import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

interface Params {
  params: {
    id: string;
  };
}

// تحديث بيانات العميل
export async function PUT(req: Request, { params }: Params) {
  try {
    const data = await req.json();
    const { name, phone, email, address, accounts } = data;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "اسم العميل مطلوب" },
        { status: 400 }
      );
    }

    // تحقق من وجود العميل وحساباته
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parseInt(params.id) },
      include: { accounts: true }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "العميل غير موجود" },
        { status: 404 }
      );
    }

    // تحديث بيانات العميل
    const updatedCustomer = await prisma.$transaction(async (prisma) => {
      // تحديث بيانات العميل الأساسية
      const customer = await prisma.customer.update({
        where: { id: parseInt(params.id) },
        data: {
          name: name.trim(),
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          address: address?.trim() || null,
        },
        include: { accounts: true }
      });

      // تحديث الحساب
      if (accounts?.[0]) {
        const account = accounts[0];
        if (customer.accounts.length > 0) {
          // تحديث الحساب الموجود
          await prisma.customerAccount.update({
            where: { id: customer.accounts[0].id },
            data: {
              balance: account.balance
            }
          });
        } else {
          // إنشاء حساب جديد
          await prisma.customerAccount.create({
            data: {
              customerId: customer.id,
              currency: "SAR",
              balance: account.balance
            }
          });
        }
      }

      // إعادة جلب العميل مع الحسابات المحدثة
      return await prisma.customer.findUnique({
        where: { id: customer.id },
        include: { accounts: true }
      });
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث بيانات العميل" },
      { status: 500 }
    );
  }
}

// حذف العميل
export async function DELETE(req: Request, { params }: Params) {
  try {
    // تحقق من وجود العميل
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(params.id) },
      include: { transactions: true }
    });

    if (!customer) {
      return NextResponse.json(
        { error: "العميل غير موجود" },
        { status: 404 }
      );
    }

    // لا يمكن حذف عميل لديه معاملات
    if (customer.transactions.length > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف عميل لديه معاملات" },
        { status: 400 }
      );
    }

    // حذف العميل وحساباته
    await prisma.$transaction([
      prisma.customerAccount.deleteMany({
        where: { customerId: parseInt(params.id) }
      }),
      prisma.customer.delete({
        where: { id: parseInt(params.id) }
      })
    ]);

    return NextResponse.json({ message: "تم حذف العميل بنجاح" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف العميل" },
      { status: 500 }
    );
  }
}

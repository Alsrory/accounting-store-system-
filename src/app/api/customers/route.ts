import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// جلب جميع العملاء
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: "لم يتم العثور على متجر مرتبط بحسابك" },
        { status: 401 }
      );
    }

    const customers = await prisma.customer.findMany({
      where: {
        storeId: session.user.storeId,
        organizationId: session.user.organizationId!
      },
      include: {
        accounts: true,
        transactions: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // حساب الرصيد الحالي لكل عميل
    const customersWithCurrentBalance = customers.map(customer => {
      const currentBalance = customer.transactions.reduce((balance, t) => {
        if (t.type === 'debit') {
          return  balance + t.amount;
        } else { // credit
          return balance - t.amount;
        }
      }, 0);

      return {
        ...customer,
        currentBalance
      };
    });

    return NextResponse.json(customersWithCurrentBalance);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب بيانات العملاء" },
      { status: 500 }
    );
  }
}

// إضافة عميل جديد
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: "لم يتم العثور على متجر مرتبط بحسابك" },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { name, phone, email, address, accountType = 'LOCAL' } = data;

    if (!name) {
      return NextResponse.json(
        { error: "اسم العميل مطلوب" },
        { status: 400 }
      );
    }

    // إنشاء العميل
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        storeId: session.user.storeId,
        organizationId: session.user.organizationId!,
      }
    });

    // إنشاء حساب افتراضي للعميل
    await prisma.customerAccount.create({
      data: {
        customerId: customer.id,
        currency: accountType,
        balance: 0,
        type: "credit"
      }
    });

    return NextResponse.json({
      message: "تم إضافة العميل بنجاح",
      customer: {
        ...customer,
        currentBalance: 0
      }
    });

  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة العميل" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// جلب جميع العملاء
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
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
          return balance + t.amount;
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
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, phone, email, address, accounts } = data;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "اسم العميل مطلوب" },
        { status: 400 }
      );
    }

    const customer = await prisma.$transaction(async (prisma) => {
      // Create customer
      const newCustomer = await prisma.customer.create({
        data: {
          name: name.trim(),
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          address: address?.trim() || null,
        },
      });

      // Create account if provided
      if (accounts?.[0]) {
        await prisma.customerAccount.create({
          data: {
            customerId: newCustomer.id,
            currency: "SAR",
            balance: 0 // الرصيد الافتتاحي يكون صفر
          }
        });
      }

      // Return customer with accounts
      return await prisma.customer.findUnique({
        where: { id: newCustomer.id },
        include: { 
          accounts: true,
          transactions: true
        }
      });
    });

    // حساب الرصيد الحالي
    const customerWithBalance = {
      ...customer,
      currentBalance: 0 // عميل جديد، الرصيد صفر
    };

    return NextResponse.json(customerWithBalance);
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة العميل" },
      { status: 500 }
    );
  }
}

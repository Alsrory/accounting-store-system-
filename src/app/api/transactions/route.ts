import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// جلب جميع المعاملات
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    const whereClause = customerId ? {
      customerId: parseInt(customerId)
    } : {};

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        customer: {
          include: {
            accounts: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // تنسيق البيانات قبل إرجاعها
    const formattedTransactions = transactions.map(transaction => {
      // حساب إجمالي رصيد العميل من جميع حساباته
      const customerBalance = transaction.customer?.accounts.reduce((total, account) => total + account.balance, 0) || 0;

      return {
        ...transaction,
        customer: {
          name: transaction.customer?.name || 'غير معروف',
          currentBalance: customerBalance
        }
      };
    });

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المعاملات" },
      { status: 500 }
    );
  }
}

// إضافة معاملة جديدة
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { customerId, type, amount, description } = data;

    if (!customerId || !type || !amount) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    // التحقق من وجود العميل وحسابه
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { accounts: true }
    });

    if (!customer) {
      return NextResponse.json(
        { error: "العميل غير موجود" },
        { status: 404 }
      );
    }

    if (!customer.accounts?.[0]) {
      return NextResponse.json(
        { error: "العميل ليس لديه حساب" },
        { status: 400 }
      );
    }

    const account = customer.accounts[0];

    // إضافة المعاملة وتحديث الرصيد في نفس الوقت
    const result = await prisma.$transaction(async (prisma) => {
      // إنشاء المعاملة
      const transaction = await prisma.transaction.create({
        data: {
          customerId,
          type,
          amount,
          description: description || null
        }
      });

      // حساب الرصيد الجديد
      const allTransactions = await prisma.transaction.findMany({
        where: { customerId }
      });

      const newBalance = allTransactions.reduce((balance, t) => {
        if (t.type === 'debit') {
          return balance + t.amount;
        } else { // credit
          return balance - t.amount;
        }
      }, 0);

      // تحديث رصيد الحساب
      await prisma.customerAccount.update({
        where: { id: account.id },
        data: { balance: newBalance }
      });

      return transaction;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة المعاملة" },
      { status: 500 }
    );
  }
}

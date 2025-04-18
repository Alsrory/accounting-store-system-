import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// جلب جميع المعاملات
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: "لم يتم العثور على متجر مرتبط بحسابك" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    const whereClause = customerId
      ? {
          customerId: parseInt(customerId),
          customer: {
            storeId: session.user.storeId
          }
        }
      : {
          customer: {
            storeId: session.user.storeId
          }
        };

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
      const customerBalance = transaction.customer?.accounts.reduce(
        (total, account) => total + account.balance,
        0
      ) || 0;

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
    const { customerId, type, amount, description } = data;

    if (!customerId || !type || !amount) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    // التحقق من وجود العميل وأنه تابع لنفس المتجر
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        storeId: session.user.storeId
      },
      include: {
        accounts: true
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: "العميل غير موجود أو غير مصرح لك بالوصول إليه" },
        { status: 404 }
      );
    }

    // إنشاء المعاملة وتحديث رصيد العميل في نفس الوقت
    const result = await prisma.$transaction(async (prisma) => {
      // إنشاء المعاملة
      const transaction = await prisma.transaction.create({
        data: {
          customerId,
          type,
          amount: parseFloat(amount.toString()),
          description: description || '',
          date: new Date(),
        }
      });

      // تحديث رصيد حساب العميل
      if (customer.accounts[0]) {
        const newBalance =
          type === 'debit'
            ? customer.accounts[0].balance + parseFloat(amount.toString())
            : customer.accounts[0].balance - parseFloat(amount.toString());

        await prisma.customerAccount.update({
          where: { id: customer.accounts[0].id },
          data: { balance: newBalance }
        });
      }

      return transaction;
    });

    return NextResponse.json({
      message: "تم إضافة المعاملة بنجاح",
      transaction: result
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة المعاملة" },
      { status: 500 }
    );
  }
}

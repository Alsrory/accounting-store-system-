import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// جلب جميع المعاملات
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  try {
    const transactions = await prisma.transaction.findMany({
      where: customerId ? { customerId: parseInt(customerId) } : {},
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    return NextResponse.json(transactions);
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
    const { customerId, type, amount, description, date } = data;

    // بدء المعاملة
    const transaction = await prisma.$transaction(async (prisma) => {
      // إنشاء المعاملة
      const newTransaction = await prisma.transaction.create({
        data: {
          customerId,
          type,
          amount,
          description,
          date: new Date(date),
        },
      });

      // تحديث رصيد العميل
      const updateAmount = type === "credit" ? amount : -amount;
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          balance: {
            increment: updateAmount,
          },
        },
      });

      return newTransaction;
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء المعاملة" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: "لم يتم العثور على متجر مرتبط بحسابك" },
        { status: 401 }
      );
    }

    // جلب إحصائيات المتجر
    const [customersCount, customers] = await Promise.all([
      // عدد العملاء في المتجر
      prisma.customer.count({
        where: {
          storeId: session.user.storeId,
          organizationId: session.user.organizationId!
        }
      }),
      // جلب العملاء مع معاملاتهم لحساب إجمالي الأرصدة
      prisma.customer.findMany({
        where: {
          storeId: session.user.storeId,
          organizationId: session.user.organizationId!
        },
        include: {
          transactions: true
        }
      })
    ]);

    // حساب إجمالي الأرصدة
    const totalBalance = customers.reduce((total, customer) => {
      const customerBalance = customer.transactions.reduce((balance, t) => {
        if (t.type === 'debit') {
          return balance + t.amount;
        } else { // credit
          return balance - t.amount;
        }
      }, 0);
      return total + customerBalance;
    }, 0);

    return NextResponse.json({
      customersCount,
      totalBalance,
      customersWithBalance: customers.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإحصائيات" },
      { status: 500 }
    );
  }
}

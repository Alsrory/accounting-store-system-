import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const [customersCount, totalBalance] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.aggregate({
        _sum: {
          //balance: true
        }
      })
    ]);

    return NextResponse.json({
      customersCount,
     // totalBalance: totalBalance._sum.balance || 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإحصائيات" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// جلب جميع العملاء
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(customers);
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
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        balance: data.balance || 0,
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة العميل" },
      { status: 500 }
    );
  }
}

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
    const customer = await prisma.customer.update({
      where: {
        id: parseInt(params.id),
      },
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
    await prisma.customer.delete({
      where: {
        id: parseInt(params.id),
      },
    });
    return NextResponse.json({ message: "تم حذف العميل بنجاح" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف العميل" },
      { status: 500 }
    );
  }
}

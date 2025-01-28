import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // التحقق من وجود مستخدم مدير
    const adminExists = await prisma.user.findFirst({
      where: {
        role: "admin"
      }
    });

    if (adminExists) {
      return NextResponse.json({ message: "المدير موجود بالفعل" });
    }

    // إنشاء مستخدم مدير جديد
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.create({
      data: {
        username: "admin",
        password: hashedPassword,
        name: "مدير النظام",
        email: "admin@example.com",
        role: "admin",
      },
    });

    // إنشاء عميل افتراضي
    const defaultCustomer = await prisma.customer.create({
      data: {
        name: "عميل افتراضي",
        phone: "0123456789",
        accounts: {
          create: [
            { currency: "LOCAL", balance: 0 },
            { currency: "SAR", balance: 0 },
            { currency: "USD", balance: 0 }
          ]
        }
      }
    });

    return NextResponse.json({
      message: "تم إعداد النظام بنجاح",
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      customer: defaultCustomer
    });
  } catch (error) {
    console.error("Error setting up system:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إعداد النظام" },
      { status: 500 }
    );
  }
}

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

    return NextResponse.json({
      message: "تم إنشاء المدير بنجاح",
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء المدير" },
      { status: 500 }
    );
  }
}

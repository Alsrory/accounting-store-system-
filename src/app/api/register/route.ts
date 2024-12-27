import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, password, name, email } = await req.json();

    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "اسم المستخدم موجود بالفعل" },
        { status: 400 }
      );
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء المستخدم
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        role: "admin", // أول مستخدم سيكون مدير
      },
    });

    return NextResponse.json({
      message: "تم إنشاء المستخدم بنجاح",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("خطأ في إنشاء المستخدم:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء المستخدم" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "../../../../../lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    // التحقق من الجلسة
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح لك بإنشاء مستخدمين' },
        { status: 403 }
      );
    }

    const { username, password, name, email, role, organizationId } = await req.json();

    // التحقق من البيانات المطلوبة
    if (!username || !password || !name || !email || !role || !organizationId) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من أن المستخدم ينتمي لنفس المؤسسة
    if (organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'لا يمكنك إضافة مستخدمين لمؤسسة أخرى' },
        { status: 403 }
      );
    }

    // التحقق من عدم وجود مستخدم بنفس اسم المستخدم أو البريد الإلكتروني
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // التحقق من أن المنظمة موجودة
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'المؤسسة غير موجودة' },
        { status: 400 }
      );
    }

    // إنشاء المستخدم الجديد
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        role,
        organizationId,
        emailVerified: new Date(),
      },
    });

    // إخفاء كلمة المرور من الرد
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      message: 'تم إنشاء المستخدم بنجاح',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المستخدم' },
      { status: 500 }
    );
  }
}

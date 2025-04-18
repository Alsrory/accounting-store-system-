import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    // التحقق من الجلسة
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const { email, name, image } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة غير مكتملة' },
        { status: 400 }
      );
    }

    // إنشاء اسم مستخدم فريد من البريد الإلكتروني
    const baseUsername = email.split('@')[0];
    let username = baseUsername;
    let counter = 1;

    // البحث عن اسم مستخدم فريد
    while (true) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (!existingUser) break;
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // إنشاء مؤسسة جديدة وحساب مستخدم
    const newUser = await prisma.organization.create({
      data: {
        name: `${name}'s Organization`,
        users: {
          create: {
            name,
            email,
            emailVerified: new Date(),
            image,
            role: 'admin',
            username,
            password: await bcrypt.hash(Math.random().toString(36), 10),
          },
        },
      },
      include: {
        users: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.users[0].id,
        email: newUser.users[0].email,
        name: newUser.users[0].name,
        organizationId: newUser.id,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الحساب' },
      { status: 500 }
    );
  }
}

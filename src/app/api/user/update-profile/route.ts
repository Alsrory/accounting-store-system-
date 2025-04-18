import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    const { username, currentPassword, newPassword } = await req.json();

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // If the user has a password, verify the current password
    if (user.password) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { message: 'كلمة المرور الحالية غير صحيحة' },
          { status: 400 }
        );
      }
    }

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: {
        username,
        NOT: {
          id: session.user.id
        }
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'اسم المستخدم مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        username,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تحديث الملف الشخصي' },
      { status: 500 }
    );
  }
}

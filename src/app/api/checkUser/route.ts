import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    // التحقق من الجلسة
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    // استخراج البريد الإلكتروني من الطلب
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    // البحث عن المستخدم في قاعدة البيانات
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    // إرجاع النتيجة
    return NextResponse.json({
      exists: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId,
      } : null,
    });
  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحقق من المستخدم' },
      { status: 500 }
    );
  }
}

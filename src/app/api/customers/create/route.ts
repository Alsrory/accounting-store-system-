import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    // التحقق من الجلسة
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }

    // التحقق من وجود متجر للمستخدم
    if (!session.user.storeId) {
      return NextResponse.json(
        { error: 'لم يتم العثور على متجر مرتبط بحسابك' },
        { status: 400 }
      );
    }

    const { name, phone, email, address } = await req.json();

    // التحقق من البيانات المطلوبة
    if (!name) {
      return NextResponse.json(
        { error: 'اسم العميل مطلوب' },
        { status: 400 }
      );
    }

    // إنشاء العميل الجديد
    const newCustomer = await prisma.customer.create({
      data: {
        name,
        phone,
        email,
        address,
        storeId: session.user.storeId,
        organizationId: session.user.organizationId!,
      },
    });

    return NextResponse.json({
      message: 'تم إضافة العميل بنجاح',
      customer: newCustomer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة العميل' },
      { status: 500 }
    );
  }
}

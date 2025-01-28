import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import fs from 'fs';
import path from 'path';
//the default photo path
const DEFAULT_LOGO = '/favicon.ico';

// جلب الإعدادات
export async function GET() {
  try {
    let settings = await prisma.storeSettings.findFirst();
    
    if (!settings) {
      try {
        settings = await prisma.storeSettings.create({
          data: {
            storeName: 'متجري',
            logo: DEFAULT_LOGO,
            address: '',
            phone: '',
            email: '',
          }
        });
      } catch (createError) {
        console.error('Error creating default settings:', createError);
        return NextResponse.json({
          storeName: 'متجري',
          logo: DEFAULT_LOGO,
          address: '',
          phone: '',
          email: '',
        });
      }
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      storeName: 'متجري',
      logo: DEFAULT_LOGO,
      address: '',
      phone: '',
      email: '',
    });
  }
}

// حفظ الإعدادات
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // التحقق من البيانات المطلوبة
    if (!data.storeName?.trim()) {
      return NextResponse.json(
        { error: 'اسم المتجر مطلوب' },
        { status: 400 }
      );
    }

    let settings = await prisma.storeSettings.findFirst();
    
    // إذا كان هناك شعار قديم وتم تغييره، قم بحذفه
    if (settings?.logo && data.logo && settings.logo !== data.logo && settings.logo !== DEFAULT_LOGO) {
      const oldLogoPath = path.join(process.cwd(), 'public', settings.logo);
      try {
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      } catch (error) {
        console.error('Error deleting old logo:', error);
      }
    }

    // إذا لم يتم تحديد شعار جديد، استخدم الشعار الافتراضي
    const logo = data.logo || DEFAULT_LOGO;
    
    if (settings) {
      // تحديث الإعدادات الموجودة
      settings = await prisma.storeSettings.update({
        where: { id: settings.id },
        data: {
          storeName: data.storeName.trim(),
          logo,
          address: data.address?.trim() || '',
          phone: data.phone?.trim() || '',
          email: data.email?.trim() || '',
        }
      });
    } else {
      // إنشاء إعدادات جديدة
      settings = await prisma.storeSettings.create({
        data: {
          storeName: data.storeName.trim(),
          logo,
          address: data.address?.trim() || '',
          phone: data.phone?.trim() || '',
          email: data.email?.trim() || '',
        }
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ الإعدادات' },
      { status: 500 }
    );
  }
}

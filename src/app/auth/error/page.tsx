'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="flex w-full max-w-sm flex-col items-center space-y-8">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-red-600">
            خطأ في تسجيل الدخول
          </h1>
          <p className="text-sm text-muted-foreground">
            {error === 'AccessDenied'
              ? 'لم يتم السماح بالوصول'
              : 'حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.'}
          </p>
        </div>
        <Button asChild>
          <Link href="/auth/signin">
            العودة إلى صفحة تسجيل الدخول
          </Link>
        </Button>
      </div>
    </div>
  );
}

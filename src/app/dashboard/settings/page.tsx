'use client';
import { useState, useEffect } from 'react';

interface StoreSettings {
  id?: number;
  storeName: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: '',
    logo: '',
    address: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلب الإعدادات
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('فشل في جلب الإعدادات');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء جلب الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  // معالجة تغيير الصورة
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        setError('يرجى اختيار ملف صورة صالح');
        return;
      }
      
      // التحقق من حجم الملف (5MB كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      setLogoFile(file);
      setError(null);
    }
  };

  // حفظ الإعدادات
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (!settings.storeName.trim()) {
        throw new Error('يرجى إدخال اسم المتجر');
      }

      let logoUrl = settings.logo;

      // رفع الصورة إذا تم اختيار صورة جديدة
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          throw new Error(uploadData.error || 'فشل في رفع الصورة');
        }

        const uploadData = await uploadResponse.json();
        logoUrl = uploadData.url;
      }

      // حفظ الإعدادات
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          logo: logoUrl
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'فشل في حفظ الإعدادات');
      }

      const savedSettings = await response.json();
      setSettings(savedSettings);
      setSuccess('تم حفظ الإعدادات بنجاح');
      setLogoFile(null);

      // إعادة تعيين حقل الملف
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold text-red-950">إعدادات المتجر</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
          )}
          {success && (
            <div className="p-3 bg-green-100 text-green-700 rounded-md">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              اسم المتجر <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) =>
                setSettings({ ...settings, storeName: e.target.value })
              }
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-950 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              شعار المتجر
            </label>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                <img
                  src={settings.logo || '/favicon.ico'}
                  alt="شعار المتجر"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/favicon.ico';
                  }}
                />
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-red-950 file:text-white
                    hover:file:bg-red-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  الحد الأقصى لحجم الملف: 5 ميجابايت. الصيغ المدعومة: JPG، PNG، GIF
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              العنوان
            </label>
            <input
              type="text"
              value={settings.address || ''}
              onChange={(e) =>
                setSettings({ ...settings, address: e.target.value })
              }
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-950 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              رقم الهاتف
            </label>
            <input
              type="tel"
              value={settings.phone || ''}
              onChange={(e) =>
                setSettings({ ...settings, phone: e.target.value })
              }
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-950 focus:border-transparent"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={settings.email || ''}
              onChange={(e) =>
                setSettings({ ...settings, email: e.target.value })
              }
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-950 focus:border-transparent"
              dir="ltr"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-950 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-950 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

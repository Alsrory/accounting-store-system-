// 'use client';

// import { signIn } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
// import Image from 'next/image';
// import { useState } from 'react';
// import { toast } from 'react-hot-toast';

// export default function SignIn() {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     username: '',
//     password: '',
//   });

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleCredentialsLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     try {
//       const result = await signIn('credentials', {
//         username: formData.username,
//         password: formData.password,
//         redirect: false,
//       });

//       if (result?.error) {
//         toast.error('خطأ في اسم المستخدم أو كلمة المرور');
//       } else {
//         router.push('/dashboard');
//       }
//     } catch (error) {
//       toast.error('حدث خطأ أثناء تسجيل الدخول');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleGoogleSignIn = async () => {
//     try {
//       setIsLoading(true);
//       const result = await signIn('google', {
//         redirect: false,
//       });

//       if (result?.error) {
//         toast.error('حدث خطأ أثناء تسجيل الدخول باستخدام Google');
//         return;
//       }

//       // التحقق من وجود المستخدم في قاعدة البيانات
//       try {
//         const response = await fetch('/api/checkUser', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ email: result?.user?.email }),
//         });

//         const data = await response.json();

//         if (response.ok) {
//           if (data.exists) {
//             // المستخدم موجود، توجيه إلى لوحة التحكم
//             router.push('/dashboard');
//           } else {
//             // المستخدم غير موجود، إنشاء حساب جديد
//             const createResponse = await fetch('/api/user/create', {
//               method: 'POST',
//               headers: {
//                 'Content-Type': 'application/json',
//               },
//               body: JSON.stringify({
//                 email: result?.user?.email,
//                 name: result?.user?.name,
//                 image: result?.user?.image,
//               }),
//             });

//             if (createResponse.ok) {
//               router.push('/dashboard');
//             } else {
//               toast.error('حدث خطأ أثناء إنشاء الحساب');
//             }
//           }
//         } else {
//           toast.error(data.error || 'حدث خطأ أثناء التحقق من المستخدم');
//         }
//       } catch (error) {
//         console.error('Error checking/creating user:', error);
//         toast.error('حدث خطأ أثناء التحقق من المستخدم');
//       }
//     } catch (error) {
//       console.error('Error during Google sign in:', error);
//       toast.error('حدث خطأ أثناء تسجيل الدخول باستخدام Google');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
//       <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
//         <div className="text-center">
//           <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
//             مرحباً بك في نظام المحاسبة
//           </h2>
//           <p className="mt-2 text-sm text-gray-600">
//             قم بتسجيل الدخول للوصول إلى حسابك
//           </p>
//         </div>

//         <form onSubmit={handleCredentialsLogin} className="mt-8 space-y-6">
//           <div className="rounded-md shadow-sm -space-y-px">
//             <div>
//               <label htmlFor="username" className="sr-only">
//                 اسم المستخدم
//               </label>
//               <input
//                 id="username"
//                 name="username"
//                 type="text"
//                 required
//                 value={formData.username}
//                 onChange={handleInputChange}
//                 className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
//                 placeholder="اسم المستخدم"
//                 dir="rtl"
//               />
//             </div>
//             <div>
//               <label htmlFor="password" className="sr-only">
//                 كلمة المرور
//               </label>
//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 required
//                 value={formData.password}
//                 onChange={handleInputChange}
//                 className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
//                 placeholder="كلمة المرور"
//                 dir="rtl"
//               />
//             </div>
//           </div>

//           <div>
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             >
//               {isLoading ? (
//                 <span className="absolute left-0 inset-y-0 flex items-center pl-3">
//                   <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
//                 </span>
//               ) : null}
//               تسجيل الدخول
//             </button>
//           </div>
//         </form>

//         <div className="mt-6">
//           <div className="relative">
//             <div className="absolute inset-0 flex items-center">
//               <div className="w-full border-t border-gray-300"></div>
//             </div>
//             <div className="relative flex justify-center text-sm">
//               <span className="px-2 bg-white text-gray-500">
//                 أو
//               </span>
//             </div>
//           </div>

//           <div className="mt-6">
//             <button
//               onClick={handleGoogleSignIn}
//               disabled={isLoading}
//               className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             >
//               {isLoading ? (
//                 <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
//               ) : (
//                 <Image
//                   src="/google.svg"
//                   alt="Google"
//                   width={20}
//                   height={20}
//                   className="ml-2"
//                 />
//               )}
//               تسجيل الدخول باستخدام Google
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('خطأ في اسم المستخدم أو كلمة المرور');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  // الإصدار المحسّن لتسجيل الدخول بجوجل
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signIn('google', { redirect: false });
      
      if (result?.error) {
        toast.error('حدث خطأ أثناء تسجيل الدخول باستخدام Google');
        return;
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error during Google sign in:', error);
      toast.error('حدث خطأ أثناء تسجيل الدخول باستخدام Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            مرحباً بك في نظام المحاسبة
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            قم بتسجيل الدخول للوصول إلى حسابك
          </p>
        </div>

        <form onSubmit={handleCredentialsLogin} className="mt-8 space-y-6">
          {/* ... (نفس محتوى النموذج السابق) */}
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                أو
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              ) : (
                <Image
                  src="/google.svg"
                  alt="Google"
                  width={20}
                  height={20}
                  className="ml-2"
                />
              )}
              تسجيل الدخول باستخدام Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
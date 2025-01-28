"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Key } from "lucide-react";

interface Stats {
  customersCount: number;
  totalBalance: number;
}
interface Transaction {
  id: number;
  customerId: number;
  type: string;
  amount: number;
  description?: string;
  date: string;
  customer: {
    name: string;
  };
}
interface CustomerAccount {
  id: number;
  currency: string;
  balance: number;
  type: string;
}
interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  accounts: CustomerAccount[];
  currentBalance: number;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [latestTransaction, setLatestTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<Stats>({
    customersCount: 0,
    totalBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("فشل في جلب بيانات العملاء");
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء جلب بيانات العملاء");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        if (!response.ok) throw new Error("فشل في جلب الإحصائيات");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchCustomers();
  }, []);
  //عدد العملاء
  let total_accounts=0
  const customer=customers.length;
   const totalBalance=customers.map(customer=>{
    total_accounts+=customer.currentBalance
  //  console.log(customer.accounts)
     
   }
  )
  
  //feach resent transection
  useEffect(() => {
    // جلب آخر معاملة
    const fetchLatestTransaction = async () => {
      try {
        const response = await fetch('/api/transactions');
        if (!response.ok) throw new Error('فشل في جلب المعاملات');
        const transactions = await response.json();
        console.log('Fetched transactions:', transactions); // للتأكد من البيانات
        if (transactions && transactions.length > 0) {
          setLatestTransaction(transactions[0]); // المعاملات مرتبة بالفعل حسب التاريخ من API
        }
      } catch (error) {
        console.error('Error fetching latest transaction:', error);
      }
    };

    fetchLatestTransaction();
  }, []);


  if (loading) {
    return <div className="p-4">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href={"/dashboard/customers"}  className="bg-white focus:border-blue-700 focus:bg-slate-300 hover:bg-slate-50  p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">إجمالي العملاء</h3>
          <p className="text-3xl font-bold text-blue-600">{customer}</p>
        </Link>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">إجمالي الموردين</h3>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">المستحقات</h3>
          <p className="text-3xl font-bold text-red-600">0 ريال</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">الديون</h3>
          <p className="text-3xl font-bold text-yellow-600">{total_accounts.toLocaleString()} ريال</p>
        </div>
        
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">آخر المعاملات</h2>
        <div className="overflow-x-auto">
          {/* <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوصف
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500" colSpan={4}>
                  لا توجد معاملات حديثة
                </td>
              </tr>
            </tbody>
          </table> */}
           <div className="">
        {/* آخر معاملة */}
        <div className="bg-white rounded-lg shadow-md p-6 ">
          <h2 className="text-lg font-semibold m-2 border shadow-sm shadow-red-950 w-full text-center p-2">آخر معاملة</h2>
          {latestTransaction ? (
            <div className="space-y-2 p-8">
              <div className="grid grid-cols-2 gap-x-4 md:gap-8">
                <span className="text-gray-600">العميل:</span>
                <span className="font-medium">{latestTransaction.customer?.name || 'غير معروف'}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 md:gap-x-8">
                <span className="text-gray-600">نوع المعاملة:</span>
                <span className={`font-medium ${
                  latestTransaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {latestTransaction.type === 'credit' ? 'إيداع' : 'سحب'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 md:gap-x-8">
                <span className="text-gray-600">المبلغ:</span>
                <span className={`font-medium ${
                  latestTransaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Number(latestTransaction.amount).toLocaleString('ar-SA')} ريال
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 md:gap-x-8">
                <span className="text-gray-600">التاريخ:</span>
                <span className="font-medium">
                  {new Date(latestTransaction.date).toLocaleDateString('ar-SA')}
                </span>
              </div>
              {latestTransaction.description && (
                <div className="grid grid-cols-2 gap-x-4 md:gap-x-8">
                  <span className="text-gray-600">الوصف:</span>
                  <span className="font-medium">{latestTransaction.description}</span>
                </div>
              )}
              <button
                onClick={() => router.push('/dashboard/transactions')}
                className="mt-4 w-full bg-red-950 text-white py-2 px-4 rounded-md hover:bg-red-900 transition duration-200"
              >
                عرض جميع المعاملات
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              لا توجد معاملات حتى الآن
            </div>
          )}
        </div>

        {/* يمكنك إضافة المزيد من البطاقات هنا */}
      </div>
        </div>
      </div>
    </div>
  );
}

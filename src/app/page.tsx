"use client";
 // eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useEffect, useState } from "react";
import LoginForm from './components/LoginForm';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const { data: session } = useSession();
 // const [latestTransaction, setLatestTransaction] = useState<Transaction | null>(null);

  // useEffect(() => {
  //   // جلب آخر معاملة
  //   const fetchLatestTransaction = async () => {
  //     try {
  //       const response = await fetch('/api/transactions');
  //       if (!response.ok) throw new Error('فشل في جلب المعاملات');
  //       const transactions = await response.json();
  //       console.log('Fetched transactions:', transactions); // للتأكد من البيانات
  //       if (transactions && transactions.length > 0) {
  //         setLatestTransaction(transactions[0]); // المعاملات مرتبة بالفعل حسب التاريخ من API
  //       }
  //     } catch (error) {
  //       console.error('Error fetching latest transaction:', error);
  //     }
  //   };

  //   fetchLatestTransaction();
  // }, []);

  if (!session) {
    return <LoginForm />;
  }

  return <> <LoginForm />;

  </>
 
}

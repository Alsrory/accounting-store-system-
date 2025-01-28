"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";

interface Transaction {
  id: number;
  customerId: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  customer: {
    name: string;
    currentBalance: number;
  };
}

interface Customer {
  id: number;
  name: string;
  currentBalance: number;
}

export default function TransactionsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomerBalance, setSelectedCustomerBalance] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    type: "credit",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCustomerTransactions, setSelectedCustomerTransactions] = useState<Transaction[]>([]);
  const [showCustomerTransactions, setShowCustomerTransactions] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedCustomerBalanceState, setSelectedCustomerBalanceState] = useState(0);

  // جلب المعاملات
  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      if (!response.ok) throw new Error("فشل في جلب المعاملات");
      const data = await response.json();
      console.log("Fetched transactions:", data); // للتأكد من البيانات
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setErrorMessage("حدث خطأ أثناء جلب المعاملات");
    }
  };

  // جلب العملاء
  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("فشل في جلب العملاء");
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setErrorMessage("حدث خطأ أثناء جلب العملاء");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCustomers();
  }, [formData.amount]);

  // معالجة تغيير العميل
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    setFormData({ ...formData, customerId });
    if (customerId) {
      const customer = customers.find(c => c.id === parseInt(customerId));
      if (customer) {
        setSelectedCustomerBalance(customer.currentBalance);
      }
    } else {
      setSelectedCustomerBalance(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // التحقق من صحة البيانات
      if (!formData.customerId) {
        setErrorMessage("الرجاء اختيار العميل");
        return;
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setErrorMessage("الرجاء إدخال مبلغ صحيح");
        return;
      }

      // تحضير البيانات للإرسال
      const transactionData = {
        customerId: parseInt(formData.customerId),
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        date: new Date(formData.date).toISOString()
      };

      // إرسال البيانات
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في إنشاء المعاملة");
      }

      // تحديث البيانات بعد نجاح العملية
      await fetchTransactions();

      // إعادة تعيين النموذج
      setFormData({
        customerId: "",
        type: "credit",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
      });

      // إغلاق النموذج وعرض رسالة النجاح
      setShowForm(false);
      setSuccessMessage("تم إضافة المعاملة بنجاح");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error creating transaction:", error);
      setErrorMessage(error instanceof Error ? error.message : "فشل في إضافة المعاملة");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // جلب معاملات العميل
  const fetchCustomerTransactions = async (customerId: number, customerName: string, balance: number) => {
    try {
      const response = await fetch(`/api/transactions?customerId=${customerId}`);
      if (!response.ok) throw new Error("فشل في جلب معاملات العميل");
      const data = await response.json();
      
      if (data && data.length > 0) {
        setSelectedCustomerTransactions(data);
        setSelectedCustomerName(customerName);
        // استخدام الرصيد المحدث من آخر معاملة
        const latestTransaction = data[0]; // المعاملات مرتبة تنازلياً حسب التاريخ
        setSelectedCustomerBalanceState(latestTransaction.customer.currentBalance);
      } else {
        setSelectedCustomerTransactions([]);
        setSelectedCustomerName(customerName);
        setSelectedCustomerBalanceState(balance);
      }
      
      setShowCustomerTransactions(true);
    } catch (error) {
      console.error("Error fetching customer transactions:", error);
      setErrorMessage("حدث خطأ أثناء جلب معاملات العميل");
    }
  };

  if (loading) {
    return <div className="p-4">جاري التحميل...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">المعاملات اليومية</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-950 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
        >
          إضافة معاملة جديدة
        </button>
      </div>

      {/* رسائل النجاح والخطأ */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl transform transition-all">
            <div className="bg-red-950 p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-xl font-bold">إضافة معاملة جديدة</h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setErrorMessage(null);
                    setFormData({
                      customerId: "",
                      type: "credit",
                      amount: "",
                      description: "",
                      date: new Date().toISOString().split('T')[0],
                    });
                  }}
                  className="text-white hover:text-gray-200 transition duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="mr-3">
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العميل *</label>
                  <select
                    value={formData.customerId}
                    onChange={handleCustomerChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950 transition duration-200"
                    required
                  >
                    <option value="">اختر العميل</option>
                    {customers.map((customer) => (
                      <option 
                        key={customer.id} 
                        value={customer.id}
                        className={customer.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}
                      >
                        {customer.name} : الرصيد {Number(customer.currentBalance).toLocaleString()} 
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950 transition duration-200"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع المعاملة *</label>
                  <div className="flex  px-6  gap-x-8">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'credit' })}
                      className={`flex gap-x-2 py-4 px-12 rounded-md border ${
                        formData.type === 'credit'
                          ? 'bg-green-100 border-green-500 text-green-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      } transition duration-200`}
                    > <ArrowBigUp className=" text-green-700 w-8" fill="green" stroke="currentColor"/>
                      له
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'debit' })}
                      className={`flex gap-x-2 py-4 px-12 rounded-md border ${
                        formData.type === 'debit'
                          ? 'bg-red-100 border-red-500 text-red-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      } transition duration-200`}
                    > <ArrowBigDown className=" text-red-700 " fill="red" stroke="currentColor"/>
                    <span>عليه</span> 
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950 transition duration-200 pl-16"
                      required
                      min="0"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ريال
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950 transition duration-200 resize-none"
                    rows={3}
                    placeholder="أدخل وصف المعاملة..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setErrorMessage(null);
                    setFormData({
                      customerId: "",
                      type: "credit",
                      amount: "",
                      description: "",
                      date: new Date().toISOString().split('T')[0],
                    });
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-red-950 text-white rounded-md hover:bg-red-900 transition duration-200"
                >
                  إضافة المعاملة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة معاملات العميل */}
      {showCustomerTransactions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '80vh' }}>
            {/* رأس النافذة المنبثقة */}
            <div className="p-4 border-b bg-red-950 text-white flex justify-between items-center">
              <h3 className="text-lg font-semibold">معاملات العميل: {selectedCustomerName}</h3>
              <button
                onClick={() => setShowCustomerTransactions(false)}
                className="text-white hover:text-gray-200 transition duration-150"
              >
                ✕
              </button>
            </div>

            {/* محتوى النافذة المنبثقة */}
            <div className="flex-1 overflow-auto p-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 sm:px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      التاريخ
                    </th>
                    <th scope="col" className="px-3 sm:px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      نوع المعاملة
                    </th>
                    <th scope="col" className="px-3 sm:px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      المبلغ
                    </th>
                    <th scope="col" className="px-3 sm:px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الوصف
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedCustomerTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-3 sm:px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-sm ${
                          transaction.type === 'credit'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'credit' ? (<><ArrowBigUp className="h-8 text-green-700 w-6" fill="green" stroke="currentColor"/> <span className="p-1 hidden md:block   ">منه</span></>) : (<><ArrowBigDown className="h-8 text-red-700 w-6" fill="red" stroke="currentColor"/> <span className="p-1 hidden md:block   ">عليه</span></> )}
                        </span>
                      </td>
                      <td className={`px-3 sm:px-3 py-3 whitespace-nowrap text-sm font-medium ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Number(transaction.amount).toLocaleString()} ريال
                      </td>
                      <td className="px-3 sm:px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {transaction.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedCustomerTransactions.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  لا توجد معاملات لهذا العميل
                </div>
              )}
            </div>

            {/* تذييل النافذة المنبثقة مع الرصيد */}
            <div className="p-4 border-t bg-gray-50 mt-auto">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-600">
                    إجمالي المعاملات: {selectedCustomerTransactions.length}
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    الرصيد الحالي:
                    <span className={`mr-2 font-bold ${selectedCustomerBalanceState >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Number(selectedCustomerBalanceState).toLocaleString()} ريال
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomerTransactions(false)}
                  className="bg-red-950 text-white px-4 py-2 rounded-md hover:bg-red-900 transition duration-200"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* عرض المعاملات */}
      <div className="mt-8 sm:mt-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4 px-2 sm:px-0">
          <h2 className="text-lg sm:text-xl font-semibold text-red-950">المعاملات اليومية</h2>
          <div className="text-xs sm:text-sm text-gray-600">
            عدد المعاملات: {transactions.length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100 mx-0">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-red-950">
                    <tr>
                      <th scope="col" className="px-3 sm:px-3 py-2 sm:py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                        التاريخ
                      </th>
                      <th scope="col" className="px-3 sm:px-3 py-2 sm:py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                        العميل
                      </th>
                      <th scope="col" className="px-3 sm:px-3 py-2 sm:py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                        نوع المعاملة
                      </th>
                      <th scope="col" className="px-3 sm:px-3 py-2 sm:py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                        المبلغ
                      </th>
                      <th scope="col" className="px-3 sm:px-3 py-2 sm:py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                        الوصف
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions && transactions.length > 0 ? (
                      transactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50 transition duration-150">
                            <td className="px-3 sm:px-3 py-2 sm:py-3 text-sm text-gray-500">
                              {new Date(transaction.date).toLocaleDateString('ar-SA')}
                            </td>
                            <td className="px-3 sm:px-3 py-2 sm:py-3">
                              <div 
                                className="text-sm font-medium text-red-950 cursor-pointer hover:text-red-800 transition duration-150 break-words whitespace-normal min-w-[100px] sm:min-w-[120px] max-w-[120px] sm:max-w-[150px]"
                                onClick={() => {
                                  if (transaction.customer) {
                                    console.log('Customer data:', transaction.customer); // للتأكد من البيانات
                                    fetchCustomerTransactions(
                                      transaction.customerId,
                                      transaction.customer.name,
                                      transaction.customer.currentBalance || 0
                                    );
                                  }
                                }}
                              >
                                {transaction.customer?.name || 'غير معروف'}
                              </div>
                            </td>
                            <td className="px-3 sm:px-3 py-2 sm:py-3">
                              <span className={`inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-md ${
                                transaction.type === 'credit'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.type === 'credit' ? (<><ArrowBigUp className="h-8 text-green-700 w-6" fill="green" stroke="currentColor"/> <span className="p-1 hidden md:block   ">له</span></>) : (<><ArrowBigDown className="h-8 text-red-700 w-6" fill="red" stroke="currentColor"/> <span className="p-1 hidden md:block   ">عليه</span></> )}
                              </span>
                            </td>
                            <td className={`px-3 sm:px-3 py-2 sm:py-3 text-sm font-medium ${
                              transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {Number(transaction.amount).toLocaleString()} ريال
                            </td>
                            <td className="px-3 sm:px-3 py-2 sm:py-3 text-sm text-gray-500 truncate max-w-[120px] sm:max-w-xs">
                              {transaction.description || '-'}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-3 sm:px-3 py-8 text-center text-gray-500 bg-gray-50">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p>لا توجد معاملات حتى الآن</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* تذييل الجدول - يمكن إضافة ترقيم الصفحات هنا */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                {transactions.length > 0 ? `عرض ${transactions.length} معاملات` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

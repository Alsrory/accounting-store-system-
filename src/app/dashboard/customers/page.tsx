"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description?: string;
  date: string;
}

export default function CustomersPage() {
  const { data: session } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showAddTransactionForm, setShowAddTransactionForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    balance: "0"
  });
  const [transactionForm, setTransactionForm] = useState({
    type: "credit",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0]
  });
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // جلب بيانات العملاء
  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("فشل في جلب بيانات العملاء");
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      setError("حدث خطأ أثناء جلب بيانات العملاء");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // جلب معاملات العميل
  const fetchCustomerTransactions = async (customerId: number) => {
    try {
      const response = await fetch(`/api/transactions?customerId=${customerId}`);
      if (!response.ok) throw new Error("فشل في جلب المعاملات");
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowFloatingButton(scrollTop > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // إضافة معاملة جديدة
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          type: transactionForm.type,
          amount: parseFloat(transactionForm.amount),
          description: transactionForm.description,
          date: new Date(transactionForm.date).toISOString()
        }),
      });

      if (!response.ok) throw new Error("فشل في إضافة المعاملة");

      await fetchCustomers();
      await fetchCustomerTransactions(selectedCustomer.id);
      setTransactionForm({
        type: "credit",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0]
      });
      setSuccessMessage("تم إضافة المعاملة بنجاح!");
      setTimeout(() => setSuccessMessage(null), 3000); // إخفاء الرسالة بعد 3 ثواني
    } catch (err) {
      console.error("Error adding transaction:", err);
    }
  };

  // عرض معاملات العميل
  const handleShowTransactions = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowTransactions(true);
    setShowAddTransactionForm(false);
    try {
      const response = await fetch(`/api/transactions?customerId=${customer.id}`);
      if (!response.ok) throw new Error("فشل في جلب المعاملات");
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  // إغلاق نافذة المعاملات
  const handleCloseTransactions = () => {
    setShowTransactions(false);
    setShowAddTransactionForm(false);
    setSelectedCustomer(null);
    setTransactions([]);
  };

  // فتح نموذج إضافة معاملة جديدة
  const handleShowAddTransaction = () => {
    setShowAddTransactionForm(true);
  };

  // إضافة عميل جديد
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.id}`
        : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          balance: parseFloat(formData.balance)
        }),
      });

      if (!response.ok) throw new Error("فشل في حفظ بيانات العميل");
      
      await fetchCustomers();
      setShowForm(false);
      setEditingCustomer(null);
      setFormData({ name: "", phone: "", email: "", address: "", balance: "0" });
    } catch (err) {
      setError("حدث خطأ أثناء حفظ بيانات العميل");
      console.error(err);
    }
  };

  // حذف عميل
  const handleDelete = async (id: number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا العميل؟")) return;
    
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("فشل في حذف العميل");
      
      await fetchCustomers();
    } catch (err) {
      setError("حدث خطأ أثناء حذف العميل");
      console.error(err);
    }
  };

  // تعديل بيانات العميل
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      balance: customer.balance.toString()
    });
    setShowForm(true);
  };

  // تصفية العملاء بناءً على مصطلح البحث
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-4">جاري التحميل...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8 main-content min-h-screen overflow-y-auto">
      

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="bg-red-950 text-white p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">إضافة عميل جديد</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-100 text-sm font-medium mb-2">الاسم</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">رقم الجوال</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">العنوان</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-red-950 text-white rounded-md hover:bg-red-900 transition-colors duration-200"
                  >
                    إضافة العميل
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-red-950 text-white">
          <h2 className="text-xl font-semibold">قائمة العملاء</h2>
          <div className="m-2">
            <input
              type="text"
              placeholder="بحث عن عميل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pr-3 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
            />
          </div>
          {/* <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-white text-red-950 rounded-md hover:bg-gray-100 transition-colors duration-200 shadow-md flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>إضافة عميل</span>
          </button> */}
        </div>
        <div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200 sm:table-fixed">
    <thead className="bg-gray-50">
      <tr>
        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الرصيد</th>
        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الجوال</th>
        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">البريد الإلكتروني</th>
        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">العنوان</th>
       
     
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {filteredCustomers.map((customer) => (
        <tr key={customer.id} className="hover:bg-gray-50 transition-colors duration-200">
          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
            <button onClick={() => handleShowTransactions(customer)} className="text-red-950 hover:text-red-900 font-medium transition-colors duration-200">{customer.name}</button>
          </td>
         
          <td className="px-6 py-4 whitespace-nowrap" style={{ color: customer.balance >= 0 ? 'red' : 'green' }}>{customer.balance.toLocaleString()} ريال</td>
          <td className="px-6 py-4 whitespace-nowrap text-left">
            <div className="flex gap-2 justify-end">
              <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:text-blue-900 transition-colors duration-200" title="تعديل">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900 transition-colors duration-200" title="حذف">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-gray-700">{customer.phone}</td>
          <td className="px-6 py-4 whitespace-nowrap text-gray-700 hidden sm:table-cell">{customer.email || "-"}</td>
          <td className="px-6 py-4 whitespace-nowrap text-gray-700 hidden md:table-cell">{customer.address || "-"}</td>
        </tr>
      ))}
      {filteredCustomers.length === 0 && (
        <tr>
          <td colSpan={6} className="px-6 py-8 text-center text-gray-500 bg-gray-50">
            <div className="flex flex-col items-center justify-center">
              <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>لا توجد معاملات لهذا العميل</p>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
        {/* <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 sm:table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الاسم
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الجوال
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  البريد الإلكتروني
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  العنوان
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الرصيد
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    <button
                      onClick={() => handleShowTransactions(customer)}
                      className="text-red-950 hover:text-red-900 font-medium transition-colors duration-200"
                    >
                      {customer.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 hidden sm:table-cell">{customer.email || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 hidden md:table-cell">{customer.address || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ color: customer.balance >= 0 ? 'red' : 'green' }}>
                    {customer.balance.toLocaleString()} ريال
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        title="تعديل"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        title="حذف"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 bg-gray-50">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p>لا يوجد عملاء حالياً</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div> */}
        {/* زر إضافة عميل عائم */}
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCustomer(null);
            setFormData({ name: "", phone: "", email: "", address: "", balance: "0" });
          }}
          className="fixed bottom-20 left-20 bg-red-950 text-white p-4 rounded-full shadow-lg hover:bg-red-900 transition-all duration-300 z-50 flex items-center justify-center group"
          aria-label="إضافة عميل جديد"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span className="absolute right-full transform translate-x-2 bg-red-950 text-white px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap mr-2">
            إضافة عميل جديد
          </span>
        </button>
      </div>
      

      
      {/* {showFloatingButton && (
        
      )} */}

      {/* نافذة عرض المعاملات */}
      {showTransactions && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md sm:max-w-2xl">
            <div className="bg-red-950 text-white p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                {/* عنوان النافذة مع اسم العميل */}
                <h3 className="text-lg font-semibold">{selectedCustomer?.name}</h3>
               
                <div className="flex  gap-4 md:gap-10">
                  {/* رصيد العميل */}
                <div className="bg-gray-100 text-gray-900 p-2 rounded-md">
                  {selectedCustomer?.balance.toLocaleString()} ريال
                </div>
                  {/* زر إغلاق النافذة */}
                <button
                  onClick={handleCloseTransactions}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                </div>
              </div>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">نوع المعاملة</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-900">{new Date(transaction.date).toLocaleDateString("ar-SA")}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {transaction.type === "credit" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">إضافة رصيد</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">خصم رصيد</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900"><span className="text-sm" dir="ltr">{transaction.amount.toLocaleString()} ريال</span></td>
                      <td className="px-3 py-2 text-sm text-gray-500">{transaction.description || "-"}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-gray-500 bg-gray-50">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p>لا توجد معاملات لهذا العميل</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* زر إضافة معاملة عائم */}
            <button
              onClick={handleShowAddTransaction}
              className="fixed bottom-20 right-100 bg-red-950 text-white p-4 rounded-full shadow-lg hover:bg-red-900 transition-all duration-300 z-50"
              aria-label="إضافة معاملة جديدة"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* نموذج إضافة معاملة جديدة */}
      {showAddTransactionForm && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="bg-red-950 text-white p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">إضافة معاملة جديدة</h3>
                <button
                  onClick={() => setShowAddTransactionForm(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">التاريخ</label>
                    <input
                      type="date"
                      value={transactionForm.date}
                      onChange={(e) =>
                        setTransactionForm({ ...transactionForm, date: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">نوع المعاملة</label>
                    <select
                      value={transactionForm.type}
                      onChange={(e) =>
                        setTransactionForm({ ...transactionForm, type: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                      required
                    >
                      <option value="credit">إضافة رصيد</option>
                      <option value="debit">خصم رصيد</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">المبلغ</label>
                    <input
                      type="number"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) =>
                        setTransactionForm({ ...transactionForm, amount: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">الوصف</label>
                    <input
                      type="text"
                      value={transactionForm.description}
                      onChange={(e) =>
                        setTransactionForm({ ...transactionForm, description: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                      placeholder="وصف المعاملة..."
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-950 text-white rounded-md hover:bg-red-900 transition-colors duration-200"
                  >
                    إضافة المعاملة
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white p-3 rounded-md shadow-lg z-[60]">
          {successMessage}
        </div>
      )}
    </div>
  );
}

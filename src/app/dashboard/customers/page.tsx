"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";

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

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description?: string;
  date: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [accountType, setAccountType] = useState<'LOCAL' | 'SAR'>('LOCAL');
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    address: string;
    accounts: Array<{
      id: number;
      currency: string;
      balance: number;
      type: string;
    }>;
  }>({
    name: "",
    phone: "",
    email: "",
    address: "",
    accounts: [
      { id: 1, currency: "SAR", balance: 0, type: "credit" },
      { id: 2, currency: "LOCAL", balance: 0, type: "credit" }
    ]
  });
  const [currentBalance, setcurrentBalance] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showAddTransactionForm, setShowAddTransactionForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'credit',
    amount: 0,
    description: '',
    date: new Date().toISOString()
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();

  // التحقق من وجود متجر للمستخدم
  useEffect(() => {
    if (session && !session.user?.storeId) {
      toast.error('لم يتم العثور على متجر مرتبط بحسابك');
      router.push('/dashboard');
    }
  }, [session, router]);

  // جلب بيانات العملاء
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
    if (session?.user?.storeId) {
      fetchCustomers();
    }
  }, [session]);

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
  }, [newTransaction.amount]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowScrollButton(scrollTop > 100);
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

  const hendleblance = () => {
    const totalDebit = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCredit = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    const a = totalDebit - totalCredit
    setcurrentBalance(a);

    console.log(currentBalance)
    console.log(newTransaction.amount)
  }

  // إضافة معاملة جديدة
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setError("الرجاء اختيار عميل أولاً");
      return;
    }

    if (!newTransaction.amount || newTransaction.amount < 0) {
      setError("الرجاء إدخال مبلغ صحيح");
      return;
    }

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          type: newTransaction.type,
          amount: newTransaction.amount,
          description: newTransaction.description?.trim() || "",
          date: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "فشل في إضافة المعاملة");
      }

      // إعادة تحميل المعاملات والعميل للحصول على أحدث البيانات
      await handleShowTransactions(selectedCustomer);
      // إعادة تعيين نموذج المعاملة
      setNewTransaction({
        type: "credit",
        amount: 0,
        description: ""
      });
      setShowAddTransactionForm(false);
      setSuccessMessage("تم إضافة المعاملة بنجاح");
      setTimeout(() => setSuccessMessage(null), 1500);
    } catch (err) {
      console.error("Error adding transaction:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء إضافة المعاملة");
    }
  };

  // دالة تعديل المعاملة
  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      if (!newTransaction.amount || newTransaction.amount < 0) {
        setErrorMessage("الرجاء إدخال مبلغ صحيح");
        return;
      }

      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: newTransaction.type,
          amount: newTransaction.amount,
          description: newTransaction.description || "",
          date: new Date().toISOString(),
          customerId: selectedCustomer?.id
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update transaction");
      }

      await fetchCustomerTransactions(selectedCustomer!.id);
      
      setShowAddTransactionForm(false);
      setEditingTransaction(null);
      setNewTransaction({
        type: "credit",
        amount: 0,
        description: "",
        date: new Date().toISOString()
      });
      
      setSuccessMessage("تم تحديث المعاملة بنجاح");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error updating transaction:", error);
      setErrorMessage(error instanceof Error ? error.message : "حدث خطأ أثناء تحديث المعاملة");
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // دالة لتحضير تعديل المعاملة
  const prepareEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description || "",
      date: transaction.date
    });
    setShowAddTransactionForm(true);
  };

  // Handle transaction type change
  const handleTransactionTypeChange = (type: "credit" | "debit") => {
    setNewTransaction(prev => ({
      ...prev,
      type
    }));
  };

  // Handle transaction amount change
  const handleTransactionAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewTransaction(prev => ({
      ...prev,
      amount: value === '' ? 0 : parseInt(value)
    }));
  };

  // Handle transaction description change
  const handleTransactionDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTransaction(prev => ({
      ...prev,
      description: e.target.value
    }));
  };

  // تحديث رصيد العميل في القائمة
  useEffect(() => {
    const updateCustomerBalance = (customerId: number, amount: number, type: 'credit' | 'debit') => {
      setCustomers(prevCustomers => {
        const updatedCustomers = prevCustomers.map(customer => {
          if (customer.id === customerId) {
            const updatedCustomer = {
              ...customer,
              accounts: customer.accounts.map(account => {
                if (account.currency === 'SAR') {
                  const balanceChange = type === 'debit' ? -amount : amount;
                  return {
                    ...account,
                    balance: account.balance - balanceChange
                  };
                }
                return account;
              }, [transactions])
            };
            // تحديث العميل المحدد أيضاً
            if (selectedCustomer?.id === customerId) {
              setSelectedCustomer(updatedCustomer);
            }
            return updatedCustomer;
          }
          return customer;
        });
        return updatedCustomers;
      });
    };
  }, [newTransaction.amount]);

  // معالجة تقديم النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError("");

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone?.trim() || "",
          email: formData.email?.trim() || "",
          address: formData.address?.trim() || "",
          accounts: formData.accounts.map(account => ({
            currency: account.currency,
            balance: Number(account.balance),
            type: account.type
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء إضافة العميل');
      }

      // تحديث قائمة العملاء
      await fetchCustomers();

      // عرض رسالة النجاح
      // toast.success('تم إضافة العميل بنجاح', {
      //   duration: 3000,
      //   position: 'bottom-center',
      // });
      
      resetFormData();
      setShowAddForm(false);
      setSuccessMessage("تم إضافة العميل بنجاح'");
      setTimeout(() => setSuccessMessage(null), 1500);
    
      // إعادة تعيين النموذج وإغلاقه
      // setTimeout(() => {
      //   setFormData({
      //     name: '',
      //     phone: '',
      //     email: '',
      //     address: '',
      //     accounts: [{ id: 1, currency: 'SAR', balance: '0', type: 'credit' }]
      //   });
      //   setShowAddForm(false);
      // }, 500);

    } catch (err) {
      console.error('Error adding customer:', err);
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة العميل', {
        duration: 3000,
        position: 'bottom-center',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // تعديل بيانات العميل
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError("الرجاء إدخال اسم العميل");
        return;
      }

      const updateData = { 
        name: formData.name.trim(),
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        address: formData.address?.trim() || null,
        accounts: [{
          id: formData.accounts[0]?.id || 0,
          currency: "SAR",
          balance: Number(formData.accounts[0]?.balance ?? 0), // ✅ تصحيح هنا
          type: formData.accounts[0]?.type || "credit"
        }]
      };
      

      console.log('Updating customer with data:', updateData);

      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Update failed:', responseData);
        throw new Error(responseData.error || "فشل في تحديث بيانات العميل");
      }

      console.log('Update successful:', responseData);
      
      await fetchCustomers();
      setShowForm(false);
      setEditingCustomer(null);
      resetFormData();
      setSuccessMessage("تم تحديث بيانات العميل بنجاح");
      setTimeout(() => setSuccessMessage(null), 1500);
    } catch (err) {
      console.error("Error updating customer:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء تحديث بيانات العميل");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      await handleUpdate(e);
    } else {
      await handleSubmit(e);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle account changes
  // const handleAccountChange = (index: number, field: string, value: string) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     accounts: prev.accounts.map((acc, i) =>
  //       i === index ? { ...acc, [field]: value } : acc
  //     )
  //   }));
  // };
  const handleAccountChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      accounts: prev.accounts.map((acc, i) =>
        i === index
          ? {
              ...acc,
              [field]: field === 'balance' ? Number(value) : value
            }
          : acc
      )
    }));
  };
  
  // حذف عميل
  const handleDelete = async (customer: Customer) => {
    if (!confirm("هل أنت متأكد من حذف هذا العميل؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "فشل في حذف العميل");
      }

      await fetchCustomers();
      setSuccessMessage("تم حذف العميل بنجاح");
      setTimeout(() => setSuccessMessage(null), 1500);
    } catch (err) {
      console.error("Error deleting customer:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء حذف العميل");
    }
  };

  // تعديل بيانات العميل
  const handleEdit = (customer: Customer) => {
    console.log('Editing customer:', customer);
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      accounts: customer.accounts?.length ? customer.accounts.map(acc => ({
        id: acc.id,
        currency: acc.currency,
        balance: acc.balance,
        type: acc.type
      })) : [{ id: 0, currency: "SAR", balance: 0, type: "credit" }]
    });
    setShowForm(true);
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      accounts: [{ id: 0, currency: "SAR", balance: 0, type: "credit" }]
    });
  };

  // عرض معاملات العميل
  const handleShowTransactions = async (customer: Customer) => {
    setSelectedCustomer(customer);
    try {
      const response = await fetch(`/api/transactions?customerId=${customer.id}`);
      if (!response.ok) throw new Error("فشل في جلب المعاملات");
      const data = await response.json();
      setTransactions(data);

      // تحديث بيانات العميل للحصول على أحدث رصيد
      const customerResponse = await fetch(`/api/customers/${customer.id}`);
      if (customerResponse.ok) {
        const updatedCustomer = await customerResponse.json();
        setSelectedCustomer(updatedCustomer);
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء جلب المعاملات");
    }
  };

  // إغلاق نافذة المعاملات
  const handleCloseTransactions = () => {
    hendleblance()
    setShowTransactions(false);
    setShowAddTransactionForm(false);
    setSelectedCustomer(null);
    setTransactions([]);
  };

  // فتح نموذج إضافة معاملة جديدة
  const handleShowAddTransaction = () => {
    setShowAddTransactionForm(true);
  };

  // تصفية العملاء بناءً على مصطلح البحث
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // دالة تصدير PDF
  const handlePrint = useCallback(async () => {
    if (!selectedCustomer || !transactions.length) return;

    try {
      // جلب إعدادات المتجر
      const settingsResponse = await fetch('/api/settings');
      const storeSettings = await settingsResponse.json();

      // تنسيق التاريخ
      const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ar', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      };

      // حساب المجاميع
      const totalDebit = transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalCredit = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      // setcurrentBalance(totalDebit-totalCredit);
      const currentBalance =  totalDebit-totalCredit;

      // تحويل الصورة النسبية إلى مطلقة
      const logoUrl = storeSettings.logo
        ? `${window.location.origin}${storeSettings.logo}`
        : `${window.location.origin}/favicon.ico`;

      // إنشاء محتوى HTML للطباعة
      let currentBalance1 = 0;

      const printContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>كشف حساب - ${selectedCustomer.name}</title>
    <style>
        @page {
            size: A4;
            margin: 1.5cm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h2 {
            font-size: 20px;
            color: #1a1a1a;
            margin-bottom: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 14px;
            table-layout: fixed; 
        }
        th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: center;
            overflow: hidden;
            word-wrap: break-word; /* السماح بكسر الكلمات الطويلة */
        }
        th {
            background-color: #5d1b1b;
            color:#fff;
        }
        .logo-cell {
            padding: 10px;
            padding-top:0px;
        }
        .store-logo {
            width: 150px;
            height: auto;
            object-fit: contain;
                margin-left: 200px;
        }
        .store-header {           
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
            display: flex;
            align-items: center;
            flex-direction: column;
        }
        .store-info {
            width: 100%;
            display: flex;
            justify-content: space-between;
            /* direction: rtl; */
            margin-top: 15px;
        }
        .store-info-right {
            text-align: right;
        }
        .store-info-left {
            text-align: left;
            direction: ltr;
            margin-right: 10px;
        }
        .store-name {
            font-size: 24px;
            font-weight: bold;
            margin-top: 6px;
            margin-bottom: 5px;
            padding: 10px;
            color: #1a1a1a;
            text-align: center;
        }
        .store-contact {
            color: #666;
            font-size: 14px;
            margin-bottom: 3px;
        }            
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
             .amount {
         text-align: center;
         font-family: 'Courier New', monospace;
       }
       .debit { color: #ef4444; }
       .credit { color: #22c55e; }
       .totals table {
         border: 2px solid #ddd;
       }
         .total-credit{
        background-color: #aca4a4;
      color: #039e5b;
         font-size: 16px;
         }
          .total-debit{
         background-color: #aca4a4;
          color: #ef4444;
         font-size: 16px;
         }
       .total-row {
         font-weight: bold;
         background-color: #f8f8f8;
        /* نمط خاص لخلية الرصيد الحالي */
            text-overflow: ellipsis;
            white-space: nowrap;
        
       }
       .print-date {
         text-align: left;
         font-size: 12px;
         color: #666;
         margin-top: 30px;
       }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>
    <div class="container">
        <table>
            <tr>
                <td  class="logo-cell" colspan="5">
                    <div class="store-info">
                        <div  >
                            <div  >
                                <div class="store-name"className="text-black font-bold text-xs md:text-2xl">
                                    ${storeSettings.storeName || 'متجري'}
                                </div>
                                <div class="store-info-right">
                                    ${storeSettings.address ? `<div class="store-contact">العنوان  ${storeSettings.address}</div>` : ''}
                                    ${storeSettings.phone ? `<div class="store-contact"> الهاتف${storeSettings.phone}</div>` : ''}
                                    ${storeSettings.email ? `<div class="store-contact"> Email ${storeSettings.email}</div>` : ''}
                                </div>
                            </div>
                            <img 
                                src="${logoUrl}" 
                                alt="شعار المتجر" 
                                class="store-logo" 
                                onerror="this.onerror=null; this.src='${window.location.origin}/favicon.ico';"
                            >
                            <div class="store-info-left"></div>
                        </div>
                    </div>
                </td>
            </tr>
            <tr> 
                <td colspan="5" class="center">
                    <div class="header">
                        <h2>كشف حساب - ${selectedCustomer.name}</h2>
                    </div>
                </td>
            </tr>
            <tr>
                <th>التاريخ</th>
                <th>البيان</th>
                <th>سحب</th>
                <th>إيداع</th>
                <th>الرصيد</th>
            </tr>
            <tbody>
              

  ${transactions.map(transaction => {
    currentBalance1 = transaction.type === 'debit'
      ? currentBalance1 + transaction.amount
      : currentBalance1 - transaction.amount;

    return `
                    
                    <tr>
                        <td>${formatDate(transaction.date)}</td>
                        <td>${transaction.description || '-'}</td>
                        <td class="amount debit">${transaction.type === 'debit' ? transaction.amount.toLocaleString() + ' ' : '-'}</td>
                        <td class="amount credit">${transaction.type === 'credit' ? transaction.amount.toLocaleString() + '' : '-'}</td>
                        <td className="amount">${currentBalance1.toLocaleString()}</td>
                    </tr>
                `}).join('')}
                  <tr>
           <tr  class="total-row">
            <td colspan="2"> اجمالى العمليات </td>
             <td class="total-debit">${totalDebit.toLocaleString()}</td>
        
             <td class=" total-credit">${totalCredit.toLocaleString()} </td>
                <td></td>
           </tr>
                
                 <tr class="total-row">
                        <td colspan="2">الرصيد الحالي  -  ${currentBalance >= 0 ? 'عليه':'له' }</td>
                    <th colspan="3"  class="amount ">${
                    Math.abs(currentBalance).toLocaleString()} </th>
                </tr>
                
                
                 
              
             
        </tr>
            </tbody>
        </table>
        <p>تاريخ الطباعة: ${formatDate(new Date().toISOString())}</p>
    </div>

    <script>
        async function generatePDF() {
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                const opt = {
                    margin: [10, 10],
                    filename: 'كشف_حساب_${selectedCustomer.name}_${new Date().toISOString().split('T')[0]}.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                await html2pdf().set(opt).from(document.body).save();
                setTimeout(() => window.close(), 1000);
            } catch (error) {
                console.error('Error generating PDF:', error);
                alert('حدث خطأ أثناء إنشاء ملف PDF');
                window.close();
            }
        }
        generatePDF();
    </scrip>
</body>
</html>
`;

      // إنشاء نافذة جديدة
     const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('فشل في فتح نافذة جديدة');
      }

      // كتابة المحتوى
      printWindow.document.write(printContent);
      printWindow.document.close();

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF');
    }
  }, [selectedCustomer, transactions]);

  // زر الطباعة
  const PrintButton = () => (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
      disabled={!transactions.length}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 012 2v3m2 4h6a2 2 0 012 2v1m-6 0h-6a2 2 0 00-2 2v1m-6 0h6v-1a2 2 0 012-2v-1m-6 0h6a2 2 0 012-2v-2a2 2 0 01-2-2m-2 0H8a2 2 0 00-2 2v20m2-20V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      طباعة
    </button>
  );

  if (loading) return <div className="p-4">جاري التحميل...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="container py-8 main-content min-h-screen overflow-y-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-red-950 text-white">
          <h2 className="text-xl font-semibold">قائمة العملاء</h2>
          <div className="m-2">
            <input
              type="text"
              placeholder="بحث عن عميل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-red-950/5">
              <tr>
                <th className="py-3 px-4 text-right text-sm font-medium text-red-950">الاسم</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-red-950">الرصيد</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-red-950 hidden sm:table-cell">رقم الهاتف</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-red-950 hidden sm:table-cell">البريد الإلكتروني</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-red-950 hidden sm:table-cell">العنوان</th>

                <th className="py-3 px-4 text-center text-sm font-medium text-red-950">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-950/10">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 bg-gray-50">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 012 2v3m2 4h6a2 2 0 012 2v1m-6 0h-6a2 2 0 00-2 2v1m-6 0h6v-1a2 2 0 012-2v-1m-6 0h6a2 2 0 012-2v-2a2 2 0 01-2-2m-2 0H8a2 2 0 00-2 2v20m2-20V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <p>لا يوجد عملاء</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr 
                    key={customer.id} 
                    onClick={() => handleShowTransactions(customer)}
                    className="hover:bg-red-950/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-4 text-sm break-words  whitespace-normal min-w-[80px] sm:min-w-[120px] max-w-[120px] sm:max-w-[150px]">{customer.name}</td>
                    <td className="py-2 px-4 text-sm font-medium">
                    
                        
                      {customer.currentBalance.toLocaleString()} ريال
                    </td>
                    <td className="py-2 px-4 text-sm hidden md:block  " dir="ltr">
                      {customer.phone || "-"}
                    </td>
                    <td className="py-2 px-4 text-sm hidden sm:table-cell" dir="ltr">
                      {customer.email || "-"}
                    </td>
                    <td className="py-2 px-4 text-sm hidden sm:table-cell">
                      {customer.address || "-"}
                    </td>
                    <td className="py-2 px-4 text-sm font-medium whitespace-nowrap">
  <div className="flex flex-col gap-1">
    {customer.accounts.map(account => (
      <span key={account.currency} className="text-xs bg-gray-100 px-2 py-1 rounded">
        {account.balance.toLocaleString()} {account.currency}
      </span>
    ))}
  </div>
</td>
                    <td className="py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1 text-red-950/70 hover:text-red-950 hover:bg-red-950/[0.04] rounded-full transition-colors"
                          title="تعديل"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="p-1 text-red-950/70 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="حذف"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* زر إضافة عميل عائم */}
      <button
        onClick={() => {
          setShowForm(true);
          setEditingCustomer(null);
          setFormData({ name: "", phone: "", email: "", address: "", accounts: [{ id: 1, currency: "SAR", balance: "0", type: "credit" }] });
        }}
        className="fixed bottom-20 left-20 bg-red-950 text-white p-4 rounded-full shadow-lg hover:bg-red-900 transition-colors"
        title="إضافة عميل جديد"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="absolute right-full transform translate-x-2 bg-red-950 text-white px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap mr-2">
          إضافة عميل جديد
        </span>
      </button>
      {/* نموذج إضافة/تعديل عميل */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="bg-red-950 text-white p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {editingCustomer ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingCustomer(null);
                    setFormData({
                      name: "",
                      phone: "",
                      email: "",
                      address: "",
                      accounts: [{ id: 0, currency: "SAR", balance: 0, type: "credit" }]
                    });
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">الاسم</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">العنوان</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                    />
                  </div>
                  

  
  {/* قسم الحسابات */}
  {formData.accounts.map((account, index) => (
    <div key={account.currency} className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        الرصيد الافتتاحي 
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
        <input
  type="number"
  min="0"
  step="0.01"
  inputMode="decimal"
  value={account.balance}
  onChange={(e) => {
    const value = e.target.value;
    handleAccountChange(index, 'balance', value);
  }}
  className="w-full p-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
  placeholder="0.00"
/>

          {/* <input
            type="Number"
           
             min="0"
            inputMode="decimal"
            value={account.balance !== undefined && account.balance !== null ? Number(account.balance) : 0}


            onChange={(e) => {
            const value = Math.max(0, Number(e.target.value));
              handleAccountChange(index, 'balance', value.toString());
            }}
            className="w-full p-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
            placeholder="0.00"
          /> */}
          {/* <input
  type="number"
  value={account.balance}
  onChange={(e) => {
    const newBalance = parseFloat(e.target.value) || 0;
    const updatedAccounts = [...formData.accounts];
    updatedAccounts[index].balance = newBalance;

    setFormData({ ...formData, accounts: updatedAccounts });
  }}
/> */}
          
          <span className="absolute right-28 top-3 text-gray-500">
            {accountType === "SAR" ? "SAR" : "LOCAL"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const balance = Math.abs(Number(account.balance));
              handleAccountChange(index, 'balance', balance.toString());
              handleAccountChange(index, 'type', 'credit');
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              account.type === 'credit'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            دائن
          </button>
          <button
            type="button"
            onClick={() => {
              const balance = Math.abs(Number(account.balance));
              handleAccountChange(index, 'balance', (-balance).toString());
              handleAccountChange(index, 'type', 'debit');
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              account.type === 'debit'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            مدين
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {account.type === 'credit' 
          ? `رصيد دائن (${accountType === "SAR" ? "ريال سعودي" : "محلي"})`
          : `رصيد مدين (${accountType === "SAR" ? "ريال سعودي" : "محلي"})`}
      </p>
    </div>
  ))}
  {/* نوع الحساب */}
  <div>
    <label className="block text-gray-700 text-sm font-medium mb-2">نوع الحساب</label>
    <select
      value={accountType}
      onChange={(e) => setAccountType(e.target.value as 'LOCAL' | 'SAR')}
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
    >
      <option value="LOCAL">حساب محلي</option>
      <option value="SAR">حساب بالريال السعودي</option>
    </select>
  </div>

                </div>

                <div className="flex justify-end mx-2 mt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-950 text-white rounded-md hover:bg-red-900 transition-colors"
                  >
                    {editingCustomer ? "تحديث" : "إضافة"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* نموذج إضافة معاملة */}
      {showAddTransactionForm && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="bg-red-950 text-white p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {editingTransaction ? "تعديل معاملة" : "إضافة معاملة جديدة"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddTransactionForm(false);
                    setEditingTransaction(null);
                    setNewTransaction({
                      type: "credit",
                      amount: 0,
                      description: "",
                    });
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              <form onSubmit={editingTransaction ? handleEditTransaction : handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">التاريخ</label>
                    <input
                      type="date"
                      value={new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                      required
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">نوع المعاملة</label>
                    <div className="flex gap-3">
                      <label className="flex-1">
                        <input
                          type="radio"
                          name="transactionType"
                          value="credit"
                          checked={newTransaction.type === 'credit'}
                          onChange={(e) => handleTransactionTypeChange(e.target.value as 'credit' | 'debit')}
                          className="sr-only"
                        />
                        <div className={`flex items-center justify-center gap-1 p-1 border rounded-md cursor-pointer transition-all ${
                          newTransaction.type === 'credit'
                            ? 'bg-green-50 border-green-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}>
                          {/* <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg> */}
                          <ArrowBigUp className="h-8 text-green-700 w-6" fill="green" stroke="currentColor"/>
                          <span className={`text-sm font-medium ${
                            newTransaction.type === 'credit' ? 'text-green-700' : 'text-gray-700'
                          }`}>
                            له
                          </span>
                        </div>
                      </label>

                      <label className="flex-1">
                        <input
                          type="radio"
                          name="transactionType"
                          value="debit"
                          checked={newTransaction.type === 'debit'}
                          onChange={(e) => handleTransactionTypeChange(e.target.value as 'credit' | 'debit')}
                          className="sr-only"
                        />
                        <div className={`flex items-center justify-center gap-1 p-1 border rounded-md cursor-pointer transition-all ${
                          newTransaction.type === 'debit'
                            ? 'bg-red-50 border-red-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}>
                          {/* <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg> */}
                          <ArrowBigDown className="h-8 text-red-700 w-6" fill="red" stroke="currentColor"/>
                          <span className={`text-sm font-medium ${
                            newTransaction.type === 'debit' ? 'text-red-700' : 'text-gray-700'
                          }`}>
                            عليه
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">المبلغ</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={newTransaction.amount || ''}
                        onChange={handleTransactionAmountChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">الوصف</label>
                    <input
                      type="text"
                      value={newTransaction.description}
                      onChange={handleTransactionDescriptionChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                      placeholder="وصف المعاملة..."
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button  onClick={  hendleblance}
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-950 text-white rounded-md hover:bg-red-900 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "جاري المعالجة..." : editingTransaction ? "تحديث المعاملة" : "إضافة المعاملة"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* نافذة عرض المعاملات */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 md:p-6 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col mx-auto" dir="rtl">
            {/* الشريط العلوي */}
            <div className="p-4 bg-red-950 text-white rounded-t-lg flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold break-words max-w-[200px] sm:max-w-none">
                  {selectedCustomer.name}
                </h3>
                <div className="text-sm opacity-80 mt-1">
                  {selectedCustomer.phone || "لا يوجد رقم هاتف"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PrintButton />
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setTransactions([]);
                  }}
                  className="p-2 text-white hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* جدول المعاملات */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                
              

                {/* قائمة المعاملات */}
                <div className="bg-red-950/5 rounded-lg border border-red-950/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-red-950/10">
                      <thead className="bg-red-950/[0.03]">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-red-950/70">
                            التاريخ
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-red-950/70">
                            النوع
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-red-950/70">
                            المبلغ
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-red-950/70">
                            الوصف
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-red-950/70">
                            الإجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-red-950/10">
                        {transactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                              لا توجد معاملات
                            </td>
                          </tr>
                        ) : (
                          transactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-red-950/[0.02]">
                              <td className="px-3 py-2 text-sm text-red-950 whitespace-nowrap">
                                {new Date(transaction.date).toLocaleDateString('ar-SA')}
                              </td>
                              <td className="px-3 py-2 text-sm">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                    transaction.type === 'debit'
                                      ? 'bg-red-50 text-red-800'
                                      : 'bg-green-100 text-green-800 '
                                  }`}
                                >
                                  {transaction.type === 'debit' ?(<><ArrowBigDown className="h-8 text-red-700 w-6" fill="red" stroke="currentColor"/> <span className="p-1 hidden md:block   ">عليه</span></> ):<>
                                  <ArrowBigUp className="h-8 text-green-700 w-6" fill="green" stroke="currentColor"/> <span className="p-1 hidden md:block   ">له</span></> }
                                </span>
                              </td>
                              <td className="px-3 py-2 text-sm font-medium tex whitespace-nowrap">
                                {transaction.amount.toLocaleString()} ريال
                              </td>
                              <td className="px-3 py-2 text-sm text-red-950/70 break-words max-w-[150px]">
                                {transaction.description || '-'}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                <button
                                  onClick={() => prepareEditTransaction(transaction)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* معلومات الحساب */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  
                <div className="flex-1 p-3 bg-red-950/5 rounded-lg border border-red-950/10">
                    <div className="text-sm text-red-950/70 mb-1 truncate">إجمالي السحبيات</div>
                    <div className="text-lg font-bold text-red-950 truncate">
                      {transactions
                        .filter(t => t.type === 'debit')
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString()} ريال
                    </div>
                  </div>

                  <div className="flex-1 p-3 bg-red-950/5 rounded-lg border border-red-950/10">
                    <div className="text-sm text-red-950/70 mb-1 truncate">إجمالي الأيداعات</div>
                    <div className="text-lg font-bold text-red-950 truncate">
                      {transactions
                        .filter(t => t.type === 'credit')
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString()} ريال
                    </div>
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1 p-3 bg-red-950 rounded-lg text-white">
                    <div className="text-sm opacity-80 mt-1">الرصيد الحالي</div>
                    <div className="text-lg font-bold">
                      {( 
                        transactions
                        .filter(t => t.type === 'debit')
                        .reduce((sum, t) => sum + t.amount, 0)-
                        transactions
                        .filter(t => t.type === 'credit')
                        .reduce((sum, t) => sum + t.amount, 0)  
                       )
                        .toLocaleString()} ريال
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* زر إضافة معاملة عائم */}
          <button
            onClick={() => setShowAddTransactionForm(true)}
            className="fixed bottom-6 left-6 bg-red-950 text-white rounded-full p-4 shadow-lg hover:bg-red-900 transition-colors"
            title="إضافة معاملة جديدة"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      {/* نموذج إضافة معاملة */}
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
              <form onSubmit={editingTransaction ? handleEditTransaction : handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">التاريخ</label>
                    <input
                      type="date"
                      value={new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                      required
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">نوع المعاملة</label>
                    <div className="flex gap-3">
                      <label className="flex-1">
                        <input
                          type="radio"
                          name="transactionType"
                          value="credit"
                          checked={newTransaction.type === 'credit'}
                          onChange={(e) => handleTransactionTypeChange(e.target.value as 'credit' | 'debit')}
                          className="sr-only"
                        />
                        <div className={`flex items-center justify-center gap-1 p-1 border rounded-md cursor-pointer transition-all ${
                          newTransaction.type === 'credit'
                            ? 'bg-green-50 border-green-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}>
                          {/* <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg> */}
                          <ArrowBigUp className="h-8 text-green-700 w-6" fill="green" stroke="currentColor"/>
                          <span className={`text-sm font-medium ${
                            newTransaction.type === 'credit' ? 'text-green-700' : 'text-gray-700'
                          }`}>
                            له
                          </span>
                        </div>
                      </label>

                      <label className="flex-1">
                        <input
                          type="radio"
                          name="transactionType"
                          value="debit"
                          checked={newTransaction.type === 'debit'}
                          onChange={(e) => handleTransactionTypeChange(e.target.value as 'credit' | 'debit')}
                          className="sr-only"
                        />
                        <div className={`flex items-center justify-center gap-1 p-1 border rounded-md cursor-pointer transition-all ${
                          newTransaction.type === 'debit'
                            ? 'bg-red-50 border-red-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}>
                          {/* <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg> */}
                          <ArrowBigDown className="h-8 text-red-700 w-6" fill="red" stroke="currentColor"/>
                          <span className={`text-sm font-medium ${
                            newTransaction.type === 'debit' ? 'text-red-700' : 'text-gray-700'
                          }`}>
                            عليه
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">المبلغ</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={newTransaction.amount || ''}
                        onChange={handleTransactionAmountChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">الوصف</label>
                    <input
                      type="text"
                      value={newTransaction.description}
                      onChange={handleTransactionDescriptionChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-950 focus:border-red-950"
                      placeholder="وصف المعاملة..."
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button  onClick={  hendleblance}
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-950 text-white rounded-md hover:bg-red-900 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "جاري المعالجة..." : editingTransaction ? "تحديث المعاملة" : "إضافة المعاملة"}
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
      {errorMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-3 rounded-md shadow-lg z-[60]">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
function setShowScrollButton(arg0: boolean) {
  throw new Error("Function not implemented.");
}

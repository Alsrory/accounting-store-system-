"use client";
import { useState, useEffect } from "react";
import CustomerForm from "./components/CustomerForm";
import CustomerList from "./components/CustomerList";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // جلب قائمة العملاء
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  // إضافة عميل جديد
  const handleAddCustomer = async (customerData: any) => {
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        fetchCustomers();
        setIsAddingCustomer(false);
      }
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  };

  // تعديل عميل
  const handleEditCustomer = async (customerData: any) => {
    try {
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        fetchCustomers();
        setEditingCustomer(null);
      }
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  };

  // حذف عميل
  const handleDeleteCustomer = async (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العميل؟")) {
      try {
        const response = await fetch(`/api/customers/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          fetchCustomers();
        }
      } catch (error) {
        console.error("Error deleting customer:", error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">إدارة العملاء</h1>
        <button
          onClick={() => setIsAddingCustomer(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          إضافة عميل جديد
        </button>
      </div>

      {isAddingCustomer && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">إضافة عميل جديد</h2>
          <CustomerForm
            onSubmit={handleAddCustomer}
            buttonText="إضافة"
          />
        </div>
      )}

      {editingCustomer && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">تعديل بيانات العميل</h2>
          <CustomerForm
            onSubmit={handleEditCustomer}
            initialData={editingCustomer}
            buttonText="حفظ التعديلات"
          />
        </div>
      )}

      <CustomerList
        customers={customers}
        onEdit={setEditingCustomer}
        onDelete={handleDeleteCustomer}
      />
    </div>
  );
}

"use client";
import { useState } from "react";

interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
}

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
}

export default function CustomerList({ customers, onEdit, onDelete }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="بحث عن عميل..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-md text-right"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الاسم</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الهاتف</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">البريد الإلكتروني</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الرصيد</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-6 py-4 text-right text-sm text-gray-900">{customer.name}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">{customer.phone || "-"}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">{customer.email || "-"}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">
                  {customer.balance.toLocaleString("ar-SA")} ريال
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(customer)}
                    className="text-blue-600 hover:text-blue-900 ml-4"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => onDelete(customer.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

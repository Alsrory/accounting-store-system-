"use client";
import { useState } from "react";

interface CustomerFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  buttonText?: string;
}

export default function CustomerForm({ onSubmit, initialData, buttonText = "إضافة عميل" }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-right text-gray-700 mb-2">
          اسم العميل *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border rounded-md text-right"
          required
        />
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-right text-gray-700 mb-2">
          رقم الهاتف
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full p-2 border rounded-md text-right"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-right text-gray-700 mb-2">
          البريد الإلكتروني
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-2 border rounded-md text-right"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-right text-gray-700 mb-2">
          العنوان
        </label>
        <textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full p-2 border rounded-md text-right"
          rows={3}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        {buttonText}
      </button>
    </form>
  );
}

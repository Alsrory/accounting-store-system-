"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const menuItems = [
    { href: "/dashboard", label: "لوحة التحكم" },
    { href: "/dashboard/customers", label: "العملاء" },
    { href: "/dashboard/suppliers", label: "الموردين" },
    { href: "/dashboard/transactions", label: "المعاملات المالية" },
    { href: "/dashboard/reports", label: "التقارير" },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const mainContent = document.querySelector('.dashboard-content');
    
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.scrollTop > 0) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll);
      return () => mainContent.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    const mainContent = document.querySelector('.dashboard-content');
    if (mainContent) {
      mainContent.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar for large screens */}
      <aside
        className={`fixed top-0 right-0 h-full bg-gray-800 text-white transition-all duration-300 ease-in-out hidden lg:block ${
          isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="p-4">
          <div className="text-xl font-bold mb-8 text-center">نظام المحاسبة</div>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col dashboard-content overflow-y-auto ${isSidebarOpen ? 'lg:mr-64' : 'lg:mr-0'}`}>
        <header className="bg-white shadow-md sticky top-0 z-20">
          <div className="mx-auto px-4 py-3 flex justify-between items-center">
            {/* Menu button for large screens */}
            <button
              onClick={toggleSidebar}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 hidden lg:block"
              aria-label={isSidebarOpen ? 'إخفاء القائمة' : 'إظهار القائمة'}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Dropdown menu for small screens */}
            <div className="relative lg:hidden">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100"
                aria-label="القائمة"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Dropdown content */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-700">مرحباً، {session?.user?.name}</span>
            </div>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
        
        {/* زر العودة إلى الأعلى */}
        <button
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 bg-red-950 text-white p-3 rounded-full shadow-lg hover:bg-red-900 transition-all duration-300 z-50 ${
            showScrollButton ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
          aria-label="العودة إلى الأعلى"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

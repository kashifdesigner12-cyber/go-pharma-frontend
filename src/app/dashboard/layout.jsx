"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  ReceiptText,
  Users,
  LogOut,
  Pill,
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const navLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "POS",
      href: "/dashboard/pos",
      icon: ShoppingCart,
    },
    {
      name: "Products",
      href: "/dashboard/products",
      icon: Package,
    },
    {
      name: "Categories",
      href: "/dashboard/categories",
      icon: FolderTree,
    },
    {
      name: "Sales",
      href: "/dashboard/sales",
      icon: ReceiptText,
    },
    {
      name: "Users",
      href: "/dashboard/users",
      icon: Users,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">

      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">

        {/* Logo */}
        <div className="border-b border-slate-100 px-6 py-5">
          <Link
            href="/dashboard"
            className="group flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-md">
              <Pill
                size={21}
                className="transition-transform duration-300 group-hover:scale-110"
              />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                GO-Pharma
              </h1>

              <p className="text-[11px] font-medium text-slate-400">
                Pharmacy Management
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Main Menu
          </p>

          <div className="space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;

              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" &&
                  pathname.startsWith(`${link.href}/`));

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-300 ease-out ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                      : "text-slate-600 hover:translate-x-1 hover:bg-purple-50 hover:text-purple-600"
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-white/80" />
                  )}

                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-white/15"
                        : "bg-slate-50 group-hover:scale-105 group-hover:bg-white"
                    }`}
                  >
                    <Icon
                      size={18}
                      className="transition-transform duration-300 group-hover:scale-110"
                    />
                  </span>

                  <span className="flex-1">
                    {link.name}
                  </span>

                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-white opacity-100"
                        : "bg-slate-300 opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom / Logout */}
        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-red-500 transition-all duration-300 hover:translate-x-1 hover:bg-red-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 transition-all duration-300 group-hover:scale-105 group-hover:bg-red-100">
              <LogOut
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </span>

            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 shadow-sm md:hidden">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600 text-white shadow-sm transition-all duration-300 group-hover:scale-105">
              <Pill
                size={19}
                className="transition-transform duration-300 group-hover:rotate-6"
              />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                GO-Pharma
              </p>

              <p className="text-[10px] text-slate-400">
                Pharmacy Management
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="group inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm"
          >
            <LogOut
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />

            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

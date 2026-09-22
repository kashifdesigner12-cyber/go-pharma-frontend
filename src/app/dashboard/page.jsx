"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function DashboardPage() {
  const [user, setUser] = useState(null);

  const [stats, setStats] = useState({
    products: 0,
    todaySales: 0,
    lowStock: 0,
  });

  const [lowStockProducts, setLowStockProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [productsResponse, salesResponse] = await Promise.all([
        apiRequest("/products"),
        apiRequest("/sales"),
      ]);

      // -----------------------------
      // Products
      // Backend response:
      // { products: [...] }
      // -----------------------------
      const products = Array.isArray(productsResponse?.products)
        ? productsResponse.products
        : [];

      // Stock less than 5
      const lowStock = products.filter(
        (product) => Number(product?.stock || 0) < 5
      );

      setLowStockProducts(lowStock);

      // -----------------------------
      // Sales
      // Backend response:
      // { sales: [...] }
      // -----------------------------
      const sales = Array.isArray(salesResponse?.sales)
        ? salesResponse.sales
        : [];

      // Today's date
      const today = new Date();

      const todaySales = sales
        .filter((sale) => {
          if (!sale?.createdAt) return false;

          const saleDate = new Date(sale.createdAt);

          return (
            saleDate.getFullYear() === today.getFullYear() &&
            saleDate.getMonth() === today.getMonth() &&
            saleDate.getDate() === today.getDate()
          );
        })
        .reduce(
          (total, sale) => total + Number(sale?.totalAmount || 0),
          0
        );

      setStats({
        products: products.length,
        todaySales,
        lowStock: lowStock.length,
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    loadDashboard();
  }, []);

  const cards = [
    {
      title: "Total Products",
      value: stats.products,
      description: "Products in inventory",
      icon: Package,
      href: "dashboard/products",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      hoverBorder: "hover:border-purple-200",
      hoverBg: "group-hover:bg-purple-50",
    },
    {
      title: "Today's Sales",
      value: `Rs. ${stats.todaySales.toLocaleString()}`,
      description: "Sales generated today",
      icon: ShoppingCart,
      href: "dashboard/sales",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      hoverBorder: "hover:border-blue-200",
      hoverBg: "group-hover:bg-blue-50",
    },
    {
      title: "Low Stock",
      value: stats.lowStock,
      description: "Products with stock below 5",
      icon: AlertTriangle,
      href: "dashboard/products",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      hoverBorder: "hover:border-red-200",
      hoverBg: "group-hover:bg-red-50",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse" />

              <p className="text-xs font-semibold tracking-wide text-purple-600">
                GO-Pharma
              </p>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Welcome back, {user?.name || "User"}.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-200 hover:text-purple-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={`transition-transform duration-500 ${
                loading ? "animate-spin" : "group-hover:rotate-180"
              }`}
            />

            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className={`group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${card.hoverBorder}`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor} transition-all duration-300 group-hover:scale-110 group-hover:rotate-2`}
                  >
                    <Icon size={21} />
                  </div>

                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 ${card.hoverBg} transition-all duration-300`}
                  >
                    <ArrowRight
                      size={17}
                      className="text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-purple-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  {loading ? (
                    <div className="mt-2 h-9 w-28 animate-pulse rounded-lg bg-slate-100" />
                  ) : (
                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      {card.value}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-slate-400">
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Low Stock Products */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                  <AlertTriangle
                    size={18}
                    className="text-red-500"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Low Stock Products
                  </h2>

                  <p className="mt-0.5 text-sm text-slate-500">
                    Products with stock less than 5
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="dashboard/products"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 transition-colors duration-200 hover:text-purple-700"
            >
              View Products

              <ArrowRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4 px-6 py-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                  </div>

                  <div className="space-y-2 text-right">
                    <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-100" />
                    <div className="ml-auto h-3 w-12 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : lowStockProducts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 transition-transform duration-300 hover:scale-110">
                <Package
                  size={20}
                  className="text-green-600"
                />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-900">
                No low stock products
              </p>

              <p className="mt-1 text-xs text-slate-500">
                All products currently have stock of 5 or more.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStockProducts.map((product) => (
                <div
                  key={product._id}
                  className="group flex items-center justify-between px-6 py-4 transition-all duration-200 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 transition-colors duration-200 group-hover:text-purple-600">
                      {product.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {product.category || "No category"}
                    </p>
                  </div>

                  <div className="ml-4 flex-shrink-0 text-right">
                    <p className="text-sm font-semibold text-red-600">
                      {Number(product.stock || 0)} left
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Low stock
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
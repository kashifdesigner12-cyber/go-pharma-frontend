"use client";

import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  Receipt,
  CalendarDays,
  CreditCard,
  X,
  Package,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);

  // Load sales from backend
  const loadSales = async () => {
    try {
      setError("");

      const response = await apiRequest("/sales");

      const list = Array.isArray(response?.sales)
        ? response.sales
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      setSales(list);
    } catch (err) {
      console.error("Sales Load Error:", err);
      setError(err.message || "Failed to load sales.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadSales();
  };

  // Receipt number
  const getReceiptNumber = (sale) => {
    return (
      sale?.receiptNumber ||
      sale?.invoiceNumber ||
      sale?.invoice ||
      "N/A"
    );
  };

  // Total amount
  const getTotal = (sale) => {
    const value = Number(sale?.totalAmount || 0);
    return value.toFixed(2);
  };

  // Payment method
  const getPaymentMethod = (sale) => {
    const method = sale?.paymentMethod;

    if (!method) {
      return "N/A";
    }

    return String(method).toUpperCase();
  };

  // Date
  const getDate = (sale) => {
    const date = sale?.createdAt || sale?.saleDate || sale?.date;

    if (!date) {
      return "N/A";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleString();
  };

  // Product name
  const getProductName = (item) => {
    if (typeof item?.product === "object" && item?.product) {
      return item.product?.name || "Product";
    }

    return item?.productName || "Product";
  };

  // Product SKU
  const getProductSku = (item) => {
    if (typeof item?.product === "object" && item?.product) {
      return item.product?.sku || item.product?.SKU || "";
    }

    return "";
  };

  // Unit price
  const getUnitPrice = (item) => {
    return Number(item?.price || item?.unitPrice || 0);
  };

  // Search
  const filteredSales = sales.filter((sale) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return true;
    }

    const receiptNumber = getReceiptNumber(sale).toLowerCase();
    const paymentMethod = getPaymentMethod(sale).toLowerCase();

    const productNames = Array.isArray(sale?.items)
      ? sale.items
          .map((item) => getProductName(item))
          .join(" ")
          .toLowerCase()
      : "";

    return (
      receiptNumber.includes(searchText) ||
      paymentMethod.includes(searchText) ||
      productNames.includes(searchText)
    );
  });

  return (
    <div className="min-w-0 space-y-6 px-6 pb-6 pt-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            Sales
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View completed sales and their details.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>

      </div>

      {/* SEARCH */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md">

        <div className="relative">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt, payment method or product..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />

        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm transition-all duration-300">

          <span>{error}</span>

          <button
            type="button"
            onClick={loadSales}
            className="rounded-md px-2 py-1 font-medium underline transition-all duration-200 hover:bg-red-100"
          >
            Retry
          </button>

        </div>
      )}

      {/* SALES TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">

        <div className="border-b border-gray-200 px-5 py-4">

          <div className="flex items-center justify-between gap-3">

            <h2 className="font-semibold text-gray-900">
              Sales History
            </h2>

            <span className="shrink-0 text-sm text-gray-500">
              {filteredSales.length} sale
              {filteredSales.length !== 1 ? "s" : ""}
            </span>

          </div>

        </div>

        {loading ? (
          <div className="flex min-h-52 items-center justify-center">

            <div className="flex items-center gap-2 text-sm text-gray-500">

              <RefreshCw
                size={24}
                className="animate-spin text-purple-600"
              />

              <span>Loading sales...</span>

            </div>

          </div>
        ) : filteredSales.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">

            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 transition-all duration-300 hover:scale-105 hover:bg-purple-50">

              <Receipt
                size={26}
                className="text-gray-400 transition-colors duration-300 hover:text-purple-600"
              />

            </div>

            <p className="font-medium text-gray-700">
              No sales found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Completed sales will appear here.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px]">

              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">

                  <th className="px-5 py-3">
                    Receipt
                  </th>

                  <th className="px-5 py-3">
                    Items
                  </th>

                  <th className="px-5 py-3">
                    Total
                  </th>

                  <th className="px-5 py-3">
                    Payment
                  </th>

                  <th className="px-5 py-3">
                    Date
                  </th>

                  <th className="px-5 py-3 text-right">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredSales.map((sale, index) => {
                  const receiptNumber = getReceiptNumber(sale);

                  const itemCount = Array.isArray(sale?.items)
                    ? sale.items.reduce(
                        (total, item) =>
                          total + Number(item?.quantity || 0),
                        0
                      )
                    : 0;

                  return (
                    <tr
                      key={sale?._id || sale?.id || index}
                      className="group transition-all duration-200 hover:bg-purple-50/40"
                    >

                      {/* Receipt */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 transition-all duration-200 group-hover:scale-105 group-hover:bg-purple-100">

                            <Receipt
                              size={17}
                              className="text-purple-600"
                            />

                          </div>

                          <span className="font-medium text-gray-900">
                            {receiptNumber}
                          </span>

                        </div>

                      </td>

                      {/* Items */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2 text-sm text-gray-700">

                          <Package
                            size={16}
                            className="text-gray-400 transition-colors duration-200 group-hover:text-purple-500"
                          />

                          {itemCount} item
                          {itemCount !== 1 ? "s" : ""}

                        </div>

                      </td>

                      {/* Total */}
                      <td className="px-5 py-4">

                        <span className="font-semibold text-gray-900">
                          {getTotal(sale)}
                        </span>

                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2 text-sm text-gray-700">

                          <CreditCard
                            size={16}
                            className="text-gray-400 transition-colors duration-200 group-hover:text-purple-500"
                          />

                          {getPaymentMethod(sale)}

                        </div>

                      </td>

                      {/* Date */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2 text-sm text-gray-600">

                          <CalendarDays
                            size={16}
                            className="text-gray-400 transition-colors duration-200 group-hover:text-purple-500"
                          />

                          {getDate(sale)}

                        </div>

                      </td>

                      {/* View */}
                      <td className="px-5 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedSale(sale)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 hover:shadow-sm"
                        >
                          <Eye
                            size={16}
                            className="transition-transform duration-200"
                          />

                          View
                        </button>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* SALE DETAILS MODAL */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">

          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl transition-all duration-300">

            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">

              <div className="min-w-0 pr-4">

                <h2 className="text-xl font-bold text-gray-900">
                  Sale Details
                </h2>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {getReceiptNumber(selectedSale)}
                </p>

              </div>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="shrink-0 rounded-lg p-2 text-gray-500 transition-all duration-200 hover:rotate-90 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>

            </div>

            {/* SALE SUMMARY */}
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">

              {/* Receipt */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-50/50 hover:shadow-sm">

                <div className="flex items-center gap-2 text-sm text-gray-500">

                  <Receipt size={16} />

                  Receipt

                </div>

                <p className="mt-2 break-all font-semibold text-gray-900">
                  {getReceiptNumber(selectedSale)}
                </p>

              </div>

              {/* Total */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-50/50 hover:shadow-sm">

                <p className="text-sm text-gray-500">
                  Total Amount
                </p>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  {getTotal(selectedSale)}
                </p>

              </div>

              {/* Payment */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-50/50 hover:shadow-sm">

                <div className="flex items-center gap-2 text-sm text-gray-500">

                  <CreditCard size={16} />

                  Payment

                </div>

                <p className="mt-2 font-semibold text-gray-900">
                  {getPaymentMethod(selectedSale)}
                </p>

              </div>

              {/* Date */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-50/50 hover:shadow-sm">

                <div className="flex items-center gap-2 text-sm text-gray-500">

                  <CalendarDays size={16} />

                  Date

                </div>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {getDate(selectedSale)}
                </p>

              </div>

            </div>

            {/* ITEMS */}
            <div className="px-6 pb-6">

              <div className="mb-3 flex items-center justify-between gap-3">

                <h3 className="text-lg font-semibold text-gray-900">
                  Sale Items
                </h3>

                <span className="shrink-0 text-sm text-gray-500">
                  {Array.isArray(selectedSale?.items)
                    ? selectedSale.items.length
                    : 0}{" "}
                  product
                  {Array.isArray(selectedSale?.items) &&
                  selectedSale.items.length !== 1
                    ? "s"
                    : ""}
                </span>

              </div>

              {Array.isArray(selectedSale?.items) &&
              selectedSale.items.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[650px]">

                      <thead>

                        <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">

                          <th className="px-4 py-3">
                            Product
                          </th>

                          <th className="px-4 py-3">
                            SKU
                          </th>

                          <th className="px-4 py-3">
                            Quantity
                          </th>

                          <th className="px-4 py-3">
                            Unit Price
                          </th>

                          <th className="px-4 py-3 text-right">
                            Total
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-gray-100">

                        {selectedSale.items.map(
                          (item, index) => {
                            const quantity = Number(
                              item?.quantity || 0
                            );

                            const unitPrice =
                              getUnitPrice(item);

                            const itemTotal =
                              quantity * unitPrice;

                            return (
                              <tr
                                key={
                                  item?._id ||
                                  item?.product?._id ||
                                  index
                                }
                                className="group transition-all duration-200 hover:bg-purple-50/40"
                              >

                                <td className="px-4 py-4">

                                  <div className="flex items-center gap-3">

                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 transition-all duration-200 group-hover:scale-105 group-hover:bg-purple-100">

                                      <Package
                                        size={17}
                                        className="text-purple-600"
                                      />

                                    </div>

                                    <span className="font-medium text-gray-900">
                                      {getProductName(item)}
                                    </span>

                                  </div>

                                </td>

                                <td className="px-4 py-4 text-sm text-gray-500">
                                  {getProductSku(item) ||
                                    "N/A"}
                                </td>

                                <td className="px-4 py-4 text-sm text-gray-700">
                                  {quantity}
                                </td>

                                <td className="px-4 py-4 text-sm text-gray-700">
                                  {unitPrice.toFixed(2)}
                                </td>

                                <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                                  {itemTotal.toFixed(2)}
                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                      {/* TOTAL */}
                      <tfoot>

                        <tr className="border-t border-gray-200 bg-gray-50">

                          <td
                            colSpan={4}
                            className="px-4 py-4 text-right font-semibold text-gray-700"
                          >
                            Grand Total
                          </td>

                          <td className="px-4 py-4 text-right text-lg font-bold text-gray-900">
                            {getTotal(selectedSale)}
                          </td>

                        </tr>

                      </tfoot>

                    </table>

                  </div>

                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 py-10 text-center transition-all duration-200 hover:bg-gray-100">

                  <Package
                    size={36}
                    className="mx-auto mb-2 text-gray-300"
                  />

                  <p className="text-sm text-gray-500">
                    No sale items found.
                  </p>

                </div>
              )}

            </div>

            {/* MODAL FOOTER */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4 text-right">

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md active:translate-y-0"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
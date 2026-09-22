"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Barcode,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
  CheckCircle,
  RefreshCw,
  Printer,
  FileText,
  Package,
  UserRound,
  CreditCard,
  Banknote,
  Sparkles,
} from "lucide-react";
import { apiRequest, API_URL } from "@/lib/api";

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [search, setSearch] = useState("");
  const [barcode, setBarcode] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountPaid, setAmountPaid] = useState("");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [receipt, setReceipt] = useState(null);

  // =========================
  // PRODUCT ID
  // =========================
  const getProductId = (product) => {
    const id =
      product?._id ||
      product?.id ||
      product?.productId ||
      product?.product?._id ||
      product?.product?.id;

    if (typeof id === "string") {
      return id;
    }

    if (id && typeof id === "object") {
      if (typeof id.$oid === "string") {
        return id.$oid;
      }

      if (typeof id.toString === "function") {
        const value = id.toString();

        if (value !== "[object Object]") {
          return value;
        }
      }
    }

    return "";
  };

  // =========================
  // PRODUCT HELPERS
  // =========================
  const getProductName = (product) =>
    product?.name ||
    product?.productName ||
    product?.medicineName ||
    "Unnamed Product";

  const getProductPrice = (product) => {
    const price =
      product?.salePrice ??
      product?.sellingPrice ??
      product?.price ??
      0;

    return Number(price);
  };

  const getProductStock = (product) => {
    const stock =
      product?.stock ??
      product?.currentStock ??
      product?.quantity ??
      product?.inventory?.quantity ??
      0;

    return Number(stock);
  };

  const getProductSku = (product) =>
    String(product?.sku || product?.SKU || "N/A");

  const getProductBarcode = (product) =>
    String(product?.barcode || product?.barCode || "");

  // =========================
  // LOAD PRODUCTS
  // =========================
  const loadProducts = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await apiRequest("/products");

      const list = Array.isArray(response?.products)
        ? response.products
        : Array.isArray(response?.data?.products)
        ? response.data.products
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      setProducts(list);

      return list;
    } catch (err) {
      console.error("POS PRODUCTS ERROR:", err);

      setError(err?.message || "Unable to load products.");

      return [];
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadProducts(true);
  }, []);

  // =========================
  // FILTER PRODUCTS
  // =========================
  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return products;
    }

    return products.filter((product) => {
      const name = getProductName(product).toLowerCase();
      const sku = getProductSku(product).toLowerCase();
      const productBarcode =
        getProductBarcode(product).toLowerCase();

      return (
        name.includes(value) ||
        sku.includes(value) ||
        productBarcode.includes(value)
      );
    });
  }, [products, search]);

  // =========================
  // ADD TO CART
  // =========================
  const addToCart = (product) => {
    setError("");
    setSuccess("");

    const productId = getProductId(product);

    if (!productId) {
      setError("Product ID is missing.");
      return;
    }

    const price = getProductPrice(product);
    const stock = getProductStock(product);

    if (!Number.isFinite(price) || price < 0) {
      setError("This product has an invalid sale price.");
      return;
    }

    if (!Number.isFinite(stock) || stock <= 0) {
      setError(`${getProductName(product)} is out of stock.`);
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.productId === productId
      );

      if (existing) {
        const nextQuantity = existing.quantity + 1;

        if (nextQuantity > stock) {
          setError(
            `Only ${stock} unit(s) available for ${getProductName(
              product
            )}.`
          );

          return currentCart;
        }

        return currentCart.map((item) =>
          item.productId === productId
            ? {
                ...item,
                product,
                unitPrice: price,
                quantity: nextQuantity,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          productId,
          product,
          quantity: 1,
          unitPrice: price,
        },
      ];
    });
  };

  // =========================
  // UPDATE QUANTITY
  // =========================
  const updateQuantity = (productId, quantity) => {
    const item = cart.find(
      (cartItem) => cartItem.productId === productId
    );

    if (!item) {
      return;
    }

    const stock = getProductStock(item.product);

    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    if (
      Number.isFinite(stock) &&
      stock >= 0 &&
      quantity > stock
    ) {
      setError(
        `Only ${stock} unit(s) available for ${getProductName(
          item.product
        )}.`
      );
      return;
    }

    setError("");

    setCart((currentCart) =>
      currentCart.map((cartItem) =>
        cartItem.productId === productId
          ? {
              ...cartItem,
              quantity,
            }
          : cartItem
      )
    );
  };

  // =========================
  // REMOVE FROM CART
  // =========================
  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.productId !== productId
      )
    );
  };

  // =========================
  // BARCODE SEARCH
  // =========================
  const handleBarcodeSearch = (event) => {
    event.preventDefault();

    const value = barcode.trim().toLowerCase();

    if (!value) {
      return;
    }

    setError("");
    setSuccess("");

    const product = products.find(
      (item) =>
        getProductBarcode(item)
          .trim()
          .toLowerCase() === value
    );

    if (!product) {
      setError("Product with this barcode was not found.");
      return;
    }

    addToCart(product);
    setBarcode("");
  };

  // =========================
  // TOTALS
  // =========================
  const subtotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.unitPrice) * Number(item.quantity),
    0
  );

  const total = subtotal;

  const paid =
    amountPaid === "" ? 0 : Number(amountPaid);

  const safePaid =
    Number.isFinite(paid) && paid >= 0
      ? paid
      : 0;

  const change = Math.max(
    safePaid - total,
    0
  );

  const due = Math.max(
    total - safePaid,
    0
  );

  // =========================
  // PAYMENT METHOD
  // =========================
  const getBackendPaymentMethod = () => {
    if (paymentMethod === "CASH") {
      return "cash";
    }

    if (paymentMethod === "CARD") {
      return "card";
    }

    return "";
  };

  // =========================
  // PRINT RECEIPT
  // =========================
  const printReceipt = () => {
    if (!receipt) {
      return;
    }

    window.print();
  };

  // =========================
  // OPEN PDF RECEIPT
  // =========================
  const openPdfReceipt = () => {
    if (!receipt?.id) {
      setError("Receipt ID is missing.");
      return;
    }

    const url = `${API_URL}/sales/${receipt.id}/receipt`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =========================
  // CLOSE RECEIPT
  // =========================
  const closeReceipt = () => {
    setReceipt(null);
  };

  // =========================
  // COMPLETE SALE
  // =========================
  const completeSale = async () => {
    if (processing) {
      return;
    }

    setError("");
    setSuccess("");

    if (cart.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    const backendPaymentMethod =
      getBackendPaymentMethod();

    if (!backendPaymentMethod) {
      setError("Please select Cash or Card.");
      return;
    }

    if (!Number.isFinite(safePaid) || safePaid < 0) {
      setError("Paid amount cannot be negative.");
      return;
    }

    if (safePaid < total) {
      setError(
        "Paid amount cannot be less than the total."
      );
      return;
    }

    try {
      setProcessing(true);

      const saleItems = [];

      for (const item of cart) {
        const productId =
          getProductId(item.product) ||
          item.productId;

        const quantity = Number(item.quantity);

        if (!productId) {
          throw new Error(
            "A cart item has an invalid product ID."
          );
        }

        if (
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          throw new Error(
            "Cart contains an invalid quantity."
          );
        }

        saleItems.push({
          product: String(productId),
          quantity,
        });
      }

      const payload = {
        items: saleItems,
        paymentMethod: backendPaymentMethod,
      };

      const response = await apiRequest(
        "/sales",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const sale =
        response?.sale ||
        response?.data?.sale ||
        response?.data ||
        null;

      if (!sale) {
        throw new Error(
          "Sale was created but sale details were not returned."
        );
      }

      const saleId =
        sale?._id ||
        sale?.id ||
        "";

      const receiptNumber =
        sale?.receiptNumber ||
        "N/A";

      setReceipt({
        id: saleId,
        receiptNumber,
        date: sale?.createdAt
          ? new Date(
              sale.createdAt
            ).toLocaleString()
          : new Date().toLocaleString(),
        paymentMethod:
          sale?.paymentMethod ||
          backendPaymentMethod,
        customerName:
          customerName.trim() ||
          "Walk-in Customer",
        items: cart.map((item) => ({
          name: getProductName(
            item.product
          ),
          quantity: Number(
            item.quantity
          ),
          price: Number(
            item.unitPrice
          ),
          total:
            Number(item.unitPrice) *
            Number(item.quantity),
        })),
        total: Number(
          sale?.totalAmount ?? total
        ),
        paid: safePaid,
        change,
      });

      setSuccess(
        `Sale completed successfully — Receipt: ${receiptNumber}`
      );

      setCart([]);
      setCustomerName("");
      setAmountPaid("");
      setPaymentMethod("CASH");
      setSearch("");
      setBarcode("");

      await loadProducts(false);
    } catch (err) {
      console.error(
        "========== POS SALE ERROR =========="
      );

      console.error(err);

      console.error(
        "===================================="
      );

      setError(
        err?.message ||
          "Unable to complete sale."
      );
    } finally {
      setProcessing(false);
    }
  };

  // =========================
  // CLEAR CART
  // =========================
  const clearCart = () => {
    if (processing) {
      return;
    }

    setCart([]);
    setCustomerName("");
    setAmountPaid("");
    setPaymentMethod("CASH");
    setError("");
    setSuccess("");
  };

  return (
    <main className="min-h-full bg-slate-50 print:bg-white">

      {/* =========================
          POS SCREEN
      ========================= */}
      <div className="print:hidden">

        <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

          {/* HEADER */}
          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between animate-in fade-in slide-in-from-top-2 duration-500">

            <div>
              <div className="mb-2 flex items-center gap-2">

                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-600 transition-transform duration-300 hover:scale-110 hover:rotate-3">
                  <Sparkles size={14} />
                </span>

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
                  GO-Pharma
                </p>

              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 transition-colors duration-300 sm:text-4xl">
                Point of Sale
              </h1>

              <p className="mt-1.5 text-sm text-slate-500">
                Create a new pharmacy sale quickly and securely.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadProducts(true)}
              disabled={loading || processing}
              className="group inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-300 hover:text-purple-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
            >
              <RefreshCw
                size={16}
                className={`transition-transform duration-500 ${
                  loading
                    ? "animate-spin"
                    : "group-hover:rotate-180"
                }`}
              />

              Refresh Products
            </button>

          </div>

          {/* ALERTS */}
          {error && (
            <div className="mb-5 flex animate-in fade-in slide-in-from-top-2 items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm duration-300">

              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
                className="ml-4 rounded-lg p-1 transition-all duration-200 hover:rotate-90 hover:bg-red-100"
              >
                <X size={17} />
              </button>

            </div>
          )}

          {success && (
            <div className="mb-5 flex animate-in fade-in slide-in-from-top-2 items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm duration-300">

              <CheckCircle size={18} />

              <span>{success}</span>

            </div>
          )}

          {/* MAIN GRID */}
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">

            {/* PRODUCTS */}
            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-left-2">

              {/* PRODUCTS HEADER */}
              <div className="border-b border-slate-100 bg-gradient-to-r from-white to-purple-50/40 p-5 sm:p-6">

                <div className="mb-5 flex items-center justify-between gap-3">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-all duration-300 hover:scale-110 hover:rotate-3 hover:bg-purple-600 hover:text-white">
                      <Package size={19} />
                    </div>

                    <div className="min-w-0">

                      <h2 className="font-bold text-slate-900">
                        Products
                      </h2>

                      <p className="truncate text-xs text-slate-400">
                        Select a product to add it to cart
                      </p>

                    </div>

                  </div>

                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 transition-all duration-300 hover:bg-purple-100 hover:text-purple-600">
                    {filteredProducts.length} available
                  </span>

                </div>

                {/* SEARCH */}
                <div className="relative">

                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search product, SKU or barcode..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />

                </div>

                {/* BARCODE */}
                <form
                  onSubmit={handleBarcodeSearch}
                  className="mt-3 flex gap-2"
                >

                  <div className="relative min-w-0 flex-1">

                    <Barcode
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) =>
                        setBarcode(e.target.value)
                      }
                      placeholder="Scan / enter barcode..."
                      className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm outline-none transition-all duration-300 hover:border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />

                  </div>

                  <button
                    type="submit"
                    disabled={
                      !barcode.trim() ||
                      processing
                    }
                    className="shrink-0 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-purple-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add
                  </button>

                </form>

              </div>

              {/* PRODUCT LIST */}
              <div className="max-h-[650px] overflow-y-auto p-5 sm:p-6">

                {loading ? (
                  <div className="grid gap-3 sm:grid-cols-2">

                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="animate-pulse rounded-xl border border-slate-100 p-4"
                      >

                        <div className="flex justify-between">

                          <div className="space-y-2">
                            <div className="h-4 w-32 rounded bg-slate-200" />
                            <div className="h-3 w-20 rounded bg-slate-100" />
                          </div>

                          <div className="h-8 w-8 rounded-lg bg-slate-100" />

                        </div>

                        <div className="mt-5 flex justify-between">

                          <div className="h-4 w-20 rounded bg-slate-200" />

                          <div className="h-3 w-14 rounded bg-slate-100" />

                        </div>

                      </div>
                    ))}

                  </div>
                ) : filteredProducts.length === 0 ? (

                  <div className="py-16 text-center animate-in fade-in zoom-in-95 duration-300">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-transform duration-300 hover:scale-105">
                      <Package size={28} />
                    </div>

                    <p className="mt-4 font-semibold text-slate-700">
                      No products found
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Try another product name, SKU or barcode.
                    </p>

                  </div>

                ) : (

                  <div className="grid gap-3 sm:grid-cols-2">

                    {filteredProducts.map((product) => {

                      const id = getProductId(product);
                      const price = getProductPrice(product);
                      const stock = getProductStock(product);

                      return (
                        <button
                          type="button"
                          key={
                            id ||
                            `${getProductSku(product)}-${getProductName(product)}`
                          }
                          onClick={() =>
                            addToCart(product)
                          }
                          disabled={
                            processing ||
                            stock <= 0
                          }
                          className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:bg-purple-50/40 hover:shadow-lg hover:shadow-purple-100/60 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                        >

                          <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-purple-600 transition-transform duration-300 group-hover:scale-x-100" />

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <h3 className="truncate text-sm font-bold text-slate-900">
                                {getProductName(product)}
                              </h3>

                              <p className="mt-1 text-xs text-slate-400">
                                SKU:{" "}
                                {getProductSku(product)}
                              </p>

                            </div>

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-purple-600 group-hover:text-white">
                              <Plus size={17} />
                            </div>

                          </div>

                          <div className="mt-5 flex items-center justify-between gap-3">

                            <span className="font-bold text-purple-600">
                              Rs.{" "}
                              {price.toLocaleString()}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                stock > 0
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-red-50 text-red-500"
                              }`}
                            >
                              Stock: {stock}
                            </span>

                          </div>

                        </button>
                      );
                    })}

                  </div>
                )}

              </div>

            </section>

            {/* CART / CHECKOUT */}
            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-right-2">

              {/* CART HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-white to-purple-50/40 p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-all duration-300 hover:scale-110 hover:rotate-3">
                    <ShoppingCart size={19} />
                  </div>

                  <div>

                    <h2 className="font-bold text-slate-900">
                      Current Sale
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {cart.length} item
                      {cart.length !== 1 ? "s" : ""}
                    </p>

                  </div>

                </div>

                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    disabled={processing}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 transition-all duration-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    Clear Cart
                  </button>
                )}

              </div>

              {/* CART ITEMS */}
              <div className="max-h-[380px] overflow-y-auto p-5">

                {cart.length === 0 ? (

                  <div className="py-14 text-center animate-in fade-in zoom-in-95 duration-300">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 transition-transform duration-300 hover:scale-105 hover:rotate-2">
                      <ShoppingCart size={30} />
                    </div>

                    <p className="mt-4 font-semibold text-slate-600">
                      Cart is empty
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Select a product to add it to the sale.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-3">

                    {cart.map((item) => (

                      <div
                        key={item.productId}
                        className="group rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-200 hover:bg-purple-50/30 hover:shadow-sm"
                      >

                        <div className="flex justify-between gap-3">

                          <div className="min-w-0">

                            <p className="truncate text-sm font-bold text-slate-900">
                              {getProductName(item.product)}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Rs.{" "}
                              {Number(
                                item.unitPrice
                              ).toLocaleString()}{" "}
                              each
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                item.productId
                              )
                            }
                            disabled={processing}
                            className="rounded-lg p-1.5 text-slate-400 opacity-70 transition-all duration-300 hover:rotate-6 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">

                          <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity - 1
                                )
                              }
                              disabled={processing}
                              className="px-3 py-1.5 text-slate-500 transition-all duration-200 hover:bg-purple-50 hover:text-purple-600 disabled:opacity-50"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="min-w-9 text-center text-sm font-bold">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity + 1
                                )
                              }
                              disabled={processing}
                              className="px-3 py-1.5 text-slate-500 transition-all duration-200 hover:bg-purple-50 hover:text-purple-600 disabled:opacity-50"
                            >
                              <Plus size={14} />
                            </button>

                          </div>

                          <span className="font-bold text-slate-900">
                            Rs.{" "}
                            {(
                              Number(item.unitPrice) *
                              Number(item.quantity)
                            ).toLocaleString()}
                          </span>

                        </div>

                      </div>
                    ))}

                  </div>
                )}

              </div>

              {/* CHECKOUT */}
              <div className="border-t border-slate-100 bg-slate-50/40 p-5">

                <div className="space-y-3">

                  {/* CUSTOMER */}
                  <div>

                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <UserRound size={13} />
                      Customer Name
                    </label>

                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) =>
                        setCustomerName(e.target.value)
                      }
                      disabled={processing}
                      placeholder="Walk-in customer"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition-all duration-300 hover:border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:bg-slate-50"
                    />

                  </div>

                  {/* PAYMENT */}
                  <div>

                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <CreditCard size={13} />
                      Payment Method
                    </label>

                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value)
                      }
                      disabled={processing}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition-all duration-300 hover:border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:bg-slate-50"
                    >

                      <option value="CASH">
                        Cash
                      </option>

                      <option value="CARD">
                        Card
                      </option>

                    </select>

                  </div>

                  {/* AMOUNT */}
                  <div>

                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <Banknote size={13} />
                      Amount Paid
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) =>
                        setAmountPaid(e.target.value)
                      }
                      disabled={processing}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition-all duration-300 hover:border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:bg-slate-50"
                    />

                  </div>

                </div>

                {/* TOTALS */}
                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-purple-200 hover:shadow-md">

                  <div className="flex justify-between text-sm text-slate-500">

                    <span>
                      Subtotal
                    </span>

                    <span>
                      Rs.{" "}
                      {subtotal.toLocaleString()}
                    </span>

                  </div>

                  <div className="my-3 border-t border-dashed border-slate-200" />

                  <div className="flex items-center justify-between">

                    <span className="text-base font-bold text-slate-900">
                      Total
                    </span>

                    <span className="text-xl font-extrabold text-purple-600 transition-all duration-300">
                      Rs.{" "}
                      {total.toLocaleString()}
                    </span>

                  </div>

                  <div className="mt-3 flex justify-between text-sm text-green-600">

                    <span>
                      Change
                    </span>

                    <span className="font-semibold">
                      Rs.{" "}
                      {change.toLocaleString()}
                    </span>

                  </div>

                  <div className="mt-2 flex justify-between text-sm text-orange-600">

                    <span>
                      Due
                    </span>

                    <span className="font-semibold">
                      Rs.{" "}
                      {due.toLocaleString()}
                    </span>

                  </div>

                </div>

                {/* COMPLETE */}
                <button
                  type="button"
                  onClick={completeSale}
                  disabled={
                    processing ||
                    cart.length === 0
                  }
                  className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >

                  {processing ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />

                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle
                        size={17}
                        className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                      />

                      Complete Sale
                    </>
                  )}

                </button>

              </div>

            </section>

          </div>

        </div>

      </div>

      {/* =========================
          PROFESSIONAL RECEIPT
      ========================= */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm animate-in fade-in duration-200 print:static print:block print:bg-white print:p-0 print:backdrop-blur-none">

          <div className="relative flex max-h-[96vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-300 print:max-h-none print:w-[80mm] print:max-w-[80mm] print:overflow-visible print:rounded-none print:bg-white print:shadow-none">

            {/* RECEIPT MODAL HEADER */}
            <div className="receipt-no-print flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <FileText size={19} />
                </div>

                <div>

                  <h2 className="font-bold text-slate-900">
                    Sale Receipt
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {receipt.receiptNumber}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={closeReceipt}
                className="rounded-lg p-2 text-slate-400 transition-all duration-300 hover:rotate-90 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>

            </div>

            {/* RECEIPT CONTENT */}
            <div className="overflow-y-auto px-3 py-5 sm:px-5 print:overflow-visible print:p-0">

              {/* 80MM THERMAL RECEIPT */}
              <div className="pos-receipt-print mx-auto w-full max-w-[380px] bg-white px-5 py-6 font-mono text-black print:mx-0 print:w-[80mm] print:max-w-[80mm] print:px-[4mm] print:py-[4mm]">

                {/* STORE HEADER */}
                <div className="text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-black">

                    <span className="text-lg font-black">
                      GP
                    </span>

                  </div>

                  <h1 className="mt-2 text-2xl font-black tracking-[0.14em]">
                    GO-PHARMA
                  </h1>

                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em]">
                    PHARMACY
                  </p>

                  <p className="mt-1 text-[9px]">
                    SALES RECEIPT
                  </p>

                </div>

                <div className="my-4 border-t-2 border-dashed border-black" />

                {/* RECEIPT DETAILS */}
                <div className="space-y-1.5 text-[10px]">

                  <div className="flex justify-between gap-3">

                    <span className="font-bold">
                      RECEIPT #
                    </span>

                    <span className="max-w-[180px] break-all text-right font-bold">
                      {receipt.receiptNumber}
                    </span>

                  </div>

                  <div className="flex justify-between gap-3">

                    <span className="font-bold">
                      DATE
                    </span>

                    <span className="text-right">
                      {receipt.date}
                    </span>

                  </div>

                  <div className="flex justify-between gap-3">

                    <span className="font-bold">
                      CUSTOMER
                    </span>

                    <span className="max-w-[180px] break-words text-right">
                      {receipt.customerName}
                    </span>

                  </div>

                  <div className="flex justify-between gap-3">

                    <span className="font-bold">
                      PAYMENT
                    </span>

                    <span className="font-bold uppercase">
                      {receipt.paymentMethod}
                    </span>

                  </div>

                </div>

                <div className="my-4 border-t-2 border-dashed border-black" />

                {/* ITEM TABLE HEADER */}
                <div className="grid grid-cols-[1fr_35px_62px] gap-2 text-[9px] font-black uppercase">

                  <span>
                    ITEM
                  </span>

                  <span className="text-center">
                    QTY
                  </span>

                  <span className="text-right">
                    AMOUNT
                  </span>

                </div>

                <div className="mt-2 border-t border-black" />

                {/* ITEMS */}
                <div className="space-y-3 pt-3">

                  {receipt.items.map(
                    (item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="text-[10px]"
                      >

                        <div className="break-words font-bold leading-tight">
                          {item.name}
                        </div>

                        <div className="mt-1 grid grid-cols-[1fr_35px_62px] gap-2">

                          <span className="text-[9px]">
                            @ Rs.{" "}
                            {item.price.toLocaleString()}
                          </span>

                          <span className="text-center font-bold">
                            {item.quantity}
                          </span>

                          <span className="text-right font-bold">
                            Rs.{" "}
                            {item.total.toLocaleString()}
                          </span>

                        </div>

                      </div>
                    )
                  )}

                </div>

                <div className="my-4 border-t-2 border-dashed border-black" />

                {/* TOTALS */}
                <div className="space-y-2 text-[10px]">

                  <div className="flex justify-between">

                    <span>
                      SUBTOTAL
                    </span>

                    <span>
                      Rs.{" "}
                      {receipt.total.toLocaleString()}
                    </span>

                  </div>

                  <div className="flex justify-between text-[15px] font-black">

                    <span>
                      TOTAL
                    </span>

                    <span>
                      Rs.{" "}
                      {receipt.total.toLocaleString()}
                    </span>

                  </div>

                  <div className="flex justify-between">

                    <span>
                      PAID
                    </span>

                    <span>
                      Rs.{" "}
                      {receipt.paid.toLocaleString()}
                    </span>

                  </div>

                  <div className="flex justify-between font-bold">

                    <span>
                      CHANGE
                    </span>

                    <span>
                      Rs.{" "}
                      {receipt.change.toLocaleString()}
                    </span>

                  </div>

                </div>

                <div className="my-4 border-t-2 border-dashed border-black" />

                {/* PAYMENT STATUS */}
                <div className="text-center">

                  <p className="text-[10px] font-black uppercase tracking-wider">
                    PAYMENT RECEIVED
                  </p>

                  <p className="mt-2 text-[9px]">
                    Thank you for your purchase
                  </p>

                  <p className="mt-1 text-[9px]">
                    Please keep this receipt for your records.
                  </p>

                </div>

                {/* FOOTER */}
                <div className="mt-5 text-center">

                  <p className="text-[10px] font-black tracking-wider">
                    GO-PHARMA
                  </p>

                  <p className="mt-1 text-[8px]">
                    PHARMACY POS
                  </p>

                  <p className="mt-3 text-[9px]">
                    *** THANK YOU ***
                  </p>

                </div>

              </div>

            </div>

            {/* ACTIONS */}
            <div className="receipt-no-print grid shrink-0 grid-cols-2 gap-3 border-t border-slate-200 bg-white p-4">

              <button
                type="button"
                onClick={printReceipt}
                className="group flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-lg active:scale-[0.99]"
              >

                <Printer
                  size={17}
                  className="transition-transform duration-300 group-hover:scale-110"
                />

                Print Receipt

              </button>

              <button
                type="button"
                onClick={openPdfReceipt}
                className="group flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-300 hover:text-purple-600 hover:shadow-sm active:scale-[0.99]"
              >

                <FileText
                  size={17}
                  className="transition-transform duration-300 group-hover:scale-110"
                />

                Open PDF

              </button>

              <button
                type="button"
                onClick={closeReceipt}
                className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-300 hover:bg-slate-100 hover:text-slate-900"
              >
                Close Receipt
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}
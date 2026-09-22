"use client";

import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Package,
  X,
  Boxes,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    unit: "box",
    category: "",
    purchasePrice: "",
    salePrice: "",
    stock: "0",
  });

  const [stockValue, setStockValue] = useState("");

  // =========================
  // GET PRODUCT ID
  // =========================
  const getProductId = (product) => {
    if (!product) return "";

    const id =
      product?._id ??
      product?.id ??
      product?.productId ??
      product?.product?._id ??
      product?.product?.id ??
      "";

    if (!id) return "";

    if (typeof id === "object") {
      if (id.$oid) {
        return String(id.$oid);
      }

      if (typeof id.toString === "function") {
        return String(id.toString());
      }
    }

    return String(id).trim();
  };

  // =========================
  // GET CATEGORY ID
  // =========================
  const getCategoryId = (category) => {
    if (!category) return "";

    if (typeof category === "string") {
      return category.trim();
    }

    const id =
      category?._id ??
      category?.id ??
      category?.categoryId ??
      "";

    if (!id) return "";

    if (typeof id === "object" && id.$oid) {
      return String(id.$oid).trim();
    }

    return String(id).trim();
  };

  // =========================
  // GET STOCK
  // =========================
  const getStock = (product) => {
    return Number(
      product?.stock ??
        product?.currentStock ??
        product?.quantity ??
        product?.inventory?.quantity ??
        0
    );
  };

  // =========================
  // LOAD PRODUCTS
  // =========================
  const loadProducts = async () => {
    try {
      setError("");

      const response = await apiRequest(
        "/products?page=1&limit=100"
      );

      const list =
        Array.isArray(response?.products)
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
      console.error("Products Load Error:", err);
      setError(err.message || "Failed to load products.");
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================
  // LOAD CATEGORIES
  // =========================
  const loadCategories = async () => {
    try {
      const response = await apiRequest(
        "/categories?page=1&limit=100"
      );

      const list =
        Array.isArray(response?.categories)
          ? response.categories
          : Array.isArray(response?.data?.categories)
          ? response.data.categories
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];

      setCategories(list);

      return list;
    } catch (err) {
      console.error("Categories Load Error:", err);
      return [];
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // =========================
  // REFRESH
  // =========================
  const handleRefresh = async () => {
    setRefreshing(true);

    await Promise.all([
      loadProducts(),
      loadCategories(),
    ]);
  };

  // =========================
  // RESET FORM
  // =========================
  const resetForm = () => {
    setForm({
      name: "",
      sku: "",
      barcode: "",
      unit: "box",
      category: "",
      purchasePrice: "",
      salePrice: "",
      stock: "0",
    });

    setEditingProduct(null);
  };

  // =========================
  // ADD PRODUCT
  // =========================
  const openAddForm = () => {
    resetForm();
    setError("");
    setShowForm(true);
  };

  // =========================
  // EDIT PRODUCT
  // =========================
  const openEditForm = (product) => {
    const productId = getProductId(product);

    if (!productId) {
      setError("Product ID not found.");
      console.error("Product without ID:", product);
      return;
    }

    setError("");
    setEditingProduct(product);

    const categoryId = getCategoryId(product?.category);

    setForm({
      name: product?.name || "",
      sku: product?.sku || "",
      barcode: product?.barcode || "",
      unit: product?.unit || "box",

      category: categoryId,

      purchasePrice:
        product?.purchasePrice ??
        product?.pricing?.purchasePrice ??
        "",

      salePrice:
        product?.salePrice ??
        product?.pricing?.salePrice ??
        product?.price ??
        "",

      stock: String(getStock(product)),
    });

    setShowForm(true);
  };

  // =========================
  // ADD STOCK
  // =========================
  const openStockForm = (product) => {
    const productId = getProductId(product);

    if (!productId) {
      setError("Product ID not found.");
      console.error("Product without ID:", product);
      return;
    }

    setError("");
    setStockProduct(product);
    setStockValue("");
    setShowStockForm(true);
  };

  // =========================
  // INPUT CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================
  // SAVE PRODUCT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const name = form.name.trim();
      const sku = form.sku.trim();
      const barcode = form.barcode.trim();
      const unit = form.unit.trim() || "box";
      const category = form.category.trim();

      const purchasePrice = Number(form.purchasePrice);
      const salePrice = Number(form.salePrice);
      const stock = Number(form.stock);

      if (!name) {
        setError("Product name is required.");
        return;
      }

      if (!sku) {
        setError("SKU is required.");
        return;
      }

      if (!category) {
        setError("Category is required.");
        return;
      }

      if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
        setError("Purchase price must be 0 or greater.");
        return;
      }

      if (!Number.isFinite(salePrice) || salePrice < 0) {
        setError("Sale price must be 0 or greater.");
        return;
      }

      if (!Number.isFinite(stock) || stock < 0) {
        setError("Stock must be 0 or greater.");
        return;
      }

      const payload = {
        name,
        sku,
        barcode,
        unit,
        category,
        purchasePrice,
        price: salePrice,
        salePrice,
        stock,
      };

      console.log("PRODUCT SAVE PAYLOAD:", payload);

      const productId = getProductId(editingProduct);

      if (productId) {
        await apiRequest(
          `/products/${encodeURIComponent(productId)}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await apiRequest("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setShowForm(false);
      resetForm();

      await loadProducts();
    } catch (err) {
      console.error("Product Save Error:", err);

      setError(
        err.message || "Failed to save product."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // ADD STOCK
  // =========================
  const handleStockUpdate = async (e) => {
    e.preventDefault();

    const productId = getProductId(stockProduct);

    if (!productId) {
      setError("Product ID not found.");
      return;
    }

    const quantity = Number(stockValue);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Stock quantity must be greater than 0.");
      return;
    }

    try {
      setStockSaving(true);
      setError("");

      await apiRequest(
        `/products/${encodeURIComponent(productId)}/stock`,
        {
          method: "PUT",
          body: JSON.stringify({
            quantity,
          }),
        }
      );

      setShowStockForm(false);
      setStockProduct(null);
      setStockValue("");

      await loadProducts();
    } catch (err) {
      console.error("Stock Update Error:", err);

      setError(
        err.message || "Failed to add stock."
      );
    } finally {
      setStockSaving(false);
    }
  };

  // =========================
  // FIND FRESH PRODUCT ID
  // =========================
  const findFreshProductId = async (product) => {
    const currentId = getProductId(product);

    const response = await apiRequest(
      "/products?page=1&limit=100"
    );

    const freshProducts =
      Array.isArray(response?.products)
        ? response.products
        : Array.isArray(response?.data?.products)
        ? response.data.products
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

    let freshProduct = freshProducts.find(
      (item) => getProductId(item) === currentId
    );

    if (!freshProduct && product?.barcode) {
      freshProduct = freshProducts.find(
        (item) =>
          String(item?.barcode || "").trim() ===
          String(product?.barcode || "").trim()
      );
    }

    if (!freshProduct && product?.sku) {
      freshProduct = freshProducts.find(
        (item) =>
          String(item?.sku || "").trim().toLowerCase() ===
          String(product?.sku || "").trim().toLowerCase()
      );
    }

    if (!freshProduct && product?.name) {
      freshProduct = freshProducts.find(
        (item) =>
          String(item?.name || "").trim().toLowerCase() ===
          String(product?.name || "").trim().toLowerCase()
      );
    }

    return {
      product: freshProduct,
      id: getProductId(freshProduct),
    };
  };

  // =========================
  // DELETE PRODUCT
  // =========================
  const handleDelete = async (product) => {
    if (!product) {
      setError("Product not found.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${product?.name || "this product"}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const originalId = getProductId(product);

      setDeletingId(originalId || "deleting");

      const fresh = await findFreshProductId(product);

      console.log("DELETE PRODUCT DEBUG:", {
        originalId,
        freshId: fresh.id,
        product: fresh.product,
      });

      if (!fresh.id) {
        setError(
          "This product no longer exists in the backend."
        );

        await loadProducts();
        return;
      }

      await apiRequest(
        `/products/${encodeURIComponent(fresh.id)}`,
        {
          method: "DELETE",
        }
      );

      setProducts((previous) =>
        previous.filter(
          (item) =>
            getProductId(item) !== fresh.id
        )
      );

      await loadProducts();
    } catch (err) {
      console.error("Product Delete Error:", err);

      setError(
        err.message || "Failed to delete product."
      );
    } finally {
      setDeletingId("");
    }
  };

  // =========================
  // PRICES
  // =========================
  const getPurchasePrice = (product) => {
    return Number(
      product?.purchasePrice ??
        product?.pricing?.purchasePrice ??
        0
    ).toFixed(2);
  };

  const getSalePrice = (product) => {
    return Number(
      product?.salePrice ??
        product?.pricing?.salePrice ??
        product?.price ??
        0
    ).toFixed(2);
  };

  // =========================
  // SEARCH
  // =========================
  const filteredProducts = products.filter((product) => {
    const text = search.toLowerCase().trim();

    if (!text) return true;

    return (
      String(product?.name || "")
        .toLowerCase()
        .includes(text) ||
      String(product?.sku || "")
        .toLowerCase()
        .includes(text) ||
      String(product?.barcode || "")
        .toLowerCase()
        .includes(text)
    );
  });

  return (
    <div className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 px-6 pb-8 pt-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 transition-all duration-300">
            Products
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage products, pricing and stock.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md active:translate-y-0"
          >
            <Plus
              size={18}
              className="transition-transform duration-200 group-hover:rotate-90"
            />
            Add Product
          </button>

        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm transition-all duration-300">
          {error}
        </div>
      )}

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
            placeholder="Search by product name, SKU or barcode..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />

        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">

        <div className="border-b border-gray-200 px-5 py-4">

          <div className="flex items-center justify-between gap-3">

            <h2 className="font-semibold text-gray-900">
              Product List
            </h2>

            <span className="shrink-0 text-sm text-gray-500">
              {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""}
            </span>

          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">

            <RefreshCw
              size={24}
              className="animate-spin text-purple-600"
            />

          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center">

            <Package
              size={42}
              className="mx-auto mb-3 text-gray-300 transition-transform duration-300 hover:scale-110"
            />

            <p className="font-medium text-gray-700">
              No products found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Add a product or change your search.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px]">

              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">

                  <th className="px-5 py-3">
                    Product
                  </th>

                  <th className="px-5 py-3">
                    SKU
                  </th>

                  <th className="px-5 py-3">
                    Barcode
                  </th>

                  <th className="px-5 py-3">
                    Unit
                  </th>

                  <th className="px-5 py-3">
                    Purchase
                  </th>

                  <th className="px-5 py-3">
                    Sale
                  </th>

                  <th className="px-5 py-3">
                    Stock
                  </th>

                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredProducts.map((product, index) => {
                  const productId = getProductId(product);
                  const stock = getStock(product);

                  const isDeleting =
                    deletingId === productId ||
                    deletingId === "deleting";

                  return (
                    <tr
                      key={productId || index}
                      className="group transition-all duration-200 hover:bg-purple-50/40"
                    >

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-purple-100">
                            <Package size={18} />
                          </div>

                          <div className="min-w-0">

                            <p className="truncate font-medium text-gray-900">
                              {product?.name ||
                                "Unnamed Product"}
                            </p>

                          </div>

                        </div>

                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {product?.sku || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {product?.barcode || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm capitalize text-gray-600">
                        {product?.unit || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {getPurchasePrice(product)}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        {getSalePrice(product)}
                      </td>

                      <td className="px-5 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            openStockForm(product)
                          }
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                            stock <= 0
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : stock <= 10
                              ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                          title="Add stock"
                        >
                          <Boxes size={14} />
                          {stock}
                        </button>

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(product)
                            }
                            disabled={isDeleting}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                            title="Edit Product"
                          >
                            <Pencil
                              size={16}
                              className="transition-transform duration-200 hover:scale-110"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openStockForm(product)
                            }
                            disabled={isDeleting}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                            title="Add Stock"
                          >
                            <Boxes
                              size={16}
                              className="transition-transform duration-200 hover:scale-110"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(product)
                            }
                            disabled={
                              isDeleting ||
                              !productId
                            }
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                            title="Delete Product"
                          >
                            {isDeleting ? (
                              <RefreshCw
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={16}
                                className="transition-transform duration-200 hover:scale-110"
                              />
                            )}
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>
            </table>

          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl transition-all duration-300">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p className="text-sm text-gray-500">
                  Enter product details and stock.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-lg p-2 text-gray-500 transition-all duration-200 hover:rotate-90 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >

              <div className="grid gap-4 md:grid-cols-2">

                {/* NAME */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Product Name
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter product name"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    SKU
                  </label>

                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    required
                    placeholder="Enter SKU"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                {/* CATEGORY */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Category
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map((category, index) => {
                      const categoryId =
                        getCategoryId(category);

                      return (
                        <option
                          key={
                            categoryId || index
                          }
                          value={categoryId}
                        >
                          {category?.name ||
                            category?.title ||
                            "Unnamed Category"}
                        </option>
                      );
                    })}
                  </select>

                  {categories.length === 0 && (
                    <p className="mt-1 text-xs text-red-600">
                      No categories found. Create a category first.
                    </p>
                  )}
                </div>

                {/* BARCODE */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Barcode
                  </label>

                  <input
                    name="barcode"
                    value={form.barcode}
                    onChange={handleChange}
                    placeholder="Enter barcode"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                {/* UNIT */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Unit
                  </label>

                  <select
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="box">Box</option>
                    <option value="piece">Piece</option>
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="bottle">Bottle</option>
                    <option value="strip">Strip</option>
                    <option value="pack">Pack</option>
                    <option value="unit">Unit</option>
                  </select>
                </div>

                {/* PURCHASE */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Purchase Price
                  </label>

                  <input
                    name="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.purchasePrice}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                {/* SALE */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Sale Price
                  </label>

                  <input
                    name="salePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.salePrice}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Sent to backend as <b>price</b>.
                  </p>
                </div>

                {/* STOCK */}
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Stock Quantity
                  </label>

                  <input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={handleChange}
                    required
                    placeholder="Enter stock quantity"
                    className="w-full rounded-lg border border-purple-300 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    {editingProduct
                      ? "This sets the product's total stock."
                      : "Initial stock quantity for this product."}
                  </p>
                </div>

              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Save Product"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* ADD STOCK MODAL */}
      {showStockForm && stockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">

          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl transition-all duration-300">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">

              <div className="min-w-0 pr-3">

                <h2 className="text-lg font-semibold text-gray-900">
                  Add Stock
                </h2>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {stockProduct?.name}
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  setShowStockForm(false);
                  setStockProduct(null);
                  setStockValue("");
                }}
                className="shrink-0 rounded-lg p-2 text-gray-500 transition-all duration-200 hover:rotate-90 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleStockUpdate}
              className="space-y-5 p-5"
            >

              <div className="rounded-lg bg-gray-50 p-4 transition-all duration-200 hover:bg-gray-100">

                <p className="text-sm text-gray-500">
                  Current Stock
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {getStock(stockProduct)}
                </p>

              </div>

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Quantity to Add
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={stockValue}
                  onChange={(e) =>
                    setStockValue(e.target.value)
                  }
                  required
                  autoFocus
                  placeholder="Enter quantity"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-lg outline-none transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />

                <p className="mt-1 text-xs text-gray-500">
                  This quantity will be added to the current stock.
                </p>

              </div>

              {stockValue &&
                Number(stockValue) > 0 && (
                  <div className="rounded-lg border border-purple-100 bg-purple-50 p-4 transition-all duration-300">

                    <div className="flex items-center justify-between text-sm">

                      <span className="text-gray-600">
                        Current Stock
                      </span>

                      <span className="font-medium text-gray-900">
                        {getStock(stockProduct)}
                      </span>

                    </div>

                    <div className="mt-2 flex items-center justify-between text-sm">

                      <span className="text-gray-600">
                        Adding
                      </span>

                      <span className="font-medium text-purple-700">
                        +{Number(stockValue)}
                      </span>

                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-purple-100 pt-3">

                      <span className="font-semibold text-gray-900">
                        New Stock
                      </span>

                      <span className="text-lg font-bold text-purple-700">
                        {getStock(stockProduct) +
                          Number(stockValue)}
                      </span>

                    </div>

                  </div>
                )}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">

                <button
                  type="button"
                  onClick={() => {
                    setShowStockForm(false);
                    setStockProduct(null);
                    setStockValue("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={stockSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >

                  {stockSaving && (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {stockSaving
                    ? "Adding..."
                    : "Add Stock"}

                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
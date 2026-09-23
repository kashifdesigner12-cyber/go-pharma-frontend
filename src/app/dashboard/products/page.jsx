"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Search,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Package,
  X,
  Boxes,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { apiRequest } from "@/lib/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const EMPTY_FORM = {
  name: "",
  sku: "",
  barcode: "",
  purchasePrice: "",
  salePrice: "",
  stock: "",
  category: "",
  unit: "box",
  image: "",
};

function getErrorMessage(
  error,
  fallback = "Something went wrong."
) {
  if (!error) return fallback;

  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.response?.message ||
    error?.message ||
    fallback
  );
}

function extractProducts(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.products)) {
    return response.products;
  }

  if (Array.isArray(response?.data?.products)) {
    return response.data.products;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function extractCategories(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.categories)) {
    return response.categories;
  }

  if (Array.isArray(response?.data?.categories)) {
    return response.data.categories;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [stockSaving, setStockSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [stockProduct, setStockProduct] =
    useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [stockQuantity, setStockQuantity] =
    useState("");

  const [importFile, setImportFile] =
    useState(null);

  const [importResult, setImportResult] =
    useState(null);

  const fileInputRef = useRef(null);

  const loadProducts = async () => {
    try {
      setError("");

      const response =
        await apiRequest("/products");

      const loadedProducts =
        extractProducts(response);

      setProducts(loadedProducts);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to load products."
        )
      );
    }
  };

  const loadCategories = async () => {
    try {
      const response =
        await apiRequest("/categories");

      setCategories(
        extractCategories(response)
      );
    } catch (err) {
      setCategories([]);

      console.error(
        "Failed to load categories:",
        err
      );
    }
  };

  const loadData = async () => {
    setLoading(true);

    try {
      await Promise.all([
        loadProducts(),
        loadCategories(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const name = String(
        product?.name || ""
      ).toLowerCase();

      const sku = String(
        product?.sku || ""
      ).toLowerCase();

      const barcode = String(
        product?.barcode || ""
      ).toLowerCase();

      const category =
        typeof product?.category === "string"
          ? product.category.toLowerCase()
          : String(
              product?.category?.name || ""
            ).toLowerCase();

      return (
        name.includes(query) ||
        sku.includes(query) ||
        barcode.includes(query) ||
        category.includes(query)
      );
    });
  }, [products, search]);

  const totalStock = useMemo(() => {
    return products.reduce(
      (total, product) =>
        total + Number(product?.stock || 0),
      0
    );
  }, [products]);

  const getCategoryName = (category) => {
    if (!category) {
      return "-";
    }

    if (typeof category === "string") {
      return category;
    }

    return (
      category?.name ||
      category?.title ||
      "-"
    );
  };

  const getProductPrice = (product) => {
    return Number(
      product?.salePrice ??
        product?.price ??
        0
    );
  };

  const getPurchasePrice = (product) => {
    return Number(
      product?.purchasePrice ?? 0
    );
  };

  const getProductStock = (product) => {
    return Number(
      product?.stock ?? 0
    );
  };

  const getProductId = (product) => {
    return (
      product?._id ||
      product?.id
    );
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);

    setForm({
      name: product?.name || "",
      sku: product?.sku || "",
      barcode: product?.barcode || "",

      purchasePrice:
        product?.purchasePrice ?? "",

      salePrice:
        product?.salePrice ??
        product?.price ??
        "",

      stock: product?.stock ?? "",

      category:
        typeof product?.category === "object"
          ? product?.category?._id ||
            product?.category?.id ||
            ""
          : product?.category || "",

      unit: product?.unit || "box",

      image: product?.image || "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError(
        "Product name is required."
      );
      return;
    }

    if (!form.barcode.trim()) {
      setError(
        "Barcode is required."
      );
      return;
    }

    if (
      form.purchasePrice === "" ||
      Number(form.purchasePrice) < 0
    ) {
      setError(
        "Please enter a valid purchase price."
      );
      return;
    }

    if (
      form.salePrice === "" ||
      Number(form.salePrice) < 0
    ) {
      setError(
        "Please enter a valid sale price."
      );
      return;
    }

    if (
      form.stock === "" ||
      Number(form.stock) < 0
    ) {
      setError(
        "Please enter a valid stock quantity."
      );
      return;
    }

    if (!form.category) {
      setError(
        "Category is required."
      );
      return;
    }

    const purchasePrice =
      Number(form.purchasePrice);

    const salePrice =
      Number(form.salePrice);

    const payload = {
      name: form.name.trim(),

      barcode:
        form.barcode.trim(),

      sku:
        form.sku.trim(),

      purchasePrice,

      salePrice,

      // Keep price for backend compatibility.
      price: salePrice,

      stock:
        Number(form.stock),

      category:
        form.category,

      unit:
        form.unit || "box",

      image:
        form.image.trim(),
    };

    setSaving(true);

    try {
      if (editingProduct) {
        const id =
          getProductId(
            editingProduct
          );

        if (!id) {
          throw new Error(
            "Product ID is missing."
          );
        }

        await apiRequest(
          `/products/${id}`,
          {
            method: "PUT",
            body: payload,
          }
        );

        setSuccess(
          "Product updated successfully."
        );
      } else {
        await apiRequest(
          "/products",
          {
            method: "POST",
            body: payload,
          }
        );

        setSuccess(
          "Product added successfully."
        );
      }

      setShowModal(false);
      setEditingProduct(null);
      setForm(EMPTY_FORM);

      await loadProducts();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to save product."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (
    product
  ) => {
    const id =
      getProductId(product);

    if (!id) {
      setError(
        "Product ID is missing."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${
          product?.name ||
          "this product"
        }"?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeleting(id);

    try {
      await apiRequest(
        `/products/${id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "Product deleted successfully."
      );

      await loadProducts();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to delete product."
        )
      );
    } finally {
      setDeleting("");
    }
  };

  const openStockModal = (product) => {
    setStockProduct(product);
    setStockQuantity("");
    setError("");
    setSuccess("");
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    if (stockSaving) {
      return;
    }

    setShowStockModal(false);
    setStockProduct(null);
    setStockQuantity("");
  };

  const handleAddStock = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!stockProduct) {
      setError(
        "Product is not selected."
      );
      return;
    }

    if (
      stockQuantity === "" ||
      !Number.isFinite(
        Number(stockQuantity)
      ) ||
      Number(stockQuantity) <= 0
    ) {
      setError(
        "Enter a valid stock quantity greater than zero."
      );
      return;
    }

    const id =
      getProductId(stockProduct);

    if (!id) {
      setError(
        "Product ID is missing."
      );
      return;
    }

    const quantity =
      Number(stockQuantity);

    setStockSaving(true);

    try {
      /*
       * Backend endpoint:
       * PUT /api/products/:id/stock
       *
       * Body:
       * {
       *   quantity: number
       * }
       */
      await apiRequest(
        `/products/${id}/stock`,
        {
          method: "PUT",
          body: {
            quantity,
          },
        }
      );

      setSuccess(
        "Stock added successfully."
      );

      setShowStockModal(false);
      setStockProduct(null);
      setStockQuantity("");

      await loadProducts();
    } catch (err) {
      const message =
        getErrorMessage(
          err,
          "Failed to update stock."
        );

      setError(message);

      console.error(
        "ADD STOCK FAILED:",
        {
          productId: id,
          quantity,
          message,
          error: err,
        }
      );
    } finally {
      setStockSaving(false);
    }
  };

  const openImportModal = () => {
    setImportFile(null);
    setImportResult(null);
    setError("");
    setSuccess("");

    setShowImportModal(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeImportModal = () => {
    if (importing) {
      return;
    }

    setShowImportModal(false);
    setImportFile(null);
    setImportResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event) => {
    const file =
      event.target.files?.[0];

    setError("");
    setImportResult(null);

    if (!file) {
      setImportFile(null);
      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "File size must be less than 10 MB."
      );

      setImportFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    const allowedExtensions = [
      ".csv",
      ".xls",
      ".xlsx",
      ".xlsm",
      ".ods",
    ];

    const fileName =
      file.name.toLowerCase();

    const isAllowed =
      allowedExtensions.some(
        (extension) =>
          fileName.endsWith(
            extension
          )
      );

    if (!isAllowed) {
      setError(
        "Please select a CSV, XLS, XLSX, XLSM, or ODS file."
      );

      setImportFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setImportFile(file);
  };

  const handleImport = async (event) => {
    event.preventDefault();

    if (!importFile) {
      setError(
        "Please select a file first."
      );
      return;
    }

    setError("");
    setSuccess("");
    setImportResult(null);
    setImporting(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        importFile
      );

      const response =
        await apiRequest(
          "/import-export/products",
          {
            method: "POST",
            body: formData,
          }
        );

      setImportResult(response);

      const importedCount =
        Number(
          response?.summary?.imported
        ) || 0;

      const skippedCount =
        Number(
          response?.summary?.skipped
        ) || 0;

      setSuccess(
        `Import completed. ${importedCount} product${
          importedCount === 1
            ? ""
            : "s"
        } imported${
          skippedCount > 0
            ? ` and ${skippedCount} skipped.`
            : "."
        }`
      );

      await loadProducts();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to import products."
        )
      );
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate =
    async () => {
      try {
        setError("");

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem(
                "token"
              )
            : null;

        const headers = {
          Accept:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };

        if (token) {
          headers.Authorization =
            `Bearer ${token}`;
        }

        const cleanApiUrl =
          String(API_URL)
            .trim()
            .replace(/\/+$/, "");

        const response =
          await fetch(
            `${cleanApiUrl}/import-export/products/template`,
            {
              method: "GET",
              headers,
              credentials: "include",
            }
          );

        if (!response.ok) {
          let message =
            "Failed to download template.";

          try {
            const data =
              await response.json();

            if (data?.message) {
              message =
                data.message;
            }
          } catch {
            // Ignore non-JSON error response.
          }

          throw new Error(message);
        }

        const blob =
          await response.blob();

        const url =
          window.URL.createObjectURL(
            blob
          );

        const link =
          document.createElement("a");

        link.href = url;

        link.download =
          "products-template.xlsx";

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
          url
        );
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Failed to download template."
          )
        );
      }
    };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                <Package size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Products
                </h1>

                <p className="text-sm text-slate-500">
                  Manage pharmacy products and stock
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openImportModal}
              className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100"
            >
              <Upload size={17} />
              Import
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span className="break-words">
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="ml-auto shrink-0"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="ml-auto shrink-0"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Products
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {products.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Package size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Stock
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {totalStock}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Boxes size={21} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search by name, SKU, barcode or category..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Product
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    SKU
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Barcode
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Category
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Sale Price
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Stock
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center"
                    >
                      <Package
                        size={38}
                        className="mx-auto mb-3 text-slate-300"
                      />

                      <p className="text-sm font-semibold text-slate-600">
                        No products found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Add a product or change your search.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(
                    (product) => {
                      const id =
                        getProductId(
                          product
                        );

                      const stock =
                        getProductStock(
                          product
                        );

                      const price =
                        getProductPrice(
                          product
                        );

                      return (
                        <tr
                          key={id}
                          className="hover:bg-purple-50/40"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-purple-50 text-purple-600">
                                {product?.image ? (
                                  <img
                                    src={
                                      product.image
                                    }
                                    alt={
                                      product?.name ||
                                      "Product"
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package
                                    size={19}
                                  />
                                )}
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {product?.name ||
                                    "-"}
                                </p>

                                {product?.genericName && (
                                  <p className="text-xs text-slate-500">
                                    {
                                      product.genericName
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {product?.sku ||
                              "-"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {product?.barcode ||
                              "-"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {getCategoryName(
                              product?.category
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                            Rs.{" "}
                            {price.toLocaleString()}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                                stock <= 0
                                  ? "bg-red-100 text-red-700"
                                  : stock <= 10
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700"
                              }`}
                            >
                              {stock}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  openStockModal(
                                    product
                                  )
                                }
                                title="Add Stock"
                                className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                              >
                                <Boxes
                                  size={17}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    product
                                  )
                                }
                                title="Edit"
                                className="rounded-lg p-2 text-purple-600 hover:bg-purple-50"
                              >
                                <Pencil
                                  size={17}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteProduct(
                                    product
                                  )
                                }
                                disabled={
                                  deleting ===
                                  id
                                }
                                title="Delete"
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2
                                  size={17}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p className="text-sm text-slate-500">
                  {editingProduct
                    ? "Update product information"
                    : "Enter product information"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleSaveProduct
              }
              className="space-y-5 p-6"
            >
              <div className="grid gap-4 md:grid-cols-2">

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Product Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={
                      handleFormChange
                    }
                    placeholder="e.g. Paracetamol 500mg"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    SKU
                  </label>

                  <input
                    name="sku"
                    value={form.sku}
                    onChange={
                      handleFormChange
                    }
                    placeholder="Product SKU"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Barcode *
                  </label>

                  <input
                    name="barcode"
                    value={
                      form.barcode
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Barcode"
                    inputMode="numeric"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Purchase Price *
                  </label>

                  <input
                    name="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.purchasePrice
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Sale Price *
                  </label>

                  <input
                    name="salePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.salePrice
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Stock *
                  </label>

                  <input
                    name="stock"
                    type="number"
                    min="0"
                    value={
                      form.stock
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Unit *
                  </label>

                  <select
                    name="unit"
                    value={
                      form.unit
                    }
                    onChange={
                      handleFormChange
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="box">
                      Box
                    </option>

                    <option value="piece">
                      Piece
                    </option>

                    <option value="strip">
                      Strip
                    </option>

                    <option value="tablet">
                      Tablet
                    </option>

                    <option value="bottle">
                      Bottle
                    </option>

                    <option value="pack">
                      Pack
                    </option>

                    <option value="unit">
                      Unit
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Category *
                  </label>

                  <select
                    name="category"
                    value={
                      form.category
                    }
                    onChange={
                      handleFormChange
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (category) => {
                        const categoryId =
                          category?._id ||
                          category?.id ||
                          category;

                        const categoryName =
                          typeof category ===
                          "string"
                            ? category
                            : category?.name ||
                              category?.title ||
                              "";

                        return (
                          <option
                            key={
                              categoryId
                            }
                            value={
                              categoryId
                            }
                          >
                            {
                              categoryName
                            }
                          </option>
                        );
                      }
                    )}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Image URL
                  </label>

                  <input
                    name="image"
                    value={
                      form.image
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                      ? "Update Product"
                      : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showStockModal &&
        stockProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Add Stock
                  </h2>

                  <p className="text-sm text-slate-500">
                    {stockProduct?.name ||
                      "Product"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeStockModal
                  }
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={
                  handleAddStock
                }
                className="space-y-5 p-6"
              >
                <div className="rounded-lg bg-purple-50 p-4">
                  <p className="text-sm text-slate-500">
                    Current Stock
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {getProductStock(
                      stockProduct
                    )}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Quantity to Add *
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      stockQuantity
                    }
                    onChange={(event) =>
                      setStockQuantity(
                        event.target.value
                      )
                    }
                    placeholder="Enter quantity"
                    autoFocus
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={
                      closeStockModal
                    }
                    disabled={
                      stockSaving
                    }
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      stockSaving
                    }
                    className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {stockSaving
                      ? "Updating..."
                      : "Add Stock"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Import Products
                </h2>

                <p className="text-sm text-slate-500">
                  Import products from a spreadsheet
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeImportModal
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleImport
              }
              className="space-y-5 p-6"
            >
              <div className="rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-6 text-center">
                <FileSpreadsheet
                  size={40}
                  className="mx-auto mb-3 text-purple-600"
                />

                <p className="text-sm font-semibold text-slate-800">
                  Select product file
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  CSV, XLS, XLSX, XLSM or ODS
                </p>

                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  accept=".csv,.xls,.xlsx,.xlsm,.ods"
                  onChange={
                    handleFileChange
                  }
                  className="mt-4 block w-full text-sm text-slate-600"
                />

                {importFile && (
                  <p className="mt-3 text-sm font-medium text-purple-600">
                    Selected:{" "}
                    {
                      importFile.name
                    }
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="mb-2 text-sm font-bold text-slate-800">
                  Supported columns
                </p>

                <p className="text-xs leading-6 text-slate-600">
                  Product Name, SKU, Barcode,
                  Purchase Price, Sale Price,
                  Stock, Category, Unit, Image
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleDownloadTemplate
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100"
              >
                <Download size={17} />
                Download Template
              </button>

              {importResult && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-green-700">
                    <CheckCircle
                      size={18}
                    />
                    Import completed
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-slate-500">
                        Total
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {
                          importResult
                            ?.summary
                            ?.totalRows ??
                          0
                        }
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-slate-500">
                        Imported
                      </p>

                      <p className="mt-1 text-lg font-bold text-green-600">
                        {
                          importResult
                            ?.summary
                            ?.imported ??
                          0
                        }
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-slate-500">
                        Skipped
                      </p>

                      <p className="mt-1 text-lg font-bold text-red-600">
                        {
                          importResult
                            ?.summary
                            ?.skipped ??
                          0
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={
                    closeImportModal
                  }
                  disabled={
                    importing
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    !importFile ||
                    importing
                  }
                  className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importing
                    ? "Importing..."
                    : "Import Products"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
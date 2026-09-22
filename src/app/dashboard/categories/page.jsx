"use client";

import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  Trash2,
  X,
  FolderTree,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");

  const loadCategories = async () => {
    try {
      setError("");

      const response = await apiRequest("/categories");

      const list = Array.isArray(response?.categories)
        ? response.categories
        : [];

      setCategories(list);
    } catch (err) {
      console.error("Categories Load Error:", err);
      setError(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
  };

  const openModal = () => {
    setName("");
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await apiRequest("/categories", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      setSuccess("Category created successfully.");
      setShowModal(false);
      setName("");

      await loadCategories();
    } catch (err) {
      console.error("Category Create Error:", err);
      setError(err.message || "Failed to create category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category?.name || "this category"}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await apiRequest(`/categories/${category._id}`, {
        method: "DELETE",
      });

      setSuccess("Category deleted successfully.");

      await loadCategories();
    } catch (err) {
      console.error("Category Delete Error:", err);
      setError(err.message || "Failed to delete category.");
    }
  };

  const filteredCategories = categories.filter((category) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) return true;

    return String(category?.name || "")
      .toLowerCase()
      .includes(searchText);
  });

  return (
    <div className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 px-6 pb-8 pt-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900 transition-all duration-300">
            Categories
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage product categories
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md active:translate-y-0"
        >
          <Plus
            size={18}
            className="transition-transform duration-200"
          />
          Add Category
        </button>

      </div>

      {/* MESSAGES */}
      {success && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm transition-all duration-300">

          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="rounded-md p-1 text-green-700 transition-all duration-200 hover:bg-green-100 hover:text-green-900"
          >
            <X size={18} />
          </button>

        </div>
      )}

      {error && !showModal && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm transition-all duration-300">

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-md p-1 text-red-700 transition-all duration-200 hover:bg-red-100 hover:text-red-900"
          >
            <X size={18} />
          </button>

        </div>
      )}

      {/* SEARCH + REFRESH */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="relative w-full sm:max-w-md">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
            />

          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

        </div>

      </div>

      {/* CATEGORIES TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">

        <div className="border-b border-gray-200 px-5 py-4">

          <div className="flex items-center gap-2">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 transition-all duration-200 hover:bg-purple-50">
              <FolderTree
                size={18}
                className="text-gray-600 transition-colors duration-200"
              />
            </div>

            <h2 className="font-semibold text-gray-900">
              Category List
            </h2>

            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition-all duration-200">
              {filteredCategories.length}
            </span>

          </div>

        </div>

        {loading ? (
          <div className="flex min-h-52 items-center justify-center">

            <div className="flex items-center gap-2 text-sm text-gray-500">

              <RefreshCw
                size={20}
                className="animate-spin text-purple-600"
              />

              <span>Loading categories...</span>

            </div>

          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">

            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 transition-all duration-300 hover:scale-105 hover:bg-purple-50">

              <FolderTree
                size={22}
                className="text-gray-500 transition-colors duration-300 hover:text-purple-600"
              />

            </div>

            <p className="font-medium text-gray-900">
              No categories found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {search
                ? "Try a different search term."
                : "Create your first category to get started."}
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[600px]">

              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    #
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Category Name
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Created
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredCategories.map((category, index) => (
                  <tr
                    key={category._id}
                    className="group transition-all duration-200 hover:bg-purple-50/40"
                  >

                    <td className="px-5 py-4 text-sm text-gray-500">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 transition-all duration-200 group-hover:scale-105 group-hover:bg-purple-50">

                          <FolderTree
                            size={17}
                            className="text-gray-600 transition-colors duration-200 group-hover:text-purple-600"
                          />

                        </div>

                        <span className="text-sm font-medium text-gray-900">
                          {category.name}
                        </span>

                      </div>

                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500">
                      {category.createdAt
                        ? new Date(
                            category.createdAt
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-5 py-4 text-right">

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(category)
                        }
                        className="inline-flex items-center justify-center rounded-lg p-2 text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm"
                        title="Delete category"
                      >
                        <Trash2
                          size={17}
                          className="transition-transform duration-200 hover:scale-110"
                        />
                      </button>

                    </td>

                  </tr>
                ))}

              </tbody>
            </table>

          </div>
        )}

      </div>

      {/* ADD CATEGORY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">

          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl transition-all duration-300">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Add Category
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Create a new product category
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 transition-all duration-200 hover:rotate-90 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="space-y-4 px-5 py-5">

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 transition-all duration-300">
                    {error}
                  </div>
                )}

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Category Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Enter category name"
                    autoFocus
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />

                </div>

              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >

                  {saving && (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Creating..."
                    : "Create Category"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  UserRound,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "cashier",
    isActive: true,
  });

  // =========================
  // LOAD USERS
  // =========================
  const loadUsers = async () => {
    try {
      setError("");

      const response = await apiRequest("/users");

      const list = Array.isArray(response?.users)
        ? response.users
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      setUsers(list);
    } catch (err) {
      console.error("Users Load Error:", err);
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // =========================
  // REFRESH
  // =========================
  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  // =========================
  // FORM
  // =========================
  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      role: "cashier",
      isActive: true,
    });

    setEditingUser(null);
  };

  const openCreateModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);

    setForm({
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "cashier",
      isActive: user?.isActive !== false,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =========================
  // CREATE / UPDATE USER
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        setError("Name is required.");
        return;
      }

      if (!form.email.trim()) {
        setError("Email is required.");
        return;
      }

      if (!editingUser && !form.password.trim()) {
        setError("Password is required.");
        return;
      }

      if (!form.role) {
        setError("Role is required.");
        return;
      }

      let payload;

      if (editingUser) {
        payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          isActive: form.isActive,
        };

        await apiRequest(`/users/${editingUser._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setSuccess("User updated successfully.");
      } else {
        payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          isActive: form.isActive,
        };

        await apiRequest("/users", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess("User created successfully.");
      }

      setShowModal(false);
      resetForm();

      await loadUsers();
    } catch (err) {
      console.error("User Save Error:", err);
      setError(err.message || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE USER
  // =========================
  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${user?.name || "this user"}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await apiRequest(`/users/${user._id}`, {
        method: "DELETE",
      });

      setSuccess("User deleted successfully.");

      if (editingUser?._id === user?._id) {
        setShowModal(false);
        resetForm();
      }

      await loadUsers();
    } catch (err) {
      console.error("User Delete Error:", err);
      setError(err.message || "Failed to delete user.");
    }
  };

  // =========================
  // SEARCH
  // =========================
  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) return true;

    const name = String(user?.name || "").toLowerCase();
    const email = String(user?.email || "").toLowerCase();
    const role = String(user?.role || "").toLowerCase();

    return (
      name.includes(searchText) ||
      email.includes(searchText) ||
      role.includes(searchText)
    );
  });

  // =========================
  // ROLE
  // =========================
  const getRoleLabel = (role) => {
    if (!role) return "N/A";

    return String(role)
      .replace("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="min-w-0 w-full px-5 pb-10 pt-10 sm:px-6 lg:px-8">
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">
              Users
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage system users and their access roles.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md active:translate-y-0"
            >
              <Plus size={18} />
              Add User
            </button>

          </div>
        </div>

        {/* SUCCESS */}
        {success && (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm">
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

        {/* ERROR */}
        {error && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
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

        {/* SEARCH */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or role..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
            />

          </div>
        </div>

        {/* USERS TABLE */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">

          <div className="border-b border-gray-200 px-5 py-4">

            <div className="flex items-center justify-between gap-3">

              <h2 className="font-semibold text-gray-900">
                Users List
              </h2>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {filteredUsers.length} user
                {filteredUsers.length !== 1 ? "s" : ""}
              </span>

            </div>
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center">

              <div className="flex items-center gap-2 text-sm text-gray-500">

                <RefreshCw
                  size={22}
                  className="animate-spin text-purple-600"
                />

                <span>Loading users...</span>

              </div>

            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">

              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 transition-all duration-300 hover:scale-105 hover:bg-purple-50">

                <UserRound
                  size={23}
                  className="text-gray-500 transition-colors duration-300 hover:text-purple-600"
                />

              </div>

              <p className="font-medium text-gray-900">
                No users found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Create a user to get started.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">

                    <th className="px-5 py-3">
                      User
                    </th>

                    <th className="px-5 py-3">
                      Email
                    </th>

                    <th className="px-5 py-3">
                      Role
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {filteredUsers.map((user, index) => (
                    <tr
                      key={user?._id || user?.id || index}
                      className="group transition-all duration-200 hover:bg-purple-50/40"
                    >

                      {/* USER */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 transition-all duration-200 group-hover:scale-105 group-hover:bg-purple-200">

                            <UserRound size={18} />

                          </div>

                          <div className="min-w-0">

                            <p className="truncate font-medium text-gray-900">
                              {user?.name || "N/A"}
                            </p>

                            <p className="text-xs text-gray-500">
                              ID:{" "}
                              {user?._id
                                ? String(user._id).slice(-8)
                                : "N/A"}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* EMAIL */}
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {user?.email || "N/A"}
                      </td>

                      {/* ROLE */}
                      <td className="px-5 py-4">

                        <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 transition-all duration-200 group-hover:bg-purple-100">
                          {getRoleLabel(user?.role)}
                        </span>

                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">

                        {user?.isActive !== false ? (
                          <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 transition-all duration-200 group-hover:bg-green-100">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 transition-all duration-200 group-hover:bg-red-100">
                            Inactive
                          </span>
                        )}

                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 text-right">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 hover:shadow-sm"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm"
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">

          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4">

              <div className="min-w-0">

                <h2 className="text-xl font-bold text-gray-900">
                  {editingUser ? "Edit User" : "Add User"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingUser
                    ? "Update user information."
                    : "Create a new system user."}
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="shrink-0 rounded-lg p-2 text-gray-500 transition-all duration-200 hover:rotate-90 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto"
            >

              <div className="space-y-5 px-6 py-6">

                {/* NAME */}
                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter user name"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />

                </div>

                {/* EMAIL */}
                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />

                </div>

                {/* PASSWORD */}
                {!editingUser && (
                  <div>

                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Password
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    />

                  </div>
                )}

                {/* ROLE */}
                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Role
                  </label>

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                  </select>

                </div>

                {/* ACTIVE */}
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-purple-200 hover:bg-purple-50/50">

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />

                  <div>

                    <p className="text-sm font-medium text-gray-800">
                      Active User
                    </p>

                    <p className="text-xs text-gray-500">
                      Allow this user to remain active.
                    </p>

                  </div>

                </label>

              </div>

              {/* BUTTONS */}
              <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >

                  {saving && (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : editingUser
                    ? "Update User"
                    : "Create User"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
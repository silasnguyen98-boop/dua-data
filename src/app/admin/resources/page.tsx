"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import BrandLogo from "@/components/BrandLogo";

interface Resource {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

type ResourceForm = Omit<Resource, "id" | "createdAt" | "updatedAt">;

const emptyResource: ResourceForm = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  category: "General",
  imageUrl: "",
  author: "DUA Edu",
  published: true,
};

function decodeStoredRole(stored: string | null): string | null {
  if (!stored) return null;
  const raw = stored.trim();
  if (!raw) return null;
  try {
    const decoded = atob(raw).trim();
    return decoded.includes(":") ? (decoded.split(":")[1] || decoded.split(":")[0] || decoded).trim() : decoded;
  } catch {
    return raw.includes(":") ? (raw.split(":")[1] || raw.split(":")[0] || raw).trim() : raw;
  }
}

function safeGetSessionItem(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function formatDate(value: string | undefined | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminResourcesPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState<ResourceForm>(emptyResource);

  const currentRole = useMemo(() => decodeStoredRole(safeGetSessionItem("admin_role")), []);
  const adminName = useMemo(() => safeGetSessionItem("admin_name") || "Admin", []);
  const publishedCount = useMemo(() => resources.filter((item) => item.published !== false).length, [resources]);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resources", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setResources(Array.isArray(data) ? data : []);
    } catch {
      setResources([]);
      setMessage("Không thể tải danh sách tài nguyên");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isAuth = safeGetSessionItem("admin_auth");
    if (!isAuth) {
      window.location.href = "/admin/login";
      return;
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (authChecked) fetchResources();
  }, [authChecked, fetchResources]);

  const showToast = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  };

  function resetForm() {
    setEditing(null);
    setForm(emptyResource);
    setShowForm(false);
  }

  function handleNew() {
    resetForm();
    setShowForm(true);
  }

  function handleEdit(item: Resource) {
    setEditing(item);
    setForm({
      title: item.title || "",
      slug: item.slug || "",
      summary: item.summary || "",
      content: item.content || "",
      category: item.category || "General",
      imageUrl: item.imageUrl || "",
      author: item.author || "DUA Edu",
      published: item.published !== false,
    });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.summary.trim()) {
      showToast("Vui lòng nhập tiêu đề và mô tả ngắn");
      return;
    }

    const nextSlug = form.slug.trim() || slugify(form.title);
    const body = {
      ...(editing ? { id: editing.id } : {}),
      title: form.title.trim(),
      slug: nextSlug,
      summary: form.summary.trim(),
      content: form.content?.trim() || "",
      category: form.category || "General",
      imageUrl: form.imageUrl?.trim() || "",
      author: form.author?.trim() || "DUA Edu",
      published: form.published !== false,
    };

    const res = await fetch("/api/resources", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      showToast(`${editing ? "Sửa" : "Thêm"} tài nguyên thất bại: ${err.error}`);
      return;
    }

    resetForm();
    showToast(editing ? "Đã cập nhật tài nguyên" : "Đã thêm tài nguyên");
    fetchResources();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa tài nguyên này?")) return;
    const res = await fetch(`/api/resources?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      showToast(`Xóa tài nguyên thất bại: ${err.error}`);
      return;
    }
    showToast("Đã xóa tài nguyên");
    fetchResources();
  }

  async function togglePublished(item: Resource) {
    const res = await fetch("/api/resources", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        title: item.title || "",
        slug: item.slug || "",
        summary: item.summary || "",
        content: item.content || "",
        category: item.category || "General",
        imageUrl: item.imageUrl || "",
        author: item.author || "DUA Edu",
        published: !item.published,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      showToast(`Cập nhật trạng thái thất bại: ${err.error}`);
      return;
    }

    fetchResources();
  }

  if (!authChecked) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Đang kiểm tra quyền truy cập...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800 mb-3">
              <span className="text-lg">←</span>
              Quay lại dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Quản lý tài nguyên</h1>
            <p className="text-gray-600 mt-2 max-w-2xl">CRUD các bài viết, template và công cụ trên website. Trang này đã tách riêng khỏi dashboard.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-green-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Tổng tài nguyên</p>
              <p className="text-2xl font-bold text-gray-900">{resources.length}</p>
            </div>
            <div className="rounded-2xl border border-green-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Đang hiển thị</p>
              <p className="text-2xl font-bold text-green-700">{publishedCount}</p>
            </div>
            <button
              type="button"
              onClick={handleNew}
              className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-200 transition hover:bg-green-700"
            >
              + Thêm tài nguyên
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="rounded-full bg-white px-3 py-1.5 border border-gray-200">Đăng nhập: {adminName}</span>
          {currentRole ? <span className="rounded-full bg-white px-3 py-1.5 border border-gray-200">Vai trò: {currentRole}</span> : null}
          <button
            type="button"
            onClick={fetchResources}
            className="rounded-full bg-white px-3 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            Làm mới
          </button>
          <Link href="/admin/quiz-attempts" className="rounded-full bg-white px-3 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
            Quiz attempts
          </Link>
        </div>

        {message ? (
          <div className="mb-5 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">{message}</div>
        ) : null}

        {loading ? (
          <div className="py-16 text-center text-gray-600">Đang tải...</div>
        ) : resources.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-green-200 bg-white/80 px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-900">Chưa có tài nguyên nào</p>
            <p className="text-sm text-gray-500 mt-1">Nhấn “Thêm tài nguyên” để tạo bản ghi đầu tiên.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Tài nguyên</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Danh mục</th>
                    <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Ngày tạo</th>
                    <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resources
                    .slice()
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.title}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{item.summary}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.category}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => togglePublished(item)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {item.published ? "Đã xuất bản" : "Nháp"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                              Sửa
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-full flex items-start justify-center px-4 py-10">
            <div className="w-full max-w-5xl rounded-3xl border border-gray-200 bg-white shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{editing ? "Sửa tài nguyên" : "Thêm tài nguyên mới"}</h2>
                  <p className="text-sm text-gray-500">Nhập nội dung và lưu trực tiếp lên Firebase.</p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="tu-dong-theo-tieu-de-neu-de-trong" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn *</label>
                  <textarea rows={3} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                  <textarea rows={7} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xuất bản</label>
                  <button type="button" onClick={() => setForm({ ...form, published: !form.published })} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${form.published ? "bg-green-500/10 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {form.published ? "Đã xuất bản" : "Nháp"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
                  Hủy
                </button>
                <button onClick={handleSubmit} className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700">
                  {editing ? "Lưu thay đổi" : "Tạo tài nguyên"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import type { Alumni } from "@/types/alumni";

type AlumniForm = Omit<Alumni, "id" | "createdAt" | "updatedAt">;

const emptyAlumni: AlumniForm = {
  name: "",
  job: "",
  linkedin: "",
  imageUrl: "",
  coverImage: "",
  content: "",
  order: 0,
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

export default function AdminAlumniPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("");
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Alumni | null>(null);
  const [form, setForm] = useState<AlumniForm>(emptyAlumni);

  const currentRole = useMemo(() => decodeStoredRole(safeGetSessionItem("admin_role")), []);
  const adminName = useMemo(() => safeGetSessionItem("admin_name") || "Admin", []);
  const publishedCount = useMemo(() => alumni.filter((item) => item.published !== false).length, [alumni]);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alumni", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setAlumni(Array.isArray(data) ? data : []);
    } catch {
      setAlumni([]);
      setMessage("Không thể tải danh sách alumni");
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
    if (authChecked) fetchAlumni();
  }, [authChecked, fetchAlumni]);

  const showToast = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  };

  function resetForm() {
    setEditing(null);
    setForm(emptyAlumni);
    setShowForm(false);
  }

  function handleNew() {
    resetForm();
    setShowForm(true);
  }

  function handleEdit(item: Alumni) {
    setEditing(item);
    setForm({
      name: item.name || "",
      job: item.job || "",
      linkedin: item.linkedin || "",
      imageUrl: item.imageUrl || "",
      coverImage: item.coverImage || "",
      content: item.content || "",
      order: item.order ?? 0,
      published: item.published !== false,
    });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.job.trim()) {
      showToast("Vui lòng nhập tên và chức danh");
      return;
    }

    const body = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name.trim(),
      job: form.job.trim(),
      linkedin: form.linkedin?.trim() || "",
      imageUrl: form.imageUrl?.trim() || "",
      coverImage: form.coverImage?.trim() || "",
      content: form.content?.trim() || "",
      order: Number(form.order) || 0,
      published: form.published !== false,
    };

    const res = await fetch("/api/alumni", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      showToast(`${editing ? "Sửa" : "Thêm"} alumni thất bại: ${err.error}`);
      return;
    }

    resetForm();
    showToast(editing ? "Đã cập nhật alumni" : "Đã thêm alumni");
    fetchAlumni();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa alumni này?")) return;
    const res = await fetch(`/api/alumni?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      showToast(`Xóa alumni thất bại: ${err.error}`);
      return;
    }
    showToast("Đã xóa alumni");
    fetchAlumni();
  }

  async function togglePublished(item: Alumni) {
    const res = await fetch("/api/alumni", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        name: item.name || "",
        job: item.job || "",
        linkedin: item.linkedin || "",
        imageUrl: item.imageUrl || "",
        coverImage: item.coverImage || "",
        content: item.content || "",
        order: Number(item.order) || 0,
        published: !item.published,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      showToast(`Cập nhật trạng thái thất bại: ${err.error}`);
      return;
    }

    fetchAlumni();
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Quản lý Alumni</h1>
            <p className="text-gray-600 mt-2 max-w-2xl">CRUD alumni hiển thị trên website. Trang này đã tách riêng khỏi dashboard để dễ quản lý hơn.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-green-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Tổng alumni</p>
              <p className="text-2xl font-bold text-gray-900">{alumni.length}</p>
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
              + Thêm alumni
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="rounded-full bg-white px-3 py-1.5 border border-gray-200">Đăng nhập: {adminName}</span>
          {currentRole ? <span className="rounded-full bg-white px-3 py-1.5 border border-gray-200">Vai trò: {currentRole}</span> : null}
          <button
            type="button"
            onClick={fetchAlumni}
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
        ) : alumni.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-green-200 bg-white/80 px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-900">Chưa có alumni nào</p>
            <p className="text-sm text-gray-500 mt-1">Nhấn “Thêm alumni” để tạo bản ghi đầu tiên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {alumni
              .slice()
              .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
              .map((item) => (
                <div key={item.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-20 w-20 rounded-2xl object-cover border border-green-100" />
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-3xl font-bold text-white">
                        {item.name?.charAt(0) || "?"}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold text-gray-900 truncate">{item.name}</h2>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.published !== false ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {item.published !== false ? "Hiển thị" : "Ẩn"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-green-700 font-medium">{item.job}</p>
                      <p className="mt-2 text-xs text-gray-400">Thứ tự: {item.order ?? 0}</p>
                      <p className="mt-2 text-xs text-gray-500">Cập nhật: {formatDate(item.updatedAt)}</p>
                    </div>
                  </div>

                  {item.content ? <p className="mt-4 text-sm text-gray-600 line-clamp-3 leading-6">{item.content}</p> : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={() => handleEdit(item)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Sửa
                    </button>
                    <button type="button" onClick={() => togglePublished(item)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      {item.published !== false ? "Ẩn" : "Hiện"}
                    </button>
                    <button type="button" onClick={() => handleDelete(item.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-full flex items-start justify-center px-4 py-10">
            <div className="w-full max-w-4xl rounded-3xl border border-gray-200 bg-white shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{editing ? "Sửa alumni" : "Thêm alumni mới"}</h2>
                  <p className="text-sm text-gray-500">Nhập thông tin alumni và lưu trực tiếp vào Firebase.</p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên *</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Công việc / chức danh *</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.job} onChange={(e) => setForm({ ...form, job: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.linkedin ?? ""} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đại diện</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.imageUrl ?? ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh cover</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.coverImage ?? ""} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                  <textarea rows={5} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự</label>
                  <input type="number" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.order ?? 0} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={() => setForm({ ...form, published: !form.published })} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${form.published !== false ? "bg-green-500/10 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {form.published !== false ? "Hiển thị" : "Ẩn"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
                  Hủy
                </button>
                <button onClick={handleSubmit} className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700">
                  {editing ? "Lưu thay đổi" : "Tạo alumni"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

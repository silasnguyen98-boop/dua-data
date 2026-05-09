"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type Expert } from "@/lib/expert-data";

type ExpertForm = Omit<Expert, "id" | "createdAt" | "updatedAt">;

const emptyExpert: ExpertForm = {
  name: "",
  position: "",
  previousWork: "",
  avatarUrl: "",
  linkedin: "",
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

export default function AdminExpertsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expert | null>(null);
  const [form, setForm] = useState<ExpertForm>(emptyExpert);

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/experts", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setExperts(Array.isArray(data) ? data : []);
    } catch {
      setExperts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isAuth = safeGetSessionItem("admin_auth");
    if (!isAuth) {
      router.replace("/admin/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    fetchExperts();
  }, [authChecked, fetchExperts]);

  const currentRole = useMemo(() => decodeStoredRole(safeGetSessionItem("admin_role")), []);
  const adminName = useMemo(() => safeGetSessionItem("admin_name") || "Admin", []);
  const publishedCount = useMemo(() => experts.filter((expert) => expert.published !== false).length, [experts]);

  function handleNew() {
    setEditing(null);
    setForm(emptyExpert);
    setShowForm(true);
  }

  function handleEdit(expert: Expert) {
    setEditing(expert);
    setForm({
      name: expert.name || "",
      position: expert.position || "",
      previousWork: expert.previousWork || "",
      avatarUrl: expert.avatarUrl || "",
      linkedin: expert.linkedin || "",
      order: expert.order || 0,
      published: expert.published !== false,
    });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.position.trim()) {
      alert("Vui lòng nhập tên và vị trí của chuyên gia");
      return;
    }

    const method = editing ? "PUT" : "POST";
    const body = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name.trim(),
      position: form.position.trim(),
      previousWork: form.previousWork?.trim() || "",
      avatarUrl: form.avatarUrl?.trim() || "",
      linkedin: form.linkedin?.trim() || "",
      order: Number(form.order) || 0,
      published: form.published !== false,
    };

    const res = await fetch("/api/experts", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      alert(`${editing ? "Sửa" : "Thêm"} chuyên gia thất bại: ${err.error}`);
      return;
    }

    setShowForm(false);
    setEditing(null);
    setForm(emptyExpert);
    fetchExperts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa chuyên gia này?")) return;
    const res = await fetch(`/api/experts?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      alert(`Xóa chuyên gia thất bại: ${err.error}`);
      return;
    }
    fetchExperts();
  }

  async function togglePublished(expert: Expert) {
    const res = await fetch("/api/experts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: expert.id,
        name: expert.name || "",
        position: expert.position || "",
        previousWork: expert.previousWork || "",
        avatarUrl: expert.avatarUrl || "",
        linkedin: expert.linkedin || "",
        order: Number(expert.order) || 0,
        published: !expert.published,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      alert(`Cập nhật trạng thái thất bại: ${err.error}`);
      return;
    }

    fetchExperts();
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Quản lý chuyên gia</h1>
            <p className="text-gray-600 mt-2 max-w-2xl">
              CRUD dữ liệu chuyên gia trực tiếp trên Supabase. Đây là nơi quản lý danh sách hiển thị trên website.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-green-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Tổng chuyên gia</p>
              <p className="text-2xl font-bold text-gray-900">{experts.length}</p>
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
              + Thêm chuyên gia
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="rounded-full bg-white px-3 py-1.5 border border-gray-200">Đăng nhập: {adminName}</span>
          {currentRole ? <span className="rounded-full bg-white px-3 py-1.5 border border-gray-200">Vai trò: {currentRole}</span> : null}
          <button
            type="button"
            onClick={fetchExperts}
            className="rounded-full bg-white px-3 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            Làm mới
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-600">Đang tải...</div>
        ) : experts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-green-200 bg-white/80 px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-900">Chưa có chuyên gia nào</p>
            <p className="text-sm text-gray-500 mt-1">Nhấn “Thêm chuyên gia” để tạo bản ghi đầu tiên trong Supabase.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {experts
              .slice()
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((expert) => (
                <div key={expert.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    {expert.avatarUrl ? (
                      <img
                        src={expert.avatarUrl}
                        alt={expert.name}
                        className="h-20 w-20 rounded-2xl object-cover border border-green-100"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-3xl font-bold text-white">
                        {expert.name.charAt(0) || "?"}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900 truncate">{expert.name}</h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            expert.published !== false
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {expert.published !== false ? "Hiển thị" : "Ẩn"}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-green-700 mt-1">{expert.position}</p>
                      {expert.previousWork ? <p className="text-sm text-gray-500 mt-1">{expert.previousWork}</p> : null}
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between gap-3">
                      <span>Thứ tự</span>
                      <span className="font-semibold text-gray-900">{expert.order || 0}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>LinkedIn</span>
                      <span className="max-w-[60%] truncate text-right">{expert.linkedin || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Cập nhật</span>
                      <span className="font-medium text-gray-900">{formatDate(expert.updatedAt || expert.createdAt)}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(expert)}
                      className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePublished(expert)}
                      className="rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
                    >
                      {expert.published !== false ? "Ẩn" : "Hiển thị"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(expert.id)}
                      className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 px-4 py-10 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-gray-200">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editing ? "Sửa chuyên gia" : "Thêm chuyên gia mới"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Dữ liệu sẽ được lưu trực tiếp vào bảng `experts` của Supabase.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-gray-500 hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Tên *</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Cuong DN"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Vị trí *</span>
                <input
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="VD: Founder & Lead Instructor"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Công việc trước đây</span>
                <input
                  value={form.previousWork || ""}
                  onChange={(e) => setForm({ ...form, previousWork: e.target.value })}
                  placeholder="VD: Data Analyst @ FPT Software"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Avatar URL</span>
                <input
                  value={form.avatarUrl || ""}
                  onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">LinkedIn URL</span>
                <input
                  value={form.linkedin || ""}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Thứ tự hiển thị</span>
                <input
                  type="number"
                  value={form.order || 0}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"
                />
              </label>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, published: !form.published })}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    form.published
                      ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {form.published ? "Đang hiển thị" : "Đang ẩn"}
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-200 hover:bg-green-700"
              >
                {editing ? "Cập nhật" : "Thêm chuyên gia"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import BrandLogo from "@/components/BrandLogo";

interface Job {
  id: string;
  title: string;
  company: string;
  summary: string;
  content: string;
  imageUrl: string;
  workType: string;
  location: string;
  position: string;
  applicationLink: string;
  applicationDeadline: string;
  salary: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

type JobForm = Omit<Job, "id" | "createdAt" | "updatedAt">;

const emptyJob: JobForm = {
  title: "",
  company: "",
  summary: "",
  content: "",
  imageUrl: "",
  workType: "Full-time",
  location: "",
  position: "",
  applicationLink: "",
  applicationDeadline: "",
  salary: "",
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

export default function AdminJobPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState<JobForm>(emptyJob);

  const currentRole = useMemo(() => decodeStoredRole(safeGetSessionItem("admin_role")), []);
  const adminName = useMemo(() => safeGetSessionItem("admin_name") || "Admin", []);
  const publishedCount = useMemo(() => jobs.filter((item) => item.published !== false).length, [jobs]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      setJobs([]);
      setMessage("Không thể tải danh sách việc làm");
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
    if (authChecked) fetchJobs();
  }, [authChecked, fetchJobs]);

  const showToast = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  };

  function resetForm() {
    setEditing(null);
    setForm(emptyJob);
    setShowForm(false);
  }

  function handleNew() {
    resetForm();
    setShowForm(true);
  }

  function handleEdit(item: Job) {
    setEditing(item);
    setForm({
      title: item.title || "",
      company: item.company || "",
      summary: item.summary || "",
      content: item.content || "",
      imageUrl: item.imageUrl || "",
      workType: item.workType || "Full-time",
      location: item.location || "",
      position: item.position || "",
      applicationLink: item.applicationLink || "",
      applicationDeadline: item.applicationDeadline || "",
      salary: item.salary || "",
      author: item.author || "DUA Edu",
      published: item.published !== false,
    });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.company.trim()) {
      showToast("Vui lòng nhập tiêu đề và công ty");
      return;
    }

    const body = {
      ...(editing ? { id: editing.id } : {}),
      title: form.title.trim(),
      company: form.company.trim(),
      summary: form.summary?.trim() || "",
      content: form.content?.trim() || "",
      imageUrl: form.imageUrl?.trim() || "",
      workType: form.workType || "Full-time",
      location: form.location?.trim() || "",
      position: form.position?.trim() || "",
      applicationLink: form.applicationLink?.trim() || "",
      applicationDeadline: form.applicationDeadline || "",
      salary: form.salary?.trim() || "",
      author: form.author?.trim() || "DUA Edu",
      published: form.published !== false,
    };

    const res = await fetch("/api/jobs", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      showToast(`${editing ? "Sửa" : "Thêm"} việc làm thất bại: ${err.error}`);
      return;
    }

    resetForm();
    showToast(editing ? "Đã cập nhật việc làm" : "Đã thêm việc làm");
    fetchJobs();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa việc làm này?")) return;
    const res = await fetch(`/api/jobs?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      showToast(`Xóa việc làm thất bại: ${err.error}`);
      return;
    }
    showToast("Đã xóa việc làm");
    fetchJobs();
  }

  async function togglePublished(item: Job) {
    const res = await fetch("/api/jobs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        title: item.title || "",
        company: item.company || "",
        summary: item.summary || "",
        content: item.content || "",
        imageUrl: item.imageUrl || "",
        workType: item.workType || "Full-time",
        location: item.location || "",
        position: item.position || "",
        applicationLink: item.applicationLink || "",
        applicationDeadline: item.applicationDeadline || "",
        salary: item.salary || "",
        author: item.author || "DUA Edu",
        published: !item.published,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      showToast(`Cập nhật trạng thái thất bại: ${err.error}`);
      return;
    }

    fetchJobs();
  }

  if (!authChecked) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Đang kiểm tra quyền truy cập...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-yellow-700 hover:text-yellow-800 mb-3">
              <span className="text-lg">←</span>
              Quay lại dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Quản lý việc làm</h1>
            <p className="text-gray-600 mt-2 max-w-2xl">CRUD tin tuyển dụng cho website. Trang này đã tách riêng để thao tác nhanh hơn.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-yellow-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Tổng việc làm</p>
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
            </div>
            <div className="rounded-2xl border border-yellow-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Đang hiển thị</p>
              <p className="text-2xl font-bold text-yellow-700">{publishedCount}</p>
            </div>
            <button
              type="button"
              onClick={handleNew}
              className="inline-flex items-center justify-center rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-gray-900 shadow-lg shadow-yellow-200 transition hover:bg-yellow-600"
            >
              + Thêm việc làm
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="rounded-full bg-white px-3 py-1.5 border border-gray-200">Đăng nhập: {adminName}</span>
          {currentRole ? <span className="rounded-full bg-white px-3 py-1.5 border border-gray-200">Vai trò: {currentRole}</span> : null}
          <button
            type="button"
            onClick={fetchJobs}
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
        ) : jobs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-yellow-200 bg-white/80 px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-900">Chưa có việc làm nào</p>
            <p className="text-sm text-gray-500 mt-1">Nhấn “Thêm việc làm” để tạo bản ghi đầu tiên.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Việc làm</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Công ty</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Hình thức</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Hạn nộp</th>
                    <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobs
                    .slice()
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{job.title}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{job.summary}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{job.company}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {job.workType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(job.applicationDeadline)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => togglePublished(job)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              job.published !== false ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {job.published !== false ? "Hiển thị" : "Ẩn"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => handleEdit(job)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                              Sửa
                            </button>
                            <button onClick={() => handleDelete(job.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
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
                  <h2 className="text-xl font-bold text-gray-900">{editing ? "Sửa việc làm" : "Thêm việc làm mới"}</h2>
                  <p className="text-sm text-gray-500">Nhập thông tin tuyển dụng và lưu trực tiếp lên Firebase.</p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-500/50" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Công ty *</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-500/50" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức</label>
                  <select className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-500/50" value={form.workType} onChange={(e) => setForm({ ...form, workType: e.target.value })}>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Internship</option>
                    <option>Freelance</option>
                    <option>Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp</label>
                  <input type="date" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-500/50" value={form.applicationDeadline || ""} onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tóm tắt</label>
                  <textarea rows={3} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-500/50" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                  <textarea rows={6} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-500/50" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-500/50" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-500/50" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mức lương</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-500/50" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link ứng tuyển</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-500/50" value={form.applicationLink} onChange={(e) => setForm({ ...form, applicationLink: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-500/50" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
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
                <button onClick={handleSubmit} className="px-5 py-2.5 rounded-xl bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-600">
                  {editing ? "Lưu thay đổi" : "Tạo việc làm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

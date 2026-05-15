"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import type { MailLogEntry, MailLogStats } from "@/types/mail";

const ROLE_LABELS: Record<string, string> = {
  system_admin: "Quản trị hệ thống",
  content_manager: "Quản lý nội dung",
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

function formatDateTime(value: string | undefined | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN");
}

function truncate(value: string, length = 120) {
  if (!value) return "—";
  return value.length > length ? `${value.slice(0, length)}...` : value;
}

function statusBadge(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "sent") return "bg-emerald-500/10 text-emerald-700";
  if (normalized === "failed") return "bg-red-500/10 text-red-700";
  if (normalized === "pending") return "bg-amber-500/10 text-amber-700";
  if (normalized === "skipped") return "bg-slate-500/10 text-slate-700";
  return "bg-slate-500/10 text-slate-700";
}

function mailTypeLabel(mailType: string) {
  const normalized = mailType.toLowerCase();
  if (normalized === "course_paid_registration") return "Đăng ký khóa phí";
  if (normalized === "course_paid_hidden_price_registration") return "Đăng ký khóa phí ẩn giá";
  if (normalized === "course_free_registration") return "Đăng ký khóa miễn phí";
  if (normalized === "newsletter") return "Newsletter";
  if (normalized === "manual") return "Thủ công";
  return mailType || "Khác";
}

export default function AdminMailPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<MailLogEntry[]>([]);
  const [stats, setStats] = useState<MailLogStats>({ total: 0, sent: 0, failed: 0, pending: 0, skipped: 0 });
  const [selectedLog, setSelectedLog] = useState<MailLogEntry | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({
    recipientEmail: "",
    subject: "",
    mailType: "manual",
    body: "",
  });

  const currentRole = useMemo(() => decodeStoredRole(safeGetSessionItem("admin_role")), []);
  const adminName = useMemo(() => safeGetSessionItem("admin_name") || "Admin", []);
  const allowed = currentRole === "system_admin" || currentRole === "content_manager";

  const buildAuthHeader = useCallback(() => {
    const stored = safeGetSessionItem("admin_role");
    if (!stored) return {} as Record<string, string>;
    return { Authorization: `Bearer ${decodeStoredRole(stored) || stored.trim()}` } as Record<string, string>;
  }, []);

  const fetchLogs = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/mail", {
        headers: buildAuthHeader(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Không thể tải mail logs");
      }
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setStats(data.stats || { total: 0, sent: 0, failed: 0, pending: 0, skipped: 0 });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể tải mail logs");
      setLogs([]);
      setStats({ total: 0, sent: 0, failed: 0, pending: 0, skipped: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildAuthHeader]);

  useEffect(() => {
    const isAuth = safeGetSessionItem("admin_auth");
    if (!isAuth) {
      router.replace("/admin/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked || !allowed) return;
    fetchLogs();
  }, [authChecked, allowed, fetchLogs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesSearch =
        !q ||
        log.recipientEmail.toLowerCase().includes(q) ||
        log.subject.toLowerCase().includes(q) ||
        log.mailType.toLowerCase().includes(q) ||
        log.body.toLowerCase().includes(q) ||
        (log.registration?.fullName || "").toLowerCase().includes(q) ||
        (log.registration?.courseTitle || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || log.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesType = typeFilter === "all" || log.mailType.toLowerCase() === typeFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [logs, search, statusFilter, typeFilter]);

  async function sendMail() {
    if (!form.recipientEmail.trim() || !form.subject.trim() || !form.body.trim()) {
      alert("Vui lòng nhập email, tiêu đề và nội dung");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/mail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(),
        },
        body: JSON.stringify({
          recipientEmail: form.recipientEmail.trim(),
          subject: form.subject.trim(),
          mailType: form.mailType,
          body: form.body,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Không thể gửi mail");
      }
      alert("Đã gửi mail và lưu log thành công");
      setForm({ recipientEmail: "", subject: "", mailType: "manual", body: "" });
      await fetchLogs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể gửi mail");
    } finally {
      setSending(false);
    }
  }

  async function resendMail(log: MailLogEntry) {
    if (!confirm("Gửi lại mail này?")) return;
    try {
      const res = await fetch("/api/admin/mail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(),
        },
        body: JSON.stringify({ logId: log.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Không thể gửi lại mail");
      }
      alert("Đã gửi lại mail");
      await fetchLogs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể gửi lại mail");
    }
  }

  async function updateStatus(log: MailLogEntry, status: string) {
    try {
      const res = await fetch("/api/admin/mail", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(),
        },
        body: JSON.stringify({ id: log.id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Không thể cập nhật trạng thái");
      }
      setLogs((prev) => prev.map((item) => (item.id === log.id ? { ...item, status } : item)));
      if (selectedLog?.id === log.id) {
        setSelectedLog({ ...selectedLog, status });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể cập nhật trạng thái");
    }
  }

  if (!authChecked) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">Đang kiểm tra đăng nhập...</div>;
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center max-w-md">
          <p className="text-xl font-bold text-gray-900">Không có quyền truy cập</p>
          <p className="text-gray-500 mt-2">Trang mail chỉ dành cho system_admin và content_manager.</p>
          <Link href="/admin" className="inline-flex mt-6 px-4 py-2 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700">
            Về admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo href="/admin" showText={false} imageClassName="h-14 w-14" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Quản lý mail</p>
              <p className="text-xs text-gray-500">
                {adminName}{currentRole ? ` • ${ROLE_LABELS[currentRole] || currentRole}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
              Về admin
            </Link>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              {refreshing ? "Đang tải..." : "Làm mới"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Tổng mail", value: stats.total },
            { label: "Đã gửi", value: stats.sent },
            { label: "Đang chờ", value: stats.pending },
            { label: "Lỗi", value: stats.failed },
            { label: "Bỏ qua", value: stats.skipped },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gửi mail mới</h1>
              <p className="text-sm text-gray-500">Lưu lịch sử gửi vào bảng <code className="font-mono">mail_logs</code>.</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-700 font-semibold">SMTP enabled</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email người nhận</label>
              <input
                type="email"
                value={form.recipientEmail}
                onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại mail</label>
              <select
                value={form.mailType}
                onChange={(e) => setForm({ ...form, mailType: e.target.value })}
                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
              >
                <option value="manual">Thủ công</option>
                <option value="course_paid_registration">Đăng ký khóa phí</option>
                <option value="course_paid_hidden_price_registration">Đăng ký khóa phí ẩn giá</option>
                <option value="course_free_registration">Đăng ký khóa miễn phí</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
              placeholder="Tiêu đề email"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
            <textarea
              rows={8}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
              placeholder="Nhập nội dung mail..."
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={sendMail}
              disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {sending ? "Đang gửi..." : "Gửi mail"}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Mail logs</h2>
              <p className="text-sm text-gray-500">Theo dõi trạng thái gửi mail, xem nội dung và gửi lại khi cần.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full lg:w-80 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
                placeholder="Tìm theo email, tiêu đề, nội dung..."
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="sent">Đã gửi</option>
                <option value="failed">Lỗi</option>
                <option value="pending">Đang chờ</option>
                <option value="skipped">Bỏ qua</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
              >
                <option value="all">Tất cả loại</option>
                <option value="manual">Thủ công</option>
                <option value="course_paid_registration">Đăng ký khóa phí</option>
                <option value="course_paid_hidden_price_registration">Đăng ký khóa phí ẩn giá</option>
                <option value="course_free_registration">Đăng ký khóa miễn phí</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500">Đang tải...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <p className="text-xl">Chưa có mail logs</p>
              <p className="mt-1">Khi có mail được gửi, nó sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Thời gian</th>
                    <th className="px-4 py-3 font-medium">Người nhận</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Loại</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Tiêu đề</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatDateTime(log.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{log.recipientEmail}</div>
                        <div className="text-xs text-gray-500">
                          {log.registration?.fullName ? `${log.registration.fullName}${log.registration.courseTitle ? ` • ${log.registration.courseTitle}` : ""}` : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs bg-slate-500/10 text-slate-700 px-2 py-0.5 rounded-full">{mailTypeLabel(log.mailType)}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="font-medium text-gray-900">{log.subject}</div>
                        <div className="text-xs text-gray-500 mt-1 max-w-[360px]">{truncate(log.body)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={log.status}
                          onChange={(e) => updateStatus(log, e.target.value)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 outline-none ${statusBadge(log.status)}`}
                        >
                          <option value="pending">Đang chờ</option>
                          <option value="skipped">Bỏ qua</option>
                          <option value="sent">Đã gửi</option>
                          <option value="failed">Lỗi</option>
                        </select>
                        {log.errorMessage && (
                          <p className="text-[11px] text-red-600 mt-1 max-w-[240px]">{log.errorMessage}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => resendMail(log)}
                            className="text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          >
                            Gửi lại
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto px-4 py-8">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Chi tiết mail</h3>
                <p className="text-sm text-gray-500">{selectedLog.subject}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-2xl text-gray-400 hover:text-gray-600">×</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Người nhận</p>
                <p className="font-semibold text-gray-900">{selectedLog.recipientEmail}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Loại mail</p>
                <p className="font-semibold text-gray-900">{mailTypeLabel(selectedLog.mailType)}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Trạng thái</p>
                <p className="font-semibold text-gray-900">{selectedLog.status}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Thời gian gửi</p>
                <p className="font-semibold text-gray-900">{formatDateTime(selectedLog.sentAt || selectedLog.createdAt)}</p>
              </div>
            </div>

            {selectedLog.registration && (
              <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-sm">
                <p className="text-xs uppercase tracking-wider text-emerald-700 mb-1">Liên kết đăng ký</p>
                <p className="font-semibold text-gray-900">{selectedLog.registration.fullName}</p>
                <p className="text-gray-600">{selectedLog.registration.courseTitle || selectedLog.registration.courseId}</p>
                <p className="text-gray-500 mt-1">{selectedLog.registration.email} • {selectedLog.registration.phone}</p>
              </div>
            )}

            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Nội dung</p>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 border border-gray-200 rounded-2xl p-4 overflow-x-auto max-h-[420px]">{selectedLog.body}</pre>
            </div>

            {selectedLog.errorMessage && (
              <div className="mt-4 bg-red-50 border border-red-100 rounded-2xl p-4">
                <p className="text-sm font-semibold text-red-700 mb-1">Lỗi</p>
                <p className="text-sm text-red-700">{selectedLog.errorMessage}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => resendMail(selectedLog)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
              >
                Gửi lại
              </button>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

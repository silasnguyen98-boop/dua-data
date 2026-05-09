"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import BrandLogo from "@/components/BrandLogo";
import type { SaleRegistrationEntry, SaleRegistrationStatus } from "@/types/sale";

const STATUS_LABELS: Record<SaleRegistrationStatus, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  consulting: "Đang tư vấn",
  paid: "Đã thanh toán",
  onboarded: "Đã onboard",
  cancelled: "Đã hủy",
};

const STATUS_STYLES: Record<SaleRegistrationStatus, string> = {
  new: "bg-amber-50 text-amber-700 border-amber-200",
  contacted: "bg-sky-50 text-sky-700 border-sky-200",
  consulting: "bg-indigo-50 text-indigo-700 border-indigo-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  onboarded: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function formatDateTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function safeGetSessionItem(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function buildAuthHeader(): Record<string, string> {
  const stored = safeGetSessionItem("admin_role");
  if (!stored) return {};
  const role = decodeStoredRole(stored) || stored.trim();
  if (!role) return {};
  return { Authorization: `Bearer ${btoa(role)}` };
}

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

function getStatusClass(status: SaleRegistrationStatus) {
  return STATUS_STYLES[status] || STATUS_STYLES.new;
}

function getDisplayContact(entry: SaleRegistrationEntry) {
  const parts = [entry.phone, entry.facebook].filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : "—";
}

export default function SalePage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<SaleRegistrationEntry[]>([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState("all");

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/sale/registrations", {
        cache: "no-store",
        headers: buildAuthHeader(),
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.error || "Failed to fetch sale registrations");
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      setRegistrations([]);
      setMessage(err instanceof Error ? err.message : "Không thể tải dữ liệu đăng ký.");
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
    const role = decodeStoredRole(safeGetSessionItem("admin_role"));
    if (role !== "system_admin" && role !== "sales_executive") {
      window.location.href = "/admin";
      return;
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    fetchRegistrations();
  }, [authChecked, fetchRegistrations]);

  const role = useMemo(() => decodeStoredRole(safeGetSessionItem("admin_role")), []);
  const adminName = useMemo(() => safeGetSessionItem("admin_name") || "Sale", []);

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    registrations.forEach((entry) => {
      if (!map.has(entry.courseId)) {
        map.set(entry.courseId, entry.courseTitle);
      }
    });
    return Array.from(map.entries())
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registrations.filter((entry) => {
      const statusMatch = statusFilter === "all" || entry.status === statusFilter;
      const courseMatch = courseFilter === "all" || entry.courseId === courseFilter;
      const searchMatch =
        !q ||
        entry.courseTitle.toLowerCase().includes(q) ||
        entry.fullName.toLowerCase().includes(q) ||
        entry.email.toLowerCase().includes(q) ||
        entry.phone.toLowerCase().includes(q) ||
        entry.facebook.toLowerCase().includes(q) ||
        entry.note.toLowerCase().includes(q);
      return statusMatch && courseMatch && searchMatch;
    });
  }, [registrations, search, statusFilter, courseFilter]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const newCount = registrations.filter((entry) => entry.status === "new").length;
    const paidCount = registrations.filter((entry) => entry.status === "paid").length;
    const onboardedCount = registrations.filter((entry) => entry.status === "onboarded").length;
    const revenue = registrations
      .filter((entry) => entry.status === "paid" || entry.status === "onboarded")
      .reduce((sum, entry) => sum + (entry.coursePrice || 0), 0);
    return { total, newCount, paidCount, onboardedCount, revenue };
  }, [registrations]);

  const exportExcel = () => {
    const rows = filteredRegistrations.map((entry, index) => ({
      STT: index + 1,
      "Khóa học": entry.courseTitle,
      "Mã khóa": entry.courseSlug,
      "Học viên": entry.fullName,
      Email: entry.email,
      "Số điện thoại": entry.phone,
      Facebook: entry.facebook || "",
      "Học phí": formatPrice(entry.coursePrice),
      "Lưu ý": entry.note,
      "Nhóm học viên": entry.learnerGroup,
      "Trạng thái": STATUS_LABELS[entry.status],
      "Ngày tạo": formatDateTime(entry.createdAt),
      "Cập nhật": formatDateTime(entry.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sale Registrations");
    XLSX.writeFile(workbook, `sale-registrations-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const updateStatus = async (id: string, status: SaleRegistrationStatus) => {
    setSavingId(id);
    setMessage("");
    try {
      const res = await fetch("/api/sale/registrations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(),
        },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Cập nhật trạng thái thất bại");
      }
      setRegistrations((current) => current.map((entry) => (entry.id === id ? (data as SaleRegistrationEntry) : entry)));
      setMessage("Đã cập nhật trạng thái.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Cập nhật trạng thái thất bại");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_30%),linear-gradient(to_bottom,#fbfdff,#f7faf8)] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo href="/admin/sale" showText={false} imageClassName="h-9 w-9" />
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-700">Sale Dashboard</div>
              <h1 className="truncate text-lg font-bold text-gray-950 sm:text-xl">
                Quản lý đăng ký khóa học có phí
              </h1>
              <p className="truncate text-xs text-gray-500 sm:text-sm">
                Xin chào {adminName} {role ? `• ${role}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="hidden rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:inline-flex"
            >
              Về Admin
            </Link>
            <button
              onClick={exportExcel}
              disabled={filteredRegistrations.length === 0}
              className="inline-flex items-center rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export Excel
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {message && (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tổng đăng ký</p>
            <p className="mt-2 text-3xl font-black text-gray-950">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Mới</p>
            <p className="mt-2 text-3xl font-black text-amber-600">{stats.newCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Đã thanh toán</p>
            <p className="mt-2 text-3xl font-black text-emerald-600">{stats.paidCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Đã onboard</p>
            <p className="mt-2 text-3xl font-black text-green-700">{stats.onboardedCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Doanh thu</p>
            <p className="mt-2 text-2xl font-black text-gray-950">{formatPrice(stats.revenue)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tìm kiếm</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, email, phone, khóa học..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Lọc theo trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              >
                <option value="all">Tất cả trạng thái</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Lọc theo khóa học</label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              >
                <option value="all">Tất cả khóa</option>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500">Đang tải dữ liệu đăng ký...</div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-gray-200 bg-white py-20 text-center text-gray-500">
            <p className="text-lg font-semibold text-gray-900">Chưa có đăng ký khóa có phí</p>
            <p className="mt-2 text-sm">Dữ liệu sale sẽ hiển thị tại đây khi học viên đăng ký các khóa học có phí.</p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Khóa học</th>
                    <th className="px-4 py-3 text-left font-semibold">Học viên</th>
                    <th className="px-4 py-3 text-left font-semibold">Liên hệ</th>
                    <th className="px-4 py-3 text-left font-semibold">Học phí</th>
                    <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-semibold">Ghi chú</th>
                    <th className="px-4 py-3 text-left font-semibold">Cập nhật</th>
                    <th className="px-4 py-3 text-center font-semibold">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRegistrations.map((entry) => (
                    <tr key={entry.id} className="align-top hover:bg-gray-50/70">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-950">{entry.courseTitle}</div>
                        <div className="mt-1 text-xs text-gray-500">Slug: {entry.courseSlug}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-950">{entry.fullName}</div>
                        <div className="mt-1 text-xs text-gray-500">Email: {entry.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-gray-700">{getDisplayContact(entry)}</div>
                        <div className="mt-1 text-xs text-gray-500">Nhóm: {entry.learnerGroup}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-base font-semibold text-gray-950">{formatPrice(entry.coursePrice)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={entry.status}
                          onChange={(e) => updateStatus(entry.id, e.target.value as SaleRegistrationStatus)}
                          disabled={savingId === entry.id}
                          className={`min-w-44 rounded-xl border px-3 py-2 text-sm font-medium outline-none transition focus:ring-2 focus:ring-green-500/20 ${getStatusClass(entry.status)}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-[280px] whitespace-pre-wrap text-gray-700">{entry.note || "—"}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        <div>{formatDateTime(entry.updatedAt)}</div>
                        <div className="mt-1 text-xs text-gray-500">{formatDateTime(entry.createdAt)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(entry.phone)}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                          >
                            Copy SĐT
                          </button>
                          {entry.facebook ? (
                            <a
                              href={entry.facebook.startsWith("http") ? entry.facebook : `https://${entry.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                            >
                              Facebook
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">Không có FB</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

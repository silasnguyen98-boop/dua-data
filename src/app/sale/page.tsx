"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx-js-style";
import BrandLogo from "@/components/BrandLogo";
import type { SaleRegistrationEntry, SaleRegistrationStatus } from "@/types/sale";

const STATUS_LABELS: Record<SaleRegistrationStatus, string> = {
  new: "🆕 Mới",
  contacted: "📞 Đã liên hệ",
  consulting: "💬 Đang tư vấn",
  paid: "✅ Đã thanh toán",
  gifted: "🎁 Đã tặng",
  onboarded: "🚀 Đã onboard",
  cancelled: "❌ Đã hủy",
};

const LEARNER_GROUP_LABELS: Record<number, string> = {
  1: "🎓 Học sinh / Sinh viên",
  2: "💼 Người đi làm 0-2 năm",
  3: "👔 Người đi làm 3-5 năm",
  0: "🔄 Chuyển ngành / Khác",
};

const STATUS_STYLES: Record<SaleRegistrationStatus, string> = {
  new: "bg-amber-50 text-amber-700 border-amber-200",
  contacted: "bg-sky-50 text-sky-700 border-sky-200",
  consulting: "bg-indigo-50 text-indigo-700 border-indigo-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  gifted: "bg-violet-50 text-violet-700 border-violet-200",
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
  const [role, setRole] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("");

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
    const storedRole = safeGetSessionItem("admin_role");
    const roleDecoded = decodeStoredRole(storedRole);
    if (roleDecoded !== "system_admin" && roleDecoded !== "sales_executive") {
      window.location.href = "/admin";
      return;
    }
    setAdminName(safeGetSessionItem("admin_name") || "Sale");
    setRole(roleDecoded);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    fetchRegistrations();
  }, [authChecked, fetchRegistrations]);

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
    const header = [
      "STT", "Khóa học", "Mã khóa", "Học viên", "Email",
      "Số điện thoại", "Facebook", "Học phí", "Lưu ý",
      "Nhóm học viên", "Trạng thái", "Ngày tạo", "Cập nhật"
    ];

    const data = filteredRegistrations.map((entry, index) => [
      index + 1,
      entry.courseTitle,
      entry.courseSlug,
      entry.fullName,
      entry.email,
      entry.phone,
      entry.facebook || "",
      formatPrice(entry.coursePrice),
      entry.note || "",
      LEARNER_GROUP_LABELS[entry.learnerGroup] || "Khác",
      STATUS_LABELS[entry.status],
      formatDateTime(entry.createdAt),
      formatDateTime(entry.updatedAt),
    ]);

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);

    // Define styles
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
      fill: { fgColor: { rgb: "10A37F" } }, // DUA Emerald
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { auto: 1 } },
        bottom: { style: "thin", color: { auto: 1 } },
        left: { style: "thin", color: { auto: 1 } },
        right: { style: "thin", color: { auto: 1 } }
      }
    };

    const cellStyle = {
      font: { sz: 10 },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { auto: 1 } },
        bottom: { style: "thin", color: { auto: 1 } },
        left: { style: "thin", color: { auto: 1 } },
        right: { style: "thin", color: { auto: 1 } }
      }
    };

    const centerStyle = {
      ...cellStyle,
      alignment: { horizontal: "center", vertical: "center" }
    };

    // Apply styles to all cells
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:M1");
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellRef]) continue;

        if (R === 0) {
          // Header row
          worksheet[cellRef].s = headerStyle;
        } else {
          // Data rows
          if (C === 0 || C === 5 || C === 10) {
            // STT, Phone, Status columns centered
            worksheet[cellRef].s = centerStyle;
          } else {
            worksheet[cellRef].s = cellStyle;
          }
        }
      }
    }

    // Set column widths
    const wscols = [
      { wch: 6 }, { wch: 35 }, { wch: 15 }, { wch: 25 }, { wch: 30 },
      { wch: 18 }, { wch: 30 }, { wch: 15 }, { wch: 50 }, { wch: 25 },
      { wch: 20 }, { wch: 20 }, { wch: 20 },
    ];
    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sale Registrations");
    XLSX.writeFile(workbook, `DUA-Data-Sale-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
    <div className="min-h-screen bg-white font-sans selection:bg-green-100 selection:text-green-900">
      {/* Subtle Technical Background */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#10a37f 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}></div>

      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <BrandLogo href="/admin/sale" showText={false} imageClassName="h-10 w-10" />
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest border border-green-100 mb-1">
                Sale Operations
              </div>
              <h1 className="text-xl font-black text-gray-950 truncate tracking-tight">
                Quản lý đăng ký khóa học
              </h1>
              <p className="text-xs text-gray-400 font-medium truncate">
                Xin chào <span className="text-gray-900 font-bold">{adminName || "Đang tải..."}</span> {role ? `• ${role}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="hidden md:flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Hệ thống v2
            </Link>
            <button
              onClick={exportExcel}
              disabled={filteredRegistrations.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-950 text-white text-sm font-black rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Xuất Excel
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        {message && (
          <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-bold text-green-700">{message}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
          <StatBox title="Tổng đăng ký" value={stats.total} color="slate" />
          <StatBox title="Đăng ký mới" value={stats.newCount} color="amber" />
          <StatBox title="Đã thanh toán" value={stats.paidCount} color="emerald" />
          <StatBox title="Đã onboard" value={stats.onboardedCount} color="green" />
          <StatBox title="Tổng doanh thu" value={formatPrice(stats.revenue)} color="dark" />
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tìm kiếm thông tin</label>
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tên, Email, SĐT..."
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-gray-300"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Lọc trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-green-500/20 transition-all appearance-none cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Lọc khóa học</label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-green-500/20 transition-all appearance-none cursor-pointer"
              >
                <option value="all">Tất cả khóa học</option>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data List/Table */}
        {loading ? (
          <div className="py-32 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4" />
            <p className="text-gray-400 font-medium italic">Đang tải dữ liệu nghiệp vụ...</p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-dashed border-gray-200 py-32 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy dữ liệu</h3>
            <p className="text-gray-400">Vui lòng điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/30">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Khóa học & Học viên</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thông tin liên hệ</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Học phí</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ghi chú & Thời gian</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRegistrations.map((entry) => (
                    <tr key={entry.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-black text-gray-950 mb-1 leading-tight">{entry.fullName}</div>
                        <div className="text-xs text-gray-400 mb-2">{entry.email}</div>
                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 text-[10px] font-black text-green-700 uppercase tracking-wider border border-green-100/50 shadow-sm">
                          {entry.courseTitle}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-800">{entry.phone}</span>
                        </div>
                        <div className="text-xs text-gray-400 italic">Nhóm: {LEARNER_GROUP_LABELS[entry.learnerGroup] || "Khác"}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-lg font-black text-gray-950 leading-none">
                          {formatPrice(entry.coursePrice)}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <select
                          value={entry.status}
                          onChange={(e) => updateStatus(entry.id, e.target.value as SaleRegistrationStatus)}
                          disabled={savingId === entry.id}
                          className={`rounded-2xl border-none px-4 py-2 text-xs font-black outline-none focus:ring-4 focus:ring-green-500/10 transition-all cursor-pointer ${getStatusClass(entry.status)}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-8 py-6">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 max-w-[300px] relative group-hover:bg-white transition-colors">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            <p className="text-xs text-gray-700 leading-relaxed font-medium">
                              {entry.note || "Không có ghi chú từ học viên"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 px-1">
                          <div className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                            Cập nhật: {formatDateTime(entry.updatedAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigator.clipboard?.writeText(entry.phone)}
                            className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600 transition-all border border-transparent hover:border-green-100"
                            title="Copy SĐT"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                          </button>
                          {entry.facebook && (
                            <a
                              href={entry.facebook.startsWith("http") ? entry.facebook : `https://${entry.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                              title="Facebook"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" /></svg>
                            </a>
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

function StatBox({ title, value, color }: { title: string, value: string | number, color: string }) {
  const colors: Record<string, string> = {
    slate: "text-slate-600 bg-slate-50 border-slate-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    green: "text-green-600 bg-green-50 border-green-100",
    dark: "text-gray-950 bg-gray-50 border-gray-100 ring-2 ring-gray-950/5",
  };

  return (
    <div className={`rounded-[32px] p-8 border shadow-sm transition-all hover:shadow-md ${colors[color] || colors.slate}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3">{title}</p>
      <p className="text-3xl font-black tracking-tighter">{value}</p>
    </div>
  );
}

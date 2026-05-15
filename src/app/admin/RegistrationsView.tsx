"use client";

import { useState, useEffect, useMemo } from "react";

interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  courseName: string;
  courseId: string;
  registeredAt: string;
  status: string;
  courseType: string;
  price: number;
  expectations: string;
}

type TimeFilter = "all" | "today" | "week" | "custom";

const STATUS_OPTIONS = [
  { id: "new", label: "Mới", color: "bg-blue-50 text-blue-600 border-blue-100" },
  { id: "contacted", label: "Đã liên hệ", color: "bg-orange-50 text-orange-600 border-orange-100" },
  { id: "paid", label: "Đã đóng tiền", color: "bg-green-50 text-green-600 border-green-100" },
  { id: "onboarded", label: "Đã onboard", color: "bg-purple-50 text-purple-600 border-purple-100" },
  { id: "cancelled", label: "Hủy", color: "bg-gray-50 text-gray-400 border-gray-100" },
];

export default function RegistrationsView() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"online_paid" | "elearning">("online_paid");

  // Filtering states
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Detail Modal state
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/register");
      const data = await res.json();
      setRegistrations(data);
    } catch (err) {
      console.error("Failed to fetch registrations", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    registrations.forEach((r) => {
      if (r.courseName && !map.has(r.courseName)) {
        map.set(r.courseName, r.courseName);
      }
    });
    return Array.from(map.values()).sort();
  }, [registrations]);

  const filteredData = useMemo(() => {
    let data = registrations;

    // 1. Tab Filter
    data = data.filter((r) => {
      if (activeTab === "elearning") return r.courseType === "elearning";
      if (r.courseType !== "online") return false;
      if (activeTab === "online_paid") return r.price > 0;
      return false;
    });

    // 2. Search Filter
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(r =>
        r.fullName.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.phone.includes(s) ||
        r.courseName.toLowerCase().includes(s)
      );
    }

    // 3. Course Name Filter
    if (courseFilter !== "all") {
      data = data.filter(r => r.courseName === courseFilter);
    }

    // 4. Time Filter
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (timeFilter === "today") {
      data = data.filter(r => r.registeredAt.startsWith(todayStr));
    } else if (timeFilter === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      data = data.filter(r => new Date(r.registeredAt) >= startOfWeek);
    } else if (timeFilter === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      data = data.filter(r => {
        const d = new Date(r.registeredAt);
        return d >= start && d <= end;
      });
    }

    return data;
  }, [registrations, activeTab, timeFilter, startDate, endDate, search, courseFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1); // Reset page when filters change
  }, [activeTab, timeFilter, search, startDate, endDate, courseFilter]);

  const stats = {
    online_paid: registrations.filter((r) => r.courseType === "online" && r.price > 0).length,
    elearning: registrations.filter((r) => r.courseType === "elearning").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Sale (Đăng ký)</h2>
          <p className="text-sm text-slate-500 font-medium">Theo dõi và chăm sóc học viên đăng ký các khóa học có phí</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input
              type="text"
              placeholder="Tìm tên, SĐT, Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all w-72 shadow-sm"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={fetchRegistrations}
            className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm active:scale-95"
            title="Tải lại dữ liệu"
          >
            <svg className={`w-5 h-5 text-slate-600 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Advanced Filters Bar */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center gap-8">
          {/* Time Filter */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Thời gian đăng ký</span>
            <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
              {[
                { id: "all", label: "Tất cả" },
                { id: "today", label: "Hôm nay" },
                { id: "week", label: "Tuần này" },
                { id: "custom", label: "Tùy chọn" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTimeFilter(f.id as TimeFilter)}
                  className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    timeFilter === f.id ? "bg-white text-green-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Course Filter */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lọc theo khóa học</span>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="block w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 appearance-none"
            >
              <option value="all">Tất cả khóa học</option>
              {courseOptions.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          {timeFilter === "custom" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-500">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Khoảng ngày chọn</span>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10"
                />
                <span className="text-slate-300 font-bold">→</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex p-1.5 bg-slate-100 rounded-[24px] w-fit">
          {[
            { id: "online_paid", label: "Online (Có phí)", count: stats.online_paid },
            { id: "elearning", label: "E-learning", count: stats.elearning },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-3 rounded-[18px] text-sm font-bold transition-all flex items-center gap-3 ${
                activeTab === tab.id
                  ? "bg-white text-green-700 shadow-lg shadow-slate-200/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              {tab.label}
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                activeTab === tab.id ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Học viên</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khóa học</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày đăng ký</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-3/4"></div><div className="h-3 bg-slate-50 rounded-lg w-1/2 mt-2"></div></td>
                    <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-1/2"></div></td>
                    <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-24"></div></td>
                    <td className="px-8 py-5"><div className="h-8 bg-slate-100 rounded-xl w-24"></div></td>
                    <td className="px-8 py-5 text-right"><div className="h-4 bg-slate-100 rounded-lg w-32 ml-auto"></div></td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                    Chưa có đăng ký nào khớp với bộ lọc
                  </td>
                </tr>
              ) : (
                paginatedData.map((reg) => (
                  <tr
                    key={reg.id}
                    onClick={() => setSelectedReg(reg)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900 group-hover:text-green-600 transition-colors">{reg.fullName}</div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-col gap-0.5 font-medium">
                        <span className="flex items-center gap-1.5">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          {reg.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          {reg.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm text-slate-700 font-bold leading-snug max-w-[200px]">
                        {reg.courseName}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest border border-slate-200">
                          {reg.courseType}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs font-bold text-slate-500">
                        {new Date(reg.registeredAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(reg.registeredAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={reg.status || "new"}
                        onChange={(e) => handleUpdateStatus(reg.id, e.target.value)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border appearance-none focus:outline-none transition-all cursor-pointer shadow-sm ${
                          STATUS_OPTIONS.find(s => s.id === (reg.status || "new"))?.color || ""
                        }`}
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status.id} value={status.id} className="bg-white text-slate-900 normal-case font-medium tracking-normal">
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="text-[11px] text-slate-500 font-medium italic line-clamp-2 max-w-[180px] leading-relaxed" title={reg.expectations}>
                          {reg.expectations || "—"}
                        </div>
                        <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} / {filteredData.length} kết quả
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2.5 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>

              <div className="flex items-center gap-1.5 px-2">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i + 1;
                  }
                  if (pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                        currentPage === pageNum
                          ? "bg-green-600 text-white shadow-lg shadow-green-200"
                          : "border border-slate-100 hover:bg-white text-slate-500"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2.5 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedReg(null)}
          />
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="p-8 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-green-100 rounded-[22px] flex items-center justify-center text-green-700 font-black text-2xl shadow-inner border border-green-200/50">
                  {selectedReg.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedReg.fullName}</h3>
                  <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                    STATUS_OPTIONS.find(s => s.id === (selectedReg.status || "new"))?.color || ""
                  }`}>
                    {STATUS_OPTIONS.find(s => s.id === (selectedReg.status || "new"))?.label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 transition-all active:scale-90"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-slate-700 break-all">{selectedReg.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại</p>
                  <p className="text-sm font-bold text-slate-700">{selectedReg.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khóa học đăng ký</p>
                  <p className="text-sm font-bold text-slate-800 leading-snug">{selectedReg.courseName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian đăng ký</p>
                  <p className="text-sm font-bold text-slate-700">
                    {new Date(selectedReg.registeredAt).toLocaleString("vi-VN", {
                      dateStyle: "long",
                      timeStyle: "short"
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-2 p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhu cầu / Ghi chú đầy đủ</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap italic">
                  "{selectedReg.expectations || "Không có ghi chú thêm."}"
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`tel:${selectedReg.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  GỌI ĐIỆN NGAY
                </a>
                <button
                  onClick={() => setSelectedReg(null)}
                  className="px-8 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
                >
                  ĐÓNG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

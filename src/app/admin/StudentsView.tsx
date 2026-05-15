"use client";

import { useState, useEffect, useMemo } from "react";

interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  courseName: string;
  registeredAt: string;
  status: string;
  courseType: string;
  price: number;
  expectations: string;
}

type TimeFilter = "all" | "today" | "week" | "custom";

export default function StudentsView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"online_paid" | "online_free" | "elearning">("online_paid");

  // Filtering states
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/register");
      const data = await res.json();
      // Filter for onboarded students only
      const onboarded = (data as Student[]).filter(s => s.status === "onboarded");
      setStudents(onboarded);
    } catch (err) {
      console.error("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  };

  // 1. First, apply filters that are GLOBAL to all tabs (Time + Search)
  const baseFilteredData = useMemo(() => {
    let data = students;

    // Search Filter
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(st =>
        st.fullName.toLowerCase().includes(s) ||
        st.email.toLowerCase().includes(s) ||
        st.phone.includes(s) ||
        st.courseName.toLowerCase().includes(s)
      );
    }

    // Time Filter
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (timeFilter === "today") {
      data = data.filter(s => s.registeredAt.startsWith(todayStr));
    } else if (timeFilter === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      data = data.filter(s => new Date(s.registeredAt) >= startOfWeek);
    } else if (timeFilter === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      data = data.filter(s => {
        const d = new Date(s.registeredAt);
        return d >= start && d <= end;
      });
    }

    return data;
  }, [students, timeFilter, startDate, endDate, search]);

  // 2. Calculate Stats based on the base filtered data
  const stats = useMemo(() => ({
    online_paid: baseFilteredData.filter((s) => s.courseType === "online" && s.price > 0).length,
    online_free: baseFilteredData.filter((s) => s.courseType === "online" && s.price === 0).length,
    elearning: baseFilteredData.filter((s) => s.courseType === "elearning").length,
  }), [baseFilteredData]);

  // 3. Final Tab-specific filter for the table
  const filteredData = useMemo(() => {
    return baseFilteredData.filter((s) => {
      if (activeTab === "elearning") return s.courseType === "elearning";
      if (s.courseType !== "online") return false;
      if (activeTab === "online_paid") return s.price > 0;
      if (activeTab === "online_free") return s.price === 0;
      return false;
    });
  }, [baseFilteredData, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, timeFilter, search, startDate, endDate]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Danh sách Học viên</h2>
          <p className="text-sm text-slate-500 font-medium">Quản lý các học viên đã chính thức nhập học (Onboarded)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input
              type="text"
              placeholder="Tìm tên, email, sđt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all w-72 shadow-sm"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={fetchStudents}
            className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm active:scale-95"
          >
            <svg className={`w-5 h-5 text-slate-600 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Thời gian nhập học</span>
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {[
              { id: "all", label: "Tất cả" },
              { id: "today", label: "Hôm nay" },
              { id: "week", label: "Tuần này" },
              { id: "custom", label: "Tùy chọn" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id as TimeFilter)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeFilter === f.id ? "bg-white text-green-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {timeFilter === "custom" && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Khoảng ngày</span>
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

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-100 rounded-[24px] w-fit">
        {[
          { id: "online_paid", label: "Online (Có phí)", count: stats.online_paid },
          { id: "online_free", label: "Online (Miễn phí)", count: stats.online_free },
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

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Học viên</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khóa học</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày nhập học</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-3/4"></div><div className="h-3 bg-slate-50 rounded-lg w-1/2 mt-2"></div></td>
                    <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-1/2"></div></td>
                    <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-24"></div></td>
                    <td className="px-8 py-5 text-right"><div className="h-8 bg-slate-100 rounded-xl w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                    Chưa có học viên nào khớp với bộ lọc
                  </td>
                </tr>
              ) : (
                paginatedData.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedStudent(st)}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md group-hover:scale-110 transition-transform">
                          {st.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-green-600 transition-colors">{st.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{st.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm text-slate-700 font-bold leading-snug">
                        {st.courseName}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs font-bold text-slate-600">
                        {new Date(st.registeredAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`tel:${st.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all active:scale-90 shadow-sm shadow-green-100"
                          title="Gọi điện"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </a>
                        <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 border border-slate-100 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-lg hover:shadow-slate-200/50 transition-all shadow-sm active:scale-95 hover:-translate-y-0.5">
                          Chi tiết
                        </button>
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
      {selectedStudent && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedStudent(null)}
          />
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="p-8 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-[22px] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-green-200">
                  {selectedStudent.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedStudent.fullName}</h3>
                  <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-purple-100 text-purple-600 border border-purple-200/50">
                    Học viên chính thức
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 transition-all active:scale-90"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-slate-700 break-all">{selectedStudent.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại</p>
                  <p className="text-sm font-bold text-slate-700">{selectedStudent.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khóa học tham gia</p>
                  <p className="text-sm font-bold text-slate-800 leading-snug">{selectedStudent.courseName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày nhập học</p>
                  <p className="text-sm font-bold text-slate-700">
                    {new Date(selectedStudent.registeredAt).toLocaleString("vi-VN", {
                      dateStyle: "long"
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-2 p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hồ sơ / Ghi chú ban đầu</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap italic">
                  "{selectedStudent.expectations || "Không có ghi chú thêm."}"
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`tel:${selectedStudent.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  LIÊN HỆ TƯ VẤN
                </a>
                <button
                  onClick={() => setSelectedStudent(null)}
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

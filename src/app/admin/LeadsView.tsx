"use client";

import { useState, useEffect, useMemo } from "react";

interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: string;
  resourceType?: string;
  courseName?: string;
  createdAt: string;
  source: "course_free" | "resource";
}

export default function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"course_free" | "resource">("course_free");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const [resFree, resRes] = await Promise.all([
        fetch("/api/register"),
        fetch("/api/lead-resource")
      ]);

      const freeData = await resFree.json();
      const resData = await resRes.json();

      const combined: Lead[] = [
        ...freeData
          .filter((r: any) => r.price === 0)
          .map((r: any) => ({
            id: r.id,
            fullName: r.fullName,
            email: r.email,
            phone: r.phone,
            courseName: r.courseName,
            createdAt: r.registeredAt,
            source: "course_free" as const
          })),
        ...resData.map((r: any) => ({
          ...r,
          source: "resource" as const
        }))
      ];

      // Sort by date newest first
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLeads(combined);
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let data = leads.filter(l => l.source === activeTab);
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(l =>
        l.fullName.toLowerCase().includes(s) ||
        l.email.toLowerCase().includes(s) ||
        (l.phone && l.phone.includes(s))
      );
    }
    return data;
  }, [leads, activeTab, search]);

  const stats = {
    course_free: leads.filter(l => l.source === "course_free").length,
    resource: leads.filter(l => l.source === "resource").length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Tiềm năng</h2>
          <p className="text-sm text-slate-500 font-medium">Danh sách khách hàng đăng ký tài liệu hoặc khóa học miễn phí</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input
              type="text"
              placeholder="Tìm kiếm tiềm năng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all w-72 shadow-sm"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={fetchLeads}
            className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm active:scale-95"
            title="Tải lại dữ liệu"
          >
            <svg className={`w-5 h-5 text-slate-600 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-100 rounded-[24px] w-fit">
        {[
          { id: "course_free", label: "Đăng ký Khóa Free", count: stats.course_free },
          { id: "resource", label: "Nhận Tài liệu", count: stats.resource },
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

      {/* Content */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin Tiềm năng</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {activeTab === "course_free" ? "Khóa học quan tâm" : "Tài liệu / Vai trò"}
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày đăng ký</th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                    Chưa có tiềm năng nào trong danh sách này
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md transition-transform group-hover:scale-110 ${
                          activeTab === "course_free" ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gradient-to-br from-orange-500 to-red-600"
                        }`}>
                          {lead.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-green-600 transition-colors">{lead.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{lead.email}</div>
                          {lead.phone && <div className="text-[10px] text-slate-500 font-medium">{lead.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {activeTab === "course_free" ? (
                        <div className="text-sm text-slate-700 font-bold leading-snug">
                          {lead.courseName}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg w-fit">
                            {lead.resourceType}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">Vai trò: {lead.role}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs font-bold text-slate-600">
                        {new Date(lead.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(lead.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          </a>
                        )}
                        <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 border border-slate-100 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-lg hover:shadow-slate-200/50 transition-all active:scale-95 hover:-translate-y-0.5">
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
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

import CoursesView from "./CoursesView";
import RegistrationsView from "./RegistrationsView";
import StudentsView from "./StudentsView";
import ShortlinksView from "./ShortlinksView";
import LeadsView from "./LeadsView";
import ActivitiesView from "./ActivitiesView";
import MailView from "./MailView";

interface Stats {
  totalStudents: number;
  totalLeads: number;
  totalCourses: number;
  totalWaitlist: number;
  growth: number;
}

function AdminContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "dashboard";

  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalLeads: 0,
    totalCourses: 0,
    totalWaitlist: 0,
    growth: 12.5
  });

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('week');
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [regRes, leadRes, courseRes, waitRes] = await Promise.all([
        fetch("/api/register"),
        fetch("/api/lead-resource"),
        fetch("/api/admin/courses"),
        fetch("/api/wait-list")
      ]);

      const regData = await regRes.json().catch(() => []);
      const leadData = await leadRes.json().catch(() => []);
      const courseData = await courseRes.json().catch(() => []);
      const waitData = await waitRes.json().catch(() => []);

      const sortedRegs = Array.isArray(regData)
        ? [...regData].sort((a, b) => {
            const tA = new Date(a.registeredAt || a.createdAt || 0).getTime();
            const tB = new Date(b.registeredAt || b.createdAt || 0).getTime();
            return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
          })
        : [];

      const freeCourseLeads = Array.isArray(regData)
        ? regData
            .filter((item: any) => Number(item.price || item.coursePrice || 0) === 0)
            .map((item: any) => ({
              ...item,
              createdAt: item.registeredAt || item.createdAt,
              source: "course_free",
            }))
        : [];

      const resourceLeads = Array.isArray(leadData)
        ? leadData.map((item: any) => ({
            ...item,
            source: "resource",
          }))
        : [];

      const combinedLeads = [...freeCourseLeads, ...resourceLeads];

      setAllRegistrations(sortedRegs);
      setAllLeads(combinedLeads);
      setStats({
        totalStudents: sortedRegs.length,
        totalLeads: combinedLeads.length,
        totalCourses: Array.isArray(courseData) ? courseData.length : 0,
        totalWaitlist: Array.isArray(waitData) ? waitData.length : 0,
        growth: 15.2
      });

      setRegistrations(sortedRegs.slice(0, 5));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "dashboard") {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [view, fetchData]);

  const chartData = useMemo(() => {
    if (!allRegistrations.length && !allLeads.length) return [];

    const now = new Date();
    const data = [];

    if (timeRange === 'day') {
      // Last 24 hours (hourly)
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - (i * 3600000));
        const hourLabel = `${d.getHours()}h`;
        const regCount = allRegistrations.filter(r => {
          const rd = new Date(r.registeredAt || r.createdAt);
          return rd && !isNaN(rd.getTime()) &&
                 rd.getDate() === d.getDate() &&
                 rd.getMonth() === d.getMonth() &&
                 rd.getFullYear() === d.getFullYear() &&
                 rd.getHours() === d.getHours();
        }).length;
        const leadCount = allLeads.filter(r => {
          const rd = new Date(r.registeredAt || r.createdAt);
          return rd && !isNaN(rd.getTime()) &&
                 rd.getDate() === d.getDate() &&
                 rd.getMonth() === d.getMonth() &&
                 rd.getFullYear() === d.getFullYear() &&
                 rd.getHours() === d.getHours();
        }).length;
        data.push({ name: hourLabel, registrations: regCount, leads: leadCount });
      }
    } else if (timeRange === 'year' || timeRange === 'all') {
      // Monthly view
      let startMonthDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      if (timeRange === 'all') {
        const allDates = [
          ...allRegistrations.map(r => new Date(r.registeredAt || r.createdAt).getTime()),
          ...allLeads.map(r => new Date(r.registeredAt || r.createdAt).getTime())
        ].filter(t => !isNaN(t));

        if (allDates.length > 0) {
          const firstDate = new Date(Math.min(...allDates));
          startMonthDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
        }
      }

      const monthsCount = (now.getFullYear() - startMonthDate.getFullYear()) * 12 + (now.getMonth() - startMonthDate.getMonth()) + 1;

      for (let i = 0; i < monthsCount; i++) {
        const d = new Date(startMonthDate.getFullYear(), startMonthDate.getMonth() + i, 1);
        const monthStr = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
        const regCount = allRegistrations.filter(r => {
          const rd = new Date(r.registeredAt || r.createdAt);
          return rd && !isNaN(rd.getTime()) &&
                 rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
        }).length;
        const leadCount = allLeads.filter(r => {
          const rd = new Date(r.registeredAt || r.createdAt);
          return rd && !isNaN(rd.getTime()) &&
                 rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
        }).length;
        data.push({ name: monthStr, registrations: regCount, leads: leadCount });
      }
    } else {
      // Daily view for week or month
      let days = 7;
      if (timeRange === 'month') days = 30;

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateKey = d.toLocaleDateString('en-CA');
        const label = days > 14
          ? d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
          : d.toLocaleDateString('vi-VN', { weekday: 'short' });

        const regCount = allRegistrations.filter(r => {
          const rd = new Date(r.registeredAt || r.createdAt);
          return rd && !isNaN(rd.getTime()) && rd.toLocaleDateString('en-CA') === dateKey;
        }).length;
        const leadCount = allLeads.filter(r => {
          const rd = new Date(r.registeredAt || r.createdAt);
          return rd && !isNaN(rd.getTime()) && rd.toLocaleDateString('en-CA') === dateKey;
        }).length;

        data.push({ name: label, registrations: regCount, leads: leadCount, fullDate: d.toLocaleDateString('vi-VN') });
      }
    }
    return data;
  }, [allRegistrations, allLeads, timeRange]);

  if (view === "courses") {
    return <CoursesView />;
  }

  if (view === "registrations") {
    return <RegistrationsView />;
  }

  if (view === "students") {
    return <StudentsView />;
  }

  if (view === "shortlinks") {
    return <ShortlinksView />;
  }

  if (view === "leads") {
    return <LeadsView />;
  }

  if (view === "activities") {
    return <ActivitiesView />;
  }

  if (view === "mail") {
    return <MailView />;
  }

  if (view !== "dashboard") {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-white rounded-3xl border border-slate-200 border-dashed">
        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Đang phát triển v2 cho {view}</h2>
        <p className="text-slate-500 mt-2">Giao diện mới cho phần này sẽ sớm được hoàn thiện.</p>
        <button onClick={() => window.location.href = `/admin?view=${view}`} className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all">
          Sử dụng bản v1
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Học viên đăng ký" value={stats.totalStudents} icon="Users" color="green" trend="+12%" />
        <StatCard title="Tiềm năng" value={stats.totalLeads} icon="LightBulb" color="blue" trend="+5%" />
        <StatCard title="Khóa học" value={stats.totalCourses} icon="BookOpen" color="purple" trend="Stable" />
        <StatCard title="Danh sách chờ" value={stats.totalWaitlist} icon="Clock" color="orange" trend="+8%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Biểu đồ tăng trưởng</h3>
              <p className="text-sm text-slate-500">
                {timeRange === 'day' && "Số lượng học viên đăng ký trong 24 giờ qua"}
                {timeRange === 'week' && "Số lượng học viên đăng ký trong tuần qua"}
                {timeRange === 'month' && "Số lượng học viên đăng ký trong 30 ngày qua"}
                {timeRange === 'year' && "Số lượng học viên đăng ký trong năm qua"}
                {timeRange === 'all' && "Số lượng học viên đăng ký từ trước đến nay"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all disabled:opacity-50"
                title="Làm mới dữ liệu"
              >
                <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
                {(['day', 'week', 'month', 'year', 'all'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      timeRange === r
                        ? "bg-white text-green-600 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {r === 'day' ? "Ngày" : r === 'week' ? "Tuần" : r === 'month' ? "Tháng" : r === 'year' ? "Năm" : "Tất cả"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-80 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10a37f" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10a37f" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#10a37f', strokeWidth: 2 }}
                />
                <Area
                  name="Học viên đăng ký"
                  type="monotone"
                  dataKey="registrations"
                  stroke="#10a37f"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRegs)"
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Area
                  name="Tiềm năng (Tổng)"
                  type="monotone"
                  dataKey="leads"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorLeads)"
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-6 mt-4 px-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10a37f]" />
              <span className="text-xs font-bold text-slate-600">Học viên đăng ký</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span className="text-xs font-bold text-slate-600">Tiềm năng (Khóa Free + Tài liệu)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Đăng ký mới nhất</h3>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
            {registrations.length === 0 ? (
              <div className="text-center py-10 text-slate-400">Không có dữ liệu</div>
            ) : (
              registrations.map((reg: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                    {reg.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{reg.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{reg.courseName || "Khóa học lẻ"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[50vh] text-slate-400 font-medium animate-pulse italic">Đang tải dashboard...</div>}>
      <AdminContent />
    </Suspense>
  );
}

function StatCard({ title, value, icon, color, trend }: { title: string, value: number, icon: string, color: string, trend: string }) {
  const colorMap: any = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600"
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl ${colorMap[color] || "bg-slate-50"}`}>
          <Icon name={icon} className="h-6 w-6" />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
          {trend}
        </span>
      </div>
      <div className="mt-4">
        <h4 className="text-sm font-medium text-slate-500">{title}</h4>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}

function Icon({ name, className }: { name: string, className?: string }) {
  switch (name) {
    case "Users": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    case "LightBulb": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
    case "BookOpen": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
    case "Clock": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    default: return null;
  }
}

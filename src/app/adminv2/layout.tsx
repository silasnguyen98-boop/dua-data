"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

const navItems = [
  { id: "dashboard", label: "Tổng quan", icon: "ChartPie", href: "/adminv2" },
  { id: "courses", label: "Khóa học", icon: "BookOpen", href: "/adminv2?view=courses" },
  { id: "registrations", label: "Đăng ký", icon: "UserAdd", href: "/adminv2?view=registrations" },
  { id: "students", label: "Học viên", icon: "Users", href: "/adminv2?view=students" },
  { id: "activities", label: "Hoạt động", icon: "Calendar", href: "/adminv2?view=activities" },
  { id: "leads", label: "Tiềm năng", icon: "UserGroup", href: "/adminv2?view=leads" },
  { id: "shortlinks", label: "Rút gọn link", icon: "Link", href: "/adminv2?view=shortlinks" },
  { id: "mail", label: "Email", icon: "Envelope", href: "/adminv2?view=mail" },
];

function Icon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "ChartPie": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;
    case "BookOpen": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
    case "UserAdd": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
    case "Users": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    case "Calendar": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case "UserGroup": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    case "Link": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
    case "Envelope": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    default: return null;
  }
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const currentView = searchParams.get("view") || "dashboard";

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (!auth) {
      router.replace("/admin/login");
    } else {
      setIsAuth(true);
    }
    setCheckingAuth(false);
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="text-slate-400 font-medium italic">Đang xác thực quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 transition-all duration-300 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="h-10 w-10 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
              <span className="text-white font-black text-xl">D</span>
            </div>
            <div>
              <h2 className="font-bold text-slate-900 leading-tight">Dứa Data</h2>
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Management v2</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 scrollbar-hide">
            <div className="px-3 mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Menu chính</p>
            </div>
            {navItems.map((item) => {
              const active = currentView === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative ${
                    active 
                      ? "bg-green-600 text-white shadow-xl shadow-green-200/50" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-green-600"
                  }`}
                >
                  <Icon name={item.icon} className={`h-5 w-5 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`} />
                  <span className={`text-sm transition-all ${active ? "font-bold" : "font-medium"}`}>{item.label}</span>
                  {active && (
                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-auto">
            <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100 shadow-inner">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold border border-green-200">
                  JD
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Admin User</p>
                  <p className="text-[10px] text-slate-500 truncate">Super Admin</p>
                </div>
              </div>
              <button
                onClick={() => {
                  sessionStorage.removeItem("admin_auth");
                  router.replace("/admin/login");
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white border border-slate-200 text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/50 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl hover:bg-slate-100 md:hidden transition-colors">
              <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">Hệ thống quản trị DUA Edu</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-slate-800">Quản trị viên</span>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">DuaData Cloud</span>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-black shadow-lg shadow-green-200">
              A
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-[#f8fafc]">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}

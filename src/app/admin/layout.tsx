"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

const navItems = [
  { id: "dashboard", label: "Tổng quan", icon: "ChartPie", href: "/admin" },
  { id: "courses", label: "Khóa học", icon: "BookOpen", href: "/admin?view=courses" },
  { id: "registrations", label: "Đăng ký", icon: "UserAdd", href: "/admin?view=registrations" },
  { id: "students", label: "Học viên", icon: "Users", href: "/admin?view=students" },
  { id: "activities", label: "Hoạt động", icon: "Calendar", href: "/admin?view=activities" },
  { id: "experts", label: "Chuyên gia", icon: "Badge", href: "/admin?view=experts" },
  { id: "leads", label: "Tiềm năng", icon: "UserGroup", href: "/admin?view=leads" },
  { id: "shortlinks", label: "Rút gọn link", icon: "Link", href: "/admin?view=shortlinks" },
  { id: "mail", label: "Email", icon: "Envelope", href: "/admin?view=mail" },
];

function Icon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "ChartPie": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;
    case "BookOpen": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
    case "UserAdd": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
    case "Users": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    case "Calendar": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case "Badge": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 21v-2a6 6 0 1112 0v2M7 3h10a2 2 0 012 2v16l-4-2-3 2-3-2-4 2V5a2 2 0 012-2z" /></svg>;
    case "UserGroup": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    case "Link": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
    case "Envelope": return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    default: return null;
  }
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true); // For mobile
  const [collapsed, setCollapsed] = useState(false); // For desktop mini-sidebar
  const currentView = searchParams.get("view") || "dashboard";

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setCheckingAuth(false);
      return;
    }

    const auth = sessionStorage.getItem("admin_auth");
    if (!auth) {
      router.replace("/admin/login");
    } else {
      setIsAuth(true);
      setAdminName(sessionStorage.getItem("admin_name") || "Quản trị viên");
      setAdminRole(sessionStorage.getItem("admin_username") === "admin" ? "Super Admin" : "Sale");
    }
    setCheckingAuth(false);
  }, [router, isLoginPage]);

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

  // If it's the login page, render children directly without the layout shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuth) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white/90 backdrop-blur-xl border-r border-slate-200/60 transition-all duration-500 ease-in-out transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 ${collapsed ? "w-24" : "w-72"}`}>
        <div className="flex flex-col h-full relative">
          {/* Collapse Toggle Button (Desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3.5 top-10 h-7 w-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:border-green-200 transition-all z-50 hidden md:flex group"
          >
            <svg className={`h-4 w-4 text-slate-500 group-hover:text-green-600 transition-transform duration-500 ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Sidebar Header / Logo */}
          <div className={`transition-all duration-500 flex items-center overflow-hidden border-b border-slate-100/50 mb-4 ${collapsed ? "p-5 justify-center h-28" : "p-10 justify-center h-32"}`}>
            <BrandLogo
              href="/admin"
              showText={false}
              className={`transition-all duration-500 ${collapsed ? "scale-90" : "scale-[1.6]"}`}
              imageClassName={collapsed ? "h-12 w-12" : "h-16 w-16"}
            />
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-hide">
            <div className={`px-3 mb-4 transition-opacity duration-300 ${collapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100 h-auto"}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Hệ thống</p>
            </div>
            {navItems.map((item) => {
              const active = currentView === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={collapsed ? item.label : ""}
                  className={`group flex items-center rounded-2xl transition-all duration-300 relative ${collapsed ? "px-0 justify-center h-14 w-14 mx-auto" : "px-4 py-3.5 gap-4"} ${
                    active
                      ? "bg-green-600 text-white shadow-xl shadow-green-200/50"
                      : "text-slate-500 hover:bg-slate-50 hover:text-green-600"
                  }`}
                >
                  <Icon name={item.icon} className={`h-6 w-6 shrink-0 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`} />
                  <span className={`text-sm tracking-tight transition-all duration-300 overflow-hidden whitespace-nowrap ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100 font-bold"}`}>
                    {item.label}
                  </span>
                  {!collapsed && active && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer / Logout Only */}
          <div className="p-4 mt-auto">
            <button
              onClick={() => {
                sessionStorage.removeItem("admin_auth");
                router.replace("/admin/login");
              }}
              className={`w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-black text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm ${collapsed ? "px-0" : "px-4"}`}
              title="Đăng xuất"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              {!collapsed && <span>ĐĂNG XUẤT</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 rounded-2xl bg-slate-50 text-slate-600 md:hidden hover:bg-slate-100 transition-all border border-slate-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <span className="hidden sm:inline">Hệ thống quản trị DUA Edu</span>
                <span className="sm:hidden">DUA Admin</span>
                <span className="px-2 py-0.5 rounded-lg bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest border border-green-100">V2.0</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-black text-slate-900 tracking-tight">{adminName || "Đang tải..."}</span>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-[0.2em]">{adminRole || "DuaData Cloud"}</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-black shadow-xl shadow-green-100 hover:scale-105 transition-all cursor-pointer">
              {adminName?.charAt(0) || "A"}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide bg-[#f8fafc]">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}

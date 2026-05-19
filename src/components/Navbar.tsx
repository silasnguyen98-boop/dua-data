"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import BrandLogo from "@/components/BrandLogo";

interface UpcomingCourse {
  slug: string;
  title: string;
  startDate: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [upcoming, setUpcoming] = useState<UpcomingCourse | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const authLoading = status === "loading";

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((courses: UpcomingCourse[]) => {
        const now = new Date();
        const future = courses
          .filter((c) => new Date(c.startDate) > now)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        if (future.length > 0) {
          setUpcoming(future[0]);
          setDaysLeft(
            Math.ceil((new Date(future[0].startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          );
        }
      })
      .catch(() => {});
  }, []);



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && !target.closest("[data-auth-menu]")) {
        setAuthMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userDisplayName = useMemo(() => {
    const name = session?.user?.name;
    const email = session?.user?.email || "";
    return name || email.split("@")[0] || "Tài khoản";
  }, [session]);

  const userAvatarUrl = useMemo(() => {
    return session?.user?.image || "";
  }, [session]);

  const userInitial = useMemo(() => {
    const firstChar = userDisplayName.trim().charAt(0);
    return firstChar ? firstChar.toUpperCase() : "U";
  }, [userDisplayName]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
    setAuthMenuOpen(false);
  };

  const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/courses", label: "Khóa học" },
    { href: "/roadmap", label: "Lộ trình" },
    { href: "/resource", label: "Tài nguyên" },
    { href: "/community", label: "Cộng đồng" },
    { href: "/genzlamdata", label: "GenZ làm Data" }
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Upcoming Course — Collapsible Side-Tab Notification */}
      {upcoming && !dismissed && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[100] group">
          <div className="relative flex items-start h-[180px]">
            {/* The Trigger Tab (Expands Vertically) */}
            <div className="w-14 bg-orange-500 rounded-r-2xl group-hover:rounded-r-none shadow-lg flex flex-col items-center pt-5 cursor-pointer relative z-30 transition-all duration-500 ease-in-out h-16 group-hover:h-[180px] overflow-hidden">
              <div className="relative flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              </div>

              {/* Vertical Text — Slides up on hover */}
              <div className="transition-all duration-700 delay-100 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="[writing-mode:vertical-lr] text-[11px] font-black text-white uppercase tracking-[0.25em] whitespace-nowrap">
                  Còn {daysLeft} ngày
                </span>
              </div>
            </div>

            {/* The Main Content Card — Slides out horizontally */}
            <div className="h-[180px] bg-white shadow-[20px_10px_60px_rgba(0,0,0,0.15)] border border-gray-100 rounded-r-[32px] flex items-center overflow-hidden transition-all duration-700 ease-in-out w-0 group-hover:w-[380px] sm:group-hover:w-[420px] relative -ml-14 z-10">
              <div className="min-w-[380px] sm:min-w-[420px] pl-20 pr-10 py-4 flex items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Sắp khai giảng</span>
                  </div>
                  <h4 className="text-[14px] font-black text-gray-900 line-clamp-2 leading-tight tracking-tight mb-4 pr-4">
                    {upcoming.title}
                  </h4>
                  <Link
                    href={`/courses/${upcoming.slug}`}
                    className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <BrandLogo
              href="/"
              showText={false}
              imageClassName="h-20 w-20"
            />

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-5 lg:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs lg:text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-green-700 border-b-2 border-green-600 pb-1"
                      : "text-gray-600 hover:text-green-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block relative" data-auth-menu>
                {authLoading ? (
                  <div className="h-10 w-24 rounded-full bg-gray-100 animate-pulse" />
                ) : session?.user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setAuthMenuOpen((value) => !value)}
                      className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-sm hover:border-emerald-300 hover:shadow transition"
                    >
                      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-500 to-green-400 text-xs font-bold text-white">
                        {userAvatarUrl ? (
                          <img
                            src={userAvatarUrl}
                            alt={userDisplayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          userInitial
                        )}
                      </span>
                      <span className="max-w-28 truncate text-sm font-medium text-gray-700">
                        {userDisplayName}
                      </span>
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {authMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl shadow-gray-200/70">
                        <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2">
                          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-500 to-green-400 text-sm font-bold text-white">
                            {userAvatarUrl ? (
                              <img
                                src={userAvatarUrl}
                                alt={userDisplayName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              userInitial
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{userDisplayName}</p>
                            <p className="truncate text-xs text-gray-500">{session?.user?.email}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="mt-3 w-full rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={`/login?next=${encodeURIComponent(pathname)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 transition"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.655 32.659 29.348 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.956 3.043l5.657-5.657C34.041 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
                      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c3.059 0 5.842 1.154 7.956 3.043l5.657-5.657C34.041 6.053 29.268 4 24 4c-7.682 0-14.35 4.335-17.694 10.691z"/>
                      <path fill="#4CAF50" d="M24 44c5.203 0 9.892-1.992 13.409-5.239l-6.196-5.238C29.198 35.091 26.782 36 24 36c-5.327 0-9.621-3.315-11.294-7.946l-6.522 5.025C9.495 39.556 16.227 44 24 44z"/>
                      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.017 2.862-3.017 5.141-5.49 6.523l.004-.003 6.196 5.238C35.668 39.999 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"/>
                    </svg>
                    Đăng nhập
                  </Link>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 text-gray-600 hover:text-green-700"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden pb-4 border-t border-gray-100">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-3 px-4 text-sm font-medium ${
                    isActive(link.href) ? "text-green-700 bg-emerald-50" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="px-4 pt-3">
                {session?.user ? (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-500 to-green-400 text-sm font-bold text-white">
                        {userAvatarUrl ? (
                          <img
                            src={userAvatarUrl}
                            alt={userDisplayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          userInitial
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{userDisplayName}</p>
                        <p className="truncate text-xs text-gray-500">{session?.user?.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold text-red-600 border border-red-100"
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <Link
                    href={`/login?next=${encodeURIComponent(pathname)}`}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.655 32.659 29.348 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.956 3.043l5.657-5.657C34.041 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
                      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c3.059 0 5.842 1.154 7.956 3.043l5.657-5.657C34.041 6.053 29.268 4 24 4c-7.682 0-14.35 4.335-17.694 10.691z"/>
                      <path fill="#4CAF50" d="M24 44c5.203 0 9.892-1.992 13.409-5.239l-6.196-5.238C29.198 35.091 26.782 36 24 36c-5.327 0-9.621-3.315-11.294-7.946l-6.522 5.025C9.495 39.556 16.227 44 24 44z"/>
                      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.017 2.862-3.017 5.141-5.49 6.523l.004-.003 6.196 5.238C35.668 39.999 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"/>
                    </svg>
                    Đăng nhập Google
                  </Link>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>
    </>
  );
}

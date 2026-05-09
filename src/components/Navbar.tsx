"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import BrandLogo from "@/components/BrandLogo";
import { createClient } from "@/lib/supabase-client";

interface UpcomingCourse {
  slug: string;
  title: string;
  startDate: string;
}

type SessionUser = {
  id: string;
  email: string | null;
  name: string;
  avatarUrl: string;
};

export default function Navbar() {
  const pathname = usePathname();
  const [upcoming, setUpcoming] = useState<UpcomingCourse | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);

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
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthMenuOpen(false);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
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
    const metadata = session?.user.user_metadata || {};
    return metadata.full_name || metadata.name || session?.user.email?.split("@")[0] || "Tài khoản";
  }, [session]);

  const userAvatarUrl = useMemo(() => {
    const metadata = session?.user.user_metadata || {};
    return metadata.avatar_url || metadata.picture || metadata.picture_url || "";
  }, [session]);

  const userInitial = useMemo(() => {
    const firstChar = userDisplayName.trim().charAt(0);
    return firstChar ? firstChar.toUpperCase() : "U";
  }, [userDisplayName]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSession(null);
    setAuthMenuOpen(false);
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/courses", label: "Khóa học" },
    { href: "/roadmap", label: "Lộ trình" },
    { href: "/resource", label: "Tài nguyên" },
    { href: "/community", label: "Cộng đồng"}
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Upcoming Course Banner */}
      {upcoming && !dismissed && (
        <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%221%22%20fill%3D%22white%22%20opacity%3D%220.1%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-4 relative text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span className="font-semibold">Sắp khai giảng!</span>
            </span>
            <span className="hidden sm:inline">
              <strong>{upcoming.title}</strong> — khai giảng trong{" "}
              <span className="bg-white/20 px-2 py-0.5 rounded font-bold">{daysLeft} ngày</span>
            </span>
            <Link
              href={`/courses/${upcoming.slug}`}
              className="bg-white text-green-700 px-4 py-1 rounded-full text-xs font-bold hover:bg-green-50 transition shadow-sm"
            >
              Xem ngay
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="absolute right-4 text-white/70 hover:text-white transition"
              aria-label="Dismiss"
            >
              ✕
            </button>
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
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
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
                ) : session ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setAuthMenuOpen((value) => !value)}
                      className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-sm hover:border-green-300 hover:shadow transition"
                    >
                      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-xs font-bold text-white">
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
                          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-sm font-bold text-white">
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
                            <p className="truncate text-xs text-gray-500">{session.user.email}</p>
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
                    className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 transition"
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
                    isActive(link.href) ? "text-green-700 bg-green-50" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="px-4 pt-3">
                {session ? (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-sm font-bold text-white">
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
                        <p className="truncate text-xs text-gray-500">{session.user.email}</p>
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  const navLinks = [
    { href: "/khoahoc", label: "Khóa học" },
    { href: "/roadmap", label: "Lộ trình" },
    { href: "/resource", label: "Tài nguyên" },
    { href: "/community", label: "Cộng đồng" },
  ];

  const isActive = (href: string) => {
    if (href === "/khoahoc") return pathname === "/khoahoc" || pathname.startsWith("/courses");
    return pathname.startsWith(href);
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
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🍍</span>
              <span className="text-xl font-bold text-green-700 font-display">Dứa Data</span>
            </Link>

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
            </div>
          )}
        </nav>
      </header>
    </>
  );
}

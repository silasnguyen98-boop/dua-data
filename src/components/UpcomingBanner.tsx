"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Course {
  id: string;
  slug: string;
  title: string;
  startDate: string;
  category: string;
}

export default function UpcomingBanner() {
  const [upcoming, setUpcoming] = useState<Course | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((courses: Course[]) => {
        const now = new Date();
        const future = courses
          .filter((c) => new Date(c.startDate) > now)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        if (future.length > 0) {
          setUpcoming(future[0]);
          const diff = Math.ceil(
            (new Date(future[0].startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          setDaysLeft(diff);
        }
      })
      .catch(() => {});
  }, []);

  if (!upcoming || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%221%22%20fill%3D%22white%22%20opacity%3D%220.1%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-4 relative text-sm">
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
  );
}

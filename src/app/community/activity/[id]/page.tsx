"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Activity {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  community: "student" | "genz";
  registrationLink: string;
  registrationDeadline: string;
  eventDate: string;
  author: string;
  published: boolean;
  createdAt: string;
}

function isNotExpired(deadline: string): boolean {
  if (!deadline) return true;
  return new Date(deadline) >= new Date();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ActivityDetailPage() {
  const params = useParams();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activities")
      .then(r => r.json())
      .then((acts: Activity[]) => {
        const found = acts.find(a => a.id === params.id);
        setActivity(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400">Đang tải...</div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-300 mb-4">Không tìm thấy hoạt động</p>
          <Link href="/community" className="text-green-600 hover:text-green-700 font-medium">
            ← Quay lại cộng đồng
          </Link>
        </div>
      </div>
    );
  }

  const eventPassed = activity.eventDate && new Date(activity.eventDate) < new Date();
  const canRegister = activity.registrationLink && isNotExpired(activity.registrationDeadline) && !eventPassed;
  const communityLabel = activity.community === "student" ? "Cộng đồng học viên" : "GenZ làm Data";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero image */}
      {activity.imageUrl && (
        <div className="w-full h-64 md:h-96 relative overflow-hidden">
          <img src={activity.imageUrl} alt={activity.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Article content */}
      <article className="max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/community" className="hover:text-green-600 transition">Cộng đồng</Link>
          <span>/</span>
          <span>{communityLabel}</span>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-xs font-medium bg-green-50 text-green-600 px-3 py-1.5 rounded-full">
            {communityLabel}
          </span>
          {eventPassed ? (
            <span className="text-xs font-medium bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full">Đã diễn ra</span>
          ) : (
            <span className="text-xs font-medium bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full animate-pulse">Sắp diễn ra</span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {activity.title}
        </h1>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
          {activity.author && <span>✍️ {activity.author}</span>}
          {activity.eventDate && <span>📅 Ngày diễn ra: {formatDate(activity.eventDate)}</span>}
          {activity.registrationDeadline && (
            <span>⏰ Hạn đăng ký: {formatDate(activity.registrationDeadline)}</span>
          )}
          <span>🕐 Đăng ngày: {formatDate(activity.createdAt)}</span>
        </div>

        {/* Summary */}
        {activity.summary && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-r-xl px-6 py-4 mb-8">
            <p className="text-gray-700 font-medium leading-relaxed">{activity.summary}</p>
          </div>
        )}

        {/* Content */}
        {activity.content && (
          <div
            className="prose prose-lg max-w-none mb-10 text-gray-700 leading-relaxed
              prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:mb-4 prose-ul:mb-4 prose-ol:mb-4
              prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: activity.content }}
          />
        )}

        {/* CTA */}
        {canRegister && (
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-2xl p-8 text-center mb-10">
            <h3 className="text-xl font-bold text-white mb-3">Đăng ký tham gia ngay!</h3>
            <p className="text-green-100 mb-5">Hạn đăng ký: {formatDate(activity.registrationDeadline)}</p>
            <a
              href={activity.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-white text-green-700 font-bold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:bg-green-50 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Đăng ký ngay
            </a>
          </div>
        )}

        {/* Back link */}
        <Link
          href="/community"
          className="inline-flex items-center text-green-600 font-medium hover:text-green-700 transition"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Quay lại cộng đồng
        </Link>
      </article>

      <Footer />
    </div>
  );
}

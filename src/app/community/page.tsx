"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useMemo, useState } from "react";

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

const ITEMS_PER_PAGE = 9;

function isRegistrationExpired(deadline: string): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) return false;
  deadlineDate.setHours(23, 59, 59, 999);
  return deadlineDate < new Date();
}

function isEventPassed(eventDate: string): boolean {
  if (!eventDate) return false;
  const date = new Date(eventDate);
  if (isNaN(date.getTime())) return false;
  date.setHours(23, 59, 59, 999);
  return date < new Date();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "Sắp diễn ra";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Sắp diễn ra";
  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const ActivityCard = ({ activity, index }: { activity: Activity; index: number }) => {
  if (!activity) return null;

  const expiredRegistration = isRegistrationExpired(activity.registrationDeadline);
  const eventPassed = isEventPassed(activity.eventDate);
  const canRegister = Boolean(activity.registrationLink) && !expiredRegistration;

  return (
    <div
      className="group relative bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl hover:border-emerald-100 hover:-translate-y-2 transition-all duration-500 flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 duration-700"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute top-6 left-6 z-20 flex flex-wrap gap-2">
        {eventPassed && (
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-slate-900 text-white px-3 py-1.5 rounded-full shadow-sm border border-white/20 backdrop-blur-md">
            Đã diễn ra
          </span>
        )}
      </div>

      <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
        {activity.imageUrl ? (
          <img
            src={activity.imageUrl}
            alt={activity.title || "Activity"}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">🎯</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
      </div>

      <div className="p-8 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
            activity.community === "student" ? "text-emerald-600" : "text-amber-500"
          }`}>
            {activity.community === "student" ? "Học viên DUA Edu" : "GenZ Làm Data"}
          </span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            {formatDate(activity.eventDate)}
          </span>
        </div>

        <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors duration-300 mb-4 leading-tight tracking-tight line-clamp-2">
          {activity.title || "Hoạt động cộng đồng"}
        </h3>

        <p className="text-sm text-slate-500 mb-8 line-clamp-3 leading-relaxed">
          {activity.summary || ""}
        </p>

        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between gap-4">
          <Link
            href={`/community/activity/${activity.id || ""}`}
            className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl text-center transition hover:bg-slate-800"
          >
            Chi tiết
          </Link>
          {canRegister && (
            <a
              href={activity.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-4 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl text-center transition hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
            >
              Đăng ký
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CommunityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showStudentModal, setShowStudentModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/activities")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const publishedActivities = Array.isArray(data)
          ? data.filter((activity: any) => activity && activity.published)
          : [];
        setActivities(publishedActivities);
      })
      .catch(() => {
        if (isMounted) setActivities([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const sortedActivities = useMemo(() => {
    if (!Array.isArray(activities)) return [];
    return [...activities].sort((a, b) => {
      const aExpired = isRegistrationExpired(a.registrationDeadline);
      const bExpired = isRegistrationExpired(b.registrationDeadline);
      if (aExpired !== bExpired) return aExpired ? 1 : -1;
      const aTime = new Date(a.eventDate || a.createdAt || 0).getTime();
      const bTime = new Date(b.eventDate || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [activities]);

  const totalPages = Math.max(1, Math.ceil(sortedActivities.length / ITEMS_PER_PAGE));
  const paginatedActivities = useMemo(() => {
    return sortedActivities.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [sortedActivities, currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {showStudentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowStudentModal(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.06)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 border border-slate-100">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M60%2060H0V0h60v60zM1%2059V1h58v58H1z%22%20fill%3D%22%2310b981%22%20fill-opacity%3D%220.02%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none" />
            <button
              onClick={() => setShowStudentModal(false)}
              className="absolute top-6 right-6 p-3 text-slate-300 hover:text-slate-900 transition-colors z-20 group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative z-10 p-12 md:p-16 flex flex-col items-center text-center space-y-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100/50">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Student Only</span>
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight">
                    Đặc quyền dành cho <br />
                    <span className="text-emerald-500">Học viên DUA Edu</span>
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Không gian thảo luận chuyên sâu và hỗ trợ trực tiếp dành riêng cho các bạn học viên tại Dứa.
                  </p>
                </div>
              </div>
              <div className="w-full space-y-4">
                {["Thảo luận chuyên môn 1:1", "Kho tài liệu thực chiến bí mật", "Hỗ trợ trực tiếp từ Mentors"].map((item) => (
                  <div key={item} className="flex items-center justify-center gap-3 text-[11px] font-medium text-slate-600">
                    <div className="w-1 h-1 rounded-full bg-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="w-full pt-4">
                <Link
                  href="/courses"
                  className="flex items-center justify-center w-full py-5 bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.15)] hover:bg-emerald-600 transition-all hover:-translate-y-1 active:scale-95"
                >
                  Khám phá khóa học ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-20 pt-32">
        <div className="flex items-center justify-between mb-16">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Hoạt động mới nhất</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Latest Updates</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-6" />
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Đang kết nối cộng đồng...</p>
          </div>
        ) : sortedActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 bg-slate-50 rounded-[48px] border border-dashed border-slate-200">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm mb-6 animate-bounce">🌊</div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Đại dương đang nghỉ ngơi...</h3>
            <p className="text-slate-500">Hãy quay lại sau để cập nhật những hoạt động mới nhất từ DUA Edu nhé!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {paginatedActivities.map((activity, index) => (
                <ActivityCard key={activity.id} activity={activity} index={index} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-20 flex items-center justify-center gap-4">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-12 h-12 rounded-2xl border border-slate-100 flex items-center justify-center transition-all hover:border-emerald-200 hover:bg-emerald-50 disabled:opacity-20 disabled:pointer-events-none"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-12 h-12 rounded-2xl text-sm font-bold flex items-center justify-center transition-all ${
                        currentPage === p ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" : "border border-slate-50 text-slate-400 hover:border-emerald-200 hover:text-emerald-600"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-12 h-12 rounded-2xl border border-slate-100 flex items-center justify-center transition-all hover:border-emerald-200 hover:bg-emerald-50 disabled:opacity-20 disabled:pointer-events-none"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <section className="relative py-48 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M40%2040H0V0h40v40zM1%2039V1h38v38H1z%22%20fill%3D%22%2310b981%22%20fill-opacity%3D%220.05%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight max-w-4xl mx-auto mb-16 tracking-tighter">
            Cộng đồng của <br />
            <span className="text-emerald-500">DUA Edu.</span>
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a
              href="https://www.facebook.com/groups/genzlamdata"
              target="_blank"
              rel="noopener noreferrer"
              className="px-14 py-6 bg-emerald-500 text-white font-bold text-sm rounded-full shadow-[0_20px_40px_rgba(16,185,129,0.15)] hover:bg-emerald-600 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center uppercase tracking-[0.2em]"
            >
              Cộng đồng Data
            </a>
            <button
              onClick={() => setShowStudentModal(true)}
              className="px-14 py-6 bg-slate-900 text-white font-bold text-sm rounded-full shadow-[0_20px_40px_rgba(15,23,42,0.1)] hover:bg-slate-800 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center uppercase tracking-[0.2em]"
            >
              Cộng đồng học viên
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

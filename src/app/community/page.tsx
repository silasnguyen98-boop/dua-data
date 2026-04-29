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
  if (!dateStr) return "Chưa cập nhật";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Chưa cập nhật";

  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const communityStats = [
  { label: "Thành viên", value: "70K+", icon: "👥", color: "from-green-500 to-emerald-500" },
  { label: "Hoạt động", value: "50+", icon: "🎯", color: "from-teal-500 to-green-600" },
  { label: "Workshop & sự kiện", value: "30+", icon: "📅", color: "from-emerald-500 to-green-700" },
  { label: "Học viên thành công", value: "300+", icon: "🏆", color: "from-amber-400 to-orange-500" },
];

function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  const expiredRegistration = isRegistrationExpired(activity.registrationDeadline);
  const eventPassed = isEventPassed(activity.eventDate);
  const canRegister = Boolean(activity.registrationLink) && !expiredRegistration;

  return (
    <div
      className="group relative bg-white border border-green-100 rounded-2xl overflow-hidden shadow-md shadow-green-100/40 hover:shadow-xl hover:shadow-green-100/70 hover:-translate-y-1 transition-all duration-300"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        {expiredRegistration ? (
          <span className="bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
            Đã quá hạn đăng ký
          </span>
        ) : (
          <span className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
            Đang mở đăng ký
          </span>
        )}

        {eventPassed && (
          <span className="bg-gray-100 border border-gray-200 text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
            Đã diễn ra
          </span>
        )}
      </div>

      {activity.imageUrl ? (
        <div className="h-48 overflow-hidden relative bg-green-50">
          <img
            src={activity.imageUrl}
            alt={activity.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-green-100 via-emerald-50 to-white flex items-center justify-center">
          <span className="text-5xl">🎯</span>
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
              activity.community === "student"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {activity.community === "student" ? "Cộng đồng học viên" : "GenZ làm Data"}
          </span>

          {activity.eventDate && (
            <span className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
              📅 {formatDate(activity.eventDate)}
            </span>
          )}
        </div>

        <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-green-700 transition-colors line-clamp-2">
          {activity.title}
        </h3>

        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-5">
          {activity.summary}
        </p>

        <div className="space-y-2 text-xs text-gray-500 mb-5">
          {activity.registrationDeadline && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
              <span>Hạn đăng ký</span>
              <span className={expiredRegistration ? "font-bold text-red-600" : "font-bold text-green-700"}>
                {formatDate(activity.registrationDeadline)}
              </span>
            </div>
          )}

          {expiredRegistration && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-red-600 font-medium">
              Hoạt động này đã quá hạn đăng ký, nhưng bạn vẫn có thể xem thông tin chi tiết.
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/community/activity/${activity.id}`}
            className="inline-flex items-center justify-center bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-green-200/60 hover:from-green-700 hover:to-emerald-600 transition-all"
          >
            Xem chi tiết
            <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {canRegister ? (
            <a
              href={activity.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-green-700 bg-green-50 text-sm font-bold px-4 py-2.5 rounded-xl border border-green-200 hover:bg-green-100 transition-all"
            >
              Đăng ký
              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <span className="inline-flex items-center justify-center text-gray-500 bg-gray-100 text-sm font-bold px-4 py-2.5 rounded-xl border border-gray-200">
              Đã đóng đăng ký
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch("/api/activities")
      .then((res) => res.json())
      .then((data) => {
        const publishedActivities = Array.isArray(data)
          ? data.filter((activity: Activity) => activity.published)
          : [];

        setActivities(publishedActivities);
      })
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      const aExpired = isRegistrationExpired(a.registrationDeadline);
      const bExpired = isRegistrationExpired(b.registrationDeadline);

      if (aExpired !== bExpired) return aExpired ? 1 : -1;

      const aTime = new Date(a.eventDate || a.createdAt).getTime();
      const bTime = new Date(b.eventDate || b.createdAt).getTime();

      return bTime - aTime;
    });
  }, [activities]);

  const totalPages = Math.max(1, Math.ceil(sortedActivities.length / ITEMS_PER_PAGE));
  const paginatedActivities = sortedActivities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [activities.length]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">
              Community Activities
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Hoạt động cộng đồng
            </h1>
          </div>

          <div className="rounded-2xl bg-green-50 border border-green-100 px-5 py-3">
            <p className="text-2xl font-black text-green-700">{sortedActivities.length}</p>
            <p className="text-xs font-medium text-green-700">hoạt động đang hiển thị</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 text-gray-500">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang tải hoạt động...
            </div>
          </div>
        ) : sortedActivities.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-green-200 bg-green-50/50 py-16 text-center">
            <p className="text-4xl mb-4">🎯</p>
            <p className="text-xl font-bold text-gray-700 mb-2">Chưa có hoạt động nào</p>
            <p className="text-sm text-gray-500">Hãy quay lại sau để xem các hoạt động mới từ DUA Edu.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedActivities.map((activity, index) => (
                <ActivityCard key={activity.id} activity={activity} index={index} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-green-100 bg-white text-sm font-bold text-green-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-50 transition"
                >
                  Trước
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition ${
                        currentPage === page
                          ? "bg-green-700 text-white shadow-lg shadow-green-200"
                          : "bg-white text-green-700 border border-green-100 hover:bg-green-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-green-100 bg-white text-sm font-bold text-green-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-50 transition"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 mt-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='white' opacity='0.3'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute -top-24 left-10 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-20 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-green-100 mb-3">
            DUA Edu Community
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Cộng đồng học Data
            <br />
            <span className="text-green-200">cùng phát triển thật</span>
          </h2>
          <p className="text-lg text-green-100 max-w-2xl mx-auto leading-relaxed">
            Tham gia các hoạt động, workshop và buổi chia sẻ từ DUA Edu để học sâu hơn,
            kết nối tốt hơn và đi xa hơn trong hành trình Data.
          </p>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {communityStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/12 backdrop-blur-sm rounded-2xl border border-white/20 p-5 text-center"
              >
                <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl shadow-md`}>
                  {stat.icon}
                </div>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-green-100 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

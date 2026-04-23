"use client";

import Link from "next/link";
import CourseImage from "./CourseImage";

interface Course {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  price: number;
  originalPrice: number;
  discount: number;
  startDate: string;
  endDate?: string;
  registrationDeadline?: string;
  imageUrl?: string;
  image?: string;
  category: string;
  totalLessons: number;
  students: number;
  rating: number;
  reviews: number;
  hours: string;
  schedule: string;
  instructor: string;
  targetAudience?: string[];
  outcomes?: string[];
  comingSoon?: boolean;
}

function formatPrice(price: number) {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function getCourseStatus(startDate: string, endDate?: string, registrationDeadline?: string): "expired" | "ended" | "upcoming" | "ongoing" {
  if (!startDate) return "upcoming";
  try {
    const now = new Date();
    if (registrationDeadline) {
      const deadline = new Date(registrationDeadline);
      if (!isNaN(deadline.getTime()) && deadline < now) return "expired";
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime()) && end < now) return "ended";
    }
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return "upcoming";
    if (start > now) return "upcoming";
    return "ongoing";
  } catch {
    return "upcoming";
  }
}

export default function CourseCard({ course, index }: { course: Course; index: number }) {
  // Coming Soon mode
  if (course.comingSoon) {
    return (
      <div
        className="relative bg-white rounded-2xl overflow-hidden animate-fade-in-up shadow-[0_4px_24px_rgba(0,0,0,0.1)] flex flex-col h-full cursor-default opacity-80"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        {/* Image section */}
        <div className="aspect-video relative overflow-hidden">
          {course.imageUrl ? (
            <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover grayscale" />
          ) : (
            <CourseImage type={course.image || "python"} size="lg" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Content section */}
        <div className="p-5 flex flex-col flex-1 items-center justify-center text-center">
          <h3 className="font-bold text-gray-900 text-lg leading-snug mb-3 line-clamp-2">
            {course.title}
          </h3>
          <span className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Coming Soon
          </span>
        </div>
      </div>
    );
  }

  const status = getCourseStatus(course.startDate || "", course.endDate, course.registrationDeadline);
  const isUpcoming = status === "upcoming";
  const isEnded = status === "ended";
  const isExpired = status === "expired";
  const isFree = (course.price || 0) === 0;

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden animate-fade-in-up shadow-[0_4px_24px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_40px_rgba(22,163,74,0.2)] transition-all duration-500 hover:-translate-y-2 flex flex-col h-full"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image section */}
      <div className="aspect-video relative overflow-hidden">
        {course.imageUrl ? (
          <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <CourseImage type={course.image || "python"} size="lg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3 z-10">
          {isExpired && (
            <span className="text-xs font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-1.5 rounded-full shadow-lg">
              Hết hạn đăng ký
            </span>
          )}
          {isEnded && (
            <span className="text-xs font-bold bg-gray-500 text-white px-3 py-1.5 rounded-full shadow-lg">
              Đã kết thúc
            </span>
          )}
          {isUpcoming && (
            <span className="text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Sắp khai giảng
            </span>
          )}
          {status === "ongoing" && (
            <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1.5 rounded-full shadow-lg">
              Đang diễn ra
            </span>
          )}
        </div>

        {/* Bottom overlay info on image */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <span className="text-white text-sm font-medium drop-shadow-md">{course.instructor || "Dứa Data"}</span>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-bold text-gray-900 text-lg leading-snug mb-3 line-clamp-2 group-hover:text-green-700 transition-colors">
          {course.title}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
            <span className="font-semibold text-gray-700">{course.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>{course.students} học viên</span>
          </div>
        </div>

        {/* Price section */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-end justify-between">
            <div>
              {(course.originalPrice || 0) > (course.price || 0) && (course.originalPrice || 0) > 0 && (
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(course.originalPrice)}
                  </span>
                  <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                    Giảm {course.discount || 0}%
                  </span>
                </div>
              )}
              <span className={`text-xl font-extrabold ${isFree ? "text-green-600" : "bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"}`}>
                {isFree ? "Miễn phí" : ((course.originalPrice || 0) > (course.price || 0) ? "Chỉ còn " : "")}{!isFree && formatPrice(course.price || 0)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {new Date(course.startDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </div>
          </div>
        </div>

      </div>

      {/* Hover overlay with full details */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-900/95 via-green-800/95 to-emerald-900/95 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-between p-6 z-20">
        <div>
          <h3 className="font-bold text-white text-lg mb-3 line-clamp-2">{course.title}</h3>
          <p className="text-green-100 text-sm mb-4 line-clamp-2">{course.shortDescription || course.description || ""}</p>

          <div className="space-y-2 text-sm text-green-100">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span>Giảng viên: <strong className="text-white">{course.instructor || "Dứa Data"}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-300 flex-shrink-0 fill-yellow-300" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
              <span><strong className="text-white">{course.rating}</strong> ({course.reviews} đánh giá)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              <span><strong className="text-white">{course.totalLessons}</strong> bài giảng</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{course.hours} — {course.schedule}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>Khai giảng: <strong className="text-white">{new Date(course.startDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</strong></span>
            </div>
            {course.targetAudience && course.targetAudience.length > 0 && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Đối tượng: <strong className="text-white">{course.targetAudience.slice(0, 2).join(", ")}</strong></span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <div className="text-center mb-2">
            <span className={`text-2xl font-extrabold ${isFree ? "text-green-300" : "text-white"}`}>
              {isFree ? "Miễn phí" : formatPrice(course.price || 0)}
            </span>
            {(course.originalPrice || 0) > (course.price || 0) && !isFree && (
              <span className="text-green-300 text-sm line-through ml-2">{formatPrice(course.originalPrice || 0)}</span>
            )}
          </div>
          <Link
            href={`/courses/${course.slug}`}
            className="flex items-center justify-center bg-white text-green-800 font-bold py-3 rounded-xl hover:bg-green-50 transition-all text-sm shadow-lg"
          >
            Xem chi tiết và đăng ký
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

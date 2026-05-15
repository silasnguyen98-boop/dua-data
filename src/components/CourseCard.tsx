"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, Users, ArrowRight } from "lucide-react";
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
  hidePrice?: boolean;
}

function formatPrice(price: number) {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function getCourseStatus(
  startDate: string,
  endDate?: string,
  registrationDeadline?: string
): "expired" | "ended" | "upcoming" | "ongoing" {
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

export default function CourseCard({
  course,
  index,
}: {
  course: Course;
  index: number;
}) {
  if (course.comingSoon) {
    return (
      <div
        className="relative bg-white rounded-2xl overflow-hidden animate-fade-in-up shadow-[0_4px_24px_rgba(0,0,0,0.1)] flex flex-col h-full cursor-default opacity-80"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="aspect-video relative overflow-hidden">
          {course.imageUrl ? (
            <img
              src={course.imageUrl}
              alt={course.title}
              className="w-full h-full object-cover grayscale"
            />
          ) : (
            <CourseImage type={course.image || "python"} size="lg" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        <div className="p-5 flex flex-col flex-1 items-center justify-center text-center">
          <h3 className="font-bold text-gray-900 text-lg leading-snug mb-3 line-clamp-2">
            {course.title}
          </h3>
          <span className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-orange-500 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Coming Soon
          </span>
        </div>
      </div>
    );
  }

  const status = getCourseStatus(
    course.startDate || "",
    course.endDate,
    course.registrationDeadline
  );

  const isUpcoming = status === "upcoming";
  const isEnded = status === "ended";
  const isExpired = status === "expired";
  const isFree = (course.price || 0) === 0;
  const shouldHidePrice = course.hidePrice === true;
  const hasDiscount = !shouldHidePrice && (course.originalPrice || 0) > (course.price || 0);
  const displayPrice = shouldHidePrice ? "Liên hệ tư vấn" : formatPrice(course.price);

  return (
    <div
      className="group relative flex h-full min-h-[460px] flex-col overflow-hidden rounded-[40px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(0,0,0,0.06)]"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {course.imageUrl ? (
          <Image
            src={course.imageUrl}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <CourseImage type={course.image || "python"} size="lg" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/40 to-transparent opacity-60" />

        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
          {isUpcoming && (
            <div className="px-3 py-1.5 rounded-full bg-amber-400/90 backdrop-blur-md text-amber-950 text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 border border-white/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-900 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-900" />
              </span>
              Sắp khai giảng
            </div>
          )}
          {status === "ongoing" && (
            <div className="px-3 py-1.5 rounded-full bg-green-500/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest shadow-lg border border-white/20">
              Đang diễn ra
            </div>
          )}
          {(isEnded || isExpired) && (
            <div className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-100 text-[9px] font-black uppercase tracking-widest shadow-lg border border-white/10">
              Đã kết thúc
            </div>
          )}
        </div>
      </div>

      <div className="p-7 flex flex-col flex-1">
        <h3 className="mb-4 line-clamp-2 text-lg font-black leading-tight text-gray-900 transition-colors group-hover:text-green-600 tracking-tight">
          {course.title}
        </h3>

        <div className="flex items-center gap-5 text-gray-400 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center">
              <BookOpen className="h-3 w-3 text-green-500" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{course.totalLessons} bài</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center">
              <Users className="h-3 w-3 text-green-500" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{course.students} Học viên</span>
          </div>
        </div>

        <div className="mt-auto border-t border-gray-50 pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {hasDiscount && (
                <div className="text-[10px] font-bold text-gray-400 line-through mb-0.5">
                  {formatPrice(course.originalPrice)}
                </div>
              )}
              <div className={`font-black text-green-500 tracking-tighter whitespace-nowrap truncate ${shouldHidePrice ? "text-base" : "text-xl"}`}>
                {displayPrice}
              </div>
            </div>

            <Link
              href={`/courses/${course.slug}`}
              className="group/btn relative flex h-11 px-5 items-center justify-center rounded-xl bg-green-500 text-white shadow-[0_8px_20px_rgba(34,197,94,0.2)] transition-all duration-500 hover:bg-gray-900 hover:shadow-[0_15px_30px_rgba(17,24,39,0.3)] hover:-translate-y-1 active:scale-95 flex-shrink-0"
            >
              <span className="text-[10px] font-black uppercase tracking-widest mr-2">Chi tiết</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover/btn:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

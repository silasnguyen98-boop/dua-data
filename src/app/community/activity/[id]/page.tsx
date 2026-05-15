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
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(23, 59, 59, 999);
  return deadlineDate >= new Date();
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
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <div className="text-center space-y-6">
          <div className="text-8xl font-black text-slate-100">404</div>
          <p className="text-slate-500 font-medium">Hoạt động này hiện không tồn tại...</p>
          <Link href="/community" className="inline-flex px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm transition hover:scale-105 active:scale-95">
            ← Quay về cộng đồng
          </Link>
        </div>
      </div>
    );
  }

  const eventPassed = activity.eventDate && new Date(activity.eventDate) < new Date();
  const canRegister = activity.registrationLink && isNotExpired(activity.registrationDeadline) && !eventPassed;
  const communityLabel = activity.community === "student" ? "Cộng đồng học viên" : "GenZ làm Data";

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* BREADCRUMBS */}
      <div className="bg-slate-50/50 pt-32 pb-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          <Link href="/" className="transition hover:text-emerald-600">Home</Link>
          <span className="opacity-30">/</span>
          <Link href="/community" className="transition hover:text-emerald-600">Community</Link>
          <span className="opacity-30">/</span>
          <span className="text-emerald-600 truncate max-w-[150px]">{activity.id}</span>
        </div>
      </div>

      <main className="pb-32">
        {/* HERO HEADER */}
        <section className="bg-slate-50/50 pt-10 pb-20">
          <div className="max-w-4xl mx-auto px-6 space-y-8 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
               <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500 text-white px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/20">
                 {communityLabel}
               </span>
               {eventPassed ? (
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-200 text-slate-500 px-4 py-1.5 rounded-full">Đã diễn ra</span>
               ) : (
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white text-emerald-600 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">Sắp diễn ra</span>
               )}
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
              {activity.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-8 border-t border-slate-200">
               {activity.eventDate && (
                 <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 leading-none mb-1">{formatDate(activity.eventDate)}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Date</span>
                 </div>
               )}
               <div className="w-px h-6 bg-slate-200 hidden md:block" />
               {activity.registrationDeadline && (
                 <div className="flex flex-col">
                    <span className={`text-xs font-black leading-none mb-1 ${!isNotExpired(activity.registrationDeadline) ? 'text-red-500' : 'text-slate-900'}`}>
                      {formatDate(activity.registrationDeadline)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deadline</span>
                 </div>
               )}
            </div>
          </div>
        </section>

        {/* IMAGE SECTION */}
        {activity.imageUrl && (
          <div className="max-w-5xl mx-auto px-6 -mt-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="aspect-video rounded-[48px] overflow-hidden border-8 border-white shadow-2xl relative">
               <img src={activity.imageUrl} alt={activity.title} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
            </div>
          </div>
        )}

        {/* CONTENT */}
        <article className="max-w-3xl mx-auto px-6 py-20">
          {activity.summary && (
            <div className="relative p-8 md:p-10 rounded-[40px] bg-slate-50 border border-slate-100 mb-16 overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:scale-150" />
              <p className="relative z-10 text-lg md:text-xl font-medium text-slate-600 leading-relaxed">
                "{activity.summary}"
              </p>
            </div>
          )}

          <div
            className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed
              [&_h2]:text-3xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:mt-16 [&_h2]:mb-8 [&_h2]:tracking-tight
              [&_h3]:text-2xl [&_h3]:font-black [&_h3]:text-slate-900 [&_h3]:mt-12 [&_h3]:mb-6 [&_h3]:tracking-tight
              [&_p]:mb-8 [&_strong]:text-slate-900 [&_strong]:font-black
              [&_ul]:space-y-4 [&_ul]:list-none [&_ul]:pl-0 [&_ul]:mb-12
              [&_li]:flex [&_li]:gap-4 [&_li:before]:content-['🎯'] [&_li:before]:text-emerald-500 [&_li:before]:font-black
              [&_a]:text-emerald-600 [&_a]:font-black [&_a]:no-underline [&_a]:border-b-2 [&_a]:border-emerald-100 [&_a]:transition-all hover:[&_a]:border-emerald-500
              [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:bg-slate-50 [&_blockquote]:p-8 [&_blockquote]:rounded-r-3xl [&_blockquote]:italic [&_blockquote]:text-slate-700
              [&_img]:rounded-[40px] [&_img]:shadow-2xl [&_img]:my-16 [&_img]:border-4 [&_img]:border-white
              [&_hr]:border-slate-100 [&_hr]:my-16"
            dangerouslySetInnerHTML={{ __html: activity.content }}
          />

          {/* CTA CARD */}
          {canRegister && (
            <div className="mt-20 relative p-10 lg:p-16 rounded-[48px] bg-slate-900 overflow-hidden shadow-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />

               <div className="relative z-10 space-y-4">
                  <h3 className="text-2xl md:text-3xl font-black text-white">Tham gia cùng chúng tôi!</h3>
                  <p className="text-slate-400 font-medium max-w-sm mx-auto">Hạn đăng ký chỉ đến hết ngày {formatDate(activity.registrationDeadline)}</p>
               </div>

               <a
                 href={activity.registrationLink}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="relative z-10 inline-flex px-12 py-5 bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95"
               >
                 Đăng ký tham gia ngay 🚀
               </a>
            </div>
          )}

          {/* FOOTER NAV */}
          <div className="mt-24 pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <Link href="/community" className="flex items-center gap-3 text-sm font-black text-slate-400 transition hover:text-emerald-600 group">
              <span className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center transition group-hover:border-emerald-200 group-hover:bg-emerald-50">
                ←
              </span>
              Quay lại cộng đồng
            </Link>

            <div className="flex gap-4">
               <div className="px-6 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  DUA Edu Community
               </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

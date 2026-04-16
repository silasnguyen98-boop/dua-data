"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";

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

interface Job {
  id: string;
  title: string;
  company: string;
  summary: string;
  content: string;
  imageUrl: string;
  workType: string;
  location: string;
  position: string;
  applicationLink: string;
  applicationDeadline: string;
  salary: string;
  author: string;
  published: boolean;
  createdAt: string;
}

type Tab = "student" | "genz" | "jobs";

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

const communityStats = [
  { label: "Thành viên", value: "70K+", icon: "👥", color: "from-green-400 to-emerald-500" },
  { label: "Hoạt động", value: "50+", icon: "🎯", color: "from-blue-400 to-indigo-500" },
  { label: "Việc làm chia sẻ", value: "100+", icon: "💼", color: "from-purple-400 to-pink-500" },
  { label: "Học viên thành công", value: "300+", icon: "🏆", color: "from-amber-400 to-orange-500" },
];

const achievements = [
  { icon: "🌱", title: "Newcomer", desc: "Tham gia cộng đồng", level: 1 },
  { icon: "📊", title: "Data Explorer", desc: "Hoàn thành 1 khóa học", level: 2 },
  { icon: "⚡", title: "Data Warrior", desc: "Hoàn thành 3 khóa học", level: 3 },
  { icon: "🔥", title: "Data Master", desc: "Tham gia 5+ hoạt động", level: 4 },
  { icon: "👑", title: "Data Legend", desc: "Mentor cộng đồng", level: 5 },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<Tab>("student");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/activities").then(r => r.json()),
      fetch("/api/jobs").then(r => r.json()),
    ]).then(([acts, jbs]) => {
      setActivities(acts.filter((a: Activity) => a.published));
      setJobs(jbs.filter((j: Job) => j.published && isNotExpired(j.applicationDeadline)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const tabs = [
    { key: "student" as Tab, label: "Cộng đồng học viên", icon: "🎓", desc: "Hoạt động dành cho học viên Dứa Data", color: "green" },
    { key: "genz" as Tab, label: "GenZ làm Data", icon: "🚀", desc: "Cộng đồng GenZ đam mê Data", color: "blue" },
    { key: "jobs" as Tab, label: "GenZ tìm việc Data", icon: "💼", desc: "Cơ hội việc làm trong ngành Data", color: "purple" },
  ];

  const filteredActivities = activities
    .filter(a => a.community === activeTab)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const sortedJobs = jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-4 pt-10 md:pt-14 pb-20">
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-10 justify-center">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-4 sm:px-7 py-2.5 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25 scale-105"
                  : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
              )}
            </button>
          ))}
        </div>

        {/* Tab description */}
        <div className="text-center mb-10">
          <p className="text-gray-400 text-sm">{tabs.find(t => t.key === activeTab)?.desc}</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 text-gray-500">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Đang tải...
            </div>
          </div>
        ) : activeTab === "jobs" ? (
          /* Jobs Tab */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedJobs.length === 0 ? (
              <div className="col-span-full text-center py-20 text-gray-600">
                <p className="text-4xl mb-4">💼</p>
                <p className="text-xl font-bold text-gray-400 mb-2">Chưa có việc làm nào</p>
                <p className="text-sm">Hãy quay lại sau để xem các cơ hội mới</p>
              </div>
            ) : sortedJobs.map((job, i) => (
              <div
                key={job.id}
                className="group relative bg-white border border-gray-100 shadow-md rounded-2xl overflow-hidden hover:shadow-lg hover:border-purple-200 hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* XP indicator */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-purple-100 border border-purple-200 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-lg">
                    +50 XP
                  </span>
                </div>

                {job.imageUrl && (
                  <div className="h-40 overflow-hidden">
                    <img src={job.imageUrl} alt={job.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">{job.workType}</span>
                    <span className="text-[11px] font-bold bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/20">{job.position}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-purple-600 transition">{job.title}</h3>
                  <p className="text-sm text-green-600 font-medium mb-2">{job.company}</p>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{job.summary}</p>

                  <div className="space-y-1.5 text-xs text-gray-500 mb-5">
                    {job.location && <div className="flex items-center gap-1.5">📍 {job.location}</div>}
                    {job.salary && <div className="flex items-center gap-1.5">💰 {job.salary}</div>}
                    {job.applicationDeadline && (
                      <div className="flex items-center gap-1.5">⏰ Hạn: {formatDate(job.applicationDeadline)}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/community/job/${job.id}`}
                      className="inline-flex items-center bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300"
                    >
                      Xem chi tiết
                      <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                    {job.applicationLink && isNotExpired(job.applicationDeadline) && (
                      <a
                        href={job.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-purple-600 text-sm font-medium px-4 py-2.5 rounded-xl border border-purple-200 hover:bg-purple-50 transition-all"
                      >
                        Ứng tuyển
                        <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Activities Tabs (student / genz) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.length === 0 ? (
              <div className="col-span-full text-center py-20 text-gray-600">
                <p className="text-4xl mb-4">🎯</p>
                <p className="text-xl font-bold text-gray-400 mb-2">Chưa có hoạt động nào</p>
                <p className="text-sm">Hãy quay lại sau để xem các hoạt động mới</p>
              </div>
            ) : filteredActivities.map((act, i) => {
              const canRegister = act.registrationLink && isNotExpired(act.registrationDeadline);
              const eventPassed = act.eventDate && new Date(act.eventDate) < new Date();
              return (
                <div
                  key={act.id}
                  className="group relative bg-white border border-gray-100 shadow-md rounded-2xl overflow-hidden hover:shadow-lg hover:border-green-200 hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {/* XP indicator */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-green-100 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-1 rounded-lg">
                      +{eventPassed ? "30" : "100"} XP
                    </span>
                  </div>

                  {act.imageUrl && (
                    <div className="h-44 overflow-hidden relative">
                      <img src={act.imageUrl} alt={act.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      {eventPassed ? (
                        <span className="text-[11px] font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg border border-gray-200">Đã diễn ra</span>
                      ) : (
                        <span className="text-[11px] font-bold bg-green-500/20 text-green-300 px-2.5 py-1 rounded-lg border border-green-500/20 flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
                          </span>
                          Sắp diễn ra
                        </span>
                      )}
                      {act.eventDate && (
                        <span className="text-[11px] text-gray-500">📅 {formatDate(act.eventDate)}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-green-600 transition">{act.title}</h3>
                    <p className="text-sm text-gray-500 mb-5 line-clamp-3">{act.summary}</p>

                    {/* Progress bar */}
                    {!eventPassed && canRegister && (
                      <div className="mb-4">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                          <span>Đăng ký</span>
                          <span className="text-green-600">Đang mở</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full w-2/3 animate-pulse" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/community/activity/${act.id}`}
                        className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-105 transition-all duration-300"
                      >
                        Xem chi tiết
                        <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </Link>
                      {canRegister && !eventPassed && (
                        <a
                          href={act.registrationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-green-600 text-sm font-medium px-4 py-2.5 rounded-xl border border-green-200 hover:bg-green-50 transition-all"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Đăng ký
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

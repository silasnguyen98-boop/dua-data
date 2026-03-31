"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

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

export default function JobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then(r => r.json())
      .then((jobs: Job[]) => {
        const found = jobs.find(j => j.id === params.id);
        setJob(found || null);
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

  if (!job) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-300 mb-4">Không tìm thấy việc làm</p>
          <Link href="/community" className="text-green-600 hover:text-green-700 font-medium">
            ← Quay lại cộng đồng
          </Link>
        </div>
      </div>
    );
  }

  const canApply = job.applicationLink && isNotExpired(job.applicationDeadline);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero image */}
      {job.imageUrl && (
        <div className="w-full h-64 md:h-80 relative overflow-hidden">
          <img src={job.imageUrl} alt={job.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/community" className="hover:text-green-600 transition">Cộng đồng</Link>
          <span>/</span>
          <span>GenZ tìm việc Data</span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full">{job.workType}</span>
          <span className="text-xs font-medium bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full">{job.position}</span>
          {job.salary && <span className="text-xs font-medium bg-green-50 text-green-600 px-3 py-1.5 rounded-full">💰 {job.salary}</span>}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
          {job.title}
        </h1>
        <p className="text-lg text-green-600 font-semibold mb-6">{job.company}</p>

        {/* Info */}
        <div className="bg-green-50/50 rounded-2xl p-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {job.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">📍</span>
              <div><span className="text-gray-400">Địa điểm:</span> {job.location}</div>
            </div>
          )}
          {job.workType && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">💼</span>
              <div><span className="text-gray-400">Hình thức:</span> {job.workType}</div>
            </div>
          )}
          {job.position && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">🎯</span>
              <div><span className="text-gray-400">Vị trí:</span> {job.position}</div>
            </div>
          )}
          {job.salary && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">💰</span>
              <div><span className="text-gray-400">Mức lương:</span> {job.salary}</div>
            </div>
          )}
          {job.applicationDeadline && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">⏰</span>
              <div><span className="text-gray-400">Hạn ứng tuyển:</span> {formatDate(job.applicationDeadline)}</div>
            </div>
          )}
        </div>

        {/* Summary */}
        {job.summary && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-r-xl px-6 py-4 mb-8">
            <p className="text-gray-700 font-medium leading-relaxed">{job.summary}</p>
          </div>
        )}

        {/* Content */}
        {job.content && (
          <div
            className="prose prose-lg max-w-none mb-10 text-gray-700 leading-relaxed
              prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:mb-4 prose-ul:mb-4 prose-ol:mb-4
              prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: job.content }}
          />
        )}

        {/* CTA */}
        {canApply && (
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-2xl p-8 text-center mb-10">
            <h3 className="text-xl font-bold text-white mb-3">Ứng tuyển vị trí này!</h3>
            {job.applicationDeadline && (
              <p className="text-green-100 mb-5">Hạn ứng tuyển: {formatDate(job.applicationDeadline)}</p>
            )}
            <a
              href={job.applicationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-white text-green-700 font-bold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:bg-green-50 transition-all duration-300"
            >
              Ứng tuyển ngay
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>
        )}

        {/* Back */}
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

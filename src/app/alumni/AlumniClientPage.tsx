"use client";

import { useState } from "react";
import Link from "next/link";
import { Alumni } from "@/types/alumni";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AlumniModal from "@/components/AlumniModal";

const PAGE_SIZE = 12;

export default function AlumniClientPage({ alumni }: { alumni: Alumni[] }) {
  const [page, setPage] = useState(1);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);

  const totalPages = Math.ceil(alumni.length / PAGE_SIZE);
  const paginated = alumni.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-green-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-bold px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Học viên DUA Edu
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 font-display">
            Cộng đồng <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Alumni</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
            Những câu chuyện thật từ học viên đã tin tưởng và chinh phục mục tiêu cùng DUA Edu
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        {alumni.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-6xl mb-4">🎓</div>
            <p className="text-xl font-semibold">Chưa có alumni nào</p>
            <p className="text-sm mt-2">Hãy quay lại sau!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginated.map((a) => (
                <div
                  key={a.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-green-100/60 hover:-translate-y-2 transition-all duration-500 overflow-hidden block cursor-pointer"
                  onClick={() => setSelectedAlumni(a)}
                >
                  {/* Top gradient bar */}
                  <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-400 group-hover:h-1.5 transition-all duration-500" />

                  <div className="p-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-3 mb-3">
                      {a.imageUrl ? (
                        <img
                          src={a.imageUrl}
                          alt={a.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-green-100 group-hover:ring-green-300 transition-all flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center ring-2 ring-green-100 flex-shrink-0">
                          <span className="text-lg font-bold text-white">{a.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-green-700 transition-colors">{a.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{a.job}</p>
                      </div>
                    </div>

                    {/* Content preview */}
                    <div
                      className="text-gray-500 text-xs leading-relaxed line-clamp-3 [&_p]:mb-1 [&_strong]:text-gray-700 [&_strong]:font-semibold [&_em]:text-gray-400"
                      dangerouslySetInnerHTML={{ __html: a.content }}
                    />

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      {a.linkedin ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          LinkedIn
                        </span>
                      ) : <span />}
                      <Link
                        href={`/alumni/${a.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold group-hover:gap-2 transition-all"
                      >
                        Xem chi tiết
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition ${
                      p === page
                        ? "bg-green-600 text-white shadow-lg shadow-green-200"
                        : "border border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Summary */}
            <p className="text-center text-xs text-gray-400 mt-4">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, alumni.length)} trong tổng số {alumni.length} alumni
            </p>
          </>
        )}
      </section>

      {selectedAlumni && (
        <AlumniModal
          alumni={selectedAlumni}
          onClose={() => setSelectedAlumni(null)}
        />
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-500 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Bạn muốn trở thành Alumni tiếp theo?</h2>
          <p className="text-green-100 text-lg mb-8">Tham gia khóa học của DUA Edu và bắt đầu hành trình của bạn ngay hôm nay</p>
          <a
            href="/courses"
            className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-4 rounded-full shadow-xl hover:bg-green-50 hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            Khám phá khóa học
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

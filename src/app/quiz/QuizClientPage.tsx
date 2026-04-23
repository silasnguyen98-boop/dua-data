"use client";

import { useState } from "react";
import Link from "next/link";
import { Quiz } from "@/types/quiz";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PAGE_SIZE = 8;

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  medium: "bg-lime-50 text-lime-700 border border-lime-100",
  hard: "bg-amber-50 text-amber-700 border border-amber-100",
};

const difficultyLabels: Record<string, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

export default function QuizClientPage({ quizzes }: { quizzes: Quiz[] }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(quizzes.length / PAGE_SIZE);
  const paginated = quizzes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-lime-50" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-lime-100/40 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-sm font-bold px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Kiểm tra kiến thức
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-emerald-950 mb-6 font-display">
            Bài Quiz <span className="bg-gradient-to-r from-emerald-700 to-lime-600 bg-clip-text text-transparent">Trắc nghiệm</span>
          </h1>
          <p className="text-emerald-900/70 max-w-2xl mx-auto text-lg leading-relaxed">
            Ôn luyện và kiểm tra kiến thức với các bài quiz trắc nghiệm từ cơ bản đến nâng cao
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        {quizzes.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl font-semibold">Chưa có bài quiz nào</p>
            <p className="text-sm mt-2">Hãy quay lại sau!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginated.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/quiz/${quiz.id}`}
                  className="group bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100/60 hover:-translate-y-2 transition-all duration-500 overflow-hidden block"
                >
                  {/* Top gradient bar */}
                  <div className="h-1 bg-gradient-to-r from-emerald-600 to-lime-500 group-hover:h-1.5 transition-all duration-500" />

                  <div className="p-5">
                    {/* Image */}
                    {quiz.imageUrl && (
                      <div className="aspect-video w-full rounded-xl overflow-hidden mb-4 bg-gray-50 border border-emerald-50">
                        <img
                          src={quiz.imageUrl}
                          alt={quiz.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {quiz.category && (
                        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                          {quiz.category}
                        </span>
                      )}
                      {quiz.difficulty && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${difficultyColors[quiz.difficulty] || "bg-gray-100 text-gray-600"}`}>
                          {difficultyLabels[quiz.difficulty] || quiz.difficulty}
                        </span>
                      )}
                      {quiz.hasPassword && (
                        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                          🔒 Mật khẩu
                        </span>
                      )}
                      {quiz.durationMinutes && quiz.durationMinutes > 0 && (
                        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                          ⏱ {quiz.durationMinutes} phút
                        </span>
                      )}
                    </div>

                    {/* Title & description */}
                    <h3 className="font-bold text-emerald-950 text-base mb-2 group-hover:text-emerald-700 transition-colors leading-snug">
                      {quiz.title}
                    </h3>
                    <p className="text-emerald-900/65 text-xs leading-relaxed line-clamp-2">
                      {quiz.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-emerald-50">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Quiz
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold group-hover:gap-2 transition-all">
                        Bắt đầu
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-xl border border-emerald-200 flex items-center justify-center text-sm font-medium text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
                        ? "bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                        : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 rounded-xl border border-emerald-200 flex items-center justify-center text-sm font-medium text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}

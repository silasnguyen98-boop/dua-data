"use client";

import { useState } from "react";
import Link from "next/link";
import { Quiz, QuizQuestion } from "@/types/quiz";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type QuizState = "not-started" | "in-progress" | "completed";

interface Answer {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};
const difficultyLabels: Record<string, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

export default function QuizTakePage({ quiz }: { quiz: Quiz }) {
  const [state, setState] = useState<QuizState>("not-started");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const questions = quiz.questions || [];
  const total = questions.length;
  const currentQ = questions[currentIndex];

  function handleSelectAnswer(optionIndex: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  }

  function handleNext() {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  function handleSubmit() {
    setSubmitted(true);
    setState("completed");
  }

  const score = questions.reduce((acc, q, i) => {
    return acc + (answers[i] === q.correctIndex ? 1 : 0);
  }, 0);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const scoreColor = percentage >= 80 ? "text-green-600" : percentage >= 50 ? "text-yellow-600" : "text-red-600";
  const scoreBg = percentage >= 80 ? "bg-green-50 border-green-200" : percentage >= 50 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";

  if (state === "not-started") {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
          <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl" />
          <div className="relative max-w-3xl mx-auto px-4 py-24 text-center">
            {quiz.imageUrl && (
              <div className="w-full h-52 rounded-2xl overflow-hidden mb-8 mx-auto max-w-lg shadow-lg">
                <img src={quiz.imageUrl} alt={quiz.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              {quiz.category && (
                <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1 rounded-full">{quiz.category}</span>
              )}
              {quiz.difficulty && (
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${difficultyColors[quiz.difficulty] || "bg-gray-100 text-gray-600"}`}>
                  {difficultyLabels[quiz.difficulty] || quiz.difficulty}
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 font-display">
              {quiz.title}
            </h1>
            <p className="text-gray-500 text-lg mb-8">{quiz.description}</p>

            <div className="inline-flex items-center gap-6 bg-white border border-gray-200 rounded-2xl px-8 py-4 shadow-sm mb-10">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-indigo-600">{total}</div>
                <div className="text-xs text-gray-500 mt-0.5">Câu hỏi</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <div className="text-2xl font-extrabold text-indigo-600">{quiz.difficulty ? (difficultyLabels[quiz.difficulty] || quiz.difficulty) : "—"}</div>
                <div className="text-xs text-gray-500 mt-0.5">Độ khó</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <div className="text-2xl font-extrabold text-indigo-600">{quiz.category || "—"}</div>
                <div className="text-xs text-gray-500 mt-0.5">Chủ đề</div>
              </div>
            </div>

            <button
              onClick={() => setState("in-progress")}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-500 text-white text-lg font-bold px-10 py-4 rounded-2xl shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Bắt đầu làm bài
            </button>

            <div className="mt-6">
              <Link href="/quiz" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
                ← Quay lại danh sách quiz
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (state === "completed") {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <section className="max-w-3xl mx-auto px-4 py-16">
          {/* Score card */}
          <div className={`text-center rounded-3xl border-2 p-10 mb-10 ${scoreBg}`}>
            <div className="text-7xl mb-4">
              {percentage >= 80 ? "🎉" : percentage >= 50 ? "🤔" : "📚"}
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              {percentage >= 80 ? "Xuất sắc!" : percentage >= 50 ? "Khá tốt!" : "Cần cố gắng thêm!"}
            </h2>
            <div className={`text-7xl font-extrabold mb-2 ${scoreColor}`}>{percentage}%</div>
            <p className="text-gray-600 text-lg">
              Bạn trả lời đúng <span className="font-bold">{score}</span> / {total} câu
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setState("in-progress");
                  setCurrentIndex(0);
                  setAnswers({});
                  setSubmitted(false);
                }}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm lại
              </button>
              <Link
                href="/quiz"
                className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                ← Danh sách quiz
              </Link>
            </div>
          </div>

          {/* Question review */}
          <h3 className="text-xl font-bold text-gray-900 mb-6">Chi tiết đáp án</h3>
          <div className="space-y-6">
            {questions.map((q, i) => {
              const selected = answers[i];
              const correct = selected === q.correctIndex;
              return (
                <div key={q.id} className={`rounded-2xl border-2 p-6 ${correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${correct ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                      {correct ? "✓" : "✗"}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 mb-1">Câu {i + 1}</div>
                      <div className="text-base font-bold text-gray-900">{q.question}</div>
                    </div>
                  </div>

                  <div className="space-y-2 ml-11">
                    {q.options.map((opt, oi) => {
                      const isCorrect = oi === q.correctIndex;
                      const isSelected = oi === selected;
                      return (
                        <div key={oi} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                          isCorrect
                            ? "bg-green-100 text-green-800 font-semibold border border-green-300"
                            : isSelected && !correct
                            ? "bg-red-100 text-red-800 font-semibold border border-red-300"
                            : "bg-white text-gray-600 border border-gray-200"
                        }`}>
                          <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ borderColor: isCorrect ? "#16a34a" : isSelected ? "#dc2626" : "#d1d5db", background: isCorrect ? "#16a34a" : isSelected ? "#dc2626" : "transparent", color: isCorrect || isSelected ? "white" : "#6b7280" }}
                          >
                            {String.fromCharCode(65 + oi)}
                          </span>
                          {opt}
                          {isCorrect && <span className="ml-auto text-green-600 font-bold text-xs">✓ Đáp án đúng</span>}
                          {!isCorrect && isSelected && <span className="ml-auto text-red-600 font-bold text-xs">✗ Bạn chọn sai</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="ml-11 mt-3 bg-white/70 rounded-xl px-4 py-3 text-sm text-gray-600 border border-gray-200">
                      <span className="font-semibold text-indigo-600">Giải thích: </span>{q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // In progress
  const answered = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <Link href="/quiz" className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-500">
                  Câu {currentIndex + 1} / {total}
                </span>
                <span className="text-xs font-semibold text-indigo-600">
                  {answered} đã trả lời
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
            Câu hỏi {currentIndex + 1}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-relaxed">
            {currentQ.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt, oi) => {
            const selected = answers[currentIndex] === oi;
            return (
              <button
                key={oi}
                onClick={() => handleSelectAnswer(oi)}
                className={`w-full text-left flex items-center gap-4 px-6 py-5 rounded-2xl border-2 transition-all duration-200 ${
                  selected
                    ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100 ring-2 ring-indigo-300"
                    : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 shadow-sm"
                }`}
              >
                <span className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-base font-bold flex-shrink-0 transition-all ${
                  selected
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-gray-50 border-gray-300 text-gray-600"
                }`}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className={`text-base font-medium ${selected ? "text-indigo-900" : "text-gray-700"}`}>
                  {opt}
                </span>
                {selected && (
                  <span className="ml-auto text-indigo-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Câu trước
          </button>

          {currentIndex < total - 1 ? (
            <button
              onClick={handleNext}
              disabled={answers[currentIndex] === undefined}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-200"
            >
              Câu tiếp
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={answered < total}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold hover:from-green-700 hover:to-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-green-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nộp bài
            </button>
          )}
        </div>

        {answered < total && (
          <p className="text-center text-sm text-gray-400 mt-4">
            {total - answered} câu chưa trả lời
          </p>
        )}
      </div>

      <Footer />
    </div>
  );
}
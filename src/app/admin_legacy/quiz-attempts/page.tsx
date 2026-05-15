"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import BrandLogo from "@/components/BrandLogo";
import { QuizAttemptAdminEntry } from "@/types/quiz";

function formatDateTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

function difficultyLabel(value?: "easy" | "medium" | "hard") {
  if (value === "easy") return "Dễ";
  if (value === "medium") return "Trung bình";
  if (value === "hard") return "Khó";
  return "—";
}

export default function QuizAttemptsAdminPage() {
  const [attempts, setAttempts] = useState<QuizAttemptAdminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [quizFilter, setQuizFilter] = useState("all");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchAttempts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/quiz-attempts", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch quiz attempts");
        const data = await res.json();
        setAttempts(Array.isArray(data) ? data : []);
      } catch {
        setMessage("Không thể tải danh sách làm quiz.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, []);

  const quizOptions = useMemo(() => {
    const map = new Map<string, string>();
    attempts.forEach((attempt) => {
      if (!map.has(attempt.quizId)) {
        map.set(attempt.quizId, attempt.quizTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [attempts]);

  const filteredAttempts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return attempts.filter((attempt) => {
      const quizMatch = quizFilter === "all" || attempt.quizId === quizFilter;
      const searchMatch =
        !q ||
        attempt.quizTitle.toLowerCase().includes(q) ||
        attempt.quizId.toLowerCase().includes(q) ||
        attempt.participantName.toLowerCase().includes(q) ||
        (attempt.participantEmail || "").toLowerCase().includes(q) ||
        (attempt.participantDisplayName || "").toLowerCase().includes(q);
      return quizMatch && searchMatch;
    });
  }, [attempts, quizFilter, search]);

  const stats = useMemo(() => {
    const uniqueQuizzes = new Set(attempts.map((attempt) => attempt.quizId)).size;
    const uniqueParticipants = new Set(
      attempts.map((attempt) => (attempt.participantEmail || attempt.participantName).trim().toLowerCase())
    ).size;
    const averageScore = attempts.length
      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length)
      : 0;
    return { uniqueQuizzes, uniqueParticipants, averageScore };
  }, [attempts]);

  const exportExcel = () => {
    const rows = filteredAttempts.map((attempt, index) => ({
      "STT": index + 1,
      "Quiz": attempt.quizTitle,
      "Quiz ID": attempt.quizId,
      "Danh mục": attempt.quizCategory || "",
      "Độ khó": difficultyLabel(attempt.quizDifficulty),
      "Trạng thái quiz": attempt.quizPublished === false ? "Ẩn" : "Hiển thị",
      "Tên học viên": attempt.participantDisplayName || attempt.participantName,
      "Email đăng nhập": attempt.participantEmail || "",
      "Điểm": attempt.score,
      "Tổng câu": attempt.totalQuestions,
      "Tỷ lệ": `${attempt.percentage}%`,
      "Thời gian làm": formatDuration(attempt.elapsedSeconds),
      "Nộp lúc": formatDateTime(attempt.submittedAt),
      "Quá giờ": attempt.submittedByTimeout ? "Có" : "Không",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Quiz Attempts");
    XLSX.writeFile(workbook, `quiz-attempts-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo href="/admin" showText={false} imageClassName="h-9 w-9" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Danh sách làm Quiz</h1>
              <p className="text-xs sm:text-sm text-gray-500">Theo dõi bài làm của học viên và xuất Excel nhanh chóng</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin?view=quiz"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            >
              ← Quản lý Quiz
            </Link>
            <button
              onClick={exportExcel}
              disabled={filteredAttempts.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Export Excel
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {message && (
          <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tổng bài làm</p>
            <p className="mt-2 text-3xl font-black text-gray-900">{attempts.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Quiz khác nhau</p>
            <p className="mt-2 text-3xl font-black text-gray-900">{stats.uniqueQuizzes}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Điểm trung bình</p>
            <p className="mt-2 text-3xl font-black text-gray-900">{stats.averageScore}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên học viên, quiz hoặc mã quiz"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lọc theo quiz</label>
              <select
                value={quizFilter}
                onChange={(e) => setQuizFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              >
                <option value="all">Tất cả quiz</option>
                {quizOptions.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Đang tải danh sách...</div>
        ) : filteredAttempts.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-200">
            <p className="text-lg font-semibold mb-1">Chưa có dữ liệu làm quiz</p>
            <p className="text-sm">Khi học viên nộp bài, dữ liệu sẽ xuất hiện ở đây.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Quiz</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Học viên</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Email</th>
                    <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Điểm</th>
                    <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Tỷ lệ</th>
                    <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Thời gian</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Nộp lúc</th>
                    <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Timeout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttempts.map((attempt) => (
                    <tr key={`${attempt.quizId}-${attempt.id}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-gray-900">{attempt.quizTitle}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                          {attempt.quizCategory && (
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
                              {attempt.quizCategory}
                            </span>
                          )}
                          {attempt.quizDifficulty && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-600">
                              {difficultyLabel(attempt.quizDifficulty)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-gray-900">
                          {attempt.participantDisplayName || attempt.participantName}
                        </div>
                        <div className="text-xs text-gray-500">Quiz ID: {attempt.quizId}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-gray-900">{attempt.participantEmail || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{attempt.score}/{attempt.totalQuestions}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 font-semibold text-green-700">
                          {attempt.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{formatDuration(attempt.elapsedSeconds)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(attempt.submittedAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          attempt.submittedByTimeout ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {attempt.submittedByTimeout ? "Có" : "Không"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

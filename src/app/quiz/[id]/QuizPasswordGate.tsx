"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FormEvent } from "react";

export default function QuizPasswordGate({
  quiz,
}: {
  quiz: {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    durationMinutes?: number;
  };
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/quiz/${quiz.id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Mật khẩu không đúng");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Không thể xác thực mật khẩu");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-lime-50" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-lime-100/40 rounded-full blur-3xl" />
        <div className="relative max-w-xl mx-auto px-4 py-24">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-100/50 p-8">
            {quiz.imageUrl && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden mb-6 border border-emerald-100 bg-gray-50">
                <img src={quiz.imageUrl} alt={quiz.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 mb-4">
              Quiz có mật khẩu
            </div>
            <h1 className="text-3xl font-extrabold text-emerald-950 mb-3">{quiz.title}</h1>
            <p className="text-emerald-900/70 mb-6">{quiz.description}</p>
            {quiz.durationMinutes && quiz.durationMinutes > 0 && (
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-sm font-bold px-4 py-2 rounded-full border border-emerald-100 mb-6">
                ⏱ Thời gian làm bài: {quiz.durationMinutes} phút
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-emerald-900/80 mb-1.5">
                  Nhập mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-emerald-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  placeholder="Mật khẩu quiz"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-700 to-emerald-600 text-white font-bold py-3.5 rounded-xl hover:from-emerald-800 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
              >
                {loading ? "Đang xác thực..." : "Vào làm bài"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/quiz" className="text-emerald-700 hover:text-emerald-900 text-sm font-semibold">
                ← Quay lại danh sách quiz
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

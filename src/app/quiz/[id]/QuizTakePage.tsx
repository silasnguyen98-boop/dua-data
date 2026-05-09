"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Quiz, QuizAttemptRecord, QuizLeaderboardEntry } from "@/types/quiz";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase-client";
import type { Session } from "@supabase/supabase-js";

type QuizState = "not-started" | "in-progress" | "completed";

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

function normalizeOptions(options: unknown): string[] {
  if (Array.isArray(options)) {
    return options.map((opt) => String(opt));
  }
  if (options && typeof options === "object") {
    return Object.values(options as Record<string, unknown>).map((opt) => String(opt));
  }
  return [];
}

function normalizeQuestions(rawQuestions: unknown): Quiz["questions"] {
  const list = Array.isArray(rawQuestions)
    ? rawQuestions
    : rawQuestions && typeof rawQuestions === "object"
    ? Object.values(rawQuestions as Record<string, unknown>)
    : [];

  return list.map((q: any, index: number) => ({
    id: String(q?.id || `q${index + 1}`),
    question: String(q?.question || ""),
    options: normalizeOptions(q?.options),
    correctIndex: Number(q?.correctIndex ?? -1),
    explanation: q?.explanation ? String(q.explanation) : undefined,
  }));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toRenderableHtml(value?: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  // Preserve existing rich HTML authored in the editor. Plain text gets paragraphs and line breaks.
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function RichContent({ content, className }: { content?: string; className: string }) {
  const html = toRenderableHtml(content);
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function QuizTakePage({
  quiz,
  initialAttempt,
}: {
  quiz: Quiz;
  initialAttempt?: QuizAttemptRecord | null;
}) {
  const [state, setState] = useState<QuizState>(initialAttempt ? "completed" : "not-started");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>(initialAttempt?.answers ?? {});
  const [submitted, setSubmitted] = useState(Boolean(initialAttempt));
  const [submittedByTimeout, setSubmittedByTimeout] = useState(Boolean(initialAttempt?.submittedByTimeout));
  const [submittedAt, setSubmittedAt] = useState(initialAttempt?.submittedAt ?? "");
  const [viewerName, setViewerName] = useState(initialAttempt?.participantName ?? "");
  const [resultsVisible, setResultsVisible] = useState(Boolean(initialAttempt?.participantName?.trim()));
  const [nameError, setNameError] = useState("");
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [attemptElapsedSeconds, setAttemptElapsedSeconds] = useState(initialAttempt?.elapsedSeconds ?? 0);
  const [leaderboard, setLeaderboard] = useState<QuizLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const timeoutHandledRef = useRef(false);
  const leaderboardLoadedRef = useRef(false);
  const authAutoSyncRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const hasTimeLimit = Number(quiz.durationMinutes || 0) > 0;
  const initialTimeLeft = hasTimeLimit ? Number(quiz.durationMinutes || 0) * 60 : 0;
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const currentPath = useMemo(() => `/quiz/${quiz.id}`, [quiz.id]);

  const questions = normalizeQuestions(quiz.questions);
  const total = questions.length;
  const currentQ = questions[currentIndex];
  const isLoggedIn = Boolean(authSession);
  const authDisplayName = authSession?.user.user_metadata?.full_name || authSession?.user.user_metadata?.name || "Tài khoản";
  const authEmail = authSession?.user.email || "";

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

  function handleStartQuiz() {
    if (submitted) return;
    if (total === 0) return;
    setState("in-progress");
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted(false);
    setSubmittedByTimeout(false);
    timeoutHandledRef.current = false;
    startedAtRef.current = Date.now();
    if (hasTimeLimit) {
      setTimeLeft(initialTimeLeft);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setAuthSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setAuthSession(nextSession);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  function handleSubmit(byTimeout = false) {
    if (submitted) return;
    const now = new Date().toISOString();
    const elapsedSeconds = startedAtRef.current ? Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)) : 0;
    const attemptRecord: QuizAttemptRecord = {
      answers,
      submittedByTimeout: byTimeout,
      submittedAt: now,
      participantName: "",
      elapsedSeconds,
    };
    try {
      persistAttempt(attemptRecord);
    } catch {
      // Persisting the attempt should never block the UI.
    }
    setSubmittedAt(now);
    setAttemptElapsedSeconds(elapsedSeconds);
    setSubmitted(true);
    setSubmittedByTimeout(byTimeout);
    setViewerName("");
    setNameError("");
    setResultsVisible(false);
    setState("completed");
  }

  function persistAttempt(nextAttempt: QuizAttemptRecord) {
    const cookieValue = encodeURIComponent(JSON.stringify(nextAttempt));
    const cookieParts = [
      `quiz_attempt_${quiz.id}=${cookieValue}`,
      `path=/quiz/${quiz.id}`,
      "max-age=31536000",
      "samesite=lax",
    ];
    if (window.location.protocol === "https:") {
      cookieParts.push("secure");
    }
    document.cookie = cookieParts.join("; ");
  }

  async function saveAttemptToLeaderboard(sourceAttempt: QuizAttemptRecord, session: Session) {
    setSavingAttempt(true);
    setLeaderboardError("");

    try {
      const accessToken = session.access_token;
      const nextAttempt: QuizAttemptRecord = {
        ...sourceAttempt,
        participantName: authDisplayName || sourceAttempt.participantName || "Ẩn danh",
        participantEmail: authEmail || undefined,
        participantDisplayName: authDisplayName || undefined,
      };

      const res = await fetch(`/api/quiz/${quiz.id}/attempts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          answers: nextAttempt.answers,
          submittedByTimeout: nextAttempt.submittedByTimeout,
          submittedAt: nextAttempt.submittedAt,
          elapsedSeconds: nextAttempt.elapsedSeconds,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Vui lòng đăng nhập để xem kết quả");
      }

      const data = await res.json();
      persistAttempt(nextAttempt);
      setSubmittedAt(nextAttempt.submittedAt);
      setAttemptElapsedSeconds(nextAttempt.elapsedSeconds || 0);
      setViewerName(nextAttempt.participantName || "");
      setNameError("");
      setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
      leaderboardLoadedRef.current = true;
      setResultsVisible(true);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Không thể lưu kết quả");
    } finally {
      setSavingAttempt(false);
    }
  }

  function handleRevealResults() {
    const nextAttempt: QuizAttemptRecord = {
      answers,
      submittedByTimeout,
      submittedAt: submittedAt || new Date().toISOString(),
      participantName: authDisplayName || viewerName.trim(),
      participantEmail: authEmail || undefined,
      participantDisplayName: authDisplayName || undefined,
      elapsedSeconds: attemptElapsedSeconds,
    };

    if (!isLoggedIn || !authSession) {
      persistAttempt(nextAttempt);
      setSubmittedAt(nextAttempt.submittedAt);
      setAttemptElapsedSeconds(nextAttempt.elapsedSeconds || 0);
      setResultsVisible(false);
      setNameError("Đăng nhập để xem kết quả và lưu BXH");
      return;
    }

    void saveAttemptToLeaderboard(nextAttempt, authSession);
  }

  async function loadLeaderboard() {
    setLeaderboardLoading(true);
    setLeaderboardError("");
    try {
      const res = await fetch(`/api/quiz/${quiz.id}/attempts`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Không thể tải bảng xếp hạng");
      }
      const data = await res.json();
      setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
    } catch (err) {
      setLeaderboardError(err instanceof Error ? err.message : "Không thể tải bảng xếp hạng");
    } finally {
      setLeaderboardLoading(false);
    }
  }

  function formatTime(seconds: number) {
    const safe = Math.max(0, seconds);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  useEffect(() => {
    if (state !== "in-progress" || !hasTimeLimit || submitted) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state, hasTimeLimit, submitted]);

  useEffect(() => {
    if (state !== "in-progress" || !hasTimeLimit || submitted) return;
    if (timeLeft > 0 || timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;
    handleSubmit(true);
  }, [state, hasTimeLimit, submitted, timeLeft]);

  useEffect(() => {
    if (state !== "completed" || !resultsVisible) return;
    if (leaderboardLoadedRef.current) return;
    leaderboardLoadedRef.current = true;
    void loadLeaderboard();
  }, [state, resultsVisible]);

  useEffect(() => {
    const pendingAttempt = Boolean(initialAttempt) && !initialAttempt?.participantName?.trim();
    if (!pendingAttempt) return;
    if (!authSession || authLoading) return;
    if (state !== "completed" || resultsVisible || authAutoSyncRef.current) return;

    authAutoSyncRef.current = true;
    void saveAttemptToLeaderboard(
      {
        answers: initialAttempt?.answers ?? answers,
        submittedByTimeout: Boolean(initialAttempt?.submittedByTimeout),
        submittedAt: initialAttempt?.submittedAt || submittedAt || new Date().toISOString(),
        participantName: authDisplayName || "",
        participantEmail: authEmail || undefined,
        participantDisplayName: authDisplayName || undefined,
        elapsedSeconds: Number(initialAttempt?.elapsedSeconds ?? attemptElapsedSeconds),
      },
      authSession
    );
  }, [
    answers,
    attemptElapsedSeconds,
    authEmail,
    authDisplayName,
    authLoading,
    authSession,
    initialAttempt,
    resultsVisible,
    state,
    submittedAt,
  ]);

  const score = questions.reduce((acc, q, i) => {
    return acc + (answers[i] === q.correctIndex ? 1 : 0);
  }, 0);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const scoreOutOf10 = total > 0 ? Math.round((score / total) * 10) : 0;

  const scoreColor = scoreOutOf10 >= 8 ? "text-emerald-700" : scoreOutOf10 >= 5 ? "text-lime-700" : "text-amber-700";
  const scoreBg = scoreOutOf10 >= 8 ? "bg-emerald-50 border-emerald-200" : scoreOutOf10 >= 5 ? "bg-lime-50 border-emerald-200" : "bg-amber-50 border-emerald-200";

  if (state !== "not-started" && total === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <section className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h1 className="text-3xl font-extrabold text-emerald-950 mb-3">Quiz chưa có câu hỏi</h1>
          <p className="text-emerald-900/70 mb-8">Không thể bắt đầu làm bài vì bộ quiz này chưa được nhập câu hỏi hợp lệ.</p>
          <Link href="/quiz" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-colors">
            ← Quay lại danh sách quiz
          </Link>
        </section>
        <Footer />
      </div>
    );
  }

  if (state === "not-started") {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-lime-50 pointer-events-none" />
          <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-lime-100/40 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto px-4 py-24 text-center">
            {quiz.imageUrl && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden mb-8 mx-auto max-w-2xl shadow-lg border border-emerald-100 bg-gray-50">
                <img src={quiz.imageUrl} alt={quiz.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              {quiz.category && (
                <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full border border-emerald-200">{quiz.category}</span>
              )}
              {quiz.difficulty && (
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${difficultyColors[quiz.difficulty] || "bg-gray-100 text-gray-600"}`}>
                  {difficultyLabels[quiz.difficulty] || quiz.difficulty}
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-950 mb-4 font-display">
              {quiz.title}
            </h1>
            <p className="text-emerald-900/70 text-lg mb-10">{quiz.description}</p>

            <div className="max-w-2xl mx-auto mb-8">
              <div className="rounded-3xl border border-emerald-200 bg-white/95 shadow-lg shadow-emerald-100/60 px-5 py-5">
                <p className="text-sm font-semibold text-emerald-900/70 mb-4">
                  Nếu bạn đã sẵn sàng thì bắt đầu làm bài ngay thôi!
                </p>
                <button
                  onClick={handleStartQuiz}
                  disabled={total === 0}
                  className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white text-lg font-bold px-10 py-4 rounded-2xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 hover:-translate-y-0.5 transition-all ring-1 ring-emerald-500/10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {total === 0 ? "Quiz chưa có câu hỏi" : "Bắt đầu làm bài"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-white border border-emerald-100 rounded-3xl px-4 py-4 shadow-sm mb-6 max-w-2xl mx-auto">
              <div className="text-center px-2">
                <div className="text-2xl font-extrabold text-emerald-700">{total}</div>
                <div className="text-[11px] font-semibold text-emerald-900/60 mt-0.5 uppercase tracking-wide">Câu hỏi</div>
              </div>
              <div className="text-center px-2 border-l border-r border-emerald-100">
                <div className="text-2xl font-extrabold text-emerald-700">{quiz.difficulty ? (difficultyLabels[quiz.difficulty] || quiz.difficulty) : "—"}</div>
                <div className="text-[11px] font-semibold text-emerald-900/60 mt-0.5 uppercase tracking-wide">Độ khó</div>
              </div>
              <div className="text-center px-2">
                <div className="text-2xl font-extrabold text-emerald-700">{quiz.category || "—"}</div>
                <div className="text-[11px] font-semibold text-emerald-900/60 mt-0.5 uppercase tracking-wide">Chủ đề</div>
              </div>
            </div>

            {hasTimeLimit && (
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-sm font-bold px-4 py-2 rounded-full border border-emerald-100 mb-6">
                ⏱ Thời gian làm bài: {quiz.durationMinutes} phút
              </div>
            )}

            <div className="mt-6">
              <Link href="/quiz" className="text-emerald-700 hover:text-emerald-900 text-sm font-semibold transition-colors">
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
            <h2 className="text-3xl font-extrabold text-emerald-950 mb-2">
              {resultsVisible ? (percentage >= 80 ? "Xuất sắc!" : percentage >= 50 ? "Khá tốt!" : "Cần cố gắng thêm!") : "Đăng nhập để xem kết quả"}
            </h2>
            <p className="text-emerald-900/70 text-sm mb-4">
              {resultsVisible
                ? `Bạn đã hoàn thành bài quiz.`
                : "Sau khi đăng nhập, điểm số, chi tiết đáp án và BXH sẽ hiện ra ở bên dưới."}
            </p>
            {submittedByTimeout && hasTimeLimit && (
              <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 text-sm font-bold px-4 py-2 rounded-full border border-red-100 mb-4">
                Hết giờ, bài làm đã được nộp tự động
              </div>
            )}
            {!resultsVisible ? (
              <div className="max-w-xl mx-auto">
                <div className="rounded-3xl border border-emerald-100 bg-white/90 shadow-sm p-6 text-left">
                  {authLoading ? (
                    <p className="text-sm font-semibold text-emerald-900/70 mb-4">
                      Đang kiểm tra trạng thái đăng nhập...
                    </p>
                  ) : isLoggedIn ? (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-emerald-900/70">
                        Bạn đã đăng nhập. Kết quả sẽ được lưu bằng email đã đăng nhập: <span className="text-emerald-700">{authEmail}</span>
                      </p>
                      {nameError && (
                        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
                          {nameError}
                        </div>
                      )}
                      {savingAttempt ? (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                          Đang lưu kết quả và đồng bộ BXH...
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (authSession) {
                              void saveAttemptToLeaderboard(
                                {
                                  answers,
                                  submittedByTimeout,
                                  submittedAt: submittedAt || new Date().toISOString(),
                                  participantName: authEmail || authDisplayName || "",
                                  elapsedSeconds: attemptElapsedSeconds,
                                },
                                authSession
                              );
                            }
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white font-bold px-6 py-3 rounded-2xl hover:from-emerald-800 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-200"
                        >
                          Xem kết quả
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-emerald-900/70">
                        Đăng nhập để xem kết quả và lưu BXH bằng email đã đăng nhập.
                      </p>
                      <div className="bg-amber-50 text-amber-800 text-sm px-4 py-3 rounded-xl border border-amber-100">
                        Bạn vẫn có thể giữ đáp án hiện tại. Sau khi đăng nhập và quay lại trang này, kết quả sẽ được đồng bộ.
                      </div>
                      <Link
                        href={`/login?next=${encodeURIComponent(currentPath)}`}
                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white font-bold px-6 py-3 rounded-2xl hover:from-emerald-800 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-200"
                      >
                        Đăng nhập để xem kết quả
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-100/50 p-8">
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-extrabold text-emerald-950">
                          Kết quả của {viewerName.trim() || authEmail || authDisplayName || "bạn"}
                        </h3>
                      </div>
                      {submittedByTimeout && hasTimeLimit && (
                        <span className="inline-flex items-center gap-2 bg-red-50 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full border border-red-100">
                          Hết giờ
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-5 text-center">
                        <div className={`text-5xl font-extrabold ${scoreColor}`}>{scoreOutOf10}/10</div>
                        <div className="text-xs font-semibold text-emerald-900/55 uppercase tracking-wide mt-2">Điểm số</div>
                      </div>
                      <div className="rounded-2xl bg-white border border-emerald-100 px-4 py-5 text-center">
                        <div className="text-3xl font-extrabold text-emerald-950">{score}/{total}</div>
                        <div className="text-xs font-semibold text-emerald-900/55 uppercase tracking-wide mt-2">Câu đúng</div>
                      </div>
                      <div className="rounded-2xl bg-white border border-emerald-100 px-4 py-5 text-center">
                        <div className="text-3xl font-extrabold text-emerald-950">
                          {score >= Math.ceil(total * 0.8) ? "A" : score >= Math.ceil(total * 0.5) ? "B" : "C"}
                        </div>
                        <div className="text-xs font-semibold text-emerald-900/55 uppercase tracking-wide mt-2">Xếp loại</div>
                      </div>
                    </div>

                    <p className="text-emerald-900/70 text-sm mt-6">
                      {isLoggedIn
                        ? "Kết quả đã được lưu với email đăng nhập của bạn."
                        : "Tên và đáp án đang được lưu tạm trên trình duyệt này. Hãy đăng nhập để đồng bộ BXH."}
                    </p>
                  </div>
                </div>

                <div className="mt-10 max-w-3xl mx-auto">
                  <h3 className="text-xl font-bold text-emerald-950 mb-4">Chi tiết đáp án</h3>
                </div>
              </>
            )}
          </div>

          {resultsVisible && (
            <div className="space-y-6">
            {questions.map((q, i) => {
              const selected = answers[i];
              const correct = selected === q.correctIndex;
              const reviewOptions = Array.isArray(q.options) ? q.options : [];
              return (
                <div key={q.id} className={`rounded-2xl border-2 p-6 ${correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                <div className="flex items-start gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${correct ? "bg-emerald-700 text-white" : "bg-red-500 text-white"}`}>
                      {correct ? "✓" : "✗"}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-emerald-900/55 mb-1">Câu {i + 1}</div>
                      <RichContent
                        content={q.question}
                        className="text-base font-semibold text-emerald-950 leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:my-3 [&_img]:shadow-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-emerald-900/70"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 ml-11">
                    {reviewOptions.map((opt, oi) => {
                      const isCorrect = oi === q.correctIndex;
                      const isSelected = oi === selected;
                      return (
                        <div key={oi} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                          isCorrect
                            ? "bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300"
                            : isSelected && !correct
                            ? "bg-red-100 text-red-800 font-semibold border border-red-300"
                            : "bg-white text-emerald-900/70 border border-emerald-100"
                        }`}>
                          <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ borderColor: isCorrect ? "#047857" : isSelected ? "#dc2626" : "#d1fae5", background: isCorrect ? "#047857" : isSelected ? "#dc2626" : "transparent", color: isCorrect || isSelected ? "white" : "#047857" }}
                          >
                            {String.fromCharCode(65 + oi)}
                          </span>
                          {opt}
                          {isCorrect && <span className="ml-auto text-emerald-700 font-bold text-xs">✓ Đáp án đúng</span>}
                          {!isCorrect && isSelected && <span className="ml-auto text-red-600 font-bold text-xs">✗ Bạn chọn sai</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="ml-11 mt-3 bg-white/80 rounded-xl px-4 py-3 text-sm text-emerald-900/70 border border-emerald-100">
                      <div className="font-semibold text-emerald-700 mb-1">Giải thích</div>
                      <RichContent
                        content={q.explanation}
                        className="text-sm leading-relaxed text-emerald-900/70 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3 [&_img]:shadow-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}
          {resultsVisible && (
            <div className="mt-12 max-w-3xl mx-auto">
              <div className="rounded-3xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 mb-1">Bảng xếp hạng</p>
                    <h3 className="text-2xl font-extrabold text-emerald-950">Top quiz</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-emerald-900/55">Ưu tiên điểm đúng</p>
                    <p className="text-xs font-semibold text-emerald-900/55">Nếu bằng điểm, ai làm nhanh hơn sẽ đứng trên</p>
                  </div>
                </div>

                <div className="p-6">
                  {leaderboardLoading ? (
                    <div className="text-center py-10 text-emerald-900/60">
                      Đang tải bảng xếp hạng...
                    </div>
                  ) : leaderboardError ? (
                    <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-2xl border border-red-100">
                      {leaderboardError}
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="text-3xl mb-3">🏁</div>
                      <p className="text-emerald-900/70 font-medium">Chưa có ai xuất hiện trên bảng xếp hạng.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaderboard.map((entry, index) => {
                        const isCurrentEmail = authEmail && entry.participantEmail === authEmail;
                        const isCurrentUser = isCurrentEmail || entry.participantName.trim() === viewerName.trim();
                        return (
                          <div
                            key={`${entry.id}-${index}`}
                            className={`flex items-center gap-4 rounded-2xl border px-4 py-4 ${
                              isCurrentUser
                                ? "border-emerald-300 bg-emerald-50 shadow-sm"
                                : "border-emerald-100 bg-white"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-extrabold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-emerald-950 truncate">{entry.participantName}</p>
                                {isCurrentUser && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-emerald-900/55 mt-0.5">
                                {entry.score}/{entry.totalQuestions} câu đúng • {formatTime(entry.elapsedSeconds)}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-2xl font-extrabold text-emerald-700">{Math.round(entry.percentage / 10)}/10</div>
                              <div className="text-[11px] font-semibold text-emerald-900/55 uppercase tracking-wide">
                                {entry.submittedByTimeout ? "Hết giờ" : "Hoàn thành"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="mt-10 text-center">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 bg-white border border-emerald-200 text-emerald-800 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors"
            >
              ← Danh sách quiz
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // In progress
  const answered = Object.keys(answers).length;
  if (!currentQ) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <section className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-extrabold text-emerald-950 mb-3">Dữ liệu quiz không hợp lệ</h1>
          <p className="text-emerald-900/70 mb-8">Mình không tìm thấy câu hỏi hiện tại để hiển thị. Vui lòng quay lại danh sách và thử lại.</p>
          <Link href="/quiz" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-colors">
            ← Quay lại danh sách quiz
          </Link>
        </section>
        <Footer />
      </div>
    );
  }
  const currentOptions = Array.isArray(currentQ.options) ? currentQ.options : [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-emerald-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
              <Link href="/quiz" className="text-emerald-700 hover:text-emerald-900 transition-colors flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-emerald-900/55">
                    Câu {currentIndex + 1} / {total}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-emerald-700">
                      {answered} đã trả lời
                    </span>
                    {hasTimeLimit && (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        timeLeft <= 60
                          ? "bg-red-50 text-red-700 border-red-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}>
                        ⏱ {formatTime(timeLeft)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-emerald-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-lime-500 rounded-full transition-all duration-500"
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
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mb-4 border border-emerald-100">
            Câu hỏi {currentIndex + 1}
          </div>
          <RichContent
            content={currentQ.question}
            className="text-2xl md:text-3xl font-semibold text-emerald-950 leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0 [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:my-4 [&_img]:shadow-md [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-emerald-900/70"
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentOptions.map((opt, oi) => {
            const selected = answers[currentIndex] === oi;
            return (
              <button
                key={oi}
                onClick={() => handleSelectAnswer(oi)}
                className={`w-full text-left flex items-center gap-4 px-6 py-5 rounded-2xl border-2 transition-all duration-200 ${
                  selected
                    ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100 ring-2 ring-emerald-300"
                    : "border-emerald-100 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 shadow-sm"
                }`}
              >
                <span className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-base font-bold flex-shrink-0 transition-all ${
                  selected
                    ? "bg-emerald-700 border-emerald-700 text-white"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className={`text-base font-medium ${selected ? "text-emerald-950" : "text-emerald-900/80"}`}>
                  {opt}
                </span>
                {selected && (
                  <span className="ml-auto text-emerald-700">
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-200 text-emerald-800 font-medium hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-200"
            >
              Câu tiếp
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={answered < total}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-lime-600 text-white font-bold hover:from-emerald-800 hover:to-lime-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-200"
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

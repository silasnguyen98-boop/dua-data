"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import BrandLogo from "@/components/BrandLogo";
import type { Quiz, QuizQuestion } from "@/types/quiz";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

const emptyQuiz: Omit<Quiz, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  description: "",
  imageUrl: "",
  category: "",
  difficulty: "medium",
  password: "",
  hasPassword: false,
  durationMinutes: 0,
  questionCount: 0,
  questions: [],
  published: true,
  order: 0,
};

function safeGetSessionItem(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function decodeStoredRole(stored: string | null): string | null {
  if (!stored) return null;
  const raw = stored.trim();
  if (!raw) return null;
  try {
    const decoded = atob(raw).trim();
    return decoded.includes(":") ? (decoded.split(":")[1] || decoded.split(":")[0] || decoded).trim() : decoded;
  } catch {
    return raw.includes(":") ? (raw.split(":")[1] || raw.split(":")[0] || raw).trim() : raw;
  }
}

function buildAuthHeader(): Record<string, string> {
  const stored = safeGetSessionItem("admin_role");
  if (!stored) return {};
  const role = decodeStoredRole(stored) || stored.trim();
  if (!role) return {};
  return { Authorization: `Bearer ${btoa(role)}` };
}

function formatDifficulty(value?: string) {
  if (value === "easy") return "Dễ";
  if (value === "hard") return "Khó";
  return "Trung bình";
}

function newQuestion(index: number): QuizQuestion {
  return {
    id: `q${index + 1}`,
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  };
}

export default function AdminQuizPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Omit<Quiz, "id" | "createdAt" | "updatedAt">>(emptyQuiz);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [durationEnabled, setDurationEnabled] = useState(false);

  const currentRole = useMemo(() => decodeStoredRole(safeGetSessionItem("admin_role")), []);
  const adminName = useMemo(() => safeGetSessionItem("admin_name") || "Admin", []);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quiz", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setQuizzes(Array.isArray(data) ? data : []);
    } catch {
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isAuth = safeGetSessionItem("admin_auth");
    if (!isAuth) {
      window.location.href = "/admin/login";
      return;
    }
    const role = decodeStoredRole(safeGetSessionItem("admin_role"));
    const access = role === "system_admin" || role === "content_manager" || role === "teacher";
    setAllowed(access);
    if (access) fetchQuizzes();
    setAuthChecked(true);
  }, [fetchQuizzes]);

  const filteredQuizzes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      if (!q) return true;
      return (
        quiz.title.toLowerCase().includes(q) ||
        quiz.description.toLowerCase().includes(q) ||
        (quiz.category || "").toLowerCase().includes(q)
      );
    });
  }, [quizzes, search]);

  function resetForm() {
    setEditing(null);
    setForm(emptyQuiz);
    setPasswordEnabled(false);
    setDurationEnabled(false);
  }

  function startCreate() {
    resetForm();
    setShowForm(true);
  }

  async function startEdit(quiz: Quiz) {
    try {
      const res = await fetch(`/api/quiz/${quiz.id}`, {
        headers: { "x-admin-preview": "1" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error("Không tải được quiz");
      const fullQuiz = data as Quiz;
      setEditing(fullQuiz);
      const { id, createdAt, updatedAt, ...rest } = fullQuiz;
      setForm({
        ...emptyQuiz,
        ...rest,
        questions: Array.isArray(rest.questions) ? rest.questions : [],
      });
      setPasswordEnabled(Boolean(fullQuiz.password));
      setDurationEnabled(Boolean(fullQuiz.durationMinutes && Number(fullQuiz.durationMinutes) > 0));
      setShowForm(true);
    } catch {
      alert("Không tải được dữ liệu quiz để chỉnh sửa");
    }
  }

  async function saveQuiz() {
    if (!form.title.trim() || !form.description.trim()) {
      alert("Vui lòng nhập tiêu đề và mô tả");
      return;
    }
    if (passwordEnabled && !form.password?.trim()) {
      alert("Vui lòng nhập mật khẩu cho quiz");
      return;
    }
    if (durationEnabled && !(Number(form.durationMinutes) > 0)) {
      alert("Vui lòng nhập thời gian làm bài lớn hơn 0");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        hasPassword: passwordEnabled,
        password: passwordEnabled ? form.password : "",
        durationMinutes: durationEnabled ? Number(form.durationMinutes) || 0 : 0,
        questionCount: Array.isArray(form.questions) ? form.questions.length : 0,
      };
      const res = await fetch("/api/quiz", {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(),
        },
        body: JSON.stringify(editing ? { ...payload, id: editing.id } : payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Không thể lưu quiz");
      setShowForm(false);
      resetForm();
      await fetchQuizzes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể lưu quiz");
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuiz(id: string) {
    if (!confirm("Bạn có chắc muốn xóa quiz này?")) return;
    await fetch(`/api/quiz?id=${id}`, { method: "DELETE", headers: buildAuthHeader() });
    fetchQuizzes();
  }

  function updateQuestion(index: number, patch: Partial<QuizQuestion>) {
    const next = [...form.questions];
    next[index] = { ...next[index], ...patch };
    setForm({ ...form, questions: next });
  }

  if (!authChecked) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Đang kiểm tra quyền truy cập...</div>;
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center max-w-md">
          <p className="text-xl font-bold text-gray-900">Không có quyền truy cập</p>
          <p className="text-gray-500 mt-2">Trang quiz chỉ dành cho system_admin, content_manager và teacher.</p>
          <Link href="/admin" className="inline-flex mt-6 px-4 py-2 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700">
            Về admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo href="/admin" showText={false} imageClassName="h-14 w-14" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Quiz admin</p>
              <p className="text-xs text-gray-500">
                {adminName}{currentRole ? ` • ${currentRole}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/quiz-attempts" className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
              Danh sách làm Quiz
            </Link>
            <Link href="/admin" className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
              Về admin
            </Link>
            <button onClick={startCreate} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
              + Thêm Quiz
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Quiz</h1>
              <p className="text-sm text-gray-500">Tạo, sửa, ẩn, xóa quiz và quản lý câu hỏi trong một nơi riêng.</p>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-80 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="Tìm theo tiêu đề hoặc chủ đề..."
            />
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500">Đang tải...</div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <p className="text-xl">Chưa có quiz nào</p>
              <p className="mt-1">Nhấn &quot;+ Thêm Quiz&quot; để tạo mới.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...filteredQuizzes]
                .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
                .map((quiz) => (
                  <article key={quiz.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    {quiz.imageUrl && (
                      <div className="aspect-video w-full overflow-hidden rounded-xl mb-4 bg-gray-100 border border-gray-100">
                        <img src={quiz.imageUrl} alt={quiz.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">{quiz.title}</h3>
                        <p className="text-gray-500 text-xs line-clamp-2">{quiz.description}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${quiz.published !== false ? "bg-green-500/10 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {quiz.published !== false ? "Hiển thị" : "Ẩn"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap my-3">
                      {quiz.category && <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">{quiz.category}</span>}
                      {quiz.difficulty && (
                        <span className={`text-xs px-2.5 py-1 rounded-full ${quiz.difficulty === "easy" ? "bg-green-100 text-green-700" : quiz.difficulty === "hard" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {formatDifficulty(quiz.difficulty)}
                        </span>
                      )}
                      {quiz.hasPassword && <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">🔒 Có mật khẩu</span>}
                      {quiz.durationMinutes ? <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">⏱ {quiz.durationMinutes} phút</span> : null}
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {quiz.questionCount ?? quiz.questions.length} câu
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-400">Thứ tự: {quiz.order ?? 0}</span>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(quiz)} className="text-blue-600 hover:text-blue-500 text-xs font-medium">Sửa</button>
                        <button onClick={() => deleteQuiz(quiz.id)} className="text-red-500 hover:text-red-400 text-xs font-medium">Xóa</button>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </section>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-full flex items-start justify-center px-4 py-10">
            <div className="w-full max-w-4xl rounded-3xl border border-gray-200 bg-white shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{editing ? "Sửa quiz" : "Thêm quiz mới"}</h2>
                  <p className="text-sm text-gray-500">Điền nội dung, câu hỏi và tùy chọn hiển thị cho quiz.</p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>

              <div className="space-y-5 max-h-[78vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                    <input
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề</label>
                    <input
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={form.category || ""}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                  <textarea
                    rows={3}
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh bìa</label>
                    <input
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={form.imageUrl || ""}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Độ khó</label>
                      <select
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                        value={form.difficulty || "medium"}
                        onChange={(e) => setForm({ ...form, difficulty: e.target.value as Quiz["difficulty"] })}
                      >
                        <option value="easy">Dễ</option>
                        <option value="medium">Trung bình</option>
                        <option value="hard">Khó</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự</label>
                      <input
                        type="number"
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                        value={form.order ?? 0}
                        onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordEnabled(false);
                          setForm({ ...form, password: "" });
                        }}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border ${!passwordEnabled ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}
                      >
                        Không
                      </button>
                      <button
                        type="button"
                        onClick={() => setPasswordEnabled(true)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border ${passwordEnabled ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}
                      >
                        Có
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Thời gian làm bài</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDurationEnabled(false);
                          setForm({ ...form, durationMinutes: 0 });
                        }}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border ${!durationEnabled ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}
                      >
                        Không giới hạn
                      </button>
                      <button
                        type="button"
                        onClick={() => setDurationEnabled(true)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border ${durationEnabled ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}
                      >
                        Có thời gian
                      </button>
                    </div>
                  </div>
                </div>

                {passwordEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu truy cập</label>
                    <input
                      type="password"
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={form.password || ""}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                )}

                {durationEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số phút làm bài</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={form.durationMinutes || 0}
                      onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Câu hỏi</label>
                  <div className="space-y-4">
                    {form.questions.map((question, index) => (
                      <div key={question.id || index} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-900">Câu {index + 1}</p>
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...form.questions];
                              next.splice(index, 1);
                              setForm({ ...form, questions: next });
                            }}
                            className="text-xs font-medium text-red-500 hover:text-red-600"
                          >
                            Xóa
                          </button>
                        </div>
                        <div className="space-y-3">
                          <RichTextEditor
                            value={question.question}
                            onChange={(content) => updateQuestion(index, { question: content })}
                            placeholder="Nhập câu hỏi..."
                            minHeight="120px"
                            maxHeight="220px"
                            editorClassName="bg-white"
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${index}`}
                                  checked={question.correctIndex === optionIndex}
                                  onChange={() => updateQuestion(index, { correctIndex: optionIndex })}
                                />
                                <input
                                  className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                                  value={option}
                                  onChange={(e) => {
                                    const options = [...question.options];
                                    options[optionIndex] = e.target.value;
                                    updateQuestion(index, { options });
                                  }}
                                  placeholder={`Đáp án ${String.fromCharCode(65 + optionIndex)}`}
                                />
                              </div>
                            ))}
                          </div>
                          <RichTextEditor
                            value={question.explanation || ""}
                            onChange={(content) => updateQuestion(index, { explanation: content })}
                            placeholder="Giải thích đáp án..."
                            minHeight="100px"
                            maxHeight="180px"
                            editorClassName="bg-white"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, questions: [...form.questions, newQuestion(form.questions.length)] })}
                      className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100"
                    >
                      + Thêm câu hỏi
                    </button>
                    {form.questions.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-400">
                        Chưa có câu hỏi nào
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Hiển thị</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, published: !form.published })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${form.published !== false ? "bg-green-500/10 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {form.published !== false ? "Hiển thị" : "Ẩn"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition">
                  Hủy
                </button>
                <button onClick={saveQuiz} disabled={saving} className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow disabled:opacity-60">
                  {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm Quiz"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

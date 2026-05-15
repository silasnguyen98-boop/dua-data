"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { Course, CurriculumItem } from "@/types/course";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

const emptyCourse: Omit<Course, "id"> = {
  slug: "",
  title: "",
  shortDescription: "",
  description: "",
  image: "",
  imageUrl: "",
  instructor: "Đội Ngũ DUA Edu",
  price: 0,
  originalPrice: 0,
  discount: 0,
  totalLessons: 0,
  students: 0,
  rating: 0,
  reviews: 0,
  startDate: "",
  endDate: "",
  registrationDeadline: "",
  schedule: "",
  hours: "",
  category: "",
  courseType: "online",
  curriculum: [],
  outcomes: [],
  targetAudience: [],
  published: false,
  comingSoon: false,
  hidePrice: false,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatPrice(price: number) {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export default function CoursesView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<Omit<Course, "id">>(emptyCourse);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  // Curriculum states
  const [editingPhaseIndex, setEditingPhaseIndex] = useState<number | null>(null);
  const [currPhase, setCurrPhase] = useState("");
  const [currTitle, setCurrTitle] = useState("");
  const [currLessons, setCurrLessons] = useState(0);
  const [currTopics, setCurrTopics] = useState("");

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("/api/admin/courses?includeCurriculum=1", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Không thể tải danh sách khóa học");
      }
      const data = await res.json().catch(() => []);
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch courses failed", err);
      setError(err instanceof Error && err.name === "AbortError" ? "Tải khóa học quá lâu. Vui lòng thử lại." : err instanceof Error ? err.message : "Không thể tải danh sách khóa học");
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [fetchCourses]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/courses/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(`Đồng bộ thành công! ${data.count} khóa học đã được cập nhật.`);
      } else {
        showToast("Lỗi đồng bộ: " + data.error, "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối khi đồng bộ", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleNew = () => {
    setEditing(null);
    setForm(emptyCourse);
    setShowForm(true);
    setEditingPhaseIndex(null);
  };

  const handleEdit = (course: Course) => {
    setEditing(course);
    const { id, ...rest } = JSON.parse(JSON.stringify(course));
    setForm(rest);
    setShowForm(true);
    setEditingPhaseIndex(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa khóa học này?")) return;
    const res = await fetch(`/api/admin/courses?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Không thể xóa khóa học" }));
      showToast(err.error || "Không thể xóa khóa học", "error");
      return;
    }
    showToast("Đã xóa khóa học thành công");
    fetchCourses();
  };

  const handleDuplicate = async (course: Course) => {
    const { id, ...rest } = course;
    const payload = {
      ...rest,
      title: `${course.title} [Copy]`,
      slug: `${course.slug}-copy-${Date.now()}`,
      published: false,
      comingSoon: false,
    };
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Không thể nhân bản khóa học" }));
      showToast(err.error || "Không thể nhân bản khóa học", "error");
      return;
    }
    showToast("Đã nhân bản khóa học thành công");
    fetchCourses();
  };

  const updateCourse = async (partial: Partial<Course> & { id: string }) => {
    const res = await fetch("/api/admin/courses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Không thể cập nhật khóa học" }));
      showToast(err.error || "Không thể cập nhật khóa học", "error");
      return;
    }
    showToast("Đã cập nhật trạng thái");
    fetchCourses();
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      hidePrice: form.hidePrice || false,
      isHidden: form.isHidden || false,
      published: form.published || false,
      comingSoon: form.comingSoon || false,
    };

    const res = await fetch("/api/admin/courses", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...payload, id: editing.id } : payload),
    });

    if (res.ok) {
      showToast(editing ? "Cập nhật khóa học thành công" : "Tạo khóa học thành công");
      setShowForm(false);
      fetchCourses();
    } else {
      const err = await res.json();
      showToast(err.error || "Lỗi khi lưu khóa học", "error");
    }
  };

  // Curriculum Helpers
  const startEditPhase = (index: number) => {
    const item = form.curriculum[index];
    setEditingPhaseIndex(index);
    setCurrPhase(item.phase);
    setCurrTitle(item.title);
    setCurrLessons(item.lessons);
    setCurrTopics((item.topics || []).join("\n"));
  };

  const cancelEditPhase = () => {
    setEditingPhaseIndex(null);
    setCurrPhase(""); setCurrTitle(""); setCurrLessons(0); setCurrTopics("");
  };

  const savePhase = () => {
    if (!currTitle.trim()) return;
    const topics = currTopics.split("\n").map(t => t.trim()).filter(Boolean);
    const item: CurriculumItem = {
      phase: currPhase || `Giai đoạn ${form.curriculum.length + 1}`,
      title: currTitle.trim(),
      lessons: currLessons || 0,
      topics: topics.length > 0 ? topics : undefined,
    };

    const updatedCurriculum = [...form.curriculum];
    if (editingPhaseIndex !== null) {
      updatedCurriculum[editingPhaseIndex] = item;
    } else {
      updatedCurriculum.push(item);
    }

    setForm({ ...form, curriculum: updatedCurriculum });
    cancelEditPhase();
  };

  const moveCurriculum = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === form.curriculum.length - 1)) return;
    const updated = [...form.curriculum];
    const target = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setForm({ ...form, curriculum: updated });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 duration-300">
          <div className={`px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border ${toast.type === "success" ? "bg-white border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"}`}>
            {toast.type === "success" ? (
              <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            ) : (
              <div className="h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
            )}
            <span className="font-black text-sm uppercase tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý Khóa học</h2>
          <p className="text-slate-500 font-medium mt-1">Sắp xếp, biên tập nội dung và lộ trình đào tạo</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border-2 ${syncing ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-white border-blue-50 text-blue-600 hover:bg-blue-50"}`}
          >
            <svg className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}
          </button>
          <button
            onClick={fetchCourses}
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl font-bold text-sm bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới
          </button>
          <button
            onClick={handleNew}
            className="bg-green-600 text-white px-6 py-2.5 rounded-2xl font-black text-sm hover:bg-green-700 transition-all shadow-xl shadow-green-100 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Thêm khóa học
          </button>
        </div>
      </div>

      {/* Course List Table */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        {error && (
          <div className="border-b border-red-100 bg-red-50 px-8 py-4 text-sm font-bold text-red-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
            <button onClick={fetchCourses} className="text-xs uppercase tracking-widest font-black hover:underline">Thử lại ngay</button>
          </div>
        )}

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Khóa học</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Hình thức</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Giai đoạn</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Giá / Học viên</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && courses.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-6"><div className="h-12 bg-slate-100 rounded-2xl w-64"></div></td>
                    <td colSpan={5} className="px-6 py-6"><div className="h-6 bg-slate-50 rounded-full w-full"></div></td>
                  </tr>
                ))
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <svg className="h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                      <p className="text-slate-400 font-bold">Chưa có khóa học nào được tạo.</p>
                    </div>
                  </td>
                </tr>
              ) : courses.map((course) => (
                <tr key={course.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-28 rounded-2xl bg-slate-100 overflow-hidden border border-slate-100 shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-500">
                        {course.imageUrl ? (
                          <img src={course.imageUrl} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-300">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-black text-slate-800 leading-tight group-hover:text-green-600 transition-colors">{course.title}</p>
                        <p className="text-xs text-slate-400 font-bold mt-1 tracking-tight">/{course.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="inline-flex px-3 py-1.5 rounded-xl bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-100">
                      {course.courseType || "online"}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-wrap gap-1.5 max-w-[150px]">
                      {course.published ? (
                        <span className="px-2 py-1 rounded-lg bg-green-50 text-green-600 text-[10px] font-black uppercase">Đã đăng</span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-black uppercase">Nháp</span>
                      )}
                      {course.comingSoon && <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-black uppercase">Sắp ra</span>}
                      {course.isHidden && <span className="px-2 py-1 rounded-lg bg-slate-200 text-slate-600 text-[10px] font-black uppercase">Đã ẩn</span>}
                      {course.hidePrice && <span className="px-2 py-1 rounded-lg bg-red-50 text-red-500 text-[10px] font-black uppercase">Ẩn giá</span>}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-black text-slate-800 leading-none">{course.curriculum?.length || 0}</span>
                      <span className="text-[9px] font-black text-slate-300 uppercase mt-1">Phần học</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <p className={`text-base font-black ${course.hidePrice ? "text-red-500" : "text-slate-800"}`}>
                      {course.hidePrice ? "Ẩn giá" : formatPrice(course.price)}
                    </p>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">{course.students} học viên</p>
                  </td>
                  <td className="px-8 py-6 text-right relative">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(course)}
                        className="h-10 px-4 rounded-xl bg-blue-50 text-blue-600 text-xs font-black hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center gap-2"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        SỬA
                      </button>

                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === course.id ? null : course.id); }}
                          className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${activeMenu === course.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenu === course.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-[60] animate-in zoom-in-95 duration-200 origin-top-right">
                            <div className="px-4 py-2 border-b border-slate-50 mb-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cấu hình nhanh</p>
                            </div>
                            <button onClick={() => updateCourse({ id: course.id, published: !course.published })} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-green-600 flex items-center gap-3">
                              <div className={`h-2 w-2 rounded-full ${course.published ? "bg-green-500" : "bg-slate-300"}`}></div>
                              {course.published ? "Hủy đăng" : "Đăng khóa học"}
                            </button>
                            <button onClick={() => updateCourse({ id: course.id, isHidden: !course.isHidden })} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              {course.isHidden ? "Hiện khóa học" : "Ẩn khỏi DS"}
                            </button>
                            <button onClick={() => updateCourse({ id: course.id, hidePrice: !course.hidePrice })} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-red-500 flex items-center gap-3">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.225 0 2.39.215 3.478.608M14 14l6 6m-3-3l3-3m-3 3l-3-3m3 3V10" /></svg>
                              {course.hidePrice ? "Hiện giá tiền" : "Ẩn giá tiền"}
                            </button>
                            <div className="h-px bg-slate-50 my-1"></div>
                            <button onClick={() => handleDuplicate(course)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-3">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" /></svg>
                              Nhân bản
                            </button>
                            <button onClick={() => handleDelete(course.id)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-3">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              Xóa vĩnh viễn
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{editing ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}</h2>
                <p className="text-slate-400 text-sm font-medium">Hoàn thiện thông tin để hiển thị trên trang web</p>
              </div>
              <button onClick={() => setShowForm(false)} className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide pb-20">
              {/* Basic Info Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1.5 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Thông tin cơ bản</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Tiêu đề khóa học *</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                      value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Ví dụ: Data Analysis Professional"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Đường dẫn (Slug)</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                      value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="Ví dụ: data-analysis-pro"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase ml-1">Mô tả ngắn</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                    value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase ml-1">Mô tả chi tiết</label>
                  <div className="rounded-2xl overflow-hidden border border-slate-100">
                    <RichTextEditor value={form.description || ""} onChange={(v) => setForm({ ...form, description: v })} minHeight="250px" />
                  </div>
                </div>
              </section>

              {/* Pricing & Media Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1.5 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Giá cả & Hình ảnh</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Giá bán (VNĐ)</label>
                    <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Giá gốc</label>
                    <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Link ảnh bìa</label>
                    <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
                  </div>
                </div>
              </section>

              {/* Curriculum Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1.5 bg-purple-500 rounded-full"></div>
                  <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Lộ trình học tập</h3>
                </div>

                <div className="space-y-4">
                  {form.curriculum.map((item, i) => (
                    <div key={i} className="space-y-4">
                      {editingPhaseIndex === i ? (
                        /* Inline Edit Form */
                        <div className="bg-blue-50/50 border-2 border-blue-200 rounded-[32px] p-8 space-y-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Đang sửa Giai đoạn {i + 1}</p>
                            <button onClick={cancelEditPhase} className="text-xs font-bold text-red-500 hover:underline">Hủy bỏ</button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tên chương</label>
                              <input className="w-full bg-white border border-blue-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={currTitle} onChange={(e) => setCurrTitle(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Giai đoạn</label>
                              <input className="w-full bg-white border border-blue-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={currPhase} onChange={(e) => setCurrPhase(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Số bài học</label>
                              <input type="number" className="w-full bg-white border border-blue-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={currLessons} onChange={(e) => setCurrLessons(Number(e.target.value))} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nội dung chi tiết</label>
                            <textarea className="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 text-sm outline-none h-32 focus:ring-2 focus:ring-blue-500/20 transition-all" value={currTopics} onChange={(e) => setCurrTopics(e.target.value)} />
                          </div>
                          <button onClick={savePhase} className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
                            ✓ Cập nhật giai đoạn
                          </button>
                        </div>
                      ) : (
                        /* Display Card */
                        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 flex flex-col sm:flex-row gap-6 group hover:bg-slate-50 transition-colors relative">
                          <div className="flex flex-col items-center justify-center bg-white h-16 w-16 rounded-2xl shadow-sm border border-slate-100 shrink-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Phase</span>
                            <span className="text-xl font-black text-slate-800 leading-none">{i + 1}</span>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-base font-bold text-slate-800">{item.title}</p>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => moveCurriculum(i, 'up')} className="p-1.5 text-slate-400 hover:text-slate-600">▲</button>
                                <button onClick={() => moveCurriculum(i, 'down')} className="p-1.5 text-slate-400 hover:text-slate-600">▼</button>
                                <button onClick={() => startEditPhase(i)} className="p-1.5 text-blue-500 hover:text-blue-700 bg-blue-50 rounded-lg ml-1">✎</button>
                                <button onClick={() => setForm({...form, curriculum: form.curriculum.filter((_, idx) => idx !== i)})} className="p-1.5 text-red-400 hover:text-red-600 ml-1 bg-red-50 rounded-lg">✕</button>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500 font-medium">{item.lessons} bài học</span>
                              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{item.phase}</span>
                            </div>
                            {item.topics && item.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {item.topics.map((t, j) => <span key={j} className="px-2 py-0.5 bg-white border border-slate-100 rounded text-[10px] text-slate-600 font-medium">{t}</span>)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New Phase Section */}
                  {editingPhaseIndex === null && (
                    <div className="bg-green-50/30 border border-green-100 rounded-[32px] p-8 space-y-4">
                      <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-2">Thêm giai đoạn mới</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tên chương</label>
                          <input className="w-full bg-white border border-green-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/20" placeholder="e.g. SQL cơ bản" value={currTitle} onChange={(e) => setCurrTitle(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Giai đoạn</label>
                          <input className="w-full bg-white border border-green-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/20" placeholder="e.g. 1" value={currPhase} onChange={(e) => setCurrPhase(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Số bài</label>
                          <input type="number" className="w-full bg-white border border-green-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/20" placeholder="e.g. 8" value={currLessons} onChange={(e) => setCurrLessons(Number(e.target.value))} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nội dung chi tiết (Mỗi dòng một ý)</label>
                        <textarea className="w-full bg-white border border-green-100 rounded-xl px-4 py-3 text-sm outline-none h-24 focus:ring-2 focus:ring-green-500/20 transition-all" placeholder="Nhập nội dung..." value={currTopics} onChange={(e) => setCurrTopics(e.target.value)} />
                      </div>
                      <button onClick={savePhase} className="bg-green-600 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl shadow-green-100 hover:bg-green-700 transition-all">
                        + Xác nhận thêm giai đoạn
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={form.published} onChange={(e) => setForm({...form, published: e.target.checked})} className="h-5 w-5 rounded-lg text-green-600 focus:ring-green-500 border-slate-200" />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-wide">Xuất bản</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={form.comingSoon} onChange={(e) => setForm({...form, comingSoon: e.target.checked})} className="h-5 w-5 rounded-lg text-amber-600 focus:ring-amber-500 border-slate-200" />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-wide text-amber-600">Coming Soon</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={Boolean(form.isHidden)} onChange={(e) => setForm({...form, isHidden: e.target.checked})} className="h-5 w-5 rounded-lg text-slate-600 focus:ring-slate-500 border-slate-200" />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-wide">Ẩn khóa học</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={Boolean(form.hidePrice)} onChange={(e) => setForm({...form, hidePrice: e.target.checked})} className="h-5 w-5 rounded-lg text-red-600 focus:ring-red-500 border-slate-200" />
                  <span className="text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors uppercase tracking-wide">Ẩn giá</span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">Hủy bỏ</button>
                <button onClick={handleSave} className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                  {editing ? "Cập nhật thay đổi" : "Khởi tạo khóa học"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

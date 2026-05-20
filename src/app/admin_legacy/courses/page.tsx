"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import BrandLogo from "@/components/BrandLogo";
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

function safeGetSessionItem(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function getValidDate(value: string | undefined | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string | undefined | null) {
  const date = getValidDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [editing, setEditing] = useState<Course | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Course, "id">>(emptyCourse);

  const [currPhase, setCurrPhase] = useState("");
  const [currTitle, setCurrTitle] = useState("");
  const [currLessons, setCurrLessons] = useState(0);
  const [currTopics, setCurrTopics] = useState("");
  const [editingTopicsIndex, setEditingTopicsIndex] = useState<number | null>(null);
  const [editingTopicsValue, setEditingTopicsValue] = useState("");
  const [editingCurriculumIndex, setEditingCurriculumIndex] = useState<number | null>(null);
  const [editCurriculumPhase, setEditCurriculumPhase] = useState("");
  const [editCurriculumTitle, setEditCurriculumTitle] = useState("");
  const [editCurriculumLessons, setEditCurriculumLessons] = useState(0);
  const [newOutcome, setNewOutcome] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/courses?includeCurriculum=1");
      const data = await res.json().catch(() => []);
      setCourses(Array.isArray(data) ? data : []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isAuth = safeGetSessionItem("admin_auth");
    if (!isAuth) {
      router.replace("/admin/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    fetchCourses();
  }, [authChecked, fetchCourses]);

  const currentRole = useMemo(() => decodeStoredRole(safeGetSessionItem("admin_role")), []);
  const adminName = useMemo(() => safeGetSessionItem("admin_name") || "Admin", []);

  function handleNew() {
    setEditing(null);
    setForm(emptyCourse);
    setCurrPhase("");
    setCurrTitle("");
    setCurrLessons(0);
    setCurrTopics("");
    setEditingTopicsIndex(null);
    setEditingTopicsValue("");
    setEditingCurriculumIndex(null);
    setEditCurriculumPhase("");
    setEditCurriculumTitle("");
    setEditCurriculumLessons(0);
    setNewOutcome("");
    setNewTarget("");
    setShowForm(true);
  }

  function handleEdit(course: Course) {
    setEditing(course);
    const { id, ...rest } = course;
    setForm(rest);
    setShowForm(true);
  }

  function addCurriculumItem() {
    if (!currTitle.trim()) return;
    const topics = currTopics.split("\n").map((t) => t.trim()).filter(Boolean);
    const item: CurriculumItem = {
      phase: currPhase || `Giai đoạn ${form.curriculum.length + 1}`,
      title: currTitle.trim(),
      lessons: currLessons || 0,
      topics: topics.length > 0 ? topics : undefined,
    };
    setForm({ ...form, curriculum: [...form.curriculum, item] });
    setCurrPhase("");
    setCurrTitle("");
    setCurrLessons(0);
    setCurrTopics("");
  }

  function removeCurriculumItem(index: number) {
    setForm({ ...form, curriculum: form.curriculum.filter((_, i) => i !== index) });
  }

  function moveCurriculumUp(index: number) {
    if (index === 0) return;
    const updated = [...form.curriculum];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setForm({ ...form, curriculum: updated });
  }

  function moveCurriculumDown(index: number) {
    if (index === form.curriculum.length - 1) return;
    const updated = [...form.curriculum];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setForm({ ...form, curriculum: updated });
  }

  function saveTopicsEdit(index: number) {
    const topics = editingTopicsValue.split("\n").map((t) => t.trim()).filter(Boolean);
    const updated = [...form.curriculum];
    updated[index] = { ...updated[index], topics: topics.length > 0 ? topics : undefined };
    setForm({ ...form, curriculum: updated });
    setEditingTopicsIndex(null);
    setEditingTopicsValue("");
  }

  function startEditCurriculumItem(index: number) {
    setEditingCurriculumIndex(index);
    setEditCurriculumPhase(form.curriculum[index].phase);
    setEditCurriculumTitle(form.curriculum[index].title);
    setEditCurriculumLessons(form.curriculum[index].lessons);
  }

  function saveCurriculumItemEdit() {
    if (editingCurriculumIndex === null) return;
    const updated = [...form.curriculum];
    updated[editingCurriculumIndex] = {
      ...updated[editingCurriculumIndex],
      phase: editCurriculumPhase,
      title: editCurriculumTitle,
      lessons: editCurriculumLessons,
    };
    setForm({ ...form, curriculum: updated });
    setEditingCurriculumIndex(null);
  }

  function addOutcome() {
    if (!newOutcome.trim()) return;
    setForm({ ...form, outcomes: [...form.outcomes, newOutcome.trim()] });
    setNewOutcome("");
  }

  function removeOutcome(index: number) {
    setForm({ ...form, outcomes: form.outcomes.filter((_, i) => i !== index) });
  }

  function addTarget() {
    if (!newTarget.trim()) return;
    setForm({ ...form, targetAudience: [...form.targetAudience, newTarget.trim()] });
    setNewTarget("");
  }

  function removeTarget(index: number) {
    setForm({ ...form, targetAudience: form.targetAudience.filter((_, i) => i !== index) });
  }

  async function handleSave() {
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      instructor: form.instructor || "Đội Ngũ DUA Edu",
      courseType: form.courseType || "online",
      schedule: form.schedule || "",
      hours: form.hours || "",
      category: form.category || "",
      totalLessons: form.totalLessons || 0,
      students: form.students || 0,
      rating: form.rating || 0,
      reviews: form.reviews || 0,
      price: form.price || 0,
      originalPrice: form.originalPrice || 0,
      discount: form.discount || 0,
      hidePrice: form.hidePrice || false,
      published: form.published || false,
      comingSoon: form.comingSoon || false,
      curriculum: form.curriculum || [],
      outcomes: form.outcomes || [],
      targetAudience: form.targetAudience || [],
    };

    try {
      const res = await fetch("/api/admin/courses", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { ...payload, id: editing.id } : payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Không thể lưu khóa học");
        return;
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyCourse);
      await fetchCourses();
    } catch {
      alert("Không thể lưu khóa học");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa khóa học này?")) return;
    const res = await fetch(`/api/admin/courses?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Không thể xóa khóa học" }));
      alert(err.error || "Không thể xóa khóa học");
      return;
    }
    fetchCourses();
  }

  async function updateCourse(partial: Partial<Course> & { id: string }) {
    const res = await fetch("/api/admin/courses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Không thể cập nhật khóa học" }));
      alert(err.error || "Không thể cập nhật khóa học");
      return;
    }

    fetchCourses();
  }

  async function handleDuplicate(course: Course) {
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
      alert(err.error || "Không thể nhân bản khóa học");
      return;
    }
    fetchCourses();
  }

  if (!authChecked) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">Đang kiểm tra đăng nhập...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo href="/admin" showText={false} imageClassName="h-14 w-14" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Quản lý khóa học</p>
              <p className="text-xs text-gray-500">{adminName}{currentRole ? ` • ${currentRole}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Về admin</Link>
            <Link href="/courses" className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700">Xem trang client</Link>
            <button onClick={handleNew} className="px-4 py-2 rounded-xl bg-emerald-500 text-gray-900 text-sm font-semibold hover:bg-emerald-600">+ Thêm khóa học</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Tổng khóa học", value: courses.length },
            { label: "Đã xuất bản", value: courses.filter((c) => c.published).length },
            { label: "Sắp ra mắt", value: courses.filter((c) => c.comingSoon).length },
            { label: "Đã ẩn", value: courses.filter((c) => c.isHidden).length },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Danh sách khóa học</h1>
              <p className="text-sm text-gray-500">CRUD trực tiếp với PostgreSQL cho cả khóa học và lộ trình</p>
            </div>
            <button onClick={fetchCourses} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Làm mới</button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500">Đang tải...</div>
          ) : courses.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <p className="text-xl">Chưa có khóa học nào</p>
              <p className="mt-1">Nhấn "+ Thêm khóa học" để bắt đầu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Khóa học</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Danh mục</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Loại</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Lộ trình</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Giá</th>
                    <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {course.imageUrl ? (
                            <img src={course.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center text-green-700 font-bold">C</div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                              <span>{course.title}</span>
                              {course.published && <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-full font-bold">Đã xuất bản</span>}
                              {course.comingSoon && <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">Coming Soon</span>}
                              {course.isHidden && <span className="text-[10px] bg-gray-500/10 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">Đã ẩn</span>}
                              {course.hidePrice && <span className="text-[10px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded-full font-bold">Đã ẩn giá</span>}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{course.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs bg-green-500/10 text-green-700 px-2 py-0.5 rounded-full">{course.category}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs bg-slate-500/10 text-slate-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          {course.courseType || "online"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-500">
                        {course.curriculum?.length || 0} giai đoạn
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-medium text-green-700">{course.hidePrice ? "Ẩn giá" : formatPrice(course.price)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {!course.published && (
                            <button onClick={() => updateCourse({ id: course.id, published: true })} className="text-xs font-medium px-2 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100">Xuất bản</button>
                          )}
                          <button onClick={() => updateCourse({ id: course.id, comingSoon: !course.comingSoon })} className="text-xs font-medium px-2 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-amber-50 hover:text-amber-600">
                            {course.comingSoon ? "Tắt Sắp ra mắt" : "Sắp ra mắt"}
                          </button>
                          <button onClick={() => updateCourse({ id: course.id, isHidden: !course.isHidden })} className="text-xs font-medium px-2 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700">
                            {course.isHidden ? "Hiện" : "Ẩn"}
                          </button>
                          <button onClick={() => updateCourse({ id: course.id, hidePrice: !course.hidePrice })} className="text-xs font-medium px-2 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-700">
                            {course.hidePrice ? "Hiện giá" : "Ẩn giá"}
                          </button>
                          <button onClick={() => handleDuplicate(course)} className="text-xs font-medium px-2 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100">Nhân bản</button>
                          <button onClick={() => handleEdit(course)} className="text-xs font-medium px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">Sửa</button>
                          <button onClick={() => handleDelete(course.id)} className="text-xs font-medium px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editing ? "Chỉnh sửa khóa học" : "Thêm khóa học mới"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-600 hover:text-gray-500 text-2xl">×</button>
            </div>

            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên khóa học *</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                <RichTextEditor value={form.description || ""} onChange={(description) => setForm({ ...form, description })} placeholder="Nhập mô tả chi tiết khóa học..." minHeight="180px" maxHeight="320px" editorClassName="bg-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link ảnh minh hoạ</label>
                <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.imageUrl || ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại khóa học</label>
                  <select
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
                    value={form.courseType || "online"}
                    onChange={(e) => setForm({ ...form, courseType: e.target.value as Course["courseType"] })}
                  >
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                    <option value="video">Video</option>
                    <option value="e_learning">E-learning</option>
                    <option value="self_study">Self-study</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giảng viên</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
                  <input type="number" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc</label>
                  <input type="number" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá (%)</label>
                  <input type="number" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tổng bài học</label>
                  <input type="number" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.totalLessons} onChange={(e) => setForm({ ...form, totalLessons: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Học viên</label>
                  <input type="number" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.students} onChange={(e) => setForm({ ...form, students: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
                  <input type="number" step="0.1" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số đánh giá</label>
                  <input type="number" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.reviews} onChange={(e) => setForm({ ...form, reviews: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày khai giảng</label>
                  <input type="date" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input type="date" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lịch học</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Thứ 2, 4, 6" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ học</label>
                  <input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="20:00 - 22:00" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lộ trình học</label>
                {form.curriculum.map((item, i) => (
                  <div key={i} className="mb-3 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {editingCurriculumIndex === i ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input className="border rounded px-2 py-1.5 text-sm w-28" placeholder="Giai đoạn" value={editCurriculumPhase} onChange={(e) => setEditCurriculumPhase(e.target.value)} />
                          <input className="border rounded px-2 py-1.5 text-sm flex-1" placeholder="Tên chương" value={editCurriculumTitle} onChange={(e) => setEditCurriculumTitle(e.target.value)} />
                          <input type="number" className="border rounded px-2 py-1.5 text-sm w-20" placeholder="Số bài" value={editCurriculumLessons} onChange={(e) => setEditCurriculumLessons(Number(e.target.value))} />
                          <button type="button" onClick={saveCurriculumItemEdit} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700">Lưu</button>
                          <button type="button" onClick={() => setEditingCurriculumIndex(null)} className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-300">Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-medium text-green-600">{item.phase}:</span>
                        <span className="flex-1 font-medium">{item.title}</span>
                        <span className="text-gray-600">{item.lessons} bài</span>
                        <button type="button" onClick={() => moveCurriculumUp(i)} className="text-gray-400 hover:text-gray-700 text-xs px-1" title="Lên">▲</button>
                        <button type="button" onClick={() => moveCurriculumDown(i)} className="text-gray-400 hover:text-gray-700 text-xs px-1" title="Xuống">▼</button>
                        <button type="button" onClick={() => {
                          setEditingTopicsIndex(editingTopicsIndex === i ? null : i);
                          setEditingTopicsValue((item.topics || []).join("\n"));
                        }} className="text-blue-500 hover:text-blue-700 text-xs font-medium px-1">
                          {editingTopicsIndex === i ? "Đóng ND" : "Sửa ND"}
                        </button>
                        <button type="button" onClick={() => startEditCurriculumItem(i)} className="text-purple-500 hover:text-purple-700 text-xs font-medium px-1">Sửa</button>
                        <button type="button" onClick={() => removeCurriculumItem(i)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
                      </div>
                    )}
                    {item.topics && item.topics.length > 0 && editingTopicsIndex !== i && editingCurriculumIndex !== i && (
                      <div className="mt-2 pl-4 border-l-2 border-green-200 space-y-0.5">
                        {item.topics.map((topic, j) => (
                          <p key={j} className="text-xs text-gray-500">• {topic}</p>
                        ))}
                      </div>
                    )}
                    {editingTopicsIndex === i && (
                      <div className="mt-2">
                        <textarea
                          className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
                          rows={4}
                          value={editingTopicsValue}
                          onChange={(e) => setEditingTopicsValue(e.target.value)}
                          placeholder="Mỗi dòng là 1 nội dung học"
                        />
                        <button type="button" onClick={() => saveTopicsEdit(i)} className="mt-1 bg-green-600 text-gray-900 px-3 py-1 rounded text-xs font-medium hover:bg-green-700">Lưu nội dung</button>
                      </div>
                    )}
                  </div>
                ))}

                <div className="space-y-2 mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-medium text-green-700">Thêm giai đoạn mới</p>
                  <div className="flex gap-2">
                    <input className="border rounded px-2 py-1.5 text-sm w-28" placeholder="Giai đoạn" value={currPhase} onChange={(e) => setCurrPhase(e.target.value)} />
                    <input className="border rounded px-2 py-1.5 text-sm flex-1" placeholder="Tên chương" value={currTitle} onChange={(e) => setCurrTitle(e.target.value)} />
                    <input type="number" className="border rounded px-2 py-1.5 text-sm w-20" placeholder="Số bài" value={currLessons} onChange={(e) => setCurrLessons(Number(e.target.value))} />
                  </div>
                  <textarea className="w-full border rounded px-2 py-1.5 text-sm" rows={3} value={currTopics} onChange={(e) => setCurrTopics(e.target.value)} placeholder="Nội dung học (mỗi dòng 1 nội dung)" />
                  <button type="button" onClick={addCurriculumItem} className="bg-green-600 text-gray-900 px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700">+ Thêm giai đoạn</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kết quả đạt được</label>
                {form.outcomes.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1 text-sm">
                    <span className="flex-1 bg-gray-50 p-2 rounded">{item}</span>
                    <button type="button" onClick={() => removeOutcome(i)} className="text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input className="border rounded px-2 py-1.5 text-sm flex-1" placeholder="Thêm kết quả đạt được" value={newOutcome} onChange={(e) => setNewOutcome(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addOutcome()} />
                  <button type="button" onClick={addOutcome} className="bg-green-500/10 text-green-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-green-200">+</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Đối tượng phù hợp</label>
                {form.targetAudience.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1 text-sm">
                    <span className="flex-1 bg-gray-50 p-2 rounded">{item}</span>
                    <button type="button" onClick={() => removeTarget(i)} className="text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input className="border rounded px-2 py-1.5 text-sm flex-1" placeholder="Thêm đối tượng" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTarget()} />
                  <button type="button" onClick={addTarget} className="bg-green-500/10 text-green-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-green-200">+</button>
                </div>
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Xuất bản:</label>
                  <button type="button" onClick={() => setForm({ ...form, published: !form.published })} className={`px-3 py-1 rounded-full text-xs font-medium transition ${form.published ? "bg-green-500/10 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {form.published ? "Đã xuất bản" : "Nháp"}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Coming Soon:</label>
                  <button type="button" onClick={() => setForm({ ...form, comingSoon: !form.comingSoon })} className={`px-3 py-1 rounded-full text-xs font-medium transition ${form.comingSoon ? "bg-amber-500/10 text-amber-600" : "bg-gray-100 text-gray-500"}`}>
                    {form.comingSoon ? "Bật" : "Tắt"}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Ẩn giá:</label>
                  <button type="button" onClick={() => setForm({ ...form, hidePrice: !form.hidePrice })} className={`px-3 py-1 rounded-full text-xs font-medium transition ${form.hidePrice ? "bg-red-500/10 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                    {form.hidePrice ? "Bật" : "Tắt"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-lg border text-gray-500 hover:bg-gray-100 transition">Hủy</button>
              <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition shadow">
                {editing ? "Cập nhật" : "Tạo khóa học"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

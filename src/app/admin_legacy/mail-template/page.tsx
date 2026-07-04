"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import BrandLogo from "@/components/BrandLogo";
import { htmlToTextPreserveLineBreaks, renderMailTemplateHtml } from "@/lib/mail-template-renderer";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

interface CourseOption {
  id: string;
  title: string;
  slug?: string;
  course_type?: string;
  price?: number;
  hide_price?: boolean;
}

interface TemplateRow {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug?: string;
  courseType?: string;
  coursePrice?: number;
  courseHidePrice?: boolean;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt?: string;
}

const ROLE_LABELS: Record<string, string> = {
  system_admin: "Quản trị hệ thống",
  content_manager: "Quản lý nội dung",
};

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

function statusBadge(active: boolean) {
  return active ? "bg-emerald-500/10 text-emerald-700" : "bg-gray-500/10 text-gray-600";
}

function formatPrice(value?: number) {
  if (!value) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPreviewContext(course?: CourseOption | null) {
  const title = course?.title || "Khóa học mẫu";
  const slug = course?.slug || "khoa-hoc-mau";
  const price = Number(course?.price || 0);
  return {
    full_name: "Nguyễn Thái",
    email: "nguyenthai@gmail.com",
    phone: "0912345678",
    course_title: title,
    course_slug: slug,
    course_price: price ? new Intl.NumberFormat("vi-VN").format(price) + "đ" : "Miễn phí",
    course_type: course?.course_type || "online",
    course_link: `https://duadata.net/courses/${slug}`,
    fanpage_link: "https://www.facebook.com/duadata",
    learning_needs: "Mình muốn học để áp dụng vào công việc thực tế.",
    facebook: "https://facebook.com/nguyenthai",
    learner_group: "2",
    payment_amount: price ? new Intl.NumberFormat("vi-VN").format(price) + "đ" : "Miễn phí",
    amount_due: price ? new Intl.NumberFormat("vi-VN").format(price) + "đ" : "Miễn phí",
    payment_note: "nguyenthai@gmail.com - DUA Edu",
    payment_qr: "https://i.ibb.co/WWpB9mvS/Screenshot-2026-05-09-at-08-36-45.png",
    registered_at: "09/05/2026 08:00",
    course_category: course?.hide_price ? "Ẩn giá" : "Hiện giá",
  };
}

function renderTemplatePreview(template: string, context: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, token) => {
    const value = context[token];
    return value == null ? "" : escapeHtml(String(value));
  });
}

export default function AdminMailTemplatePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("silasnguyen98@gmail.com");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [form, setForm] = useState({
    courseId: "",
    subject: "",
    body: "",
    isActive: true,
  });

  const currentRole = useMemo(() => decodeStoredRole(safeGetSessionItem("admin_role")), []);
  const adminName = useMemo(() => safeGetSessionItem("admin_name") || "Admin", []);

  const buildAuthHeader = useCallback(() => {
    const stored = safeGetSessionItem("admin_role");
    if (!stored) return {} as Record<string, string>;
    return { Authorization: `Bearer ${decodeStoredRole(stored) || stored.trim()}` } as Record<string, string>;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mail-templates", {
        headers: buildAuthHeader(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Không thể tải template");
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
      setCourses(Array.isArray(data.courses) ? data.courses : []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể tải template");
      setTemplates([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [buildAuthHeader]);

  useEffect(() => {
    const isAuth = safeGetSessionItem("admin_auth");
    if (!isAuth) {
      router.replace("/admin/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    const role = decodeStoredRole(safeGetSessionItem("admin_role"));
    const access = role === "system_admin" || role === "content_manager";
    setAllowed(access);
    if (authChecked && access) fetchData();
  }, [authChecked, fetchData]);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((template) =>
      !q ||
      template.courseTitle.toLowerCase().includes(q) ||
      template.subject.toLowerCase().includes(q) ||
      template.body.toLowerCase().includes(q)
    );
  }, [templates, search]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === form.courseId) || null,
    [courses, form.courseId]
  );

  const previewContext = useMemo(() => getPreviewContext(selectedCourse), [selectedCourse]);
  const previewSubject = useMemo(
    () => renderTemplatePreview(form.subject || "Xác nhận thông tin đăng ký khóa học {{course_title}}", previewContext),
    [form.subject, previewContext]
  );
  const previewHtml = useMemo(
    () =>
      renderMailTemplateHtml(
        form.body ||
          `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <p>Chào <strong>{{full_name}}</strong>,</p>
            <p>DUA Edu đã nhận được thông tin bạn quan tâm đến khóa học <strong>{{course_title}}</strong>.</p>
            <p>Fanpage hỗ trợ: <a href="{{fanpage_link}}">{{fanpage_link}}</a></p>
          </div>`,
        previewContext
      ),
    [form.body, previewContext]
  );
  const previewText = useMemo(
    () => htmlToTextPreserveLineBreaks(previewHtml),
    [previewHtml]
  );

  function resetForm() {
    setEditing(null);
    setForm({
      courseId: courses[0]?.id || "",
      subject: "",
      body: "",
      isActive: true,
    });
  }

  function startCreate() {
    resetForm();
  }

  function startEdit(template: TemplateRow) {
    setEditing(template);
    setForm({
      courseId: template.courseId,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
    });
  }

  async function saveTemplate() {
    if (!form.courseId || !form.subject.trim() || !form.body.trim()) {
      alert("Vui lòng chọn khóa học, tiêu đề và nội dung");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/mail-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(),
        },
        body: JSON.stringify({
          id: editing?.id,
          ...form,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Không thể lưu template");
      await fetchData();
      resetForm();
      alert("Đã lưu template");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể lưu template");
    } finally {
      setSaving(false);
    }
  }

  async function sendTestMail() {
    if (!selectedCourse) {
      alert("Vui lòng chọn khóa học để gửi test mail");
      return;
    }

    const recipientEmail = testEmail.trim();
    if (!recipientEmail) {
      alert("Vui lòng nhập email test");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/admin/mail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(),
        },
        body: JSON.stringify({
          recipientEmail,
          subject: previewSubject,
          body: previewHtml,
          html: previewHtml,
          text: previewText,
          mailType: "manual",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Không thể gửi test mail");
      alert(`Đã gửi test mail tới ${recipientEmail}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể gửi test mail");
    } finally {
      setTesting(false);
    }
  }

  async function toggleTemplate(template: TemplateRow) {
    try {
      const res = await fetch("/api/admin/mail-templates", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(),
        },
        body: JSON.stringify({ id: template.id, isActive: !template.isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Không thể cập nhật");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể cập nhật");
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Xóa template này?")) return;
    try {
      const res = await fetch(`/api/admin/mail-templates?id=${id}`, {
        method: "DELETE",
        headers: buildAuthHeader(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Không thể xóa template");
      await fetchData();
      if (editing?.id === id) resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể xóa template");
    }
  }

  useEffect(() => {
    if (courses.length > 0 && !form.courseId) {
      setForm((prev) => ({ ...prev, courseId: courses[0].id }));
    }
  }, [courses, form.courseId]);

  if (!authChecked) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">Đang kiểm tra đăng nhập...</div>;
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center max-w-md">
          <p className="text-xl font-bold text-gray-900">Không có quyền truy cập</p>
          <p className="text-gray-500 mt-2">Trang template mail chỉ dành cho system_admin và content_manager.</p>
          <Link href="/admin" className="inline-flex mt-6 px-4 py-2 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700">
            Về admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo href="/admin" showText={false} imageClassName="h-14 w-14" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Mail template</p>
              <p className="text-xs text-gray-500">
                {adminName}{currentRole ? ` • ${ROLE_LABELS[currentRole] || currentRole}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Về admin</Link>
            <button onClick={fetchData} className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700">Làm mới</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Template mail xác nhận theo khóa học</h1>
              <p className="text-sm text-gray-500">
                Dùng placeholders như <code className="font-mono">{`{{full_name}}`}</code>, <code className="font-mono">{`{{course_title}}`}</code>, <code className="font-mono">{`{{email}}`}</code>.
              </p>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full lg:w-80 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
                placeholder="Tìm theo khóa học hoặc nội dung..."
              />
              <button onClick={startCreate} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 whitespace-nowrap">
                + Tạo template
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] gap-6 items-start">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khóa học</label>
                <select
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} {course.hide_price ? "(Ẩn giá)" : course.price ? `(${formatPrice(course.price)})` : "(Miễn phí)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Template áp dụng</p>
                <div className="w-full rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
                  Một template riêng cho một khóa học. Nếu khóa không có template riêng, hệ thống sẽ tự dùng mail mặc định theo loại khóa.
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
                  placeholder="Tiêu đề mail"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Nội dung mail</label>
                  <span className="text-xs text-gray-500">Rich text</span>
                </div>
                <RichTextEditor
                  value={form.body}
                  onChange={(body) => setForm({ ...form, body })}
                  placeholder="Soạn nội dung template..."
                  minHeight="360px"
                  maxHeight="720px"
                  editorClassName="bg-white"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Gợi ý placeholders: <code className="font-mono">{`{{full_name}}`}</code>, <code className="font-mono">{`{{course_title}}`}</code>, <code className="font-mono">{`{{email}}`}</code>, <code className="font-mono">{`{{payment_note}}`}</code>.
                </p>
              </div>

              <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                <button
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${form.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {form.isActive ? "Đang kích hoạt" : "Đã tắt"}
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : editing ? "Cập nhật template" : "Lưu template"}
                </button>
                <button
                  onClick={sendTestMail}
                  disabled={testing}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
                >
                  {testing ? "Đang gửi..." : "Test mail"}
                </button>
                {editing && (
                  <button
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Hủy sửa
                  </button>
                )}
                <div className="flex-1 min-w-[260px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email test</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
                    placeholder="Nhập email nhận test mail"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 xl:sticky xl:top-20">
              <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-white/80 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Email preview</p>
                      <h3 className="font-bold text-gray-900 text-lg">{previewSubject}</h3>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusBadge(form.isActive)}`}>
                      {form.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-slate-50">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 bg-gradient-to-r from-green-700 to-emerald-600 text-white">
                      <p className="text-xs uppercase tracking-[0.18em] text-emerald-100">DUA Edu</p>
                      <h4 className="text-xl font-bold mt-1">Xác nhận email cho {selectedCourse?.title || "khóa học"}</h4>
                      <p className="text-sm text-emerald-50 mt-1">
                        Template riêng theo khóa • {selectedCourse?.course_type || "online"}
                      </p>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5">
                        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Khóa học</p>
                          <p className="font-semibold text-gray-900">{selectedCourse?.title || "—"}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Người nhận mẫu</p>
                          <p className="font-semibold text-gray-900">Nguyễn Thái</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Email</p>
                          <p className="font-semibold text-gray-900">nguyenthai@gmail.com</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Ngày gửi</p>
                          <p className="font-semibold text-gray-900">{previewContext.registered_at}</p>
                        </div>
                      </div>

                      <div
                        className="prose prose-sm max-w-none text-gray-700 leading-relaxed
                          [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4
                          [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mb-3
                          [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mb-2
                          [&_p]:mb-3 [&_strong]:font-semibold [&_a]:text-green-600 [&_a]:underline
                          [&_img]:block [&_img]:mx-auto [&_img]:w-full [&_img]:max-w-[640px] [&_img]:aspect-video [&_img]:object-cover [&_img]:rounded-xl [&_img]:my-4
                          [&_blockquote]:border-l-4 [&_blockquote]:border-green-400 [&_blockquote]:pl-4 [&_blockquote]:text-gray-600
                          [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:p-2 [&_th]:border [&_th]:border-gray-200 [&_th]:p-2 [&_th]:bg-gray-50"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />

                      <div className="mt-5 bg-gray-50 rounded-2xl border border-gray-100 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Text preview</p>
                        <p className="text-sm text-gray-700 leading-6">{previewText}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="font-bold text-gray-900 mb-3">Tham số hỗ trợ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {[
                    "{{full_name}}",
                    "{{email}}",
                    "{{phone}}",
                    "{{course_title}}",
                    "{{course_slug}}",
                    "{{course_price}}",
                    "{{course_type}}",
                    "{{course_link}}",
                    "{{fanpage_link}}",
                    "{{learning_needs}}",
                    "{{facebook}}",
                    "{{learner_group}}",
                    "{{payment_amount}}",
                    "{{amount_due}}",
                    "{{payment_note}}",
                    "{{payment_qr}}",
                    "{{registered_at}}",
                  ].map((item) => (
                    <div key={item} className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 font-mono text-gray-700">{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Danh sách template</h2>
              <p className="text-sm text-gray-500">Mỗi khóa học chỉ có một template riêng.</p>
            </div>
            <div className="text-sm text-gray-500">{filteredTemplates.length} template</div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500">Đang tải...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <p className="text-xl">Chưa có template nào</p>
              <p className="mt-1">Tạo template đầu tiên ở khung phía trên.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Khóa học</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Tiêu đề</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50 align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{template.courseTitle}</div>
                        <div className="text-xs text-gray-500">{template.courseSlug}</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="font-medium text-gray-900">{template.subject}</div>
                        <div className="text-xs text-gray-500 mt-1 max-w-[360px]">{template.body.slice(0, 180)}{template.body.length > 180 ? "..." : ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge(template.isActive)}`}>
                          {template.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button onClick={() => startEdit(template)} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">Sửa</button>
                          <button onClick={() => toggleTemplate(template)} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">{template.isActive ? "Tắt" : "Bật"}</button>
                          <button onClick={() => deleteTemplate(template.id)} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">Xóa</button>
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
    </div>
  );
}

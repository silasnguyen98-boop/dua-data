"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { htmlToTextPreserveLineBreaks, renderMailTemplateHtml } from "@/lib/mail-template-renderer";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

interface CourseOption {
  id: string;
  title: string;
  slug?: string;
  course_type?: string;
  price?: number;
}

interface TemplateRow {
  id: string;
  courseId: string;
  courseTitle: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt?: string;
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
  if (typeof window === "undefined") return {};
  const stored = sessionStorage.getItem("admin_role");
  if (!stored) return {};
  return { Authorization: `Bearer ${decodeStoredRole(stored) || stored.trim()}` };
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
    payment_note: "nguyenthai@gmail.com - DUA Edu",
    payment_qr: "https://i.ibb.co/WWpB9mvS/Screenshot-2026-05-09-at-08-36-45.png",
    registered_at: "09/05/2026 08:00",
  };
}

export default function MailView() {
  const [activeTab, setActiveTab] = useState<"mail" | "template">("template");
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);
  const [form, setForm] = useState({
    courseId: "",
    subject: "",
    body: "",
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("silasnguyen98@gmail.com");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mail-templates", {
        headers: buildAuthHeader()
      });
      const data = await res.json();
      setTemplates(data.templates || []);
      setCourses(data.courses || []);
      if (data.courses?.length > 0 && !form.courseId) {
        setForm(prev => ({ ...prev, courseId: data.courses[0].id }));
      }
    } catch (err) {
      console.error("Failed to fetch mail data", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCourse = useMemo(() => courses.find(c => c.id === form.courseId), [courses, form.courseId]);
  const previewContext = useMemo(() => getPreviewContext(selectedCourse), [selectedCourse]);

  const previewHtml = useMemo(() =>
    renderMailTemplateHtml(form.body || "<p>Nội dung mẫu...</p>", previewContext),
    [form.body, previewContext]
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/mail-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader()
        },
        body: JSON.stringify({ id: editingTemplate?.id, ...form }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingTemplate(null);
        fetchData();
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa template này?")) return;
    try {
      const res = await fetch(`/api/admin/mail-templates?id=${id}`, {
        method: "DELETE",
        headers: buildAuthHeader()
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleTestMail = async () => {
    if (!testEmail) return alert("Nhập email test");
    setTesting(true);
    try {
      const res = await fetch("/api/admin/mail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader()
        },
        body: JSON.stringify({
          recipientEmail: testEmail,
          subject: form.subject || "Test Mail",
          body: previewHtml,
          html: previewHtml,
          text: htmlToTextPreserveLineBreaks(previewHtml),
          mailType: "manual"
        }),
      });
      if (res.ok) alert("Đã gửi test mail");
    } catch (err) {
      console.error("Test failed", err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Hệ thống Mail</h2>
          <p className="text-sm text-slate-500 font-medium">Quản lý gửi mail và các mẫu mail tự động</p>
        </div>
        <div className="flex p-1.5 bg-slate-100 rounded-[24px] w-fit">
          <button
            onClick={() => setActiveTab("mail")}
            className={`px-8 py-3 rounded-[18px] text-sm font-bold transition-all ${
              activeTab === "mail" ? "bg-white text-green-700 shadow-lg shadow-slate-200/50" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Gửi Mail
          </button>
          <button
            onClick={() => setActiveTab("template")}
            className={`px-8 py-3 rounded-[18px] text-sm font-bold transition-all ${
              activeTab === "template" ? "bg-white text-green-700 shadow-lg shadow-slate-200/50" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Mail Template
          </button>
        </div>
      </div>

      {activeTab === "mail" ? (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-12 text-center">
          <div className="h-20 w-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto mb-6">
            <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest italic">Tính năng đang cập nhật</h3>
          <p className="text-slate-400 mt-2 font-medium">Hệ thống gửi mail thủ công sẽ sớm có mặt tại đây.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingTemplate(null);
                setForm({ courseId: courses[0]?.id || "", subject: "", body: "", isActive: true });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              TẠO TEMPLATE MỚI
            </button>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khóa học</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiêu đề Mail</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-48"></div></td>
                        <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-64"></div></td>
                        <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-16"></div></td>
                        <td className="px-8 py-5 text-right"><div className="h-8 bg-slate-100 rounded-xl w-32 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : templates.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">Chưa có template nào</td>
                    </tr>
                  ) : (
                    templates.map((template) => (
                      <tr key={template.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5 font-bold text-slate-900">{template.courseTitle}</td>
                        <td className="px-8 py-5 font-medium text-slate-600 truncate max-w-xs">{template.subject}</td>
                        <td className="px-8 py-5">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${template.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                            {template.isActive ? "Đang chạy" : "Đã tắt"}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingTemplate(template);
                                setForm({
                                  courseId: template.courseId,
                                  subject: template.subject,
                                  body: template.body,
                                  isActive: template.isActive
                                });
                                setIsModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                            </button>
                            <button
                              onClick={() => handleDelete(template.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsModalOpen(false)}
          />
          <form onSubmit={handleSave} className="relative bg-white w-full max-w-6xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingTemplate ? "Chỉnh sửa Mail Template" : "Tạo Mail Template mới"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Sử dụng placeholders {`{{full_name}}`}, {`{{course_title}}`}... để cá nhân hóa nội dung.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 xl:grid-cols-2 gap-12 scrollbar-hide">
              {/* Form Side */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Khóa học áp dụng</label>
                  <select
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all appearance-none"
                  >
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tiêu đề Mail</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all shadow-inner"
                    placeholder="Ví dụ: [DUA Edu] Xác nhận đăng ký khóa học {{course_title}}"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block">Nội dung mẫu</label>
                  <RichTextEditor
                    value={form.body}
                    onChange={(body) => setForm({ ...form, body })}
                    minHeight="400px"
                    maxHeight="600px"
                  />
                </div>

                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[22px] border border-slate-100 shadow-inner">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="h-6 w-6 rounded-lg text-green-600 focus:ring-green-500 transition-all"
                    />
                    <span className="text-sm font-black text-slate-700 uppercase tracking-widest">KÍCH HOẠT TEMPLATE NÀY</span>
                  </label>
                </div>
              </div>

              {/* Preview Side */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LIVE PREVIEW</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Email nhận test..."
                      className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold focus:outline-none w-48"
                    />
                    <button
                      type="button"
                      onClick={handleTestMail}
                      disabled={testing}
                      className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[11px] font-black hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                      {testing ? "GỬI..." : "GỬI TEST"}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-[40px] border border-slate-200 p-6 shadow-inner">
                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Subject</p>
                      <h4 className="font-bold text-sm mt-0.5">{form.subject || "Tiêu đề mail mẫu..."}</h4>
                    </div>
                    <div className="p-8">
                      <div className="prose prose-sm max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-green-50 rounded-[32px] border border-green-100">
                  <h5 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-3">Tham số hỗ trợ</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {["{{full_name}}", "{{email}}", "{{phone}}", "{{course_title}}", "{{course_link}}", "{{payment_qr}}"].map(p => (
                      <div key={p} className="px-3 py-1.5 bg-white rounded-lg border border-green-200 text-[10px] font-mono text-green-700 text-center font-bold">{p}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-[22px] font-black text-sm hover:bg-slate-50 transition-all"
              >
                HỦY
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-12 py-4 bg-green-600 text-white rounded-[22px] font-black text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
              >
                {saving ? "ĐANG LƯU..." : editingTemplate ? "CẬP NHẬT TEMPLATE" : "TẠO TEMPLATE MỚI"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

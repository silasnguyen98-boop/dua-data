"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { htmlToTextPreserveLineBreaks, renderMailTemplateHtml, wrapGenericMailHtml } from "@/lib/mail-template-renderer";

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

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
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
  const [activeTab, setActiveTab] = useState<"mail" | "template" | "history">("template");
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [logStats, setLogStats] = useState({ total: 0, sent: 0, failed: 0 });
  const [filter, setFilter] = useState<"day" | "week" | "month" | "all">("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);
  const [form, setForm] = useState({
    courseIds: [] as string[],
    subject: "",
    body: "",
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("silasnguyen98@gmail.com");

  const [manualSending, setManualSending] = useState(false);
  const [manualForm, setManualForm] = useState({
    recipientEmail: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
    profile: "noreply" as "noreply" | "hello"
  });

  const handleSendManual = async () => {
    if (!manualForm.recipientEmail || !manualForm.subject || !manualForm.body) {
      return alert("Vui lòng điền đầy đủ thông tin");
    }
    setManualSending(true);
    
    // Wrap the body in the beautiful frame
    const wrappedHtml = wrapGenericMailHtml(manualForm.body, manualForm.subject);

    try {
      const res = await fetch("/api/admin/mail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader()
        },
        body: JSON.stringify({
          recipientEmail: manualForm.recipientEmail,
          cc: manualForm.cc,
          bcc: manualForm.bcc,
          subject: manualForm.subject,
          body: manualForm.body,
          html: wrappedHtml,
          text: htmlToTextPreserveLineBreaks(manualForm.body),
          mailType: "manual",
          profile: manualForm.profile
        }),
      });
      if (res.ok) {
        alert("Đã gửi mail thành công!");
        setManualForm({ recipientEmail: "", cc: "", bcc: "", subject: "", body: "", profile: "noreply" });
      } else {
        const data = await res.json();
        alert(`Lỗi: ${data.error || "Không thể gửi mail"}`);
      }
    } catch (err) {
      console.error("Send failed", err);
      alert("Lỗi kết nối server");
    } finally {
      setManualSending(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (currentFilter?: string) => {
    setLoading(true);
    const f = currentFilter || filter;
    try {
      const [tplRes, mailRes] = await Promise.all([
        fetch("/api/admin/mail-templates", { headers: buildAuthHeader() }),
        fetch(`/api/admin/mail?filter=${f}`, { headers: buildAuthHeader() })
      ]);
      
      const tplData = await tplRes.json();
      const mailData = await mailRes.json();

      setTemplates(tplData.templates || []);
      setCourses(tplData.courses || []);
      setLogs(mailData.logs || []);
      setLogStats(mailData.stats || { total: 0, sent: 0, failed: 0 });

      if (tplData.courses?.length > 0 && form.courseIds.length === 0) {
        setForm(prev => ({ ...prev, courseIds: [tplData.courses[0].id] }));
      }
    } catch (err) {
      console.error("Failed to fetch mail data", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCourse = useMemo(() => courses.find(c => c.id === form.courseIds[0]), [courses, form.courseIds]);
  const previewContext = useMemo(() => getPreviewContext(selectedCourse), [selectedCourse]);

  const previewHtml = useMemo(() =>
    renderMailTemplateHtml(form.body || "<p>Nội dung mẫu...</p>", previewContext),
    [form.body, previewContext]
  );

  const toggleTemplateCourse = (courseId: string) => {
    setForm(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  };

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
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Không thể lưu template");
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
          <button
            onClick={() => setActiveTab("history")}
            className={`px-8 py-3 rounded-[18px] text-sm font-bold transition-all ${
              activeTab === "history" ? "bg-white text-green-700 shadow-lg shadow-slate-200/50" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Lịch sử
          </button>
        </div>
      </div>

      {activeTab === "history" ? (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng số</p>
               <h4 className="text-2xl font-black text-slate-900">{logStats.total}</h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Thành công</p>
               <h4 className="text-2xl font-black text-green-600">{logStats.sent}</h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lọc thời gian</p>
               <select
                 value={filter}
                 onChange={(e) => {
                   const val = e.target.value as any;
                   setFilter(val);
                   fetchData(val);
                   setCurrentPage(1);
                 }}
                 className="text-sm font-bold text-slate-900 bg-transparent focus:outline-none w-full"
               >
                 <option value="all">Tất cả</option>
                 <option value="day">Trong ngày</option>
                 <option value="week">Trong tuần</option>
                 <option value="month">Trong tháng</option>
               </select>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
               <button onClick={() => fetchData()} className="w-full h-full flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-green-600 transition-all">
                  <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  LÀM MỚI
               </button>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người nhận</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiêu đề</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-32"></div></td>
                        <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-48"></div></td>
                        <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-64"></div></td>
                        <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-20"></div></td>
                        <td className="px-8 py-5 text-right"><div className="h-8 bg-slate-100 rounded-xl w-24 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-medium">Chưa có lịch sử gửi mail</td>
                    </tr>
                  ) : (
                    logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5 text-xs font-medium text-slate-500 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-8 py-5 font-bold text-slate-900">{log.recipientEmail}</td>
                        <td className="px-8 py-5 font-medium text-slate-600 truncate max-w-xs">{log.subject}</td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit ${
                              log.status === "sent" ? "bg-green-100 text-green-700" : 
                              log.status === "failed" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-400"
                            }`}>
                              {log.status === "sent" ? "Thành công" : log.status === "failed" ? "Thất bại" : "Đang chờ"}
                            </span>
                            {log.openedAt && (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 px-1">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                <span>Đã xem ({log.openCount})</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                             onClick={() => alert(log.errorMessage || "Không có thông báo lỗi")}
                             className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                             title="Xem lỗi / chi tiết"
                          >
                             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!loading && logs.length > itemsPerPage && (
              <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Trang {currentPage} / {Math.ceil(logs.length / itemsPerPage)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-all"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(logs.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(logs.length / itemsPerPage)}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-all"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "mail" ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Left: Compose Form */}
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Soạn thư mới</h3>
                <p className="text-xs text-slate-500 font-medium">Gửi email thủ công tới học viên hoặc khách hàng</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Chọn mẫu nhanh (Tùy chọn)</label>
                <select
                  onChange={(e) => {
                    const t = templates.find(tpl => tpl.id === e.target.value);
                    if (t) {
                      setManualForm(prev => ({
                        ...prev,
                        subject: t.subject,
                        body: t.body
                      }));
                    }
                  }}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all appearance-none"
                >
                  <option value="">-- Chọn một mẫu có sẵn --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.courseTitle || "Chung"}] {t.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email người nhận</label>
                  <input
                    type="email"
                    value={manualForm.recipientEmail}
                    onChange={(e) => setManualForm({ ...manualForm, recipientEmail: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all shadow-inner"
                    placeholder="example@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email gửi đi (SMTP)</label>
                  <select
                    value={manualForm.profile}
                    onChange={(e) => setManualForm({ ...manualForm, profile: e.target.value as any })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all appearance-none"
                  >
                    <option value="noreply">noreply@duadata.net (Mặc định)</option>
                    <option value="hello">hello@duadata.net (Hỗ trợ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Đồng gửi (CC)</label>
                  <input
                    type="text"
                    value={manualForm.cc}
                    onChange={(e) => setManualForm({ ...manualForm, cc: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all shadow-inner"
                    placeholder="email1@gmail.com, email2@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Gửi bản sao ẩn (BCC)</label>
                  <input
                    type="text"
                    value={manualForm.bcc}
                    onChange={(e) => setManualForm({ ...manualForm, bcc: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all shadow-inner"
                    placeholder="boss@duadata.net"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tiêu đề email</label>
                <input
                  type="text"
                  value={manualForm.subject}
                  onChange={(e) => setManualForm({ ...manualForm, subject: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all shadow-inner"
                  placeholder="Nhập tiêu đề thư..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block">Nội dung thư</label>
                <RichTextEditor
                  value={manualForm.body}
                  onChange={(body) => setManualForm({ ...manualForm, body })}
                  minHeight="350px"
                  maxHeight="500px"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSendManual}
                  disabled={manualSending}
                  className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                >
                  {manualSending ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ĐANG GỬI...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      GỬI MAIL NGAY
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Preview & Tips */}
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden">
               {/* Technical Background */}
               <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
               
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Live Preview</span>
                 </div>
                 
                 <div className="bg-white rounded-[32px] overflow-hidden text-slate-900 shadow-2xl">
                   <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Preview</p>
                     <h4 className="font-bold text-sm truncate">{manualForm.subject || "Tiêu đề trống..."}</h4>
                   </div>
                   <div className="p-8 min-h-[300px] max-h-[500px] overflow-y-auto scrollbar-hide">
                     <div className="prose prose-sm max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: wrapGenericMailHtml(manualForm.body || "<p className='text-slate-300 italic'>Nội dung đang được soạn thảo...</p>", manualForm.subject) }} />
                   </div>
                 </div>

                 <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-[28px]">
                   <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     Mẹo gửi mail chuyên nghiệp
                   </h5>
                   <ul className="space-y-3">
                     {[
                       "Tiêu đề ngắn gọn, gây chú ý nhưng không clickbait.",
                       "Sử dụng định dạng in đậm, danh sách để nội dung dễ đọc.",
                       "Luôn kiểm tra kỹ email người nhận trước khi bấm gửi.",
                       "Sử dụng email Hello cho các mục đích CSKH."
                     ].map((tip, i) => (
                       <li key={i} className="flex gap-3 text-xs text-slate-400 font-medium">
                         <span className="text-green-500 font-black">0{i+1}.</span>
                         {tip}
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingTemplate(null);
                setForm({ courseIds: courses[0]?.id ? [courses[0].id] : [], subject: "", body: "", isActive: true });
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
                                  courseIds: template.courseId ? [template.courseId] : [],
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khóa học áp dụng</label>
                    <span className="text-[10px] font-bold text-slate-400">{form.courseIds.length} khóa đã chọn</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded-[22px] border border-slate-200 bg-slate-50 p-3 space-y-2">
                    <label className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 border border-slate-100 cursor-pointer hover:border-green-200 hover:bg-green-50/30 transition-all">
                      <input
                        type="checkbox"
                        checked={form.courseIds.includes("system")}
                        onChange={() => toggleTemplateCourse("system")}
                        className="mt-0.5 h-5 w-5 rounded-lg text-green-600 focus:ring-green-500 border-slate-200"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-slate-800 leading-snug">Hệ thống / Chung</span>
                        <span className="block text-[10px] font-bold text-slate-400 mt-0.5">Dùng cho gửi mail thủ công</span>
                      </span>
                    </label>
                    {courses.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">Chưa có khóa học</div>
                    ) : courses.map(c => (
                      <label key={c.id} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 border border-slate-100 cursor-pointer hover:border-green-200 hover:bg-green-50/30 transition-all">
                        <input
                          type="checkbox"
                          checked={form.courseIds.includes(c.id)}
                          onChange={() => toggleTemplateCourse(c.id)}
                          className="mt-0.5 h-5 w-5 rounded-lg text-green-600 focus:ring-green-500 border-slate-200"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-black text-slate-800 leading-snug">{c.title}</span>
                          <span className="block text-[10px] font-bold text-slate-400 mt-0.5">/{c.slug || c.id}</span>
                        </span>
                      </label>
                    ))}
                  </div>
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

"use client";

import { useState, useEffect, useMemo } from "react";
import RichTextEditor from "@/components/RichTextEditor";

interface Resource {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string;
  author: string;
  published: boolean;
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  summary: string;
  content: string;
  workType: string;
  location: string;
  position: string;
  applicationLink: string;
  applicationDeadline: string;
  salary: string;
  published: boolean;
  createdAt: string;
}

interface CommunityActivity {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  community: "student" | "genz";
  registrationLink: string;
  registrationDeadline: string;
  eventDate: string;
  published: boolean;
  createdAt: string;
}

type ActivityTab = "resources" | "jobs" | "community";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ActivitiesView() {
  const [activeTab, setActiveTab] = useState<ActivityTab>("resources");
  const [resources, setResources] = useState<Resource[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activities, setActivities] = useState<CommunityActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRes, jobRes, actRes] = await Promise.all([
        fetch("/api/resources"),
        fetch("/api/jobs"),
        fetch("/api/activities")
      ]);

      setResources(await resRes.json());
      setJobs(await jobRes.json());
      setActivities(await actRes.json());
    } catch (err) {
      console.error("Failed to fetch activities data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    let data: any[] = [];
    if (activeTab === "resources") data = resources;
    if (activeTab === "jobs") data = jobs;
    if (activeTab === "community") data = activities;

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(item =>
        (item.title || "").toLowerCase().includes(s) ||
        (item.company || "").toLowerCase().includes(s) ||
        (item.category || "").toLowerCase().includes(s)
      );
    }
    return data;
  }, [activeTab, resources, jobs, activities, search]);

  const stats = {
    resources: resources.length,
    jobs: jobs.length,
    community: activities.length
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mục này?")) return;
    const apiMap = {
      resources: "/api/resources",
      jobs: "/api/jobs",
      community: "/api/activities"
    };
    try {
      const res = await fetch(`${apiMap[activeTab]}?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const openAddModal = () => {
    const blankItem: any = { title: "", summary: "", content: "", imageUrl: "", published: true };
    if (activeTab === "resources") {
      blankItem.category = "General";
      blankItem.slug = "";
      blankItem.author = "DUA Edu";
    } else if (activeTab === "jobs") {
      blankItem.company = "";
      blankItem.workType = "Full-time";
      blankItem.location = "";
      blankItem.position = "";
      blankItem.applicationLink = "";
      blankItem.applicationDeadline = "";
      blankItem.salary = "";
    } else if (activeTab === "community") {
      blankItem.community = "student";
      blankItem.registrationLink = "";
      blankItem.registrationDeadline = "";
      blankItem.eventDate = "";
    }
    setEditingItem(blankItem);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const apiMap = {
      resources: "/api/resources",
      jobs: "/api/jobs",
      community: "/api/activities"
    };

    const method = editingItem.id ? "PUT" : "POST";

    // Auto-slug for resources if missing
    if (activeTab === "resources" && !editingItem.slug) {
      editingItem.slug = slugify(editingItem.title);
    }

    try {
      const res = await fetch(apiMap[activeTab], {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingItem(null);
        fetchData();
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Hoạt động</h2>
          <p className="text-sm text-slate-500 font-medium">Quản lý tài nguyên, việc làm và sản phẩm cộng đồng</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input
              type="text"
              placeholder="Tìm kiếm nội dung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all w-64 shadow-sm"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            THÊM MỚI
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-100 rounded-[24px] w-fit">
        {[
          { id: "resources", label: "Tài nguyên", count: stats.resources },
          { id: "jobs", label: "Việc làm", count: stats.jobs },
          { id: "community", label: "Cộng đồng", count: stats.community },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-3 rounded-[18px] text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === tab.id
                ? "bg-white text-green-700 shadow-lg shadow-slate-200/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            {tab.label}
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
              activeTab === tab.id ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiêu đề</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin chi tiết</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-3/4"></div></td>
                    <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-1/2"></div></td>
                    <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-16"></div></td>
                    <td className="px-8 py-5 text-right"><div className="h-8 bg-slate-100 rounded-xl w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                    Chưa có hoạt động nào trong danh sách này
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900 group-hover:text-green-600 transition-colors">{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">Ngày tạo: {new Date(item.createdAt).toLocaleDateString("vi-VN")}</div>
                    </td>
                    <td className="px-8 py-5">
                      {activeTab === "resources" && (
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">Category: {item.category}</span>
                      )}
                      {activeTab === "jobs" && (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{item.company}</span>
                        </div>
                      )}
                      {activeTab === "community" && (
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${item.community === "student" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                          {item.community === "student" ? "Học viên" : "GenZ Data"}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                        {item.published ? "Công khai" : "Nháp"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                          title="Sửa"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                        </button>
                         <button
                          onClick={() => window.open(activeTab === 'resources' ? `/resource/${item.slug}` : activeTab === 'jobs' ? `/job` : `/community`, '_blank')}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Xem"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Xóa"
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

      {/* Unified Comprehensive Modal with Rich Text */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
          />
          <form onSubmit={handleSave} className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="p-8 pb-0 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingItem.id ? "Chỉnh sửa" : "Tạo mới"} {activeTab === "resources" ? "Tài nguyên" : activeTab === "jobs" ? "Việc làm" : "Hoạt động"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Cập nhật đầy đủ thông tin nội dung lên hệ thống.</p>
              </div>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
                className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 transition-all"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tiêu đề nội dung *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-inner"
                  />
                </div>

                {activeTab === "resources" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Slug (URL)</label>
                      <input
                        type="text"
                        value={editingItem.slug}
                        onChange={(e) => setEditingItem({...editingItem, slug: e.target.value})}
                        placeholder="Để trống để tự tạo từ tiêu đề"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Danh mục</label>
                      <input
                        type="text"
                        value={editingItem.category}
                        onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tác giả</label>
                      <input
                        type="text"
                        value={editingItem.author}
                        onChange={(e) => setEditingItem({...editingItem, author: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-inner"
                      />
                    </div>
                  </>
                )}

                {activeTab === "jobs" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Công ty *</label>
                      <input
                        type="text"
                        required
                        value={editingItem.company}
                        onChange={(e) => setEditingItem({...editingItem, company: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Địa điểm</label>
                      <input
                        type="text"
                        value={editingItem.location}
                        onChange={(e) => setEditingItem({...editingItem, location: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mức lương</label>
                      <input
                        type="text"
                        value={editingItem.salary}
                        onChange={(e) => setEditingItem({...editingItem, salary: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Link ứng tuyển</label>
                      <input
                        type="text"
                        value={editingItem.applicationLink}
                        onChange={(e) => setEditingItem({...editingItem, applicationLink: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-inner"
                      />
                    </div>
                  </>
                )}

                {activeTab === "community" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cộng đồng *</label>
                      <select
                        value={editingItem.community}
                        onChange={(e) => setEditingItem({...editingItem, community: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-inner appearance-none"
                      >
                        <option value="student">Học viên DUA Edu</option>
                        <option value="genz">GenZ Data</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ngày diễn ra</label>
                      <input
                        type="date"
                        value={editingItem.eventDate?.split('T')[0] || ""}
                        onChange={(e) => setEditingItem({...editingItem, eventDate: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-inner"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Link ảnh (Image URL)</label>
                <input
                  type="text"
                  value={editingItem.imageUrl}
                  onChange={(e) => setEditingItem({...editingItem, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mô tả ngắn *</label>
                <textarea
                  required
                  value={editingItem.summary}
                  onChange={(e) => setEditingItem({...editingItem, summary: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all h-24 shadow-inner"
                  placeholder="Mô tả tóm tắt nội dung..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block">Nội dung chi tiết *</label>
                <RichTextEditor
                  value={editingItem.content}
                  onChange={(content) => setEditingItem({...editingItem, content})}
                  placeholder="Nhập nội dung chi tiết bài viết..."
                  minHeight="300px"
                  maxHeight="600px"
                />
              </div>

              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[22px] border border-slate-100 shadow-inner">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.published}
                    onChange={(e) => setEditingItem({...editingItem, published: e.target.checked})}
                    className="h-6 w-6 rounded-lg border-slate-300 text-green-600 focus:ring-green-500 transition-all"
                  />
                  <span className="text-sm font-black text-slate-700">CÔNG KHAI NỘI DUNG NÀY LÊN WEBSITE</span>
                </label>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-[22px] font-black text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      {editingItem.id ? "CẬP NHẬT THAY ĐỔI" : "TẠO NỘI DUNG MỚI"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
                  className="px-8 py-4 bg-slate-100 text-slate-600 rounded-[22px] font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
                >
                  HỦY BỎ
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

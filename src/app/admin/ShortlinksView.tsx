"use client";

import { useState, useEffect, useMemo } from "react";

interface Shortlink {
  id: string;
  url: string;
  title: string;
  code: string;
  clicks: number;
  createdAt: string;
}

export default function ShortlinksView() {
  const [shortlinks, setShortlinks] = useState<Shortlink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLink, setNewLink] = useState({ url: "", title: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShortlinks();
  }, []);

  const fetchShortlinks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shortlinks");
      const data = await res.json();
      setShortlinks(data);
    } catch (err) {
      console.error("Failed to fetch shortlinks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.url) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/shortlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLink),
      });
      if (res.ok) {
        setNewLink({ url: "", title: "" });
        setShowAddModal(false);
        fetchShortlinks();
      }
    } catch (err) {
      console.error("Failed to add shortlink", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa link này?")) return;
    try {
      const res = await fetch(`/api/shortlinks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setShortlinks(prev => prev.filter(l => l.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete shortlink", err);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return shortlinks;
    const s = search.toLowerCase();
    return shortlinks.filter(l =>
      l.title.toLowerCase().includes(s) ||
      l.url.toLowerCase().includes(s) ||
      l.code.toLowerCase().includes(s)
    );
  }, [shortlinks, search]);

  const totalClicks = useMemo(() => {
    return shortlinks.reduce((sum, l) => sum + (l.clicks || 0), 0);
  }, [shortlinks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Shortlink</h2>
          <p className="text-sm text-slate-500 font-medium">Tạo và quản lý các liên kết rút gọn Marketing</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input
              type="text"
              placeholder="Tìm kiếm link..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all w-64 shadow-sm"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            THÊM MỚI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng số link</p>
          <p className="text-2xl font-black text-slate-900">{shortlinks.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng lượt click</p>
          <p className="text-2xl font-black text-green-600">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trung bình</p>
          <p className="text-2xl font-black text-blue-600">{shortlinks.length ? (totalClicks / shortlinks.length).toFixed(1) : 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiêu đề / Link gốc</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã rút gọn</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lượt click</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-3/4"></div><div className="h-3 bg-slate-50 rounded-lg w-1/2 mt-2"></div></td>
                    <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-1/2"></div></td>
                    <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-12 mx-auto"></div></td>
                    <td className="px-8 py-5 text-right"><div className="h-8 bg-slate-100 rounded-xl w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                    Chưa có shortlink nào được tạo
                  </td>
                </tr>
              ) : (
                filtered.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900 group-hover:text-green-600 transition-colors">{link.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate max-w-xs" title={link.url}>{link.url}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-mono text-xs font-bold">
                          {link.code}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/s/${link.code}`);
                            // Optional: add a toast here
                          }}
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Copy link"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="text-sm font-black text-slate-700">{link.clicks || 0}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(`/s/${link.code}`, '_blank')}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Mở link"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </button>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Xóa link"
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowAddModal(false)}
          />
          <form onSubmit={handleAddLink} className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="p-8 pb-0 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Tạo Shortlink mới</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 transition-all"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tiêu đề (Ghi nhớ)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Link Landing Page Khóa học A"
                  value={newLink.title}
                  onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Link gốc (URL)</label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com/very-long-url..."
                  value={newLink.url}
                  onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-inner"
                />
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
                      TẠO NGAY
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-8 py-4 bg-slate-100 text-slate-600 rounded-[22px] font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
                >
                  HỦY
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

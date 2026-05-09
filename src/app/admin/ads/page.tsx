"use client";

import { useState, useEffect, useCallback } from "react";
import BrandLogo from "@/components/BrandLogo";

interface Ad {
  id?: string;
  imageUrl: string;
  link: string;
  startDate: string;
  endDate: string;
  enabled: boolean;
  type: "floating" | "top_banner";
  createdAt?: string;
}

const emptyAd = {
  imageUrl: "",
  link: "",
  startDate: "",
  endDate: "",
  enabled: true,
  type: "floating" as const,
};

export default function AdsAdminPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [form, setForm] = useState<Ad>(emptyAd);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ads");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAds(data.sort((a: Ad, b: Ad) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
    } catch {
      setMessage({ type: "error", text: "Không thể tải danh sách ads" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setForm(emptyAd);
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.imageUrl || !form.link || !form.startDate || !form.endDate) {
      showMessage("error", "Vui lòng điền đầy đủ ảnh, link và thời hạn chạy ads");
      return;
    }
    setSaving(true);
    try {
      const url = editing?.id ? "/api/ads" : "/api/ads";
      const body = editing?.id ? { id: editing.id, ...form } : form;
      const res = await fetch(url, {
        method: editing?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      showMessage("success", editing?.id ? "Đã cập nhật!" : "Đã thêm banner!");
      resetForm();
      fetchAds();
    } catch {
      showMessage("error", "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa banner này?")) return;
    try {
      const res = await fetch(`/api/ads?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showMessage("success", "Đã xóa!");
      fetchAds();
    } catch {
      showMessage("error", "Xóa thất bại");
    }
  };

  const handleToggle = async (ad: Ad) => {
    if (!ad.id) return;
    try {
      const res = await fetch("/api/ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ad.id, enabled: !ad.enabled }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      fetchAds();
    } catch {
      showMessage("error", "Cập nhật thất bại");
    }
  };

  const editAd = (ad: Ad) => {
    setForm({ imageUrl: ad.imageUrl, link: ad.link, startDate: ad.startDate, endDate: ad.endDate, enabled: ad.enabled, type: (ad as Ad).type || "floating" });
    setEditing(ad);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <h1 className="text-xl font-bold text-gray-900">Quản lý Banner Ads</h1>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            + Thêm Banner
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Đang tải...</div>
        ) : ads.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">Chưa có banner nào</p>
            <p className="text-sm">Nhấn "Thêm Banner" để tạo banner quảng cáo đầu tiên</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Banner</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Loại</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Link</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Thời hạn</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <img src={ad.imageUrl} alt="banner" className="h-16 w-auto rounded-lg object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        ad.type === "top_banner"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {ad.type === "top_banner" ? "🎌 Top Banner" : "📌 Floating"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a href={ad.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline max-w-[200px] truncate block">{ad.link}</a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ad.startDate && <div>Từ: {new Date(ad.startDate).toLocaleDateString("vi-VN")}</div>}
                      {ad.endDate && <div>Đến: {new Date(ad.endDate).toLocaleDateString("vi-VN")}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(ad)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          ad.enabled
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${ad.enabled ? "bg-green-500" : "bg-gray-400"}`} />
                        {ad.enabled ? "Đang chạy" : "Tắt"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => editAd(ad)} className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">Sửa</button>
                        <button onClick={() => handleDelete(ad.id!)} className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editing?.id ? "Sửa Banner" : "Thêm Banner"}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link ảnh banner *</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="preview" className="mt-2 h-24 w-auto rounded-lg object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại banner</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "floating" | "top_banner" })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="floating">📌 Floating — góc phải dưới, có countdown</option>
                  <option value="top_banner">🎌 Top Banner — trên navbar, chỉ ảnh</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {form.type === "top_banner" ? "Kích cỡ ảnh khuyến nghị: 1920×240 px. Không có countdown." : "Hiển thị góc phải bên dưới màn hình, có đếm ngược thời gian."}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link chuyển hướng *</label>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Bật banner ngay lập tức</span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button onClick={resetForm} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">Hủy</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

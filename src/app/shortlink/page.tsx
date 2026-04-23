"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ShortlinkPage() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [result, setResult] = useState<{ code: string; url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/shortlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), title: title.trim() || undefined }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult({ code: data.code, url: data.url });
      setUrl("");
      setTitle("");
    } catch (e: any) {
      setError(e.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${baseUrl}/s/${result.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            🔗 Rút gọn link miễn phí
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Rút gọn đường link <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">nhanh chóng</span>
          </h1>
          <p className="text-gray-500 text-lg">Tạo link rút gọn với theo dõi lượt truy cập từ DUA Edu</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 mb-8">
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Đường link gốc *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/your-long-url"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tên link (tuỳ chọn)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên mô tả cho link"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-green-200"
          >
            {loading ? "Đang tạo..." : "🔗 Rút gọn ngay"}
          </button>
          {error && <p className="mt-3 text-red-500 text-sm text-center">{error}</p>}
        </form>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl border border-green-200 shadow-lg p-8 animate-fadeIn">
            <div className="flex items-center gap-2 text-green-600 font-bold mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Tạo link thành công!
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm text-gray-800 truncate">
                {baseUrl}/s/{result.code}
              </div>
              <button
                onClick={handleCopy}
                className="bg-green-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-green-700 transition whitespace-nowrap"
              >
                {copied ? "Đã copy ✓" : "Copy"}
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-400 truncate">Link gốc: {result.url}</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

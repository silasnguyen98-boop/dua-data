"use client";

import { useState } from "react";

interface Props {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
}

export default function RegistrationForm({ courseId, courseTitle, onClose }: Props) {
  const [form, setForm] = useState({
    fullName: "",
    facebook: "",
    birthday: "",
    phone: "",
    email: "",
    referralCode: "",
    expectations: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.fullName || !form.facebook || !form.birthday || !form.phone || !form.email) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, courseId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Đăng ký thất bại");
      }
    } catch {
      setError("Lỗi kết nối, vui lòng thử lại");
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Chúc mừng!</h3>
          <p className="text-gray-600 leading-relaxed mb-6">
            Chúc mừng bạn đã đăng ký thành công khóa học <span className="font-semibold text-green-600">{courseTitle}</span>, Dứa sẽ sớm liên hệ lại bạn!
          </p>
          <button
            onClick={onClose}
            className="bg-green-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-700 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Đăng ký khóa học</h3>
              <p className="text-green-100 text-sm mt-1">{courseTitle}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-light">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {/* Họ tên + Ngày sinh on same row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Họ tên của bạn <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ngày sinh của bạn <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                value={form.birthday}
                onChange={e => setForm({ ...form, birthday: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Link Facebook của bạn <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="https://facebook.com/username"
              value={form.facebook}
              onChange={e => setForm({ ...form, facebook: e.target.value })}
            />
          </div>

          {/* Số điện thoại + Email on same row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Số điện thoại của bạn <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                placeholder="0912345678"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email của bạn <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                placeholder="email@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mã giới thiệu <span className="text-gray-400 text-xs">(không bắt buộc)</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="Nhập mã giới thiệu nếu có"
              value={form.referralCode}
              onChange={e => setForm({ ...form, referralCode: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bạn mong muốn nhận được điều gì thêm từ khóa học <span className="text-gray-400 text-xs">(không bắt buộc)</span>
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              rows={3}
              placeholder="Chia sẻ mong muốn của bạn..."
              value={form.expectations}
              onChange={e => setForm({ ...form, expectations: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-4 rounded-xl hover:from-green-700 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-200/60 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Đang đăng ký...
              </span>
            ) : "Đăng ký ngay"}
          </button>

          <p className="text-center text-xs text-gray-400">
            Thông tin của bạn được bảo mật và chỉ sử dụng cho mục đích liên hệ khóa học
          </p>
        </form>
      </div>
    </div>
  );
}

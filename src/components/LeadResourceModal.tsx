"use client";

import { useState } from "react";

export default function LeadResourceModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "",
    resourceType: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.fullName || !form.email || !form.role || !form.resourceType) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/lead-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Gửi thất bại, vui lòng thử lại");
      }
    } catch {
      setError("Lỗi kết nối, vui lòng thử lại");
    }
    setSubmitting(false);
  }

  function handleClose() {
    setOpen(false);
    setSuccess(false);
    setError("");
    setForm({ fullName: "", email: "", role: "", resourceType: "" });
  }

  return (
    <>
      {/* CTA Button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-green-700 text-white font-semibold px-8 py-4 rounded-full shadow-lg shadow-green-200 hover:bg-green-800 hover:shadow-xl hover:shadow-green-300 transition-all duration-300 text-lg mt-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Nhận tài nguyên miễn phí
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={handleClose}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={e => e.stopPropagation()}>
            {success ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Cảm ơn bạn!</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Chúng tôi sẽ gửi tài nguyên đến email của bạn sớm nhất.
                </p>
                <button
                  onClick={handleClose}
                  className="bg-green-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-700 transition-all"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Nhận tài nguyên miễn phí</h3>
                      <p className="text-green-100 text-sm mt-1">Điền thông tin để nhận tài liệu từ Dứa Data</p>
                    </div>
                    <button onClick={handleClose} className="text-white/70 hover:text-white text-2xl font-light">×</button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
                  {error && (
                    <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Họ tên <span className="text-red-500">*</span>
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
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      placeholder="email@example.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Đang là <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="">-- Chọn --</option>
                      <option value="Sinh viên">Sinh viên</option>
                      <option value="Người đi làm">Người đi làm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tài liệu muốn nhận <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
                      value={form.resourceType}
                      onChange={e => setForm({ ...form, resourceType: e.target.value })}
                    >
                      <option value="">-- Chọn --</option>
                      <option value="Cơ bản">Cơ bản</option>
                      <option value="Chuyên sâu">Chuyên sâu</option>
                      <option value="Cả hai">Cả hai</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-4 rounded-xl hover:from-green-700 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-200/60 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Đang gửi...
                      </span>
                    ) : "Nhận tài nguyên"}
                  </button>

                  <p className="text-center text-xs text-gray-400">
                    Thông tin của bạn được bảo mật và chỉ sử dụng để gửi tài nguyên
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

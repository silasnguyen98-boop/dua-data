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
      setError("Vui lòng điền đầy đủ thông tin để Dứa gửi tài liệu nhé!");
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
        setError(data.error || "Gửi thất bại, vui lòng thử lại sau ít phút");
      }
    } catch {
      setError("Lỗi kết nối, hãy kiểm tra lại mạng của bạn nhé!");
    }
    setSubmitting(false);
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
        setSuccess(false);
        setError("");
        setForm({ fullName: "", email: "", role: "", resourceType: "" });
    }, 300);
  }

  return (
    <>
      {/* CTA Button - PREMIUM STYLE */}
      <button
        onClick={() => setOpen(true)}
        className="px-12 py-5 border-2 border-emerald-500 text-emerald-600 font-black text-sm rounded-2xl hover:bg-emerald-50 transition-all hover:scale-105 active:scale-95 mt-6"
      >
        Nhận tài nguyên miễn phí
      </button>

      {/* Modal - REDESIGNED */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={handleClose} />

          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            {/* Header decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />

            {success ? (
              <div className="p-12 text-center space-y-8">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <span className="text-5xl">✨</span>
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Tuyệt vời!</h3>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                    Tài liệu sẽ sớm hạ cánh xuống hòm thư <span className="text-emerald-600 font-black">{form.email}</span> của bạn.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl transition hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-900/10"
                >
                  Sẵn sàng khám phá 🚀
                </button>
              </div>
            ) : (
              <>
                <div className="p-10 pb-0 flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Tài liệu Thực chiến</h3>
                    <p className="text-slate-400 font-medium">Để lại lời nhắn, Dứa gửi quà ngay!</p>
                  </div>
                  <button onClick={handleClose} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-6">
                  {error && (
                    <div className="bg-red-50 text-red-600 text-[11px] font-black uppercase tracking-widest px-6 py-4 rounded-2xl border border-red-100 flex items-center gap-3">
                      <span className="text-lg">⚠️</span>
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Họ tên</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                        placeholder="Nguyễn Văn A"
                        value={form.fullName}
                        onChange={e => setForm({ ...form, fullName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email</label>
                      <input
                        type="email"
                        required
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                        placeholder="dua@edu.vn"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nghề nghiệp</label>
                      <select
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all outline-none appearance-none"
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                      >
                        <option value="">-- Chọn --</option>
                        <option value="Sinh viên">Sinh viên</option>
                        <option value="Người đi làm">Người đi làm</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Cấp độ tài liệu</label>
                      <select
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all outline-none appearance-none"
                        value={form.resourceType}
                        onChange={e => setForm({ ...form, resourceType: e.target.value })}
                      >
                        <option value="">-- Chọn --</option>
                        <option value="Cơ bản">Cơ bản (Beginner)</option>
                        <option value="Chuyên sâu">Chuyên sâu (Pro)</option>
                        <option value="Tất cả">Cần tất cả!</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 mt-4"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      "Gửi yêu cầu ngay"
                    )}
                  </button>

                  <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    DUA Edu cam kết bảo mật thông tin 100%
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

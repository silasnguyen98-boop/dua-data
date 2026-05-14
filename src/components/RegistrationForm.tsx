"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAppCheckHeaders } from "@/lib/firebase-app-check";
import { useSession } from "next-auth/react";

interface Props {
  courseId: string;
  courseTitle: string;
  coursePath: string;
  onClose: () => void;
}

export default function RegistrationForm({ courseId, courseTitle, coursePath, onClose }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    phone: "",
    facebook: "",
    learningNeeds: "",
    learnerGroup: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt, setFormStartedAt] = useState<number>(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    setFormStartedAt(Date.now());
  }, []);

  const { data: session, status: authStatus } = useSession();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailError("");

    if (!form.phone.trim() || !form.learningNeeds.trim()) {
      setError("Vui lòng nhập số điện thoại và nhu cầu học");
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!/^0[0-9]{9,10}$/.test(phoneDigits)) {
      setError("Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Zalo của bạn.");
      return;
    }

    if (authStatus !== "authenticated") {
      router.push(`/login?next=${encodeURIComponent(`${coursePath}?register=1`)}`);
      return;
    }

    setSubmitting(true);
    try {
      const appCheckHeaders = await getAppCheckHeaders();
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...appCheckHeaders,
        },
        body: JSON.stringify({
          courseId,
          phone: phoneDigits,
          facebook: form.facebook,
          learningNeeds: form.learningNeeds,
          learnerGroup: Number(form.learnerGroup),
          honeypot,
          formStartedAt,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setEmailSent(Boolean(data.emailSent));
        setEmailError(data.emailError || "");
      } else {
        if (res.status === 401 && data.loginUrl) {
          router.push(data.loginUrl);
          return;
        }
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(`${coursePath}?register=1`)}`);
          return;
        }
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
          <p className="text-gray-600 leading-relaxed mb-4">
            Chúc mừng bạn đã đăng ký thành công khóa học <span className="font-semibold text-green-600">{courseTitle}</span>.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            {emailSent
              ? "DUA đã gửi email xác nhận vào Gmail bạn đã đăng nhập."
              : "DUA đã lưu đăng ký của bạn. Email xác nhận sẽ được gửi sớm."}
          </p>
          {emailError && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 text-left">
              Mail xác nhận chưa gửi được ngay: {emailError}
            </p>
          )}
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
          <input
            type="text"
            name="company"
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-green-100 bg-green-50/70 px-4 py-3 text-sm text-green-800">
            Đăng ký bằng tài khoản Google đã đăng nhập. Email xác nhận sẽ được gửi tới Gmail của bạn.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Số điện thoại Zalo của bạn <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="Ví dụ: 0912345678"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-400">Số này DUA sẽ dùng để liên hệ qua Zalo nếu cần.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bạn đang là? <span className="text-gray-400 text-xs">(không bắt buộc)</span>
            </label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
              value={form.learnerGroup}
              onChange={e => setForm({ ...form, learnerGroup: e.target.value })}
            >
              <option value="">Chọn một mục</option>
              <option value="1">Học sinh / Sinh viên</option>
              <option value="2">Người đi làm 0-2 năm</option>
              <option value="3">Người đi làm 3-5 năm</option>
              <option value="0">Người chuyển ngành</option>
              <option value="0">Khác</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">DUA dùng thông tin này để cá nhân hóa tư vấn và tài liệu gửi bạn.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Link Facebook của bạn <span className="text-gray-400 text-xs">(không bắt buộc)</span>
            </label>
            <input
              type="url"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="https://facebook.com/username (tuỳ chọn)"
              value={form.facebook}
              onChange={e => setForm({ ...form, facebook: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bạn mong muốn học gì từ khóa học này? <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              rows={4}
              placeholder="Ví dụ: Em muốn học để tối ưu workflow, làm dashboard và ứng dụng AI vào công việc..."
              value={form.learningNeeds}
              onChange={e => setForm({ ...form, learningNeeds: e.target.value })}
            />
          </div>

          <p style={{ color: "#166534" }}>
            <i>*DUA sẽ ưu tiên liên hệ với bạn qua Zalo/Facebook và gửi email xác nhận vào Gmail đã đăng nhập.</i>
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-4 rounded-xl hover:from-green-700 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-200/60 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
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

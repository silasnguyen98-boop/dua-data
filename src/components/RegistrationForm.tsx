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
  onSuccess?: (registration: { status?: string } | null) => void;
}

function withRegisterParam(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}register=1`;
}

export default function RegistrationForm({ courseId, courseTitle, coursePath, onClose, onSuccess }: Props) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
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
      router.push(`/login?next=${encodeURIComponent(withRegisterParam(coursePath))}`);
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
        onSuccess?.(data.registration || null);
      } else {
        if (res.status === 401 && data.loginUrl) {
          router.push(data.loginUrl);
          return;
        }
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(withRegisterParam(coursePath))}`);
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
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-2xl shadow-slate-900/20 animate-fade-in-up" onClick={e => e.stopPropagation()}>
          <div className="relative overflow-hidden bg-emerald-50 p-8 text-center">
            <div className="absolute inset-0 opacity-[0.28] [background-image:linear-gradient(45deg,#86efac_25%,transparent_25%,transparent_75%,#86efac_75%,#86efac),linear-gradient(45deg,#86efac_25%,transparent_25%,transparent_75%,#86efac_75%,#86efac)] [background-position:0_0,12px_12px] [background-size:24px_24px]" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-emerald-50/90 to-sky-50/70" />
            <div className="relative">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-600 shadow-sm">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Đăng ký thành công</p>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">DUA đã nhận thông tin</h3>
            </div>
          </div>
          <div className="p-8 text-center">
            <p className="text-sm leading-relaxed text-slate-600">
              Bạn đã đăng ký khóa học <span className="font-black text-slate-900">{courseTitle}</span>.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              {emailSent
                ? "Email xác nhận đã được gửi tới Gmail bạn đang đăng nhập."
                : "DUA đã lưu đăng ký của bạn. Email xác nhận sẽ được gửi sớm."}
            </p>
            {emailError && (
              <p className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-left text-xs leading-relaxed text-amber-700">
                Mail xác nhận chưa gửi được ngay: {emailError}
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-7 w-full rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-emerald-100 bg-white shadow-2xl shadow-slate-900/25 animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="relative overflow-hidden border-b border-emerald-100 bg-emerald-50 p-7">
          <div className="absolute inset-0 opacity-[0.3] [background-image:linear-gradient(45deg,#86efac_25%,transparent_25%,transparent_75%,#86efac_75%,#86efac),linear-gradient(45deg,#86efac_25%,transparent_25%,transparent_75%,#86efac_75%,#86efac)] [background-position:0_0,12px_12px] [background-size:24px_24px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-emerald-50/90 to-sky-50/70" />
          <div className="relative flex items-start justify-between gap-6">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Đăng ký học</p>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Thông tin tư vấn lộ trình</h3>
              <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-slate-600">{courseTitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white/80 text-xl font-light text-slate-500 transition hover:bg-white hover:text-slate-900"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-7">
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
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm font-medium leading-relaxed text-emerald-800">
            Đăng ký bằng tài khoản Google <span className="font-black">{session?.user?.email || "đã đăng nhập"}</span>. Email xác nhận sẽ được gửi tới Gmail này.
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Số điện thoại Zalo <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              placeholder="Ví dụ: 0912345678"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
            <p className="mt-2 text-xs text-slate-400">DUA sẽ dùng số này để liên hệ qua Zalo nếu cần.</p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Bạn đang là? <span className="normal-case tracking-normal text-slate-400">(không bắt buộc)</span>
            </label>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
            <p className="mt-2 text-xs text-slate-400">DUA dùng thông tin này để cá nhân hóa tư vấn và tài liệu gửi bạn.</p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Link Facebook <span className="normal-case tracking-normal text-slate-400">(không bắt buộc)</span>
            </label>
            <input
              type="url"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              placeholder="https://facebook.com/username (tuỳ chọn)"
              value={form.facebook}
              onChange={e => setForm({ ...form, facebook: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Mục tiêu học tập <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              rows={4}
              placeholder="Ví dụ: Em muốn học để tối ưu workflow, làm dashboard và ứng dụng AI vào công việc..."
              value={form.learningNeeds}
              onChange={e => setForm({ ...form, learningNeeds: e.target.value })}
            />
          </div>

          <p className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-xs font-medium leading-relaxed text-emerald-800">
            DUA sẽ ưu tiên liên hệ qua Zalo/Facebook và gửi email xác nhận vào Gmail đã đăng nhập.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-emerald-600 py-5 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang đăng ký...
              </span>
            ) : "Gửi thông tin đăng ký"}
          </button>

          <p className="text-center text-xs text-slate-400">
            Thông tin của bạn được bảo mật và chỉ sử dụng cho mục đích liên hệ khóa học
          </p>
        </form>
      </div>
    </div>
  );
}

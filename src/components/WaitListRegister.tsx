"use client";

import { useState } from "react";

interface Props {
  courseId: string;
  courseTitle: string;
}

export default function WaitListRegister({ courseId, courseTitle }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      setStatus("error");
      setMessage("Vui lòng nhập họ tên và số điện thoại.");
      return;
    }

    // Basic phone validation (Vietnamese format: 10–11 digits starting with 0)
    const phoneRegex = /^0[0-9]{9,10}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      setStatus("error");
      setMessage("Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/wait-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, name, phone, email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Đăng ký thất bại");
      }

      setStatus("success");
      setMessage("Đăng ký thành công! DUA sẽ thông báo ngay khi khóa học khai giảng.");
      setName("");
      setPhone("");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    }
  }

  return (
    <div>
      {status === "success" ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-green-700 mb-1">Đăng ký thành công!</h3>
          <p className="text-sm text-green-600">{message}</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-3 text-sm text-green-600 font-medium hover:underline"
          >
            Đăng ký thêm
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-2">
            <p className="text-sm text-amber-700 font-medium flex items-center gap-1.5">
              <span className="text-base">🔔</span>
              Khóa học "{courseTitle}" chưa mở bán
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Đăng ký ngay để nhận thông báo mở bán sớm nhất!
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-gray-400">(tùy chọn)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            />
          </div>

          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "loading" ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang đăng ký...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Đăng ký nhận thông báo
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            Chúng tôi sẽ không chia sẻ thông tin của bạn với bất kỳ bên thứ ba nào.
          </p>
        </form>
      )}
    </div>
  );
}

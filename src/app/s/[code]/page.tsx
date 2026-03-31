"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ShortlinkRedirect() {
  const params = useParams();
  const code = params.code as string;
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) return;
    fetch("/api/shortlinks/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [code]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link không tồn tại</h1>
          <p className="text-gray-500 mb-6">Đường link rút gọn này không hợp lệ hoặc đã bị xoá.</p>
          <a href="/" className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-700 transition">
            Về trang chủ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <svg className="animate-spin h-8 w-8 text-green-500 mx-auto mb-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-gray-500">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}

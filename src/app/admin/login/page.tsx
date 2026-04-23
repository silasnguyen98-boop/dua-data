"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rtdb } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import BrandLogo from "@/components/BrandLogo";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const snapshot = await get(ref(rtdb, "users/_system"));
      if (!snapshot.exists()) {
        setError("Không tìm thấy người dùng nào. Vui lòng liên hệ quản trị viên.");
        setLoading(false);
        return;
      }

      const allUsers = snapshot.val() as Record<string, any>;
      const matchedKey = Object.keys(allUsers).find(
        (k) => allUsers[k].username === username && allUsers[k].password === password
      );

      if (!matchedKey) {
        setError("Sai tài khoản hoặc mật khẩu");
        setLoading(false);
        return;
      }

      const matchedUser = allUsers[matchedKey];
      const role = (matchedUser.role || "").trim();
      // Encode role as base64 so API can decode reliably
      const encodedRole = btoa(role);
      sessionStorage.setItem("admin_auth", "true");
      sessionStorage.setItem("admin_role", encodedRole);
      sessionStorage.setItem("admin_id", matchedKey);
      sessionStorage.setItem("admin_name", (matchedUser.name || role || "").trim());
      sessionStorage.setItem("admin_username", username);
      router.push("/admin");
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo
            href="/"
            className="justify-center mb-2"
            showText={false}
            imageClassName="h-12 w-12"
          />
          <p className="text-gray-500">Đăng nhập trang quản trị</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8"
        >
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tài khoản</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-gray-900"
              placeholder="Nhập tài khoản"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-gray-900"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white font-semibold py-3 rounded-xl hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-400">
          <a href="/" className="hover:text-green-600 transition">← Quay về trang chủ</a>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import BrandLogo from "@/components/BrandLogo";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.655 32.659 29.348 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.956 3.043l5.657-5.657C34.041 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c3.059 0 5.842 1.154 7.956 3.043l5.657-5.657C34.041 6.053 29.268 4 24 4c-7.682 0-14.35 4.335-17.694 10.691z" />
      <path fill="#4CAF50" d="M24 44c5.203 0 9.892-1.992 13.409-5.239l-6.196-5.238C29.198 35.091 26.782 36 24 36c-5.327 0-9.621-3.315-11.294-7.946l-6.522 5.025C9.495 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.017 2.862-3.017 5.141-5.49 6.523l.004-.003 6.196 5.238C35.668 39.999 44 34 44 24c0-1.341-.138-2.651-.389-3.917z" />
    </svg>
  );
}

export default function LoginClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const nextTarget = searchParams.get("next") || "/";
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextTarget)}`
          : `/auth/callback?next=${encodeURIComponent(nextTarget)}`;

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng nhập bằng Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo
            href="/"
            className="justify-center mb-3"
            showText={false}
            imageClassName="h-12 w-12"
          />
          <h1 className="text-2xl font-bold text-gray-900">Đăng nhập DUA Edu</h1>
          <p className="mt-2 text-sm text-gray-500">
            Dùng Google để đăng nhập và đồng bộ ảnh đại diện của bạn.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition disabled:opacity-60"
          >
            <GoogleIcon />
            {loading ? "Đang chuyển hướng..." : "Đăng nhập bằng Google"}
          </button>

          <p className="mt-4 text-xs leading-5 text-gray-500">
            Sau khi đăng nhập, ảnh đại diện của bạn sẽ hiện ở góc phải trên thanh điều hướng.
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-gray-400">
          <a href="/" className="hover:text-green-600 transition">← Quay về trang chủ</a>
        </p>
      </div>
    </div>
  );
}

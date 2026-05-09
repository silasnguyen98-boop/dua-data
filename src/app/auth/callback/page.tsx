import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4">
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-xl shadow-gray-200/60 text-sm text-gray-600">
            Đang hoàn tất đăng nhập...
          </div>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}

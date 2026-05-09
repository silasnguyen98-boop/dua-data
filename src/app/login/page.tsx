import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-xl shadow-gray-200/60 text-sm text-gray-600">
            Đang tải...
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Đang hoàn tất đăng nhập...");

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") || "/";
    let cancelled = false;
    let timeoutId: number | null = null;
    let pollId: number | null = null;

    if (!code) {
      window.location.replace(next);
      return;
    }

    const supabase = createClient();

    const fail = (errorMessage: string) => {
      if (cancelled) return;
      setMessage(errorMessage);
      router.replace(`/login?error=${encodeURIComponent(errorMessage)}`);
    };

    const finish = () => {
      if (cancelled) return;
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      if (pollId) window.clearInterval(pollId);
      window.location.replace(next);
    };

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error) throw error;
        if (data.session) {
          finish();
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Không thể hoàn tất đăng nhập";
        fail(errorMessage);
      }
    };

    void checkSession();
    pollId = window.setInterval(() => {
      void checkSession();
    }, 300);

    timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        fail("Không thể hoàn tất đăng nhập");
      }
    }, 12000);

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      if (pollId) window.clearInterval(pollId);
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4">
      <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-xl shadow-gray-200/60 text-sm text-gray-600">
        {message}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RegistrationForm from "./RegistrationForm";
import { createClient } from "@/lib/supabase-client";

interface Props {
  courseId: string;
  courseTitle: string;
  coursePath: string;
  endDate?: string;
  registrationDeadline?: string;
  autoOpen?: boolean;
}

function getCourseStatus(endDate?: string, registrationDeadline?: string) {
  const now = new Date();
  if (registrationDeadline) {
    const deadline = new Date(registrationDeadline);
    if (deadline < now) return "expired"; // past registration deadline
  }
  if (endDate) {
    const end = new Date(endDate);
    if (end < now) return "ended"; // course already finished
  }
  return "open";
}

export default function RegisterButton({ courseId, courseTitle, coursePath, endDate, registrationDeadline, autoOpen }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);
  const router = useRouter();
  const status = getCourseStatus(endDate, registrationDeadline);
  const registerNextPath = `${coursePath}?register=1`;

  useEffect(() => {
    if (!autoOpen) return;

    let cancelled = false;
    const openIfLoggedIn = async () => {
      try {
        const supabase = createClient();
        setCheckingSession(true);
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        setCheckingSession(false);

        if (data.session) {
          setShowForm(true);
          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", coursePath);
          }
        } else {
          router.replace(`/login?next=${encodeURIComponent(registerNextPath)}`);
        }
      } catch {
        if (!cancelled) {
          setCheckingSession(false);
          router.replace(`/login?next=${encodeURIComponent(registerNextPath)}`);
        }
      }
    };

    void openIfLoggedIn();

    return () => {
      cancelled = true;
    };
  }, [autoOpen, coursePath, registerNextPath, router]);

  const handleRegisterClick = async () => {
    try {
      const supabase = createClient();
      setCheckingSession(true);
      const { data } = await supabase.auth.getSession();
      setCheckingSession(false);

      if (!data.session) {
        router.push(`/login?next=${encodeURIComponent(registerNextPath)}`);
        return;
      }

      setShowForm(true);
    } catch {
      setCheckingSession(false);
      router.push(`/login?next=${encodeURIComponent(registerNextPath)}`);
    }
  };

  if (status === "expired") {
    return (
      <div className="w-full bg-gray-200 text-gray-500 font-bold py-5 px-8 rounded-2xl text-center text-base cursor-not-allowed border border-gray-300">
        Đã hết hạn đăng ký
      </div>
    );
  }

  if (status === "ended") {
    return (
      <div className="w-full bg-gray-300 text-gray-600 font-bold py-5 px-8 rounded-2xl text-center text-base cursor-not-allowed border border-gray-300">
        Khóa học đã kết thúc
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleRegisterClick}
        disabled={checkingSession}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-extrabold py-5 px-8 rounded-2xl hover:from-green-700 hover:to-emerald-600 transition-all duration-300 shadow-xl shadow-green-300/60 hover:shadow-2xl hover:shadow-green-400/80 hover:-translate-y-1 text-xl tracking-wide flex items-center justify-center gap-3"
      >
        {checkingSession ? "Đang kiểm tra..." : "Đăng ký ngay"}
      </button>
      {showForm && (
        <RegistrationForm
          courseId={courseId}
          courseTitle={courseTitle}
          coursePath={coursePath}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}

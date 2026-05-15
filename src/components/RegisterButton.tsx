"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import RegistrationForm from "./RegistrationForm";

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
  const router = useRouter();
  const { status: authStatus } = useSession();
  const isAuthenticated = authStatus === "authenticated";
  const status = getCourseStatus(endDate, registrationDeadline);
  const registerNextPath = `${coursePath}?register=1`;

  useEffect(() => {
    if (!autoOpen) return;
    if (authStatus === "loading") return;

    if (isAuthenticated) {
      setShowForm(true);
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", coursePath);
      }
    } else {
      router.replace(`/login?next=${encodeURIComponent(registerNextPath)}`);
    }
  }, [autoOpen, authStatus, coursePath, registerNextPath, isAuthenticated, router]);

  const handleRegisterClick = async () => {
    if (authStatus === "loading") return;

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(registerNextPath)}`);
      return;
    }

    setShowForm(true);
  };

  if (status === "expired") {
    return (
      <div className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-5 py-3.5 text-center text-sm font-semibold text-gray-500">
        Đã hết hạn đăng ký
      </div>
    );
  }

  if (status === "ended") {
    return (
      <div className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-5 py-3.5 text-center text-sm font-semibold text-gray-500">
        Khóa học đã kết thúc
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleRegisterClick}
        disabled={authStatus === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {authStatus === "loading" ? "Đang kiểm tra..." : "Đăng ký ngay"}
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

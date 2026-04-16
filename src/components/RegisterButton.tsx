"use client";

import { useState } from "react";
import RegistrationForm from "./RegistrationForm";

interface Props {
  courseId: string;
  courseTitle: string;
  endDate?: string;
  registrationDeadline?: string;
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

export default function RegisterButton({ courseId, courseTitle, endDate, registrationDeadline }: Props) {
  const [showForm, setShowForm] = useState(false);
  const status = getCourseStatus(endDate, registrationDeadline);

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
        onClick={() => setShowForm(true)}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-extrabold py-5 px-8 rounded-2xl hover:from-green-700 hover:to-emerald-600 transition-all duration-300 shadow-xl shadow-green-300/60 hover:shadow-2xl hover:shadow-green-400/80 hover:-translate-y-1 text-xl tracking-wide flex items-center justify-center gap-3"
      >
        <span>📋</span>
        Đăng ký ngay
        <span className="inline-block animate-bounce">→</span>
      </button>
      {showForm && (
        <RegistrationForm
          courseId={courseId}
          courseTitle={courseTitle}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}

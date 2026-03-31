"use client";

import { useState } from "react";
import RegistrationForm from "./RegistrationForm";

interface Props {
  courseId: string;
  courseTitle: string;
}

export default function RegisterButton({ courseId, courseTitle }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-4.5 rounded-2xl hover:from-green-700 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-200/60 hover:shadow-xl hover:shadow-green-300/70 hover:-translate-y-0.5 text-lg tracking-wide"
      >
        Đăng ký ngay
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

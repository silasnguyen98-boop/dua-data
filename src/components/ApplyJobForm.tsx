"use client";

import { useState } from "react";
import { ref, push } from "firebase/database";
import { db } from "@/lib/firebase";

interface ApplyJobFormProps {
  jobId: string;
  jobTitle: string;
  applicationLink?: string;
}

export default function ApplyJobForm({ jobId, jobTitle, applicationLink }: ApplyJobFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const application = {
      fullName: formData.get("fullName") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string || "",
      position: (formData.get("position") as string) || jobTitle,
      cvLink: formData.get("cvLink") as string,
      coverLetter: formData.get("coverLetter") as string || "",
      jobId,
      jobTitle,
      appliedAt: new Date().toISOString(),
    };

    try {
      const newRef = push(ref(db, "JobApplications"));
      await import("firebase/database").then(m => m.set(newRef, application));
      setSuccess(true);
    } catch {
      setError("Gửi hồ sơ thất bại, vui lòng thử lại");
    }
    setSubmitting(false);
  }

  function handleReset() {
    setSuccess(false);
    setError("");
  }

  if (success) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Hồ sơ đã được gửi!</h3>
        <p className="text-gray-600 mb-6">
          DUA Edu sẽ liên hệ với bạn sớm nhất khi có cơ hội phù hợp.
        </p>
        <button
          onClick={handleReset}
          className="bg-green-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-700 transition-all"
        >
          Đóng
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 border border-yellow-100">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Ứng tuyển ngay</h2>
      <p className="text-sm text-gray-500 mb-6">
        Để lại thông tin để DUA Edu kết nối bạn với nhà tuyển dụng
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              name="fullName"
              type="text"
              required
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              name="phone"
              type="tel"
              required
              placeholder="0912 345 678"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            placeholder="email@example.com"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí ứng tuyển</label>
          <input
            name="position"
            type="text"
            defaultValue={jobTitle}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link CV (Google Drive) <span className="text-red-500">*</span>
          </label>
          <input
            name="cvLink"
            type="url"
            required
            placeholder="https://drive.google.com/..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thư giới thiệu (tùy chọn)</label>
          <textarea
            name="coverLetter"
            rows={3}
            placeholder="Giới thiệu ngắn về bản thân và kinh nghiệm..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold text-sm rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Đang gửi..." : "Gửi hồ sơ"}
          </button>
          {applicationLink && (
            <a
              href={applicationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 border border-gray-200 text-gray-700 font-medium text-sm rounded-xl hover:bg-gray-50 transition-colors"
            >
              Ứng tuyển trên website công ty
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
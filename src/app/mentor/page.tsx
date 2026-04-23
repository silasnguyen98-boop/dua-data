"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Người mới bắt đầu (0-1 năm)" },
  { value: "intermediate", label: "Có nền tảng (1-3 năm)" },
  { value: "advanced", label: "Nâng cao (3-5 năm)" },
  { value: "senior", label: "Chuyên gia (5+ năm)" },
];

const SKILL_OPTIONS = [
  "Python", "SQL", "Data Analysis", "Machine Learning", "Deep Learning",
  "Data Visualization", "Big Data", "Statistics", "Excel", "Power BI",
  "Tableau", "Business Intelligence", "Data Engineering", "NLP",
  "Computer Vision", "Cloud (AWS/GCP/Azure)", "Blockchain", "DevOps",
];

const TIME_OPTIONS = [
  { value: "weekday_evening", label: "Tối các ngày trong tuần" },
  { value: "weekend_morning", label: "Sáng cuối tuần" },
  { value: "weekend_afternoon", label: "Chiều cuối tuần" },
  { value: "flexible", label: "Linh hoạt theo lịch mentor" },
  { value: "intensive", label: "Học cường độ cao (nhiều giờ/tuần)" },
];

const BENEFITS = [
  {
    icon: "🎯",
    title: "Lộ trình cá nhân hóa",
    desc: "Mentor giúp bạn xây dựng lộ trình học tập phù hợp với mục tiêu và trình độ hiện tại.",
  },
  {
    icon: "💡",
    title: "Giải đáp nhanh chóng",
    desc: "Gặp khó khăn? Mentor sẽ hướng dẫn bạn ngay, không phải chờ đợi hay tìm kiếm mò mẫm.",
  },
  {
    icon: "🚀",
    title: "Học từ kinh nghiệm thực tế",
    desc: "Mentor chia sẻ bài học từ dự án thực tế, giúp bạn tránh sai lầm và tiến nhanh hơn.",
  },
  {
    icon: "🤝",
    title: "Kết nối cộng đồng",
    desc: "Tham gia cộng đồng học viên DUA Edu, mở rộng network và cơ hội nghề nghiệp.",
  },
];

export default function MentorPage() {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    goal: "",
    currentLevel: "",
    skills: [] as string[],
    problems: "",
    availableTime: "",
    budget: "",
  });
  const [error, setError] = useState("");

  function toggleSkill(skill: string) {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter(s => s !== skill)
        : [...f.skills, skill],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.phone.trim() || !form.goal.trim() || !form.currentLevel || !form.availableTime) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/mentor-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Đăng ký thất bại");
      setSubmitted(true);
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="bg-white rounded-3xl border border-green-200 shadow-xl shadow-green-100/50 p-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Đăng ký thành công!</h2>
            <p className="text-gray-600 mb-2">
              Cảm ơn <strong>{form.name}</strong> đã tin tưởng DUA Edu.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Đội ngũ của chúng tôi đang tìm mentor phù hợp với bạn. Bạn sẽ nhận được thông báo qua <strong>{form.phone}</strong> trong thời gian sớm nhất.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 text-left">
              <p className="text-sm font-bold text-amber-700 mb-2">⏳ Trạng thái hiện tại</p>
              <p className="text-sm text-amber-600">Đang tìm mentor phù hợp cho bạn...</p>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm">
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-white border-b border-gray-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-50/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="max-w-5xl mx-auto px-4 py-20 relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-6">
              <span className="text-sm font-semibold text-green-700">🎓</span>
              <span className="text-sm font-semibold text-green-700">Mentoring DUA Edu</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-5 leading-tight">
              Tìm Mentor phù hợp<br />
              <span className="text-green-600">Phát triển sự nghiệp Data</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              Kết nối với mentor giàu kinh nghiệm từ các công ty hàng đầu. Lộ trình học tập cá nhân hóa, giải đáp nhanh chóng, và học từ những gì thực tế nhất.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-lg px-10 py-4 rounded-2xl hover:from-green-700 hover:to-emerald-600 transition-all duration-300 shadow-xl shadow-green-300/60 hover:shadow-2xl hover:shadow-green-400/80 hover:-translate-y-0.5 inline-flex items-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Tìm mentor phù hợp với tôi
            </button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Tại sao nên có Mentor?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-green-200 transition-all">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl mb-4">{b.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Quy trình hoạt động</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Đăng ký", desc: "Điền thông tin về mục tiêu, trình độ và nhu cầu học tập của bạn." },
              { step: "2", title: "Match Mentor", desc: "Đội ngũ DUA Edu sẽ chọn và gán mentor phù hợp nhất cho bạn." },
              { step: "3", title: "Bắt đầu học", desc: "Nhận thông tin mentor, kết nối và bắt đầu hành trình học tập." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4 shadow-lg shadow-green-200">{item.step}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Sẵn sàng tìm mentor?</h2>
          <p className="text-gray-500 mb-6">Đăng ký ngay, chỉ mất 2 phút để hoàn thành.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-base px-8 py-3.5 rounded-2xl hover:from-green-700 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-200/60 hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Tìm mentor phù hợp với tôi
          </button>
        </div>
      </section>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Đăng ký tìm Mentor</h2>
                <p className="text-sm text-gray-500 mt-0.5">Giúp chúng tôi hiểu bạn hơn</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
              {/* Personal info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="0901234567"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-gray-400">(tùy chọn)</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-bold text-gray-700 mb-4">Thông tin học tập</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mục tiêu học tập <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.goal}
                      onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                      placeholder="VD: Muốn trở thành Data Analyst, thành thạo SQL, Python, và Power BI trong 6 tháng..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Level hiện tại <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.currentLevel}
                      onChange={e => setForm(f => ({ ...f, currentLevel: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                      required
                    >
                      <option value="">Chọn level của bạn</option>
                      {LEVEL_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kỹ năng muốn học <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_OPTIONS.map(skill => (
                        <button
                          type="button"
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                            form.skills.includes(skill)
                              ? "bg-green-600 text-white border-green-600 shadow-sm"
                              : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-600"
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                    {form.skills.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1.5">Chọn ít nhất 1 kỹ năng</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Vấn đề đang gặp
                    </label>
                    <textarea
                      value={form.problems}
                      onChange={e => setForm(f => ({ ...f, problems: e.target.value }))}
                      placeholder="VD: Không biết bắt đầu từ đâu, thiếu dự án thực tế để thực hành..."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Thời gian có thể học <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.availableTime}
                        onChange={e => setForm(f => ({ ...f, availableTime: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                        required
                      >
                        <option value="">Chọn thời gian</option>
                        {TIME_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Ngân sách <span className="text-gray-400">(tùy chọn)</span>
                      </label>
                      <input
                        type="text"
                        value={form.budget}
                        onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                        placeholder="VD: 1-3 triệu/tháng"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-200/60 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Gửi đăng ký
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

import Link from "next/link";
import { Course } from "@/types/course";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseImage from "@/components/CourseImage";
import CourseCard from "@/components/CourseCard";
import RegistrationCountdown from "@/components/RegistrationCountdown";
import ExpertCarousel, { Expert } from "@/components/ExpertCarousel";

async function getCourses(): Promise<Course[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/courses`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

async function getExperts(): Promise<Expert[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/experts`, { cache: "no-store" });
    if (!res.ok) return [];
    const experts = await res.json();
    return experts.filter((e: Expert) => e.published);
  } catch {
    return [];
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

const socialProofStats = [
  { number: "300+", label: "Học viên đã tham gia" },
  { number: "12", label: "Lớp đào tạo thực chiến" },
  { number: "70.000+", label: "Thành viên cộng đồng" },
  { number: "98%", label: "Học viên hài lòng" },
];

const whyChooseCards = [
  {
    icon: "🧠",
    title: "Tư duy Data-driven",
    desc: "Hiểu cách thu thập, phân tích và sử dụng dữ liệu để đưa ra quyết định tốt hơn.",
  },
  {
    icon: "🛠️",
    title: "Công cụ là phương tiện",
    desc: "Excel, SQL, Power BI được sử dụng để giải bài toán thực tế, không học lan man.",
  },
  {
    icon: "🚀",
    title: "Đồng hành xuyên suốt sự nghiệp",
    desc: "Dứa không chỉ là nơi bắt đầu, mà là nơi bạn tiếp tục học, phát triển và nâng cấp kỹ năng Data.",
  },
];

const testimonials = [
  {
    stars: 5,
    quote: "Trước đây mình không biết gì về Data. Sau khóa học, mình đã hiểu cách dùng dữ liệu trong công việc và tự tin hơn khi làm các task liên quan đến phân tích.",
    name: "Đặng Hoàng Khôi",
    role: "Người mới bắt đầu với Data",
    initials: "K",
    gradient: "from-green-400 to-emerald-600",
  },
  {
    stars: 5,
    quote: "Mình chuyển từ kế toán sang Data. Khóa học giúp mình hiểu rõ cách phân tích dữ liệu trong thực tế, không còn học lan man như trước.",
    name: "Vũ Thị Mai Lan",
    role: "Data Analyst",
    initials: "L",
    gradient: "from-blue-400 to-indigo-600",
  },
  {
    stars: 5,
    quote: "Mình áp dụng ngay những gì học được vào công việc hằng ngày. Biết cách xử lý dữ liệu và làm báo cáo hiệu quả hơn rất nhiều.",
    name: "Bùi Quốc Hưng",
    role: "Làm việc với Data",
    initials: "H",
    gradient: "from-purple-400 to-pink-600",
  },
  {
    stars: 5,
    quote: "Cộng đồng Dứa rất hỗ trợ. Mỗi khi có vấn đề, luôn có người chia sẻ và giải đáp, giúp mình học nhanh hơn và không bị bỏ lại phía sau.",
    name: "Trịnh Ngọc Yến",
    role: "Thành viên cộng đồng Dứa Data",
    initials: "Y",
    gradient: "from-orange-400 to-red-500",
  },
];

const valueBlocks = [
  {
    icon: "🧠",
    title: "Hiểu Data từ gốc, không chỉ là công cụ",
    desc: "Học cách tiếp cận vấn đề, phân tích dữ liệu và sử dụng Data để giải quyết bài toán thực tế.",
  },
];

function getCourseStatus(startDate: string): "upcoming" | "ongoing" | "completed" {
  const now = new Date();
  const start = new Date(startDate);
  if (start > now) return "upcoming";
  // Assume course runs ~3 months
  const endEstimate = new Date(start);
  endEstimate.setMonth(endEstimate.getMonth() + 3);
  if (now <= endEstimate) return "ongoing";
  return "completed";
}

function sortCourses(courses: Course[]): { main: Course[]; comingSoon: Course | null } {
  if (!courses || courses.length === 0) return { main: [], comingSoon: null };
  const statusOrder = { upcoming: 0, ongoing: 1, completed: 2 };

  const main = courses
    .filter(c => c && c.published !== false && !c.isHidden && !c.comingSoon && c.startDate)
    .filter(c => getCourseStatus(c.startDate) !== "completed")
    .sort((a, b) => {
      const sa = statusOrder[getCourseStatus(a.startDate)];
      const sb = statusOrder[getCourseStatus(b.startDate)];
      if (sa !== sb) return sa - sb;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

  const comingSoonCourses = courses
    .filter(c => c && c.published !== false && !c.isHidden && c.comingSoon)
    .sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime());

  return { main, comingSoon: comingSoonCourses[0] || null };
}

export default async function HomePage() {
  const allCourses = await getCourses();
  const { main: courses, comingSoon } = sortCourses(allCourses);
  const experts = await getExperts();

  return (
    <div className="min-h-screen bg-white bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M40%200H0v40%22%20fill%3D%22none%22%20stroke%3D%22%2322c55e%22%20stroke-opacity%3D%220.04%22%2F%3E%3C%2Fsvg%3E')]">
      <Navbar />

      {/* 1. Hero Section — Tech style */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M40%200H0v40%22%20fill%3D%22none%22%20stroke%3D%22%2322c55e%22%20stroke-opacity%3D%220.08%22%2F%3E%3C%2Fsvg%3E')]" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-green-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-emerald-200/30 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <div className="animate-fade-in-left">
              <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 text-green-700 px-4 py-1.5 rounded-full text-sm font-mono mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Data-driven learning platform
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 leading-tight font-display">
                Dứa Data
              </h1>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent mb-6 leading-tight font-display">
                Học Data để làm được việc thật
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
                Giúp bạn không chỉ học Data, mà dùng dữ liệu để hiểu vấn đề và tạo ra quyết định có giá trị
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#courses"
                  className="inline-flex items-center justify-center bg-green-600 text-white font-semibold px-8 py-3.5 rounded-lg shadow-lg shadow-green-600/20 hover:bg-green-700 hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300"
                >
                  Các khóa học
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </a>
                <a
                  href="#about"
                  className="inline-flex items-center justify-center text-green-700 font-semibold px-8 py-3.5 rounded-lg border border-green-300 hover:border-green-500 hover:bg-green-50 transition-all duration-300"
                >
                  Tìm hiểu thêm
                </a>
              </div>
            </div>

            {/* Right — Data Analyst Dashboard SVG */}
            <div className="hidden lg:flex items-center justify-center animate-fade-in-right">
              <div className="relative w-full max-w-[540px] h-auto aspect-[540/446]">
                <svg viewBox="0 0 460 380" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  {/* Dashboard background */}
                  <rect x="20" y="20" width="420" height="340" rx="16" fill="white" stroke="#16a34a" strokeWidth="1" strokeOpacity="0.2"/>
                  <rect x="20" y="20" width="420" height="40" rx="16" fill="#f0fdf4"/>
                  <rect x="20" y="44" width="420" height="16" fill="#f0fdf4"/>

                  {/* Window dots */}
                  <circle cx="44" cy="40" r="5" fill="#ef4444" opacity="0.7"/>
                  <circle cx="62" cy="40" r="5" fill="#f59e0b" opacity="0.7"/>
                  <circle cx="80" cy="40" r="5" fill="#22c55e" opacity="0.7"/>

                  {/* Title bar text */}
                  <text x="230" y="44" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">dashboard.analytics</text>

                  {/* Bar chart */}
                  <g transform="translate(50, 80)">
                    <text x="0" y="12" fill="#6b7280" fontSize="10" fontFamily="monospace">Revenue</text>
                    <rect x="0" y="25" width="28" height="80" rx="3" fill="#22c55e" opacity="0.3"><animate attributeName="height" from="0" to="80" dur="1.2s" fill="freeze"/></rect>
                    <rect x="35" y="40" width="28" height="65" rx="3" fill="#22c55e" opacity="0.5"><animate attributeName="height" from="0" to="65" dur="1.4s" fill="freeze"/></rect>
                    <rect x="70" y="15" width="28" height="90" rx="3" fill="#22c55e" opacity="0.7"><animate attributeName="height" from="0" to="90" dur="1.6s" fill="freeze"/></rect>
                    <rect x="105" y="5" width="28" height="100" rx="3" fill="#22c55e"><animate attributeName="height" from="0" to="100" dur="1.8s" fill="freeze"/></rect>
                    <rect x="140" y="20" width="28" height="85" rx="3" fill="#22c55e" opacity="0.8"><animate attributeName="height" from="0" to="85" dur="2s" fill="freeze"/></rect>
                  </g>

                  {/* Line chart */}
                  <g transform="translate(240, 80)">
                    <text x="0" y="12" fill="#6b7280" fontSize="10" fontFamily="monospace">Trend</text>
                    <polyline points="0,95 30,80 60,85 90,50 120,60 150,30 180,20" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <animate attributeName="stroke-dashoffset" from="400" to="0" dur="2s" fill="freeze"/>
                    </polyline>
                    <polyline points="0,95 30,80 60,85 90,50 120,60 150,30 180,20" stroke="none" fill="url(#lineGrad)" opacity="0.15"/>
                    {/* Data points */}
                    <circle cx="90" cy="50" r="4" fill="#22c55e"><animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="1.2s" fill="freeze"/></circle>
                    <circle cx="150" cy="30" r="4" fill="#22c55e"><animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="1.6s" fill="freeze"/></circle>
                    <circle cx="180" cy="20" r="4" fill="#22c55e"><animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="1.8s" fill="freeze"/></circle>
                  </g>

                  {/* KPI Cards */}
                  <g transform="translate(50, 210)">
                    <rect x="0" y="0" width="110" height="55" rx="8" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1"/>
                    <text x="12" y="22" fill="#6b7280" fontSize="9" fontFamily="monospace">Students</text>
                    <text x="12" y="42" fill="#22c55e" fontSize="18" fontWeight="bold" fontFamily="system-ui">300+</text>
                  </g>
                  <g transform="translate(175, 210)">
                    <rect x="0" y="0" width="110" height="55" rx="8" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1"/>
                    <text x="12" y="22" fill="#6b7280" fontSize="9" fontFamily="monospace">Courses</text>
                    <text x="12" y="42" fill="#4ade80" fontSize="18" fontWeight="bold" fontFamily="system-ui">12</text>
                  </g>
                  <g transform="translate(300, 210)">
                    <rect x="0" y="0" width="110" height="55" rx="8" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1"/>
                    <text x="12" y="22" fill="#6b7280" fontSize="9" fontFamily="monospace">Rating</text>
                    <text x="12" y="42" fill="#fbbf24" fontSize="18" fontWeight="bold" fontFamily="system-ui">4.9★</text>
                  </g>

                  {/* Donut chart */}
                  <g transform="translate(90, 310)">
                    <circle cx="0" cy="0" r="22" fill="none" stroke="#e5e7eb" strokeWidth="6"/>
                    <circle cx="0" cy="0" r="22" fill="none" stroke="#22c55e" strokeWidth="6" strokeDasharray="110 138" strokeLinecap="round" transform="rotate(-90)">
                      <animate attributeName="stroke-dasharray" from="0 138" to="110 138" dur="1.5s" fill="freeze"/>
                    </circle>
                    <text x="0" y="5" textAnchor="middle" fill="#16a34a" fontSize="11" fontWeight="bold">80%</text>
                  </g>
                  <text x="125" y="305" fill="#6b7280" fontSize="9" fontFamily="monospace">Completion</text>
                  <text x="125" y="320" fill="#374151" fontSize="11">Tỷ lệ hoàn thành khóa</text>

                  {/* Mini table */}
                  <g transform="translate(250, 280)">
                    <rect x="0" y="0" width="170" height="70" rx="8" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1"/>
                    <text x="10" y="18" fill="#6b7280" fontSize="8" fontFamily="monospace">RECENT ENROLLMENTS</text>
                    <line x1="10" y1="24" x2="160" y2="24" stroke="#e5e7eb" strokeWidth="0.5"/>
                    <text x="10" y="38" fill="#374151" fontSize="9">Hoàng Khôi</text>
                    <text x="130" y="38" fill="#22c55e" fontSize="9" fontFamily="monospace">SQL</text>
                    <text x="10" y="52" fill="#374151" fontSize="9">Mai Lan</text>
                    <text x="130" y="52" fill="#4ade80" fontSize="9" fontFamily="monospace">DA</text>
                    <text x="10" y="66" fill="#374151" fontSize="9">Quốc Hưng</text>
                    <text x="130" y="66" fill="#86efac" fontSize="9" fontFamily="monospace">PBI</text>
                  </g>

                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>

                {/* Floating tech badges */}
                <div className="absolute -top-2 -right-2 bg-white border border-green-200 rounded-lg px-3 py-1.5 text-xs font-mono text-green-700 shadow-lg animate-bounce" style={{ animationDelay: "0.5s", animationDuration: "3s" }}>
                  SQL &middot; Python &middot; Power BI
                </div>
                <div className="absolute -bottom-2 -left-2 bg-white border border-green-200 rounded-lg px-3 py-1.5 text-xs font-mono text-green-700 shadow-lg animate-bounce" style={{ animationDelay: "1.5s", animationDuration: "3.5s" }}>
                  Data Analytics
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Social Proof */}
      <section className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22%20fill%3D%22white%22%20opacity%3D%220.08%22%2F%3E%3C%2Fsvg%3E')]" />
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {socialProofStats.map((stat, i) => (
              <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
                <p className="text-3xl md:text-4xl font-bold text-white font-display">{stat.number}</p>
                <p className="text-green-200 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Registration Countdown */}
      <section className="max-w-7xl mx-auto px-4 pt-12 pb-4">
        <RegistrationCountdown courses={allCourses} />
      </section>

      {/* 4. Featured Courses */}
      <section id="courses" className="max-w-7xl mx-auto px-4 pb-20">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">Courses</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-display">Khóa học nổi bật</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Các chương trình được thiết kế xoay quanh bài toán thực tế — giúp bạn học cách sử dụng Data để làm việc và đưa ra quyết định
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto justify-items-center">
          {courses.map((course, i) => (
            <div key={course.id} className="w-full max-w-sm">
              <CourseCard course={course} index={i} />
            </div>
          ))}
        </div>

        {/* Coming Soon — latest one at bottom */}
        {comingSoon && (
          <div className="mt-8 max-w-6xl mx-auto">
            <div className="border-2 border-dashed border-amber-300 bg-amber-50 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">🚀</span>
                <span className="text-sm font-bold text-amber-600 uppercase tracking-wider">Sắp ra mắt</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{comingSoon.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{comingSoon.shortDescription}</p>
              <Link
                href={`/courses/${comingSoon.slug}`}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md"
              >
                Xem chi tiết
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>
          </div>
        )}

        {courses.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">Chưa có khóa học nào</p>
            <p className="mt-2">Hãy thêm khóa học qua trang <Link href="/admin" className="text-green-600 underline">Admin</Link></p>
          </div>
        )}

        {courses.length > 0 && (
          <div className="text-center mt-10">
            <Link href="/courses" className="inline-flex items-center gap-2 bg-green-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-800 transition-all shadow-lg shadow-green-200/50">
              Xem tất cả khóa học
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        )}
      </section>

      {/* 5. About Dứa Data — Dynamic Illustrated Layout */}
      <section id="about" className="relative py-24 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-green-50/60 to-white" />
        <div className="absolute top-20 -left-20 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

        <div className="max-w-7xl mx-auto px-4 relative">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2 text-center">About us</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4 font-display">
            Sứ mệnh đưa Data đến nhiều người hơn
          </h2>
          <p className="text-gray-600 text-center max-w-3xl mx-auto mb-16">
            Dứa Data tin rằng Data không chỉ dành cho người làm kỹ thuật, mà dành cho bất kỳ ai muốn hiểu vấn đề và đưa ra quyết định tốt hơn.
          </p>

          {/* Feature card */}
          <div className="mb-16">
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden animate-fade-in-left group max-w-4xl mx-auto">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
              <div className="relative">
                <div className="text-5xl mb-4">🧠</div>
                <h3 className="text-2xl font-bold mb-3">{valueBlocks[0].title}</h3>
                <p className="text-green-100 leading-relaxed text-lg">{valueBlocks[0].desc}</p>
                {/* Inline illustration: data flow */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Thu thập
                  </div>
                  <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Phân tích
                  </div>
                  <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Quyết định
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Why Choose Dứa Data — integrated into About */}
          <div className="mt-16">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-3">Tại sao chọn Dứa Data?</h3>
            <p className="text-gray-500 max-w-2xl mx-auto text-center mb-10">
              Không chỉ học công cụ, mà học cách dùng Data để làm việc và giải quyết vấn đề
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {whyChooseCards.map((card, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-7 border border-green-100 shadow-lg shadow-green-100/40 animate-fade-in-up hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <span className="text-2xl">{card.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
                  <div className="mt-5 h-1 w-12 rounded-full bg-gradient-to-r from-green-500 to-green-200 group-hover:w-20 transition-all duration-500" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 6. Testimonials — Horizontal Card Blocks */}
      <section className="bg-gradient-to-b from-green-50 via-white to-green-50/30 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-display">Học viên nói gì về Dứa Data</h2>
            <p className="text-gray-500">
              Những chia sẻ thật từ học viên đã đồng hành cùng Dứa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up flex flex-col"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-3 text-yellow-400">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <svg key={j} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
                  ))}
                </div>
                {/* Quote */}
                <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                {/* Avatar & info */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expert Team Section */}
      <section className="py-20 bg-gradient-to-b from-green-50/50 to-white relative overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-green-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">Our Team</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-display">Đội ngũ chuyên gia</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Những người đồng hành cùng bạn trên hành trình Data — giàu kinh nghiệm thực chiến và đam mê chia sẻ.</p>
          </div>
          <ExpertCarousel experts={experts} />
        </div>
      </section>

      {/* 7. Final CTA */}
      <section className="relative bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22%20fill%3D%22white%22%20opacity%3D%220.06%22%2F%3E%3C%2Fsvg%3E')]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl" />

        <div className="max-w-3xl mx-auto text-center px-4 relative">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 font-display">
            Sẵn sàng bắt đầu hành trình với Data?
          </h2>
          <p className="text-green-100 text-lg mb-10 max-w-xl mx-auto">
            Tham gia cùng cộng đồng Dứa Data để học công cụ, hiểu bài toán và phát triển lâu dài trong sự nghiệp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#courses"
              className="inline-flex items-center justify-center bg-white text-green-700 font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:bg-green-50 transition-all duration-300"
            >
              Bắt đầu học ngay
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </a>
            <Link
              href="/roadmap"
              className="inline-flex items-center justify-center bg-transparent text-white font-semibold px-8 py-4 rounded-full border-2 border-white/30 hover:border-white hover:bg-white/10 transition-all duration-300"
            >
              Tìm hiểu lộ trình phù hợp
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

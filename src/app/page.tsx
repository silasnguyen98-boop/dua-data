import Link from "next/link";
import { Course } from "@/types/course";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import RegistrationCountdown from "@/components/RegistrationCountdown";
import ExpertCarousel, { Expert } from "@/components/ExpertCarousel";
import { query } from "@/lib/db";
import { normalizeCourseRows } from "@/lib/course-data";
import { readExpertsByGroup } from "@/lib/expert-json";

export const dynamic = "force-dynamic";

import fs from "fs/promises";
import path from "path";

async function getCourses(): Promise<Course[]> {
  const publicCourseColumns = "id, slug, title, short_description, image, image_url, instructor, price, original_price, discount, total_lessons, students, rating, reviews, start_date, end_date, schedule, hours, category, course_type, published, coming_soon, is_hidden, hide_price, created_at, updated_at";

  try {
    const filePath = path.join(process.cwd(), "src/data/courses.json");
    const stats = await fs.stat(filePath);
    if (stats.isFile()) {
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data) as Course[];
    }
  } catch (err) {}

  try {
    const { rows } = await query(
      `SELECT ${publicCourseColumns} FROM courses WHERE published = true ORDER BY start_date DESC`
    );
    return normalizeCourseRows((rows || []) as Record<string, unknown>[]);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

async function getExperts(): Promise<Expert[]> {
  return readExpertsByGroup("home");
}

const socialProofStats = [
  { number: "300+", label: "Học viên đã tham gia" },
  { number: "12", label: "Lớp đào tạo thực chiến" },
  { number: "70.000+", label: "Thành viên cộng đồng" },
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
    desc: "DUA Edu không chỉ là nơi bắt đầu, mà là nơi bạn tiếp tục học, phát triển và nâng cấp kỹ năng Data.",
  },
];

const testimonials = [
  {
    stars: 5,
    quote: "Trước đây mình không biết gì về Data. Sau khóa học, mình đã hiểu cách dùng dữ liệu trong công việc và tự tin hơn khi làm các task liên quan đến phân tích.",
    name: "Đặng Hoàng Khôi",
    role: "Người mới bắt đầu với Data",
    initials: "K",
    gradient: "from-emerald-400 to-green-600",
  },
  {
    stars: 5,
    quote: "Mình chuyển từ kế toán sang Data. Khóa học giúp mình hiểu rõ cách phân tích dữ liệu trong thực tế, không còn học lan man như trước.",
    name: "Vũ Thị Mai Lan",
    role: "Data Analyst",
    initials: "L",
    gradient: "from-blue-400 to-emerald-600",
  },
  {
    stars: 5,
    quote: "Mình áp dụng ngay những gì học được vào công việc hằng ngày. Biết cách xử lý dữ liệu và làm báo cáo hiệu quả hơn rất nhiều.",
    name: "Bùi Quốc Hưng",
    role: "Làm việc với Data",
    initials: "H",
    gradient: "from-emerald-500 to-emerald-600",
  },
];

function getCourseStatus(startDate: string): "upcoming" | "ongoing" | "completed" {
  const now = new Date();
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return "upcoming";
  if (start > now) return "upcoming";
  const endEstimate = new Date(start);
  endEstimate.setMonth(endEstimate.getMonth() + 3);
  if (now <= endEstimate) return "ongoing";
  return "completed";
}

function getCourseSortTime(course: Course) {
  const start = new Date(course.startDate);
  if (!isNaN(start.getTime())) return start.getTime();
  const createdAt = new Date(course.createdAt || "");
  if (!isNaN(createdAt.getTime())) return createdAt.getTime();
  return 0;
}

function sortCourses(courses: Course[]): { main: Course[]; comingSoon: Course | null } {
  if (!courses || courses.length === 0) return { main: [], comingSoon: null };
  const statusOrder = { upcoming: 0, ongoing: 1, completed: 2 };

  const main = courses
    .filter(c => c && c.published !== false && !c.isHidden && !c.comingSoon)
    .filter(c => getCourseStatus(c.startDate) !== "completed")
    .sort((a, b) => {
      const sa = statusOrder[getCourseStatus(a.startDate)];
      const sb = statusOrder[getCourseStatus(b.startDate)];
      if (sa !== sb) return sa - sb;
      return getCourseSortTime(a) - getCourseSortTime(b);
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
    <div className="min-h-screen bg-white relative">
      <Navbar />

      {/* 1. Hero Section — White Background */}
      {/* 1. Hero Section — Clean & Minimalist Premium */}
      <section className="relative pt-32 pb-32 overflow-hidden bg-white">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-50/50 rounded-full blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16 min-h-[600px]">
            {/* Left — Content */}
            <div className="flex-1 text-center lg:text-left animate-fade-in-up py-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-widest mb-8 border border-green-100">
                Data Learning Hub
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-6 leading-[1] tracking-tighter">
                DUA Edu
              </h1>
              <h2 className="text-3xl md:text-5xl text-green-500 font-bold mb-8 leading-tight">
                Nâng cấp năng lực <br className="hidden md:block" />
                <span className="text-gray-900">bằng dữ liệu.</span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Học cách thấu hiểu bản chất bài toán và đưa ra quyết định dựa trên dữ liệu thực tế.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <a
                  href="#courses"
                  className="px-10 py-5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-green-500/20 hover:-translate-y-0.5 active:scale-95"
                >
                  Bắt đầu ngay
                </a>
                <a
                  href="#about"
                  className="px-10 py-5 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl border border-gray-200 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                >
                  Tìm hiểu thêm
                </a>
              </div>
            </div>

            {/* Right — Minimalist Green/White/Orange Isometric Illustration */}
            <div className="flex-1 w-full max-w-xl relative lg:mt-0">
              <div className="relative flex items-center justify-center">

                {/* Clean Background Ambient */}
                <div className="absolute inset-0 bg-green-500/5 rounded-full blur-[120px]" />

                {/* The "Data Path" Isometric SVG */}
                {/* Custom Styles for Squash & Stretch Interaction */}
                <style>{`
                  @keyframes bar-squash {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(0.7); }
                  }
                  .animate-bar-squash {
                    animation: bar-squash ease-in-out infinite;
                    transform-origin: bottom;
                    transform-box: fill-box;
                  }
                `}</style>

                {/* The "Data Path" Combination Chart SVG */}
                <svg viewBox="0 0 450 450" className="w-full h-auto relative z-10 drop-shadow-2xl overflow-visible max-h-[550px]">
                  {/* Caro (Grid) Pattern Definition */}
                  <defs>
                    <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.3"/>
                    </pattern>
                  </defs>

                  {/* Grid Background */}
                  <rect x="20" y="40" width="410" height="380" fill="url(#gridPattern)" />

                  {/* Axis Labels (Numbers) */}
                  {/* Y-Axis (Vertical) */}
                  <g fill="#9ca3af" fontSize="8" fontWeight="bold">
                    <text x="15" y="405" textAnchor="end">0%</text>
                    <text x="15" y="315" textAnchor="end">25%</text>
                    <text x="15" y="225" textAnchor="end">50%</text>
                    <text x="15" y="135" textAnchor="end">75%</text>
                    <text x="15" y="45" textAnchor="end">100%</text>
                  </g>

                  {/* X-Axis (Horizontal) */}
                  <g fill="#9ca3af" fontSize="8" fontWeight="bold" textAnchor="middle">
                    <text x="45" y="420">D</text>
                    <text x="115" y="420">U</text>
                    <text x="185" y="420">A</text>
                    <text x="255" y="420">E</text>
                    <text x="325" y="420">d</text>
                    <text x="395" y="420">u</text>
                  </g>

                  {/* Subtle Grid Lines (Main axes) */}
                  <line x1="20" y1="400" x2="430" y2="400" stroke="#9ca3af" strokeWidth="1" opacity="0.5" />
                  <line x1="20" y1="40" x2="20" y2="400" stroke="#9ca3af" strokeWidth="1" opacity="0.5" />

                  {/* Bar Chart Background (Green - Fluctuating with Squash Effect) */}
                  {/* Bar: Excel */}
                  <rect
                    x="30" y="310" width="30" height="90" rx="4" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1" opacity="0.8"
                    className="animate-bar-squash"
                    style={{ animationDelay: "0s", animationDuration: "2.5s" }}
                  />
                  {/* Bar 0 - Mindset */}
                  <rect
                    x="100" y="250" width="30" height="150" rx="4" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1" opacity="0.8"
                    className="animate-bar-squash"
                    style={{ animationDelay: "0.2s", animationDuration: "2.1s" }}
                  />
                  {/* Bar 1 - SQL (Lower - Dip) */}
                  <rect
                    x="170" y="280" width="30" height="120" rx="4" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1" opacity="0.8"
                    className="animate-bar-squash"
                    style={{ animationDelay: "0.5s", animationDuration: "2.8s" }}
                  />
                  {/* Bar 2 - Power BI (Higher - Peak) */}
                  <rect
                    x="240" y="160" width="30" height="240" rx="4" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1" opacity="0.8"
                    className="animate-bar-squash"
                    style={{ animationDelay: "0.8s", animationDuration: "2.3s" }}
                  />
                  {/* Bar 3 - Python (Slight Dip) */}
                  <rect
                    x="310" y="190" width="30" height="210" rx="4" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1" opacity="0.8"
                    className="animate-bar-squash"
                    style={{ animationDelay: "1.1s", animationDuration: "2.6s" }}
                  />
                  {/* Bar 4 - Data Careers (Highest - Goal) */}
                  <rect
                    x="380" y="80" width="30" height="320" rx="4" fill="#fff7ed" stroke="#f97316" strokeWidth="1" opacity="0.8"
                    className="animate-bar-squash"
                    style={{ animationDelay: "1.4s", animationDuration: "2.4s" }}
                  />

                  {/* Bouncing Milestones (Perfectly Aligned with Squashed Tops) */}
                  {/* 0. Excel */}
                  <g className="animate-bounce" style={{ animationDelay: "0s", animationDuration: "2.5s" }}>
                    <circle cx="45" cy="313" r="24" fill="white" stroke="#22c55e" strokeWidth="1" />
                    <circle cx="45" cy="313" r="18" fill="#f0fdf4" />
                    <text x="45" y="317" fill="#16a34a" fontSize="7" fontWeight="900" textAnchor="middle">EXCEL</text>
                  </g>

                  {/* 1. Mindset */}
                  <g className="animate-bounce" style={{ animationDelay: "0.2s", animationDuration: "2.1s" }}>
                    <circle cx="115" cy="267" r="28" fill="white" stroke="#facc15" strokeWidth="1" />
                    <circle cx="115" cy="267" r="20" fill="#fefce8" />
                    <text x="115" y="271" fill="#ca8a04" fontSize="7" fontWeight="900" textAnchor="middle">MINDSET</text>
                  </g>

                  {/* 2. SQL */}
                  <g className="animate-bounce" style={{ animationDelay: "0.5s", animationDuration: "2.8s" }}>
                    <circle cx="185" cy="284" r="32" fill="white" stroke="#22c55e" strokeWidth="1" />
                    <circle cx="185" cy="284" r="24" fill="#f0fdf4" />
                    <text x="185" y="288" fill="#16a34a" fontSize="9" fontWeight="900" textAnchor="middle">SQL</text>
                  </g>

                  {/* 3. Power BI */}
                  <g className="animate-bounce" style={{ animationDelay: "0.8s", animationDuration: "2.3s" }}>
                    <circle cx="255" cy="194" r="38" fill="white" stroke="#22c55e" strokeWidth="1.5" />
                    <circle cx="255" cy="194" r="28" fill="#f0fdf4" />
                    <text x="255" y="198" fill="#16a34a" fontSize="9" fontWeight="900" textAnchor="middle">POWER BI</text>
                  </g>

                  {/* 4. Python */}
                  <g className="animate-bounce" style={{ animationDelay: "1.1s", animationDuration: "2.6s" }}>
                    <circle cx="325" cy="221" r="32" fill="white" stroke="#22c55e" strokeWidth="1" />
                    <circle cx="325" cy="221" r="24" fill="#f0fdf4" />
                    <text x="325" y="225" fill="#16a34a" fontSize="9" fontWeight="900" textAnchor="middle">PYTHON</text>
                  </g>

                  {/* 5. Data Careers */}
                  <g className="animate-bounce" style={{ animationDelay: "1.4s", animationDuration: "2.4s" }}>
                    <circle cx="395" cy="131" r="45" fill="#f97316" className="shadow-lg shadow-orange-500/30" />
                    <text x="395" y="131" fill="white" fontSize="9" fontWeight="900" textAnchor="middle">
                      <tspan x="395" dy="-2">DATA</tspan>
                      <tspan x="395" dy="12">CAREERS</tspan>
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats — Grid Background */}
      <section className="py-24 border-y border-gray-50 bg-blue-50/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M40%2040H0V0h40v40zM1%2039V1h38v38H1z%22%20fill%3D%22%23007acc%22%20fill-opacity%3D%220.03%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {socialProofStats.map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-5xl lg:text-7xl font-extrabold text-gray-900 mb-4 tracking-tighter group-hover:text-green-500 transition-colors">
                  {stat.number}
                </div>
                <div className="text-green-600/60 text-xs font-black uppercase tracking-[0.3em]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Courses — White Background */}
      <section id="courses" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-gray-950 mb-6 font-display">
              Khóa học thực chiến
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-xl font-light">
              Thiết kế tinh gọn, tập trung vào kỹ năng bạn thực sự cần.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {courses.map((course, i) => (
              <div key={course.id} className="bg-white rounded-[40px] p-2 shadow-sm border border-gray-50 hover:shadow-2xl transition-all duration-500">
                <CourseCard course={course} index={i} />
              </div>
            ))}
          </div>

          {comingSoon && (
            <div className="mt-20 max-w-4xl mx-auto p-12 rounded-[48px] bg-green-500 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-green-500/20 overflow-hidden relative">
              <div className="relative z-10">
                <div className="inline-block px-4 py-1 rounded-full bg-green-500 text-xs font-bold mb-6 uppercase tracking-widest">
                  Sắp ra mắt
                </div>
                <h3 className="text-3xl font-black mb-4">{comingSoon.title}</h3>
                <p className="text-blue-50 text-lg opacity-80">{comingSoon.shortDescription}</p>
              </div>
              <Link
                href={`/courses/${comingSoon.slug}`}
                className="relative z-10 whitespace-nowrap px-10 py-5 bg-white text-green-600 font-bold rounded-full hover:bg-blue-50 transition-all shadow-xl"
              >
                Đăng ký sớm
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 4. Why DUA Edu — Grid Background */}
      <section id="about" className="py-32 bg-blue-50/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M40%2040H0V0h40v40zM1%2039V1h38v38H1z%22%20fill%3D%22%2310b981%22%20fill-opacity%3D%220.03%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-950 mb-16 font-display leading-[1.3]">
                Triết lý giáo dục
              </h2>
              <div className="space-y-16">
                {whyChooseCards.map((card, i) => (
                  <div key={i} className="group border-l-4 border-blue-50/50 hover:border-green-500 pl-10 transition-all duration-500">
                    <h4 className="text-2xl font-bold text-gray-950 mb-4 group-hover:text-green-600 transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-gray-400 text-lg leading-relaxed font-light">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-[56px] p-16 shadow-[0_40px_100px_rgba(0,0,0,0.04)] border border-gray-100 relative z-10 overflow-hidden border-l-[12px] border-l-green-500">
                {/* Subtle background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50" />

                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl font-black mb-12 leading-tight text-gray-950">
                    "Học ít hơn, hiểu sâu hơn, làm được nhiều hơn."
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4c0 3.5-1 4.5-4 5" />
                        <path d="M13 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2h-3c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4c0 3.5-1 4.5-4 5" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-black text-xl tracking-tight text-gray-950">DUA Edu</div>
                      <div className="text-green-500 text-xs font-bold tracking-widest uppercase">Human-First Education</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-30" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Testimonials — White Background */}
      <section className="py-32 bg-white border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-black text-gray-950 mb-6 font-display leading-[1.3]">
            Học viên nói gì
          </h2>
          <p className="text-gray-400 text-xl font-light">Những trải nghiệm thật từ cộng đồng DUA Edu.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="flex flex-col h-full bg-white p-10 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex-1">
                <div className="flex gap-1 mb-6">
                  {[...Array(t.stars)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-green-500 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 text-lg leading-relaxed mb-10 font-normal">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-4 pt-6 border-t border-gray-50">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                  {t.initials}
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900">{t.name}</div>
                  <div className="text-green-600 text-[10px] font-black tracking-widest uppercase">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CTA — Grid Background */}
      <section className="py-48 bg-blue-50/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M40%2040H0V0h40v40zM1%2039V1h38v38H1z%22%20fill%3D%22%2310b981%22%20fill-opacity%3D%220.03%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-950 mb-12 font-display leading-[1.3]">
            Sẵn sàng bắt đầu <br /> <span className="text-green-500">hành trình với Data?</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 mb-16 max-w-3xl mx-auto font-light leading-relaxed">
            Tham gia cùng cộng đồng DUA Edu để học công cụ, hiểu bài toán và phát triển lâu dài trong sự nghiệp.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a
              href="#courses"
              className="px-14 py-6 bg-green-500 text-white font-bold rounded-full shadow-2xl shadow-green-500/20 hover:bg-green-600 transition-all hover:scale-105"
            >
              Học ngay bây giờ
            </a>
            <Link
              href="/roadmap"
              className="px-14 py-6 bg-blue-50 text-green-600 font-bold rounded-full hover:bg-green-100 transition-all border border-green-100"
            >
              Lộ trình học
            </Link>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-blue-50/40 rounded-full blur-[180px] -z-0" />
      </section>

      <Footer />

      {/* Floating Messenger Contact Button — Premium & Animated */}
      <a
        href="https://m.me/duadata"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-12 right-12 z-[101] group flex flex-row-reverse items-center gap-3"
      >
        <div className="relative">
          {/* Pulse Effect */}
          <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20 group-hover:opacity-40" />

          <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.1)] border border-gray-100 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-12 group-hover:shadow-[0_20px_50px_rgba(34,197,94,0.2)]">
            <svg className="w-9 h-9 text-green-500 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.453 5.503 3.735 7.234.195.148.31.378.31.625v2.855c0 .484.536.772.943.506l3.193-2.09c.162-.106.353-.153.546-.135 1.047.106 2.12.164 3.273.164 5.523 0 10-4.145 10-9.258S17.523 2 12 2zm4.774 7.158l-2.88 4.588a1.123 1.123 0 01-1.638.286l-2.285-1.713a.562.562 0 00-.674.004l-3.23 2.457c-.43.326-.983-.2-.733-.6l2.88-4.588a1.123 1.123 0 011.638-.286l2.285 1.713a.562.562 0 00.674-.004l3.23-2.457c.43-.326.983.2.733.6z" />
            </svg>
          </div>
        </div>

        {/* Hover Label — Now appears to the LEFT */}
        <div className="bg-white px-4 py-2 rounded-xl shadow-xl border border-gray-100 opacity-0 translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
          <span className="text-sm font-black text-gray-900 whitespace-nowrap">Chat với DUA Edu</span>
        </div>
      </a>
    </div>
  );
}

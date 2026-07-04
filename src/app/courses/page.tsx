import { Course } from "@/types/course";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

function getCourseStatus(startDate: string, endDate?: string, registrationDeadline?: string): "expired" | "ended" | "upcoming" | "ongoing" {
  const now = new Date();
  if (registrationDeadline) {
    const deadline = new Date(registrationDeadline);
    if (!isNaN(deadline.getTime()) && deadline < now) return "expired";
  }
  if (endDate) {
    const end = new Date(endDate);
    if (!isNaN(end.getTime()) && end < now) return "ended";
  }
  const start = new Date(startDate);
  if (isNaN(start.getTime()) || start > now) return "upcoming";
  return "ongoing";
}

function getCourseSortTime(course: Course) {
  const start = new Date(course.startDate);
  if (!isNaN(start.getTime())) return start.getTime();
  const createdAt = new Date(course.createdAt || "");
  if (!isNaN(createdAt.getTime())) return createdAt.getTime();
  return 0;
}

function isElearningCourse(course: Course) {
  const courseType = String(course.courseType || "").trim().toLowerCase();
  return courseType === "e_learning" || courseType === "elearning" || courseType === "e-learning";
}

function sortCourses(courses: Course[]): Course[] {
  if (!courses || courses.length === 0) return [];
  const statusOrder: Record<string, number> = { upcoming: 0, ongoing: 1, expired: 2, ended: 2 };
  return courses
    .filter((c) => c && c.published !== false && !c.isHidden && !c.comingSoon && !isElearningCourse(c))
    .sort((a, b) => {
      const sa = statusOrder[getCourseStatus(a.startDate, a.endDate, a.registrationDeadline)] ?? 3;
      const sb = statusOrder[getCourseStatus(b.startDate, b.endDate, b.registrationDeadline)] ?? 3;
      if (sa !== sb) return sa - sb;
      return getCourseSortTime(a) - getCourseSortTime(b);
    });
}

async function getCourses(): Promise<Course[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/courses`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

export default async function CoursesPage() {
  const allCourses = await getCourses();
  const courses = sortCourses(allCourses);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* HERO SECTION - RE-DESIGNED */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-[100px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-green-50/50 rounded-full blur-[80px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter">
              Bắt đầu hành trình <br />
              <span className="text-emerald-500">làm chủ dữ liệu.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed font-medium">
              Từ tư duy phân tích đến thực chiến công cụ — DUA Edu mang đến những khóa học tinh gọn,
              tập trung hoàn toàn vào việc giải quyết bài toán thực tế của doanh nghiệp.
            </p>
          </div>
        </div>
      </section>


      {/* COURSES GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {courses.map((course, i) => (
              <div key={course.id} className="group animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${i * 100}ms` }}>
                <CourseCard course={course} index={i} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 bg-slate-50 rounded-[48px] border border-dashed border-slate-200">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm mb-6 animate-bounce">⚓</div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Đại dương đang tĩnh lặng...</h3>
            <p className="text-slate-500 font-medium">Chúng tôi đang chuẩn bị những hành trình mới, hãy quay lại sau nhé!</p>
          </div>
        )}
      </section>


      {/* FINAL CTA - MATCHING IMAGE 2 */}
      <section className="relative py-40 overflow-hidden bg-white">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M40%2040H0V0h40v40zM1%2039V1h38v38H1z%22%20fill%3D%22%2310b981%22%20fill-opacity%3D%220.05%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-10 leading-[1.1] tracking-tighter mx-auto">
            Nếu bạn chưa biết chọn khóa nào phù hợp, <br />
            <span className="text-emerald-500">nhắn DỨA, DỨA chỉ cho</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            Hành trình chinh phục dữ liệu sẽ dễ dàng hơn khi có người đồng hành cùng bạn.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://m.me/duadata"
              target="_blank"
              rel="noopener noreferrer"
              className="px-12 py-5 bg-emerald-500 text-white font-black text-sm rounded-full shadow-2xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all hover:scale-105 flex items-center justify-center"
            >
              Nhắn cho Dứa ngay
            </a>
            <Link
              href="/roadmap"
              className="px-12 py-5 bg-emerald-50/50 text-emerald-600 font-black text-sm rounded-full hover:bg-emerald-100 transition-all border border-emerald-100/50 flex items-center justify-center"
            >
              Lộ trình học
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

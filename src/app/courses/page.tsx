import { Course } from "@/types/course";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";

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

function sortCourses(courses: Course[]): Course[] {
  if (!courses || courses.length === 0) return [];
  const statusOrder: Record<string, number> = { upcoming: 0, ongoing: 1, expired: 2, ended: 2 };
  return courses
    .filter((c) => c && c.published !== false && !c.isHidden && !c.comingSoon)
    .sort((a, b) => {
      const sa = statusOrder[getCourseStatus(a.startDate, a.endDate, a.registrationDeadline)] ?? 3;
      const sb = statusOrder[getCourseStatus(b.startDate, b.endDate, b.registrationDeadline)] ?? 3;
      if (sa !== sb) return sa - sb;
      return getCourseSortTime(a) - getCourseSortTime(b);
    });
}

async function getCourses(): Promise<Course[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3008";
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
  const courses = sortCourses(await getCourses());

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-green-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">All Courses</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-display">Tất cả khóa học</h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Các chương trình được thiết kế xoay quanh bài toán thực tế — giúp bạn học cách sử dụng Data để làm việc và đưa ra quyết định
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {courses.map((course, i) => (
            <div key={course.id}>
              <CourseCard course={course} index={i} />
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">Chưa có khóa học nào</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

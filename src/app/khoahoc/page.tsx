import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";

interface Course {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  price: number;
  originalPrice: number;
  discount: number;
  startDate: string;
  imageUrl?: string;
  image?: string;
  category: string;
  totalLessons: number;
  students: number;
  rating: number;
  reviews: number;
  hours: string;
  schedule: string;
  instructor: string;
  targetAudience?: string[];
  outcomes?: string[];
  published?: boolean;
  comingSoon?: boolean;
}

function getCourseStatus(startDate: string): "upcoming" | "ongoing" | "completed" {
  if (!startDate) return "upcoming";
  try {
    const now = new Date();
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return "upcoming";
    if (start > now) return "upcoming";
    const endEstimate = new Date(start);
    endEstimate.setMonth(endEstimate.getMonth() + 3);
    if (now <= endEstimate) return "ongoing";
    return "completed";
  } catch {
    return "upcoming";
  }
}

function sortCourses(courses: Course[]): Course[] {
  if (!courses || !Array.isArray(courses)) return [];
  return courses
    .filter((c) => c.published !== false)
    .filter((c) => getCourseStatus(c.startDate) !== "completed" || c.comingSoon)
    .sort((a, b) => {
      if (a.comingSoon && !b.comingSoon) return 1;
      if (!a.comingSoon && b.comingSoon) return -1;
      const statusA = getCourseStatus(a.startDate);
      const statusB = getCourseStatus(b.startDate);
      if (statusA === "upcoming" && statusB !== "upcoming") return -1;
      if (statusA !== "upcoming" && statusB === "upcoming") return 1;
      return 0;
    });
}

async function getCourses(): Promise<Course[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/courses`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function KhoaHocPage() {
  const courses = await getCourses();
  const sorted = sortCourses(courses);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-green-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-display mb-4">
            Khóa học tại Dứa Data
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Học Data để làm được việc. Từ zero đến chuyên nghiệp với lộ trình bài bản và thực chiến.
          </p>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {sorted.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">Chưa có khóa học nào. Hãy quay lại sau!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
              {sorted.map((course, i) => (
                <div key={course.id} className="w-full max-w-sm">
                  <CourseCard course={course} index={i} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

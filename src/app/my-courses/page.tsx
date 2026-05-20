import Link from "next/link";
import { getServerSession } from "next-auth/next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type RegisteredCourse = {
  registrationId: string;
  status: string;
  registeredAt: string;
  learningNeeds: string;
  phone: string;
  courseId: string;
  slug: string;
  title: string;
  shortDescription: string;
  imageUrl: string;
  instructor: string;
  price: number;
  hidePrice: boolean;
  startDate: string;
  schedule: string;
  hours: string;
  category: string;
  courseType: string;
};

const STATUS_LABELS: Record<string, { label: string; className: string; description: string }> = {
  new: {
    label: "Đã đăng ký",
    className: "border-blue-100 bg-blue-50 text-blue-700",
    description: "DUA Edu đã nhận thông tin và sẽ liên hệ xác nhận.",
  },
  contacted: {
    label: "Đã liên hệ",
    className: "border-amber-100 bg-amber-50 text-amber-700",
    description: "Tư vấn viên đã liên hệ hoặc đang chờ bạn phản hồi.",
  },
  paid: {
    label: "Đã thanh toán",
    className: "border-emerald-100 bg-emerald-50 text-emerald-700",
    description: "Thanh toán đã được ghi nhận.",
  },
  onboarded: {
    label: "Đã là học viên",
    className: "border-purple-100 bg-purple-50 text-purple-700",
    description: "Bạn đã được xác nhận là học viên của khóa này.",
  },
  cancelled: {
    label: "Đã hủy",
    className: "border-slate-200 bg-slate-100 text-slate-600",
    description: "Đăng ký này đã được hủy.",
  },
};

const COURSE_TYPE_LABELS: Record<string, string> = {
  offline: "Offline",
  online: "Online live",
  e_learning: "E-learning",
  elearning: "E-learning",
  self_study: "Tự học",
  video: "Video",
};

function normalizeCourseType(value: unknown) {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "e-learning") return "e_learning";
  return raw || "online";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value: number, hidePrice: boolean) {
  if (hidePrice) return "Liên hệ tư vấn";
  if (!Number.isFinite(value) || value <= 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function canLearnOnline(course: RegisteredCourse) {
  return course.status === "onboarded" && ["online", "video", "e_learning", "elearning"].includes(course.courseType);
}

async function getRegisteredCourses(userId: string): Promise<RegisteredCourse[]> {
  const { rows } = await query(
    `SELECT
      r.id as registration_id,
      r.status,
      r.created_at as registered_at,
      r.note as learning_needs,
      r.phone,
      c.id as course_id,
      c.slug,
      c.title,
      c.short_description,
      c.image,
      c.image_url,
      c.instructor,
      c.price,
      c.hide_price,
      c.start_date,
      c.schedule,
      c.hours,
      c.category,
      c.course_type
    FROM course_registrations r
    LEFT JOIN courses c ON r.course_id::text = c.id::text
    WHERE r.user_id = $1
    ORDER BY r.created_at DESC`,
    [userId],
  );

  return ((rows || []) as Record<string, unknown>[]).map((row) => {
    const courseType = normalizeCourseType(row.course_type);
    return {
      registrationId: String(row.registration_id || ""),
      status: String(row.status || "new"),
      registeredAt: String(row.registered_at || ""),
      learningNeeds: String(row.learning_needs || ""),
      phone: String(row.phone || ""),
      courseId: String(row.course_id || ""),
      slug: String(row.slug || row.course_id || ""),
      title: String(row.title || "Khóa học chưa cập nhật"),
      shortDescription: String(row.short_description || ""),
      imageUrl: String(row.image_url || row.image || ""),
      instructor: String(row.instructor || "DUA Edu"),
      price: Number(row.price || 0),
      hidePrice: Boolean(row.hide_price),
      startDate: String(row.start_date || ""),
      schedule: String(row.schedule || ""),
      hours: String(row.hours || ""),
      category: String(row.category || ""),
      courseType,
    };
  });
}

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-black text-green-700">
            D
          </div>
          <h1 className="mb-3 text-3xl font-black tracking-tight text-slate-950">Đăng nhập để xem khóa học</h1>
          <p className="mb-8 text-sm font-medium leading-6 text-slate-500">
            Các khóa bạn đã đăng ký sẽ được hiển thị theo tài khoản Google đang đăng nhập.
          </p>
          <Link href="/login?next=/my-courses" className="rounded-full bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700">
            Đăng nhập
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const courses = await getRegisteredCourses(session.user.id);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-green-600">Tài khoản học viên</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-950">Khóa học của tôi</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Theo dõi các khóa bạn đã đăng ký, trạng thái xử lý và đường vào học online khi được xác nhận.
            </p>
          </div>
          <Link href="/courses" className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-bold text-green-700 transition hover:bg-emerald-50">
            Xem thêm khóa học
          </Link>
        </div>

        {courses.length === 0 ? (
          <section className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-slate-400">
              0
            </div>
            <h2 className="mb-2 text-xl font-black text-slate-950">Bạn chưa đăng ký khóa học nào</h2>
            <p className="mx-auto mb-6 max-w-md text-sm font-medium leading-6 text-slate-500">
              Khi bạn đăng ký khóa học bằng tài khoản này, thông tin sẽ xuất hiện tại đây.
            </p>
            <Link href="/courses" className="inline-flex rounded-full bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700">
              Khám phá khóa học
            </Link>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const status = STATUS_LABELS[course.status] || STATUS_LABELS.new;
              const courseHref = course.slug ? `/courses/${course.slug}` : "/courses";
              return (
                <article key={course.registrationId} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                  <div className="flex h-full flex-col">
                    <div className="aspect-video bg-slate-100">
                      {course.imageUrl ? (
                        <img src={course.imageUrl} alt={course.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-emerald-50 text-3xl font-black text-green-700">
                          DUA
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}>
                          {status.label}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                          {COURSE_TYPE_LABELS[course.courseType] || course.courseType || "Khóa học"}
                        </span>
                      </div>

                      <h2 className="text-xl font-black leading-tight text-slate-950">{course.title}</h2>
                      {course.shortDescription && (
                        <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500">{course.shortDescription}</p>
                      )}

                      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">Ngày đăng ký</p>
                          <p className="font-semibold">{formatDate(course.registeredAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">Khai giảng</p>
                          <p className="font-semibold">{formatDate(course.startDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">Học phí</p>
                          <p className="font-semibold">{formatCurrency(course.price, course.hidePrice)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">Thời lượng</p>
                          <p className="font-semibold">{course.hours || "Chưa cập nhật"}</p>
                        </div>
                      </div>

                      <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-500">
                        {status.description}
                      </p>

                      <div className="mt-auto flex flex-wrap gap-3 pt-5">
                        <Link href={courseHref} className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                          Chi tiết khóa học
                        </Link>
                        {canLearnOnline(course) && (
                          <Link href={`/online?course=${course.courseId}`} className="inline-flex items-center justify-center rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700">
                            Vào học online
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

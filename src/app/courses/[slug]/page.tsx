import Link from "next/link";
import { notFound } from "next/navigation";
import { Course } from "@/types/course";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseImage from "@/components/CourseImage";
import CurriculumAccordion from "@/components/CurriculumAccordion";
import RegisterButton from "@/components/RegisterButton";
import WaitListRegister from "@/components/WaitListRegister";

async function getCourse(slug: string): Promise<Course | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/courses`, { cache: "no-store" });
  if (!res.ok) return null;
  const courses: Course[] = await res.json();
  return courses.find((c) => c.slug === slug) || null;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = await getCourse(params.slug);
  if (!course || course.published === false || course.isHidden === true) notFound();

  const totalTopics = course.curriculum.reduce((sum, item) => sum + (item.topics?.length || 0), 0);
  const shouldHidePrice = course.hidePrice === true;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <Link href="/" className="hover:text-green-600 transition">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link href="/courses" className="hover:text-green-600 transition">Khóa học</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-medium">{course.title}</span>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-600 to-emerald-500" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='white' opacity='0.3'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-20">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-sm bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full font-medium">
                {course.category}
              </span>

              {(() => {
                const now = new Date();

                if (course.registrationDeadline && new Date(course.registrationDeadline) < now) {
                  return (
                    <span className="text-sm bg-red-500/80 backdrop-blur-sm px-4 py-1.5 rounded-full font-medium">
                      Đã hết hạn đăng ký
                    </span>
                  );
                }

                if (course.endDate && new Date(course.endDate) < now) {
                  return (
                    <span className="text-sm bg-gray-500/80 backdrop-blur-sm px-4 py-1.5 rounded-full font-medium">
                      Đã kết thúc
                    </span>
                  );
                }

                return null;
              })()}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {course.title}
            </h1>

            <p className="text-lg text-green-100 max-w-3xl mb-6 leading-relaxed">
              {course.shortDescription}
            </p>
  

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-green-100">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-white font-semibold">{course.rating}</span>
                ({course.reviews} đánh giá)
              </span>

              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {course.students} học viên
              </span>

              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {course.totalLessons} bài học
              </span>

              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {course.instructor}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-10">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Bài học",
                value: course.totalLessons.toString(),
                svg: (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
              },
              {
                label: "Giai đoạn",
                value: course.curriculum.length.toString(),
                svg: (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                ),
              },
              {
                label: "Chủ đề",
                value: totalTopics.toString(),
                svg: (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                ),
              },
              {
                label: "Học viên",
                value: course.students.toString(),
                svg: (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
              },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-md shadow-green-100/40 border border-green-50 text-center">
                <span className="block mb-1 flex justify-center">{stat.svg}</span>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
           {/* Course Description */}
          {course.description && (
            <div className="bg-white rounded-2xl p-6 shadow-md shadow-green-100/40 border border-green-50">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tổng quan khóa học
              </h2>

              <div
                className="text-gray-700 leading-relaxed space-y-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_strong]:font-bold [&_a]:text-green-600 [&_a]:underline [&_img]:rounded-xl [&_img]:my-4 [&_img]:max-w-full"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            </div>
          )}
          {/* Curriculum - Accordion */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Lộ trình học
            </h2>
            <p className="text-sm text-gray-500 mb-6">Nhấn vào từng giai đoạn để xem chi tiết nội dung</p>
            <CurriculumAccordion items={course.curriculum} />
          </div>

          {/* Outcomes */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Bạn sẽ đạt được
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {course.outcomes.map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-md shadow-green-100/40 border border-green-50 flex items-start gap-3 hover:shadow-lg transition-shadow">
                  <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <p className="text-gray-700 font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Đối tượng phù hợp
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {course.targetAudience.map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-md shadow-green-100/40 border border-green-50 flex items-start gap-3 hover:shadow-lg transition-shadow">
                  <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <p className="text-gray-700 font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-[0_8px_40px_-4px_rgba(22,163,74,0.25)] border-2 border-green-200 p-0 sticky top-20 overflow-hidden ring-1 ring-green-100">
            {/* Course Image in card */}
            {course.imageUrl ? (
              <div className="w-full aspect-video overflow-hidden">
                <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full aspect-video overflow-hidden">
                <CourseImage type={course.image || "python"} size="lg" />
              </div>
            )}

            {/* Price section */}
            <div className="bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%221%22%20fill%3D%22white%22%20opacity%3D%220.1%22%2F%3E%3C%2Fsvg%3E')]" />

              <div className="relative">
                {course.comingSoon ? (
                  <div>
                    <span className="inline-block bg-yellow-400 text-yellow-900 text-sm font-bold px-4 py-1.5 rounded-full mb-3 shadow-lg animate-pulse">
                      🔔 Sắp ra mắt
                    </span>
                    <div className="text-2xl font-extrabold text-white drop-shadow-lg">Sắp có mặt</div>
                    <p className="text-green-200 text-sm mt-2">Đăng ký để nhận thông báo ngay khi mở bán</p>
                  </div>
                ) : shouldHidePrice ? (
                  <div>
                    <div className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">
                      Tư vấn miễn phí
                    </div>
                    <p className="text-green-200 text-sm mt-2">
                      Liên hệ để nhận lộ trình và học phí phù hợp
                    </p>
                  </div>
                ) : (
                  <>
                    {course.discount > 0 && (
                      <span className="inline-block bg-red-500 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-3 shadow-lg animate-pulse">
                        Giảm {course.discount}%
                      </span>
                    )}

                    <div className="text-4xl font-extrabold text-white drop-shadow-lg">
                      {formatPrice(course.price)}
                    </div>

                    {course.originalPrice > course.price && (
                      <div className="text-green-200 line-through text-lg mt-1">
                        {formatPrice(course.originalPrice)}
                      </div>
                    )}

                    {course.discount > 0 && (
                      <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm mt-2 px-3 py-1 rounded-full font-medium">
                        Tiết kiệm {formatPrice(course.originalPrice - course.price)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="p-7">
              {/* CTA Buttons */}
              {course.comingSoon ? (
                <WaitListRegister courseId={course.id} courseTitle={course.title} />
              ) : (
                <div className="space-y-3">
                  <RegisterButton
                    courseId={course.id}
                    courseTitle={course.title}
                    endDate={course.endDate}
                    registrationDeadline={course.registrationDeadline}
                  />

                  <a
                    href="https://m.me/100655359652109"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-blue-200/50 hover:shadow-xl text-base"
                  >

                    Tư vấn miễn phí
                  </a>
                </div>
              )}

              {/* Course Info */}
              <div className="space-y-0 text-sm text-gray-600 mt-6 mb-6 bg-green-50/50 rounded-2xl p-4">
                {[
                  {
                    svg: (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ),
                    label: "Khai giảng",
                    value: course.startDate
                      ? new Date(course.startDate).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })
                      : "—",
                  },
                  {
                    svg: (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ),
                    label: "Kết thúc",
                    value: course.endDate
                      ? new Date(course.endDate).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })
                      : "—",
                  },
                  {
                    svg: (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    label: "Hạn đăng ký",
                    value: course.registrationDeadline
                      ? new Date(course.registrationDeadline).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })
                      : "—",
                  },
                  {
                    svg: (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    ),
                    label: "Lịch học",
                    value: course.schedule || "—",
                  },
                  {
                    svg: (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    label: "Giờ học",
                    value: course.hours || "—",
                  },
                  {
                    svg: (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    ),
                    label: "Số bài học",
                    value: course.totalLessons.toString(),
                  },
                  {
                    svg: (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    ),
                    label: "Giai đoạn",
                    value: course.curriculum.length.toString(),
                  },
                  {
                    svg: (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ),
                    label: "Giảng viên",
                    value: course.instructor,
                  },
                ].map((info, i) => (
                  <div key={i} className={`flex justify-between py-3 ${i < 7 ? "border-b border-gray-100" : ""}`}>
                    <span className="flex items-center gap-2">
                      <span className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                        {info.svg}
                      </span>
                      <span className="text-gray-500">{info.label}</span>
                    </span>
                    <span className="font-semibold text-gray-800 text-right max-w-[55%]">
                      {info.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                {[
                  {
                    svg: (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ),
                    text: "Hỗ trợ 1-1 trong suốt khóa học",
                  },
                  {
                    svg: (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    ),
                    text: "Truy cập tài liệu trọn đời",
                  },
                  {
                    svg: (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ),
                    text: "Cộng đồng 70.000+ thành viên",
                  },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <span className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      {badge.svg}
                    </span>
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

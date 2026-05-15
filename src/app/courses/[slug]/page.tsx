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
  const res = await fetch(`${baseUrl}/api/courses?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (res.status === 404 || !res.ok) return null;
  const course = await res.json();
  return course || null;
}

function formatPrice(price: number) {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function formatDate(date?: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
}

function getCourseStatus(course: Course) {
  const now = new Date();

  if (course.registrationDeadline && new Date(course.registrationDeadline) < now) {
    return { label: "Đã hết hạn đăng ký", className: "bg-red-50 text-red-700 border-red-100" };
  }

  if (course.endDate && new Date(course.endDate) < now) {
    return { label: "Đã kết thúc", className: "bg-slate-100 text-slate-600 border-slate-200" };
  }

  if (course.comingSoon) {
    return { label: "Sắp ra mắt", className: "bg-amber-50 text-amber-700 border-amber-100" };
  }

  return { label: "Đang mở đăng ký", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
}

function CheckIcon() {
  return (
    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { register?: string };
}) {
  const course = await getCourse(params.slug);
  if (!course || course.published === false || course.isHidden === true) notFound();

  const autoOpenRegister = searchParams?.register === "1";
  const totalTopics = course.curriculum.reduce((sum, item) => sum + (item.topics?.length || 0), 0);
  const shouldHidePrice = course.hidePrice === true;
  const status = getCourseStatus(course);

  const heroStats = [
    { label: "Bài học", value: course.totalLessons.toString(), icon: "📚" },
    { label: "Giai đoạn", value: course.curriculum.length.toString(), icon: "🗺️" },
    { label: "Chủ đề", value: totalTopics.toString(), icon: "🎯" },
    { label: "Học viên", value: course.students.toString(), icon: "👥" },
  ];

  const courseInfo = [
    { label: "Khai giảng", value: formatDate(course.startDate) },
    { label: "Kết thúc", value: formatDate(course.endDate) },
    { label: "Hạn đăng ký", value: formatDate(course.registrationDeadline) },
    { label: "Lịch học", value: course.schedule || "—" },
    { label: "Giờ học", value: course.hours || "—" },
    { label: "Giảng viên", value: course.instructor || "—" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* BREADCRUMBS */}
      <div className="bg-slate-50/50 pt-32 pb-4">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          <Link href="/" className="transition hover:text-emerald-600">Home</Link>
          <span className="opacity-30">/</span>
          <Link href="/courses" className="transition hover:text-emerald-600">Courses</Link>
          <span className="opacity-30">/</span>
          <span className="text-emerald-600">{course.slug}</span>
        </div>
      </div>

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-slate-50/50 pb-20 pt-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />

          <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[1fr_450px] items-center">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-900 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  {course.category}
                </span>
                <span className={`rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${status.className}`}>
                  {status.label}
                </span>
              </div>

              <h1 className="text-4xl font-black leading-[1.1] text-slate-900 md:text-6xl tracking-tight mb-8">
                {course.title}
              </h1>

              <div className="flex items-center gap-6 mb-8 py-6 border-y border-slate-200/60">
                 <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-lg">★★★★★</span>
                    <span className="text-sm font-black text-slate-900">{course.rating}</span>
                    <span className="text-sm font-bold text-slate-400">({course.reviews} reviews)</span>
                 </div>
                 <div className="w-px h-4 bg-slate-300" />
                 <div className="text-sm font-bold text-slate-500">Giảng viên: <span className="text-slate-900">{course.instructor}</span></div>
              </div>

              <p className="text-lg leading-relaxed text-slate-500 font-medium max-w-2xl italic">
                "{course.shortDescription}"
              </p>
            </div>

            <div className="relative animate-in fade-in zoom-in duration-1000 delay-200">
              <div className="absolute -inset-4 bg-emerald-500/10 rounded-[40px] blur-2xl -z-10" />
              <div className="overflow-hidden rounded-[32px] border-4 border-white bg-white shadow-2xl relative">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.title} className="aspect-video h-full w-full object-cover" />
                ) : (
                  <div className="aspect-video">
                    <CourseImage type={course.image || "python"} size="lg" />
                  </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT GRID */}
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1fr_400px]">
          <div className="space-y-16">
            {/* STATS */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1">
                  <div className="text-3xl mb-3">{stat.icon}</div>
                  <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* DESCRIPTION */}
            {course.description && (
              <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-1 bg-emerald-500 rounded-full" />
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Chi tiết hành trình</h2>
                </div>
                <div
                  className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed
                  [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:mt-12 [&_h2]:mb-6
                  [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-slate-900 [&_h3]:mt-10 [&_h3]:mb-4
                  [&_p]:mb-6 [&_strong]:text-slate-900 [&_strong]:font-black
                  [&_ul]:space-y-3 [&_ul]:list-none [&_ul]:pl-0
                  [&_li]:flex [&_li]:gap-3 [&_li:before]:content-['⚓'] [&_li:before]:text-emerald-500 [&_li:before]:font-black
                  [&_img]:rounded-[32px] [&_img]:shadow-2xl [&_img]:my-12 [&_img]:border-4 [&_img]:border-white"
                  dangerouslySetInnerHTML={{ __html: course.description }}
                />
              </section>
            )}

            {/* CURRICULUM */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-1 bg-emerald-500 rounded-full" />
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Lộ trình chi tiết</h2>
                </div>
                <div className="px-4 py-1.5 bg-emerald-50 rounded-full text-xs font-black text-emerald-700 uppercase tracking-widest">
                  {course.curriculum.length} Giai đoạn
                </div>
              </div>
              <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                <CurriculumAccordion items={course.curriculum} />
              </div>
            </section>

            {/* OUTCOMES & TARGET */}
            <div className="grid md:grid-cols-2 gap-10">
              {course.outcomes.length > 0 && (
                <section className="space-y-6">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <span className="w-2 h-6 bg-emerald-500 rounded-full" /> Bạn sẽ đạt được
                  </h2>
                  <div className="space-y-3">
                    {course.outcomes.map((item) => (
                      <div key={item} className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100/50 text-sm font-bold text-slate-700 leading-relaxed transition-all hover:bg-white hover:shadow-lg hover:border-emerald-100">
                        <CheckIcon />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {course.targetAudience.length > 0 && (
                <section className="space-y-6">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <span className="w-2 h-6 bg-amber-500 rounded-full" /> Đối tượng phù hợp
                  </h2>
                  <div className="space-y-3">
                    {course.targetAudience.map((item) => (
                      <div key={item} className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100/50 text-sm font-bold text-slate-700 leading-relaxed transition-all hover:bg-white hover:shadow-lg hover:border-emerald-100">
                        <CheckIcon />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* SIDEBAR - BOARDING PASS */}
          <aside className="lg:sticky lg:top-32 h-fit animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="rounded-[40px] border border-slate-100 bg-white p-2 shadow-2xl shadow-slate-200/50">
              <div className="rounded-[36px] bg-slate-900 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />

                {course.comingSoon ? (
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">Coming Soon</p>
                    <h3 className="text-3xl font-black mb-4">Sắp khởi hành</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">Đăng ký vào danh sách chờ để nhận ưu đãi sớm nhất.</p>
                  </div>
                ) : shouldHidePrice ? (
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">Consulting</p>
                    <h3 className="text-3xl font-black mb-4">Liên hệ tư vấn</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">Nhận lộ trình học cá nhân hóa phù hợp với mục tiêu của bạn.</p>
                  </div>
                ) : (
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-4">Boarding Ticket</p>
                    <div className="flex items-end gap-3 mb-4">
                      <span className="text-4xl font-black tracking-tighter">{formatPrice(course.price)}</span>
                      {course.price > 0 && course.originalPrice > course.price && (
                        <span className="text-lg text-slate-500 line-through pb-1">{formatPrice(course.originalPrice)}</span>
                      )}
                    </div>
                    {course.price > 0 && course.discount > 0 && (
                      <div className="inline-block px-3 py-1 rounded-full bg-emerald-500 text-[10px] font-black uppercase tracking-widest text-white">
                        Tiết kiệm {course.discount}%
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
                <div className="py-4">
                  {course.comingSoon ? (
                    <WaitListRegister courseId={course.id} courseTitle={course.title} />
                  ) : (
                    <div className="space-y-4">
                      <RegisterButton
                        courseId={course.id}
                        courseTitle={course.title}
                        coursePath={`/courses/${course.slug || params.slug}`}
                        endDate={course.endDate}
                        registrationDeadline={course.registrationDeadline}
                        autoOpen={autoOpenRegister}
                      />

                      <a
                        href="https://m.me/duadata"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white px-5 py-5 text-sm font-black text-slate-800 transition-all hover:bg-slate-50 hover:border-slate-200 active:scale-95 shadow-sm"
                      >
                        <span className="text-lg">💬</span> Tư vấn miễn phí
                      </a>
                    </div>
                  )}
                </div>

                {/* COURSE INFO LIST */}
                <div className="space-y-4 px-2">
                  {courseInfo.map((info) => (
                    <div key={info.label} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-400">{info.label}</span>
                      <span className="font-black text-slate-900">{info.value}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                   <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                      <span className="text-xl">✅</span>
                      Hỗ trợ 1-1 trong suốt hành trình
                   </div>
                   <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                      <span className="text-xl">🎓</span>
                      Chứng chỉ hoàn thành từ DUA Edu
                   </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

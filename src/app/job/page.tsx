import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  company: string;
  summary: string;
  content: string;
  imageUrl: string;
  workType: string;
  location: string;
  position: string;
  applicationLink: string;
  applicationDeadline: string;
  salary: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

const jobFormUrl = "https://forms.gle/bJTWKuToEDowfCSq8";

const workTypeColors: Record<string, string> = {
  "Full-time": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Part-time": "bg-blue-50 text-blue-700 border-blue-100",
  Internship: "bg-amber-50 text-amber-700 border-amber-100",
  Freelance: "bg-purple-50 text-purple-700 border-purple-100",
  Remote: "bg-teal-50 text-teal-700 border-teal-100",
};

async function getJobs(): Promise<Job[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/jobs`, { cache: "no-store" });
    if (!res.ok) return [];

    const data: Job[] = await res.json();
    return Array.isArray(data) ? data.filter((job) => job.published) : [];
  } catch {
    return [];
  }
}

function formatDeadline(dateStr: string) {
  if (!dateStr) return null;

  const deadline = new Date(dateStr);
  if (isNaN(deadline.getTime())) return null;

  deadline.setHours(23, 59, 59, 999);

  const now = new Date();
  const diffDays = Math.ceil(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return { text: "Đã hết hạn", urgent: true };
  if (diffDays === 0) return { text: "Hết hạn hôm nay", urgent: true };
  if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, urgent: true };

  return { text: `Còn ${diffDays} ngày`, urgent: false };
}

export default async function JobPage() {
  const jobs = await getJobs();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-yellow-100">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-white to-orange-50" />
        <div className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-yellow-200/30 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-white/80 px-4 py-1.5 text-sm font-semibold text-yellow-700 shadow-sm">
              Việc làm Data
            </div>

            <h1 className="font-display text-4xl font-bold text-gray-950 md:text-6xl">
              Để lại thông tin tìm việc ngành{" "}
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Data
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
              Dứa Data sẽ chủ động kết nối bạn với các cơ hội phù hợp từ network
              doanh nghiệp, đối tác tuyển dụng và cộng đồng Data.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={jobFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-gray-900/10 transition hover:bg-yellow-600"
              >
                Để lại thông tin tìm việc
              </a>

              <a
                href="#explore-jobs"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-800 shadow-sm transition hover:border-yellow-300 hover:bg-yellow-50"
              >
                Khám phá công việc
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-yellow-100 bg-white/80 p-6 shadow-xl shadow-yellow-900/5 backdrop-blur">
            <div className="space-y-4">
              {[
                ["01", "Điền thông tin", "Chia sẻ mục tiêu, kinh nghiệm và vị trí bạn đang tìm."],
                ["02", "Nhận cơ hội phù hợp", "Dứa Data lọc và kết nối với các job đúng định hướng."],
                ["03", "Ứng tuyển nhanh hơn", "Bạn vẫn có thể tự khám phá các công việc đang mở bên dưới."],
              ].map(([step, title, desc]) => (
                <div key={step} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-sm font-bold text-yellow-700">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-950">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="explore-jobs" className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-yellow-600">
            Khám phá các công việc
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-950">
            Cơ hội đang mở
          </h2>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-yellow-200 bg-yellow-50/60 px-6 py-20 text-center">
            <h2 className="text-2xl font-bold text-gray-800">Chưa có việc làm nào</h2>
            <p className="mt-2 text-gray-500">
              Bạn vẫn có thể để lại thông tin để được kết nối khi có cơ hội phù hợp.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {jobs.map((job) => {
              const deadlineInfo = formatDeadline(job.applicationDeadline);
              const typeColor =
                workTypeColors[job.workType] ||
                "bg-gray-50 text-gray-600 border-gray-100";
              const companyInitial = job.company?.trim()?.charAt(0) || "?";

              return (
                <Link key={job.id} href={`/job/${job.id}`} className="group block">
                  <article className="flex flex-col gap-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-yellow-300 hover:shadow-xl hover:shadow-yellow-900/5 md:flex-row md:items-center md:p-6">
                    {job.imageUrl ? (
                      <img
                        src={job.imageUrl}
                        alt={job.company || job.title}
                        className="h-16 w-16 rounded-2xl border border-gray-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100">
                        <span className="text-2xl font-bold text-yellow-700">
                          {companyInitial}
                        </span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {job.workType && (
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${typeColor}`}>
                            {job.workType}
                          </span>
                        )}

                        {job.location && (
                          <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-600">
                            {job.location}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-gray-950 transition group-hover:text-yellow-700">
                        {job.title}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-gray-500">
                        {job.company || "Đang cập nhật"}
                      </p>

                      {job.summary && (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
                          {job.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-5 border-t border-gray-100 pt-4 md:w-56 md:flex-col md:items-end md:border-l md:border-t-0 md:pl-5 md:pt-0">
                      <div className="text-left md:text-right">
                        <p className="text-sm font-bold text-emerald-600">
                          {job.salary || "Lương thỏa thuận"}
                        </p>

                        {deadlineInfo && (
                          <p className={`mt-1 text-xs font-semibold ${deadlineInfo.urgent ? "text-red-500" : "text-gray-400"}`}>
                            {deadlineInfo.text}
                          </p>
                        )}
                      </div>

                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-950 text-white transition group-hover:bg-yellow-600">
                        →
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

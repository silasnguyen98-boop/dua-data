import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { notFound } from "next/navigation";

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

const workTypeColors: Record<string, string> = {
  "Full-time": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Part-time": "bg-blue-50 text-blue-700 border-blue-100",
  Internship: "bg-amber-50 text-amber-700 border-amber-100",
  Freelance: "bg-purple-50 text-purple-700 border-purple-100",
  Remote: "bg-teal-50 text-teal-700 border-teal-100",
};

async function getJob(id: string): Promise<Job | null> {
  const snapshot = await get(ref(db, `Job/${id}`));
  if (!snapshot.exists()) return null;
  return { ...(snapshot.val() as Job), id };
}

function formatDate(dateStr: string) {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const job = await getJob(params.id);

  if (!job || !job.published) {
    notFound();
  }

  const typeColor =
    workTypeColors[job.workType] || "bg-gray-50 text-gray-600 border-gray-100";
  const companyInitial = job.company?.trim()?.charAt(0) || "?";
  const formattedDeadline = formatDate(job.applicationDeadline);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="bg-gradient-to-br from-yellow-50 via-white to-orange-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Link
            href="/job"
            className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-yellow-300 hover:text-yellow-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Quay lại danh sách việc làm
          </Link>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-yellow-900/5">
              <div className="border-b border-gray-100 bg-white p-6 md:p-10">
                <div className="flex flex-col gap-6 sm:flex-row">
                  {job.imageUrl ? (
                    <img
                      src={job.imageUrl}
                      alt={job.company || job.title}
                      className="h-20 w-20 shrink-0 rounded-2xl border border-gray-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100">
                      <span className="text-3xl font-bold text-yellow-700">
                        {companyInitial}
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {job.workType && (
                        <span
                          className={`rounded-full border px-3 py-1 text-sm font-bold ${typeColor}`}
                        >
                          {job.workType}
                        </span>
                      )}

                      {job.location && (
                        <span className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-sm font-bold text-gray-600">
                          {job.location}
                        </span>
                      )}

                      {job.salary && (
                        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                          {job.salary}
                        </span>
                      )}
                    </div>

                    <h1 className="font-display text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
                      {job.title}
                    </h1>

                    <p className="mt-3 text-lg font-medium text-gray-500">
                      {job.company || "Đang cập nhật"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-10">
                <div className="mb-8 grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 sm:grid-cols-2">
                  {job.position && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Vị trí
                      </p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {job.position}
                      </p>
                    </div>
                  )}

                  {formattedDeadline && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Hạn nộp
                      </p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {formattedDeadline}
                      </p>
                    </div>
                  )}
                </div>

                {job.content ? (
                  <section>
                    <h2 className="mb-4 text-2xl font-bold text-gray-950">
                      Mô tả công việc
                    </h2>
                    <div className="whitespace-pre-line text-base leading-8 text-gray-600">
                      {job.content}
                    </div>
                  </section>
                ) : job.summary ? (
                  <section>
                    <h2 className="mb-4 text-2xl font-bold text-gray-950">
                      Tóm tắt
                    </h2>
                    <p className="text-base leading-8 text-gray-600">
                      {job.summary}
                    </p>
                  </section>
                ) : null}
              </div>
            </article>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-yellow-100 bg-white p-6 shadow-xl shadow-yellow-900/5">
                <p className="text-sm font-bold uppercase tracking-wide text-yellow-600">
                  Ứng tuyển
                </p>

                <h2 className="mt-3 text-2xl font-bold text-gray-950">
                  Sẵn sàng gửi hồ sơ?
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Kiểm tra thông tin công việc, sau đó nhấn ứng tuyển để đi tới
                  trang nộp hồ sơ của vị trí này.
                </p>

                {job.applicationLink ? (
                  <a
                    href={job.applicationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gray-950 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-gray-900/10 transition hover:bg-yellow-600"
                  >
                    Ứng tuyển ngay
                  </a>
                ) : (
                  <div className="mt-6 rounded-xl bg-gray-100 px-6 py-3.5 text-center text-sm font-bold text-gray-500">
                    Chưa mở ứng tuyển
                  </div>
                )}

                <div className="mt-6 border-t border-gray-100 pt-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Công ty
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {job.company || "Đang cập nhật"}
                  </p>

                  {formattedDeadline && (
                    <>
                      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-400">
                        Hạn ứng tuyển
                      </p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {formattedDeadline}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

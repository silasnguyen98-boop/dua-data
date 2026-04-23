import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LeadResourceModal from "@/components/LeadResourceModal";
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

const workTypeColors: Record<string, string> = {
  "Full-time": "bg-green-100 text-green-700",
  "Part-time": "bg-blue-100 text-blue-700",
  "Internship": "bg-amber-100 text-amber-700",
  "Freelance": "bg-purple-100 text-purple-700",
  "Remote": "bg-teal-100 text-teal-700",
};

async function getJobs(): Promise<Job[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/jobs`, { cache: "no-store" });
    if (!res.ok) return [];
    const data: Job[] = await res.json();
    return data.filter((j) => j.published);
  } catch {
    return [];
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDeadline(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: "Đã hết hạn", urgent: true };
  if (diffDays === 0) return { text: "Hết hạn hôm nay", urgent: true };
  if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, urgent: true };
  if (diffDays <= 7) return { text: `Còn ${diffDays} ngày`, urgent: false };
  return { text: `Còn ${diffDays} ngày`, urgent: false };
}

export default async function JobPage() {
  const jobs = await getJobs();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-white to-orange-50" />
        <div className="absolute top-10 right-20 w-72 h-72 bg-yellow-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Việc làm Data
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-display">
            Cơ hội nghề nghiệp <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Data</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Kết nối bạn với các cơ hội việc làm phù hợp từ network doanh nghiệp và đối tác của Dứa Data
          </p>
        </div>
      </section>

      {/* Job listings */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {jobs.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Chưa có việc làm nào</h2>
            <p className="text-gray-500">Hãy quay lại sau để xem các cơ hội mới</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => {
              const deadlineInfo = formatDeadline(job.applicationDeadline);
              const typeColor = workTypeColors[job.workType] || "bg-gray-100 text-gray-600";

              return (
                <Link key={job.id} href={`/job/${job.id}`}>
                  <div className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-yellow-400 hover:shadow-lg transition-all duration-200 cursor-pointer h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        {job.imageUrl ? (
                          <img
                            src={job.imageUrl}
                            alt={job.company}
                            className="w-14 h-14 rounded-xl object-cover mb-3 border border-gray-100"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center mb-3">
                            <span className="text-xl font-bold text-yellow-600">
                              {job.company.charAt(0)}
                            </span>
                          </div>
                        )}
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-yellow-700 transition-colors line-clamp-2">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{job.company}</p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${typeColor}`}>
                        {job.workType}
                      </span>
                      {job.location && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.location}
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    {job.summary && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">{job.summary}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                      {job.salary && (
                        <span className="text-sm font-semibold text-emerald-600">{job.salary}</span>
                      )}
                      {deadlineInfo && (
                        <span className={`text-xs font-medium ${deadlineInfo.urgent ? "text-red-500" : "text-gray-400"}`}>
                          {deadlineInfo.text}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-10 border border-yellow-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Không tìm thấy việc phù hợp?</h2>
          <p className="text-gray-600 mb-6">
            Để lại thông tin để Dứa Data chủ động kết nối bạn với các cơ hội phù hợp trong tương lai
          </p>
          <LeadResourceModal />
        </div>
      </section>

      <Footer />
    </div>
  );
}
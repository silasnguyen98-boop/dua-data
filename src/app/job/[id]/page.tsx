import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { notFound } from "next/navigation";
import ApplyJobForm from "@/components/ApplyJobForm";

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

async function getJob(id: string): Promise<Job | null> {
  const snapshot = await get(ref(db, `Job/${id}`));
  if (!snapshot.exists()) return null;
  return { ...(snapshot.val() as Job), id };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);

  if (!job || !job.published) {
    notFound();
  }

  const typeColor = workTypeColors[job.workType] || "bg-gray-100 text-gray-600";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Back */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <Link href="/job" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-yellow-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách việc làm
        </Link>
      </div>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-6 mb-8">
            {job.imageUrl ? (
              <img
                src={job.imageUrl}
                alt={job.company}
                className="w-20 h-20 rounded-2xl object-cover border border-gray-100 flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-yellow-600">{job.company.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-lg text-gray-500 mb-3">{job.company}</p>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${typeColor}`}>
                  {job.workType}
                </span>
                {job.location && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {job.location}
                  </span>
                )}
                {job.salary && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
                    {job.salary}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-6 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
            {job.position && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Vị trí: <strong className="text-gray-700">{job.position}</strong></span>
              </div>
            )}
            {job.applicationDeadline && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Hạn nộp: <strong className="text-gray-700">{formatDate(job.applicationDeadline)}</strong></span>
              </div>
            )}
          </div>

          {/* Content */}
          {job.content && (
            <div className="prose max-w-none mb-10">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Mô tả công việc</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">{job.content}</div>
            </div>
          )}

          {job.summary && !job.content && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Tóm tắt</h2>
              <p className="text-gray-600 leading-relaxed">{job.summary}</p>
            </div>
          )}

          {/* Apply */}
          <ApplyJobForm jobId={job.id} jobTitle={job.title} applicationLink={job.applicationLink} />
        </div>
      </section>

      <Footer />
    </div>
  );
}

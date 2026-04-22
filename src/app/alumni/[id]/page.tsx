import { Alumni } from "@/types/alumni";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

async function getAlumni(id: string): Promise<Alumni | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/alumni`, { cache: "no-store" });
  if (!res.ok) return null;
  const list: Alumni[] = await res.json();
  return list.find(a => a.id === id) ?? null;
}

export default async function AlumniDetailPage({ params }: Props) {
  const { id } = await params;
  const alumni = await getAlumni(id);

  if (!alumni || alumni.published === false) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Back link */}
        <a
          href="/alumni"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          ← Danh sách Alumni
        </a>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-green-100/30 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left: Content */}
            <div className="flex-1 p-8 lg:p-12 flex flex-col">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4 mb-6">
                {alumni.imageUrl ? (
                  <img
                    src={alumni.imageUrl}
                    alt={alumni.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-green-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center ring-2 ring-green-200">
                    <span className="text-xl font-bold text-white">{alumni.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">{alumni.name}</h1>
                  <p className="text-green-600 font-semibold text-sm mt-0.5">{alumni.job}</p>
                </div>
              </div>

              {/* LinkedIn */}
              {alumni.linkedin && (
                <a
                  href={alumni.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mb-8"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  Xem LinkedIn
                </a>
              )}

              {/* Divider */}
              <div className="border-t border-gray-100 mb-8" />

              {/* Content */}
              <div className="flex-1">
                <div className="text-gray-700 leading-relaxed text-base [&_p]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-gray-900 [&_strong]:font-semibold">
                  <div dangerouslySetInnerHTML={{ __html: alumni.content }} />
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="mt-10 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-3">Bạn muốn trở thành Alumni tiếp theo?</p>
                <a
                  href="/courses"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-green-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm"
                >
                  Khám phá khóa học
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Right: Large Image */}
            <div className="lg:w-[45%] relative min-h-[300px] lg:min-h-[600px]">
              {(() => {
                const img = alumni.coverImage || alumni.imageUrl;
                if (!img) return null;
                return (
                  <img
                    src={img}
                    alt={alumni.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                );
              })()}
              {!alumni.coverImage && !alumni.imageUrl && (
                <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
                  <span className="text-[120px] font-bold text-white/20">{alumni.name.charAt(0)}</span>
                </div>
              )}
              {/* Gradient overlay on image edge */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 pointer-events-none lg:block hidden" />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LeadResourceModal from "@/components/LeadResourceModal";

interface Resource {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

async function getResources(): Promise<Resource[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/resources`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.filter((r: Resource) => r.published);
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

const categories = [
  { key: "all", label: "Tất cả" },
  { key: "Tutorial", label: "Hướng dẫn" },
  { key: "Template", label: "Template" },
  { key: "Tool", label: "Công cụ" },
  { key: "Article", label: "Bài viết" },
];

export default async function ResourcePage() {
  const resources = await getResources();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50" />
        <div className="absolute top-10 right-20 w-72 h-72 bg-green-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Resource Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-display">
            Tài nguyên <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Dứa Data</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tổng hợp các bài viết, template, công cụ và hướng dẫn miễn phí từ cộng đồng Dứa Data
          </p>
          <LeadResourceModal />
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {resources.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sắp ra mắt!</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Đội ngũ Dứa Data đang chuẩn bị những tài nguyên chất lượng. Hãy quay lại sau nhé!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((resource, i) => (
              <Link
                key={resource.id}
                href={`/resource/${resource.slug}`}
                className="group bg-white rounded-3xl overflow-hidden shadow-md shadow-green-100/40 border border-green-50 hover:shadow-2xl hover:shadow-green-100/60 hover:-translate-y-2 transition-all duration-500 flex flex-col animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Image */}
                {resource.imageUrl ? (
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={resource.imageUrl}
                      alt={resource.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 text-[11px] font-semibold bg-white/95 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full shadow">
                      {resource.category}
                    </span>
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center relative">
                    <svg className="w-16 h-16 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="absolute top-3 left-3 text-[11px] font-semibold bg-white/95 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full shadow">
                      {resource.category}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300 mb-2 text-[17px] leading-snug line-clamp-2">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-3 leading-relaxed">
                    {resource.summary}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100/80">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                        {resource.author.charAt(0)}
                      </div>
                      <span>{resource.author}</span>
                      <span className="text-gray-300">|</span>
                      <span>{formatDate(resource.createdAt)}</span>
                    </div>
                    <svg className="w-4 h-4 text-green-500 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

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

const PAGE_SIZE = 6;

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
  { key: "all", label: "Tất cả", icon: "💎" },
  { key: "Tutorial", label: "Hướng dẫn", icon: "📚" },
  { key: "Template", label: "Template", icon: "📑" },
  { key: "Tool", label: "Công cụ", icon: "🛠️" },
  { key: "Article", label: "Bài viết", icon: "✍️" },
];

function getPageHref(page: number) {
  return page <= 1 ? "/resource" : `/resource?page=${page}`;
}

export default async function ResourcePage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const resources = await getResources();
  const currentPage = Math.max(1, Number(searchParams?.page) || 1);
  const totalPages = Math.max(1, Math.ceil(resources.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const paginatedResources = resources.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* HERO SECTION - MODERNIZED */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-slate-50/50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-green-500/5 rounded-full blur-[80px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            Kho tài nguyên <br />
            <span className="text-emerald-500">Thực chiến.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            Tổng hợp các bài viết chuyên sâu, template tối ưu và công cụ đắc lực
            giúp bạn nâng tầm kỹ năng Dữ liệu mỗi ngày.
          </p>

          <div className="flex justify-center animate-in fade-in zoom-in duration-1000 delay-500">
            <LeadResourceModal />
          </div>
        </div>
      </section>

      {/* CONTENT GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-32 pt-20">
        {resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 bg-slate-50 rounded-[48px] border border-dashed border-slate-200">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm mb-6 animate-bounce">📦</div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Đang kiện toàn kho báu...</h3>
            <p className="text-slate-500 font-medium">Những tài liệu chất lượng nhất đang được chuẩn bị, quay lại sau bạn nhé!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {paginatedResources.map((resource, i) => (
                <Link
                  key={resource.id}
                  href={`/resource/${resource.slug}`}
                  className="group bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:border-emerald-100 hover:-translate-y-2 transition-all duration-500 flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 duration-700"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Image Section */}
                  <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                    {resource.imageUrl ? (
                      <img
                        src={resource.imageUrl}
                        alt={resource.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">📄</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                    <span className="absolute top-4 left-4 text-[9px] font-black uppercase tracking-[0.2em] bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-full shadow-sm border border-white/20">
                      {resource.category}
                    </span>
                  </div>

                  {/* Content Section */}
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors duration-300 mb-4 leading-tight tracking-tight line-clamp-2">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-8 line-clamp-3 leading-relaxed font-medium">
                      {resource.summary}
                    </p>

                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black">
                          {resource.author.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-900 leading-none mb-1">{resource.author}</span>
                           <span className="text-[9px] font-bold text-slate-400 leading-none">{formatDate(resource.createdAt)}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center transition-all group-hover:bg-emerald-500 group-hover:text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-20">
                <Link
                  href={getPageHref(page - 1)}
                  aria-disabled={page === 1}
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                    page === 1
                      ? "opacity-20 pointer-events-none"
                      : "border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </Link>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={getPageHref(p)}
                    className={`w-12 h-12 rounded-2xl text-sm font-black flex items-center justify-center transition-all ${
                      p === page
                        ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                        : "border border-slate-50 text-slate-400 hover:border-emerald-200 hover:text-emerald-600"
                    }`}
                  >
                    {p}
                  </Link>
                ))}

                <Link
                  href={getPageHref(page + 1)}
                  aria-disabled={page === totalPages}
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                    page === totalPages
                      ? "opacity-20 pointer-events-none"
                      : "border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            )}

            <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest mt-12">
               Page {page} of {totalPages} — Total {resources.length} resources
            </p>
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}

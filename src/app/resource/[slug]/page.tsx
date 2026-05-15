import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

async function getResource(slug: string): Promise<Resource | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/resources`, { cache: "no-store" });
    if (!res.ok) return null;
    const data: Resource[] = await res.json();
    return data.find((r) => r.slug === slug && r.published) || null;
  } catch {
    return null;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ResourceDetailPage({ params }: { params: { slug: string } }) {
  const resource = await getResource(params.slug);

  if (!resource) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <div className="text-center space-y-6">
          <div className="text-8xl font-black text-slate-100">404</div>
          <p className="text-slate-500 font-medium">Hành trình này hiện chưa có tài liệu...</p>
          <Link href="/resource" className="inline-flex px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm transition hover:scale-105 active:scale-95">
            ← Quay về kho tài nguyên
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* BREADCRUMBS */}
      <div className="bg-slate-50/50 pt-32 pb-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          <Link href="/" className="transition hover:text-emerald-600">Home</Link>
          <span className="opacity-30">/</span>
          <Link href="/resource" className="transition hover:text-emerald-600">Resources</Link>
          <span className="opacity-30">/</span>
          <span className="text-emerald-600 truncate max-w-[150px]">{resource.slug}</span>
        </div>
      </div>

      <main className="pb-32">
        {/* HERO HEADER */}
        <section className="bg-slate-50/50 pt-10 pb-20">
          <div className="max-w-4xl mx-auto px-6 space-y-8">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500 text-white px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/20">
              {resource.category}
            </span>

            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
              {resource.title}
            </h1>

            <div className="flex items-center gap-6 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-black">
                  {resource.author.charAt(0)}
                </div>
                <div className="flex flex-col">
                   <span className="text-xs font-black text-slate-900 leading-none mb-1">{resource.author}</span>
                   <span className="text-[10px] font-bold text-slate-400 leading-none">Author</span>
                </div>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="flex flex-col">
                 <span className="text-xs font-black text-slate-900 leading-none mb-1">{formatDate(resource.createdAt)}</span>
                 <span className="text-[10px] font-bold text-slate-400 leading-none">Published Date</span>
              </div>
            </div>
          </div>
        </section>

        {/* IMAGE SECTION */}
        {resource.imageUrl && (
          <div className="max-w-5xl mx-auto px-6 -mt-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="aspect-video rounded-[48px] overflow-hidden border-8 border-white shadow-2xl relative">
               <img src={resource.imageUrl} alt={resource.title} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
            </div>
          </div>
        )}

        {/* CONTENT */}
        <article className="max-w-3xl mx-auto px-6 py-20">
          {resource.summary && (
            <div className="relative p-8 md:p-10 rounded-[40px] bg-emerald-50/50 border border-emerald-100 mb-16 overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:scale-150" />
              <p className="relative z-10 text-lg md:text-xl font-medium text-emerald-800 leading-relaxed italic">
                "{resource.summary}"
              </p>
            </div>
          )}

          <div
            className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed
              [&_h2]:text-3xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:mt-16 [&_h2]:mb-8 [&_h2]:tracking-tight
              [&_h3]:text-2xl [&_h3]:font-black [&_h3]:text-slate-900 [&_h3]:mt-12 [&_h3]:mb-6 [&_h3]:tracking-tight
              [&_p]:mb-8 [&_strong]:text-slate-900 [&_strong]:font-black
              [&_ul]:space-y-4 [&_ul]:list-none [&_ul]:pl-0 [&_ul]:mb-12
              [&_li]:flex [&_li]:gap-4 [&_li:before]:content-['💠'] [&_li:before]:text-emerald-500 [&_li:before]:font-black
              [&_a]:text-emerald-600 [&_a]:font-black [&_a]:no-underline [&_a]:border-b-2 [&_a]:border-emerald-100 [&_a]:transition-all hover:[&_a]:border-emerald-500
              [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:bg-slate-50 [&_blockquote]:p-8 [&_blockquote]:rounded-r-3xl [&_blockquote]:italic [&_blockquote]:text-slate-700
              [&_img]:rounded-[40px] [&_img]:shadow-2xl [&_img]:my-16 [&_img]:border-4 [&_img]:border-white
              [&_hr]:border-slate-100 [&_hr]:my-16"
            dangerouslySetInnerHTML={{ __html: resource.content.replace(/\n/g, "<br/>") }}
          />

          {/* FOOTER NAV */}
          <div className="mt-24 pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <Link href="/resource" className="flex items-center gap-3 text-sm font-black text-slate-400 transition hover:text-emerald-600 group">
              <span className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center transition group-hover:border-emerald-200 group-hover:bg-emerald-50">
                ←
              </span>
              Tất cả tài nguyên
            </Link>

            <div className="flex gap-4">
               <div className="px-6 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Share this article
               </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-500 mb-6">Không tìm thấy tài nguyên này</p>
          <Link href="/resource" className="text-green-600 font-semibold hover:underline">
            ← Quay về trang tài nguyên
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero image */}
      {resource.imageUrl && (
        <div className="w-full h-64 md:h-80 relative overflow-hidden">
          <img src={resource.imageUrl} alt={resource.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        </div>
      )}

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <span className="inline-block text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full mb-4">
            {resource.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {resource.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
              {resource.author.charAt(0)}
            </div>
            <span className="font-medium text-gray-700">{resource.author}</span>
            <span className="text-gray-300">|</span>
            <span>{formatDate(resource.createdAt)}</span>
          </div>
        </div>

        {resource.summary && (
          <div className="bg-green-50 border-l-4 border-green-500 px-6 py-4 rounded-r-xl mb-8">
            <p className="text-green-800 leading-relaxed">{resource.summary}</p>
          </div>
        )}

        <div
          className="prose prose-green prose-lg max-w-none
            prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900
            prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-pre:bg-gray-900 prose-pre:text-gray-100
            prose-img:rounded-2xl prose-img:shadow-lg
            prose-li:text-gray-700"
          dangerouslySetInnerHTML={{ __html: resource.content.replace(/\n/g, "<br/>") }}
        />

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link href="/resource" className="inline-flex items-center text-green-600 font-semibold hover:text-green-700 transition group">
            <svg className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
            Tất cả tài nguyên
          </Link>
        </div>
      </article>

      <Footer />
    </div>
  );
}

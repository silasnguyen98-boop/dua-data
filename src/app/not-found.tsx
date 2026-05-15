import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6 py-24 sm:py-32 lg:px-8 font-sans">
      {/* Subtle Dot Grid */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#10a37f 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}></div>

      <div className="text-center relative z-10">
        <p className="text-sm font-black text-green-600 uppercase tracking-[0.4em] mb-4">Lỗi hệ thống</p>
        <h1 className="text-[120px] md:text-[180px] font-black text-slate-900 leading-none tracking-tighter mb-4">
          404
        </h1>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight mb-6">
          Trang không tìm thấy
        </h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto text-lg leading-relaxed mb-10">
          Dường như bạn đã đi lạc. Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <div className="flex items-center justify-center gap-x-6">
          <Link
            href="/"
            className="rounded-full bg-[#10a37f] px-10 py-4 text-sm font-black text-white shadow-xl shadow-green-100 hover:bg-[#0e8c6d] hover:scale-105 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            Quay về trang chủ
          </Link>
        </div>

        {/* Decorative Element */}
        <div className="mt-20 flex justify-center">
          <div className="h-1 w-12 bg-slate-200 rounded-full"></div>
        </div>
      </div>

      <div className="absolute bottom-12 left-12 hidden md:block">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Dua Edu Operations</span>
      </div>
    </main>
  );
}

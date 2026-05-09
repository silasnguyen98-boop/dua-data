import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07130b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.25),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.18),_transparent_22%),linear-gradient(180deg,_#07130b_0%,_#04100a_100%)]" />

      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-green-400/20 blur-3xl animate-float" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl animate-float delay-300" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-lime-300/10 blur-3xl animate-pulse-slow" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
        <div className="absolute inset-x-0 top-10 mx-auto h-[440px] w-[440px] max-w-[90vw] rounded-full border border-green-400/15 shadow-[0_0_120px_rgba(34,197,94,0.15)] animate-spin [animation-duration:24s]" />
        <div className="absolute inset-x-0 top-24 mx-auto h-[280px] w-[280px] max-w-[70vw] rounded-full border border-emerald-300/20 border-dashed animate-spin [animation-duration:16s] [animation-direction:reverse]" />

        <section className="relative z-10 w-full max-w-3xl">
          <div className="rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-2xl backdrop-blur-xl md:p-10">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-4">
                <p className="inline-flex items-center rounded-full border border-green-400/20 bg-green-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-green-200">
                  Trang không tồn tại
                </p>
                <div className="space-y-2">
                  <h1 className="text-6xl font-black tracking-[-0.08em] text-white md:text-8xl">
                    404
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-white/75 md:text-lg">
                    Có vẻ như đường dẫn này đã đi lạc mất rồi. Mình đã chuẩn bị một màn 404 có chuyển động nhẹ để bạn quay lại thật nhanh.
                  </p>
                </div>
              </div>

              <div className="relative flex h-40 w-40 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-green-400/10 blur-2xl animate-pulse-slow" />
                <div className="absolute inset-5 rounded-full border border-green-300/20 animate-spin [animation-duration:10s]" />
                <div className="absolute inset-0 rounded-full border border-dashed border-white/10 animate-spin [animation-duration:18s] [animation-direction:reverse]" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-green-300/30 bg-[#0d1f15]/80 shadow-[0_0_60px_rgba(34,197,94,0.18)]">
                  <span className="text-3xl font-bold text-green-200">DUA</span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Gợi ý 1</p>
                <p className="mt-2 text-sm text-white/75">Quay về trang chủ để tiếp tục xem khóa học, tài nguyên và lộ trình.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Gợi ý 2</p>
                <p className="mt-2 text-sm text-white/75">Nếu vừa bấm từ menu, có thể đường dẫn đã đổi. Hãy thử lại từ navbar.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Gợi ý 3</p>
                <p className="mt-2 text-sm text-white/75">Bạn cũng có thể dùng ô tìm kiếm ở trang chủ để đi nhanh hơn.</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-green-400 px-6 py-3 text-sm font-semibold text-[#07130b] transition hover:bg-green-300"
              >
                Về trang chủ
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Xem khóa học
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

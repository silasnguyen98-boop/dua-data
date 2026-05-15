import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

const jobFormUrl = "https://forms.gle/bJTWKuToEDowfCSq8";

const workTypeColors: Record<string, string> = {
  "Full-time": "bg-emerald-500 text-white",
  "Part-time": "bg-blue-500 text-white",
  Internship: "bg-amber-500 text-white",
  Freelance: "bg-purple-500 text-white",
  Remote: "bg-teal-500 text-white",
};

async function getJobs(): Promise<Job[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/jobs`, { cache: "no-store" });
    if (!res.ok) return [];
    const data: Job[] = await res.json();
    return Array.isArray(data) ? data.filter((job) => job.published) : [];
  } catch {
    return [];
  }
}

function formatDeadline(dateStr: string) {
  if (!dateStr) return null;
  const deadline = new Date(dateStr);
  if (isNaN(deadline.getTime())) return null;
  deadline.setHours(23, 59, 59, 999);
  const now = new Date();
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: "Đã quá hạn", urgent: true };
  if (diffDays === 0) return { text: "Hết hạn hôm nay", urgent: true };
  if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, urgent: true };
  return { text: `Còn ${diffDays} ngày`, urgent: false };
}

export default async function JobPage() {
  const jobs = await getJobs();

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-slate-50/50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-4 duration-500">
               🚀 Career Hub
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-700">
              Chạm đến <br />
              <span className="text-emerald-500">Sự nghiệp Data.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed font-medium max-w-xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
              DUA Edu không chỉ dạy bạn kỹ năng, chúng tôi kết nối bạn trực tiếp
              với các cơ hội thực chiến từ mạng lưới đối tác doanh nghiệp hàng đầu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in zoom-in duration-1000 delay-500">
               <a
                href={jobFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-5 bg-slate-900 text-white font-black text-sm rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 text-center"
              >
                Để lại thông tin tìm việc
              </a>
              <a
                href="#explore-jobs"
                className="px-8 py-5 border-2 border-emerald-500 text-emerald-600 font-black text-sm rounded-2xl hover:bg-emerald-50 transition-all text-center"
              >
                Khám phá công việc
              </a>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-12 duration-1000 delay-300">
             <div className="absolute inset-0 bg-emerald-500/5 rounded-[60px] blur-3xl" />
             <div className="relative space-y-6">
                {[
                  { step: "01", title: "Điền thông tin", desc: "Chia sẻ mục tiêu, kinh nghiệm và vị trí bạn đang tìm kiếm." },
                  { step: "02", title: "Kết nối cơ hội", desc: "DUA Edu lọc và giới thiệu các job đúng định hướng của bạn." },
                  { step: "03", title: "Tăng tốc sự nghiệp", desc: "Ứng tuyển nhanh chóng và nhận tư vấn chuyên sâu từ đội ngũ." },
                ].map((item) => (
                  <div key={item.step} className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 border border-white shadow-xl shadow-slate-200/50 flex gap-6 items-start transition hover:-translate-y-1">
                     <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-emerald-500/20 shrink-0">
                        {item.step}
                     </div>
                     <div className="space-y-1">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{item.title}</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* JOBS LISTING */}
      <section id="explore-jobs" className="max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
           <div className="space-y-2 text-center md:text-left">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Cơ hội đang mở</h2>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-[0.2em]">Latest Opportunities</p>
           </div>
           <div className="px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 text-xs font-black text-center">
              {jobs.length} Vị trí đang tuyển dụng
           </div>
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 bg-slate-50 rounded-[48px] border border-dashed border-slate-200">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm mb-6 animate-bounce">💼</div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Đang tìm kiếm cơ hội tốt nhất...</h3>
            <p className="text-slate-500 font-medium text-center px-6">Chúng tôi đang làm việc với các đối tác để mang đến những vị trí tốt nhất cho bạn.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {jobs.map((job, i) => {
              const deadlineInfo = formatDeadline(job.applicationDeadline);
              const typeColor = workTypeColors[job.workType] || "bg-slate-100 text-slate-600";
              const companyInitial = job.company?.trim()?.charAt(0) || "?";

              return (
                <Link
                  key={job.id}
                  href={`/job/${job.id}`}
                  className="group block animate-in fade-in slide-in-from-bottom-8 duration-700"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <article className="bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col lg:flex-row lg:items-center gap-10 shadow-sm hover:shadow-2xl hover:border-emerald-100 transition-all duration-500">
                    <div className="flex items-center gap-6 flex-1">
                       {job.imageUrl ? (
                         <div className="w-20 h-20 rounded-[24px] overflow-hidden border border-slate-100 shadow-sm shrink-0">
                            <img src={job.imageUrl} alt={job.company} className="w-full h-full object-cover" />
                         </div>
                       ) : (
                         <div className="w-20 h-20 rounded-[24px] bg-slate-900 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg">
                            {companyInitial}
                         </div>
                       )}

                       <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap gap-2 mb-2">
                             <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${typeColor}`}>
                                {job.workType}
                             </span>
                             <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 text-slate-500 rounded-full border border-slate-100">
                                {job.location}
                             </span>
                          </div>
                          <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tight truncate">
                             {job.title}
                          </h3>
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-slate-400">{job.company}</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col lg:items-end gap-6 lg:border-l lg:border-slate-50 lg:pl-10 lg:w-72">
                       <div className="space-y-1 lg:text-right">
                          <div className="text-xl font-black text-emerald-500 leading-none">{job.salary || "Lương thỏa thuận"}</div>
                          {deadlineInfo && (
                            <div className={`text-[10px] font-black uppercase tracking-widest ${deadlineInfo.urgent ? 'text-red-500' : 'text-slate-300'}`}>
                               {deadlineInfo.text}
                            </div>
                          )}
                       </div>
                       <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 transition-all group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-110">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                       </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-40">
        <div className="relative p-12 lg:p-24 rounded-[48px] bg-slate-900 overflow-hidden shadow-2xl text-center space-y-10">
           <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px]" />

           <h2 className="relative z-10 text-3xl md:text-5xl font-black text-white leading-tight max-w-3xl mx-auto">
             Bạn là nhà tuyển dụng <br />
             <span className="text-emerald-400">Đang tìm nhân tài?</span>
           </h2>
           <p className="relative z-10 text-slate-400 text-lg font-medium max-w-xl mx-auto">
             Hãy kết nối với chúng tôi để tiếp cận đội ngũ học viên tài năng,
             được đào tạo thực chiến và sẵn sàng bứt phá cho doanh nghiệp của bạn.
           </p>
           <div className="relative z-10">
              <a
                href="https://m.me/duadata"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex px-12 py-5 bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95"
              >
                Hợp tác tuyển dụng ngay 🤝
              </a>
           </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

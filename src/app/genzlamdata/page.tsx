import type { Metadata } from "next";
import Link from "next/link";

import ExpertCarousel, { type Expert } from "@/components/ExpertCarousel";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { readExpertsByGroup } from "@/lib/expert-json";

export const metadata: Metadata = {
  title: "GenZ làm Data - Cộng đồng Data dành cho người trẻ",
  description:
    "Landing page giới thiệu cộng đồng GenZ làm Data, nơi người trẻ học hỏi, chia sẻ tài nguyên và phát triển kỹ năng dữ liệu để ứng dụng trong nhiều bối cảnh.",
};

export const dynamic = "force-dynamic";

const stats = [
  { number: "70.000+", label: "Thành viên trong cộng đồng" },
  { number: "3", label: "Trụ cột: học, làm, kết nối" },
  { number: "24/7", label: "Không gian hỏi đáp và chia sẻ" },
];

const pillars = [
  {
    title: "Học Data từ người thật, việc thật",
    desc: "Các bài chia sẻ, tài nguyên và case study được chọn lọc để người mới hiểu đúng bản chất trước khi chạy theo công cụ.",
  },
  {
    title: "Kết nối cùng người cùng mục tiêu",
    desc: "Một nơi để hỏi đáp, tìm bạn học, trao đổi lộ trình và giữ động lực khi bắt đầu hoặc chuyển hướng sang Data.",
  },
  {
    title: "Phát triển kỹ năng ứng dụng",
    desc: "Biết cách đọc dữ liệu, đặt câu hỏi đúng, xây dashboard, tự động hóa và thử nghiệm mô hình ở mức phù hợp với nhu cầu của mình.",
  },
];

const activities = [
  "Chia sẻ roadmap phát triển kỹ năng phân tích, trực quan hóa, xử lý và mô hình hóa dữ liệu.",
  "Tổng hợp tài nguyên học Excel, SQL, Power BI, Python và tư duy phân tích.",
  "Gợi ý bài tập, dự án cá nhân và cách kể câu chuyện bằng dữ liệu.",
  "Tạo không gian hỏi đáp để thành viên áp dụng Data vào học tập, vận hành, marketing, tài chính, sản phẩm và công việc hằng ngày.",
];

const skillTracks = [
  {
    title: "Data Analysis",
    subtitle: "Insight & Dashboard",
    tools: ["SQL", "Power BI", "Storytelling"],
    delay: "0s",
  },
  {
    title: "Data Engineering",
    subtitle: "Pipeline & Automation",
    tools: ["ETL", "Warehouse", "Automation"],
    delay: "0.25s",
  },
  {
    title: "Data Science",
    subtitle: "Model & Experiment",
    tools: ["Python", "ML", "Experiment"],
    delay: "0.5s",
  },
];

const developmentTeamFallback: Expert[] = [
  {
    id: "duadata",
    name: "DUA Edu",
    position: "Đơn vị phát triển",
    previousWork: "Xây dựng định hướng học Data thực chiến cho cộng đồng người trẻ.",
    order: 1,
    published: true,
  },
  {
    id: "content-team",
    name: "Content Team",
    position: "Nội dung & tài nguyên",
    previousWork: "Biên tập bài viết, roadmap, tài liệu và các góc nhìn ứng dụng Data.",
    order: 2,
    published: true,
  },
  {
    id: "community-team",
    name: "Community Team",
    position: "Vận hành cộng đồng",
    previousWork: "Kết nối thành viên, điều phối thảo luận và giữ không gian chia sẻ tích cực.",
    order: 3,
    published: true,
  },
  {
    id: "mentor-network",
    name: "Mentor Network",
    position: "Cố vấn chuyên môn",
    previousWork: "Đồng hành qua kinh nghiệm thực tế trong phân tích, xử lý và mô hình hóa dữ liệu.",
    order: 4,
    published: true,
  },
  {
    id: "learning-team",
    name: "Learning Support",
    position: "Hỗ trợ học tập",
    previousWork: "Gợi ý bài tập, dự án thực hành và cách áp dụng Data vào bối cảnh thực tế.",
    order: 5,
    published: true,
  },
];

async function getDevelopmentTeam(): Promise<Expert[]> {
  const experts = await readExpertsByGroup("genzlamdata");
  return experts.length ? experts : developmentTeamFallback;
}

export default async function GenZLamDataPage() {
  const developmentTeam = await getDevelopmentTeam();

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-white pt-28 pb-24">
          <style>{`
            @keyframes genz-float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }

            @keyframes genz-pulse-line {
              0%, 100% { stroke-dashoffset: 120; opacity: 0.35; }
              50% { stroke-dashoffset: 0; opacity: 0.95; }
            }

            @keyframes genz-grow {
              0%, 100% { transform: scaleY(0.72); }
              50% { transform: scaleY(1); }
            }

            .genz-float-card {
              animation: genz-float 4.5s ease-in-out infinite;
            }

            .genz-flow-line {
              stroke-dasharray: 10 12;
              animation: genz-pulse-line 3.2s ease-in-out infinite;
            }

            .genz-grow-bar {
              animation: genz-grow 3.4s ease-in-out infinite;
              transform-origin: bottom;
            }
          `}</style>
          <div className="absolute right-0 top-0 h-[520px] w-[520px] rounded-full bg-emerald-50/80 blur-[120px]" />
          <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative z-10 text-center lg:text-left">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                Community by DUA Edu
              </div>
              <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-gray-950 md:text-7xl">
                GenZ làm Data
              </h1>
              <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-gray-500 md:text-xl lg:mx-0">
                Cộng đồng dành cho người trẻ muốn bắt đầu, nâng cấp kỹ năng và ứng dụng dữ liệu vào học tập, công việc hoặc dự án cá nhân. Ở đây, Data không chỉ là công cụ mà là cách nhìn vấn đề rõ ràng hơn.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <a
                  href="https://www.facebook.com/groups/genzlamdata"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-emerald-500 px-9 py-4 text-center font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600"
                >
                  Tham gia cộng đồng
                </a>
                <a
                  href="#team"
                  className="rounded-2xl border border-gray-200 bg-white px-9 py-4 text-center font-bold text-gray-700 transition hover:-translate-y-0.5 hover:bg-gray-50"
                >
                  Xem đội ngũ
                </a>
              </div>
            </div>

            <div className="relative z-10">
              <div className="relative rounded-[44px] border border-emerald-100 bg-white p-6 shadow-[0_35px_90px_rgba(16,185,129,0.12)]">
                <div className="absolute -left-6 top-14 h-24 w-24 rounded-full bg-emerald-100/70 blur-2xl" />
                <div className="absolute -right-4 bottom-12 h-28 w-28 rounded-full bg-lime-100/70 blur-2xl" />

                <div className="relative overflow-hidden rounded-[32px] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-white p-5 text-gray-950">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(16,185,129,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />

                  <div className="relative z-10 mb-7 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">Data Skill Map</p>
                      <h2 className="mt-2 text-2xl font-black text-gray-950">Từ học đến ứng dụng</h2>
                    </div>
                    <div className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-500/20">Live</div>
                  </div>

                  <div className="relative z-10">
                    <svg className="absolute left-0 top-16 hidden h-32 w-full sm:block" viewBox="0 0 520 140" fill="none" aria-hidden="true">
                      <path className="genz-flow-line" d="M95 70 C165 12 230 12 260 70 C290 128 365 128 430 70" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                      <path className="genz-flow-line" d="M95 92 C180 150 315 150 430 92" stroke="#86efac" strokeWidth="3" strokeLinecap="round" style={{ animationDelay: "0.45s" }} />
                    </svg>

                    <div className="grid gap-4 sm:grid-cols-3">
                      {skillTracks.map((track, index) => (
                        <div
                          key={track.title}
                          className="genz-float-card relative rounded-[28px] border border-emerald-100 bg-white/90 p-5 shadow-sm shadow-emerald-100/70 backdrop-blur"
                          style={{ animationDelay: track.delay }}
                        >
                          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-700 ring-1 ring-emerald-100">
                            0{index + 1}
                          </div>
                          <h3 className="text-lg font-black text-gray-950">{track.title}</h3>
                          <p className="mt-1 text-sm font-semibold text-emerald-600">{track.subtitle}</p>
                          <div className="mt-5 space-y-2">
                            {track.tools.map((tool, toolIndex) => (
                              <div key={tool} className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                <span className="text-xs font-bold text-gray-500">{tool}</span>
                                <span
                                  className="ml-auto h-1.5 rounded-full bg-emerald-100"
                                  style={{ width: `${34 + toolIndex * 10}px` }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10 mt-6 rounded-[28px] border border-emerald-100 bg-white/95 p-5 text-gray-950 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black">Learning signal</p>
                        <p className="text-xs text-gray-500">Analysis, Engineering, Science cùng phát triển</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Skill-ready</span>
                    </div>
                    <div className="grid grid-cols-7 items-end gap-3">
                      {[48, 72, 58, 86, 66, 92, 78].map((height, index) => (
                        <div key={index} className="flex h-32 items-end rounded-xl bg-emerald-50 p-2">
                          <div
                            className="genz-grow-bar w-full rounded-lg bg-gradient-to-t from-emerald-500 via-green-400 to-lime-300"
                            style={{ height: `${height}%`, animationDelay: `${index * 0.18}s` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-gray-50 bg-emerald-50/20 py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mb-3 text-5xl font-extrabold tracking-tight text-gray-950 md:text-6xl">{stat.number}</div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 max-w-3xl">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-emerald-600">Vì sao cộng đồng tồn tại</p>
              <h2 className="text-4xl font-black leading-tight text-gray-950 md:text-5xl">
                Giúp người trẻ đi vào Data bằng lộ trình rõ ràng và mạng lưới thật.
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-emerald-100 hover:shadow-md">
                  <div className="mb-8 h-12 w-12 rounded-2xl bg-emerald-500" />
                  <h3 className="text-2xl font-black leading-tight text-gray-950">{pillar.title}</h3>
                  <p className="mt-5 text-base leading-7 text-gray-500">{pillar.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-blue-50/10 py-28">
          <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-emerald-600">Hoạt động chính</p>
              <h2 className="text-4xl font-black leading-tight md:text-5xl">Một cộng đồng để học đều, hỏi thật và đi xa hơn.</h2>
              <p className="mt-6 text-lg font-light leading-relaxed text-gray-500">
                GenZ làm Data tập trung vào những nội dung giúp thành viên chuyển kiến thức thành năng lực thực tế, từ nền tảng công cụ đến tư duy phân tích và cách ứng dụng dữ liệu trong nhiều bối cảnh khác nhau.
              </p>
            </div>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity} className="flex gap-5 rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-base font-medium leading-7 text-gray-600">{activity}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="team" className="bg-white py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 text-center">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-emerald-600">Development Team</p>
              <h2 className="text-4xl font-black leading-tight text-gray-950 md:text-5xl">Đội ngũ phát triển cộng đồng</h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-gray-500">
                Những nhóm đứng sau nội dung, vận hành và hoạt động học tập của GenZ làm Data.
              </p>
            </div>
            <ExpertCarousel experts={developmentTeam} />
          </div>
        </section>

        <section className="relative overflow-hidden bg-emerald-500 py-28 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_42%)]" />
          <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
            <h2 className="text-4xl font-black leading-tight md:text-6xl">Bắt đầu hành trình Data cùng cộng đồng.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-emerald-50">
              Tham gia GenZ làm Data để học có định hướng, kết nối với người cùng mục tiêu và nâng cấp cách bạn sử dụng dữ liệu trong công việc lẫn cuộc sống.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="https://www.facebook.com/groups/genzlamdata"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white px-10 py-5 font-bold text-emerald-600 shadow-xl transition hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                Vào group Facebook
              </a>
              <Link
                href="/community"
                className="rounded-full border border-white/30 bg-white/10 px-10 py-5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
              >
                Xem hoạt động cộng đồng
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

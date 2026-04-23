import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const roadmapSteps = [
  {
    number: 1,
    title: "Data Fundamentals",
    subtitle: "Tư duy & bản chất dữ liệu",
    description: "Hiểu bản chất trước khi học tool",
    topics: ["Data types (structured / unstructured)", "Data lifecycle (Collect → Clean → Analyze → Present)", "Data-driven mindset"],
    note: "Đây là nền tảng tư duy của một Data Analyst",
    icon: "🧠",
    color: "from-green-500 to-emerald-600",
    bgLight: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    number: 2,
    title: "Data Collection",
    subtitle: "Nguồn dữ liệu",
    description: "Hiểu data đến từ đâu",
    topics: ["Database", "Excel / Google Sheets", "API", "Tracking (web/app events)"],
    note: "Analyst cần hiểu data flow end-to-end",
    icon: "📥",
    color: "from-teal-500 to-green-600",
    bgLight: "bg-teal-50",
    borderColor: "border-teal-200",
  },
  {
    number: 3,
    title: "Excel / Google Sheets",
    subtitle: "Xử lý dữ liệu business",
    description: "Xử lý dữ liệu trong môi trường business",
    topics: ["Functions (IF, SUM, XLOOKUP)", "Pivot Table", "Data cleaning cơ bản", "Basic visualization"],
    icon: "📊",
    color: "from-emerald-500 to-green-600",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    number: 4,
    title: "SQL (Core Skill)",
    subtitle: "Truy vấn dữ liệu",
    description: "Làm việc với database — kỹ năng bắt buộc",
    topics: ["Basic: SELECT, WHERE", "Intermediate: GROUP BY, HAVING", "Advanced: JOIN, Subquery, CTE, Window Functions"],
    note: "Đây là kỹ năng bắt buộc",
    icon: "🗄️",
    color: "from-green-600 to-emerald-700",
    bgLight: "bg-green-50",
    borderColor: "border-green-300",
    highlight: true,
  },
  {
    number: 5,
    title: "Data Cleaning & Processing",
    subtitle: "Làm sạch dữ liệu",
    description: "Biến dữ liệu thô → usable",
    topics: ["Missing values", "Outliers", "Duplicate", "Data transformation"],
    tools: "Python (Pandas, NumPy)",
    icon: "🧹",
    color: "from-teal-500 to-emerald-600",
    bgLight: "bg-teal-50",
    borderColor: "border-teal-200",
  },
  {
    number: 6,
    title: "Statistics & Data Analysis",
    subtitle: "Hiểu bản chất dữ liệu",
    description: "Phân biệt Analyst thật vs chỉ biết tool",
    topics: ["Descriptive statistics", "Correlation", "Hypothesis testing", "Regression cơ bản"],
    note: "Phân biệt Analyst thật vs chỉ biết tool",
    icon: "📈",
    color: "from-emerald-600 to-green-700",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    number: 7,
    title: "Exploratory Data Analysis (EDA)",
    subtitle: "Tìm insight",
    description: "Khám phá dữ liệu và tìm insight",
    topics: ["Trend", "Pattern", "Anomaly", "Đặt giả thuyết & kiểm chứng"],
    icon: "🔍",
    color: "from-green-500 to-teal-600",
    bgLight: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    number: 8,
    title: "Data Visualization & BI",
    subtitle: "Trực quan hóa & Dashboard",
    description: "Communicate insight hiệu quả",
    topics: ["Power BI / Tableau", "Dashboard design", "KPI tracking", "Storytelling"],
    icon: "📉",
    color: "from-teal-600 to-green-700",
    bgLight: "bg-teal-50",
    borderColor: "border-teal-200",
  },
  {
    number: 9,
    title: "Programming (Python)",
    subtitle: "Xử lý data nâng cao",
    description: "Nâng cao khả năng xử lý dữ liệu",
    topics: ["Pandas", "Automation", "Data pipeline cơ bản"],
    icon: "🐍",
    color: "from-emerald-500 to-green-600",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    number: 10,
    title: "Data Modeling & Storage",
    subtitle: "Cấu trúc dữ liệu",
    description: "Hiểu cấu trúc dữ liệu chuyên sâu",
    topics: ["Relational database", "Schema (Star, Snowflake)", "Data warehouse cơ bản"],
    icon: "🏗️",
    color: "from-green-600 to-emerald-700",
    bgLight: "bg-green-50",
    borderColor: "border-green-300",
  },
  {
    number: 11,
    title: "AI for Data Analyst",
    subtitle: "Tăng tốc workflow",
    description: "Module riêng — điểm khác biệt 2026",
    topics: [
      "AI hỗ trợ phân tích dữ liệu",
      "Viết SQL từ prompt",
      "Clean data tự động",
      "Phân tích & gợi ý insight",
      "Prompt engineering",
      "Kiểm chứng output AI",
    ],
    tools: "ChatGPT / Copilot, BI AI (Power BI AI, Tableau AI), SQL AI tools",
    note: "Không phải học để làm → học để điều khiển AI làm",
    icon: "🤖",
    color: "from-green-700 to-emerald-800",
    bgLight: "bg-green-50",
    borderColor: "border-green-300",
    highlight: true,
  },
  {
    number: 12,
    title: "Projects (QUAN TRỌNG NHẤT)",
    subtitle: "Chứng minh năng lực",
    description: "Mỗi project: Business problem → Data → Clean → Analyze → Dashboard → Insight",
    topics: ["Sales dashboard", "User behavior analysis", "Customer segmentation", "Marketing performance"],
    icon: "🚀",
    color: "from-emerald-700 to-green-800",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-300",
    highlight: true,
  },
  {
    number: 13,
    title: "Business & Communication",
    subtitle: "Tạo giá trị thực",
    description: "Kỹ năng mềm quyết định sự nghiệp",
    topics: ["Business thinking", "Communication", "Problem solving", "Stakeholder mindset"],
    icon: "💼",
    color: "from-green-600 to-emerald-700",
    bgLight: "bg-green-50",
    borderColor: "border-green-200",
  },
];

const simplifiedFlow = [
  { step: "Hiểu bài toán", icon: "🎯", color: "bg-green-500" },
  { step: "Lấy dữ liệu", icon: "📥", color: "bg-teal-500" },
  { step: "Làm sạch dữ liệu", icon: "🧹", color: "bg-emerald-500" },
  { step: "Phân tích dữ liệu", icon: "📊", color: "bg-green-600" },
  { step: "Trực quan hóa", icon: "📈", color: "bg-teal-600" },
  { step: "Ứng dụng AI", icon: "🤖", color: "bg-emerald-600" },
  { step: "Đưa ra quyết định", icon: "💡", color: "bg-green-700" },
];

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-600 to-emerald-500" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='white' opacity='0.3'/%3E%3C/svg%3E")`,
        }} />
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Cập nhật 2026
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Lộ trình trở thành<br />
            <span className="bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent">
              Data Analyst chuyên nghiệp
            </span>
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Data Analyst = giao điểm của <strong>Data + Business + AI</strong>
          </p>

          <a
            href="https://www.facebook.com/duadata"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:bg-green-50 transition-all duration-300 mb-8 animate-fade-in-up"
            style={{ animationDelay: "0.25s" }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/></svg>
            Liên hệ DUA để được tư vấn lộ trình phù hợp
          </a>

          {/* Core Flow — text only */}
          <div className="flex flex-wrap justify-center items-center gap-2 animate-fade-in-up text-sm text-green-200 font-medium" style={{ animationDelay: "0.3s" }}>
            {simplifiedFlow.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">{item.step}</span>
                {i < simplifiedFlow.length - 1 && <span className="text-white/40">→</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Roadmap */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2 animate-fade-in-up">Detailed Roadmap</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 animate-fade-in-up font-display" style={{ animationDelay: "0.1s" }}>Lộ trình chi tiết</h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Center line with glow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-green-200 via-emerald-400 to-green-600 hidden lg:block rounded-full" />
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-4 bg-gradient-to-b from-green-200/20 via-emerald-400/20 to-green-600/20 hidden lg:block rounded-full blur-sm" />

          <div className="space-y-12 lg:space-y-16">
            {roadmapSteps.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
              <div
                key={i}
                className="relative animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {/* Timeline node */}
                <div className="absolute left-1/2 -translate-x-1/2 top-8 hidden lg:flex z-20">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl ring-4 ring-white text-white font-bold text-sm`}>
                    {step.number}
                  </div>
                </div>

                <div className={`lg:grid lg:grid-cols-2 lg:gap-16 items-start`}>
                  {/* Card - alternates sides on desktop */}
                  <div className={`${isLeft ? "lg:pr-8" : "lg:col-start-2 lg:pl-8"}`}>
                    <div className={`bg-white rounded-3xl p-6 md:p-8 border ${step.borderColor} shadow-lg hover:shadow-2xl hover:shadow-green-200/30 hover:-translate-y-2 transition-all duration-500 ${step.highlight ? "ring-2 ring-green-300 shadow-green-200/40" : ""} group relative overflow-hidden`}>
                      {/* Decorative gradient orb */}
                      <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${step.color} opacity-[0.07] rounded-full blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500`} />

                      <div className="relative">
                        <div className="flex items-start gap-4 mb-5">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                            {step.number}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                              <span className={`text-[11px] font-bold text-white bg-gradient-to-r ${step.color} px-3 py-1 rounded-full uppercase tracking-wider`}>
                                Bước {step.number}
                              </span>
                              {step.highlight && (
                                <span className="text-[11px] font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-600 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-600"></span>
                                  </span>
                                  Quan trọng
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">{step.title}</h3>
                            <p className="text-sm text-green-600 font-medium">{step.subtitle}</p>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-5 leading-relaxed">{step.description}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                          {step.topics.map((topic, j) => (
                            <div key={j} className="flex items-center gap-2.5 text-sm text-gray-700 bg-gray-50/80 rounded-lg px-3 py-2 group-hover:bg-green-50/60 transition-colors duration-300">
                              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" />
                              </svg>
                              <span>{topic}</span>
                            </div>
                          ))}
                        </div>

                        {step.tools && (
                          <div className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3.5 py-2.5 mb-3">
                            <span className="font-semibold text-gray-700">Tools:</span>
                            <span className="text-gray-500">{step.tools}</span>
                          </div>
                        )}

                        {step.note && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl px-4 py-3.5 border border-green-200/60">
                            <p className="text-sm text-green-800 font-medium flex items-start gap-2">
                              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                              <span>{step.note}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

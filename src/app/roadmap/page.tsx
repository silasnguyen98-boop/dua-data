import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type RoadmapTrack = "analyst" | "engineer" | "science";

interface RoadmapStep {
  number: number;
  title: string;
  subtitle: string;
  description: string;
  topics: string[];
  tools?: string;
  note?: string;
  color: string;
  bgLight: string;
  borderColor: string;
  highlight?: boolean;
}

const roadmapTracks = [
  { key: "analyst", label: "Data Analyst", href: "/roadmap?track=analyst" },
  { key: "engineer", label: "Data Engineer", href: "/roadmap?track=engineer" },
  { key: "science", label: "Data Science", href: "/roadmap?track=science" },
] satisfies { key: RoadmapTrack; label: string; href: string }[];

const analystRoadmapSteps: RoadmapStep[] = [
  {
    number: 1,
    title: "Nền tảng tư duy, thống kê & Excel",
    subtitle: "Hiểu dữ liệu đang nói gì",
    description:
      "Giai đoạn đặt nền móng, giúp bạn hiểu bản chất dữ liệu và biết cách xử lý dữ liệu ở quy mô nhỏ trước khi đi vào các công cụ nâng cao.",
    topics: [
      "Thống kê mô tả: Mean, Median, Mode, Variance, Standard Deviation",
      "Thống kê suy luận: Hypothesis testing, p-values",
      "Xác suất cơ bản",
      "Excel / Google Sheets: Pivot Table, VLOOKUP, HLOOKUP, INDEX-MATCH",
      "Hàm điều kiện: IF, COUNTIF",
      "Làm sạch dữ liệu và vẽ biểu đồ cơ bản",
    ],
    tools: "Excel / Google Sheets, Python cơ bản nếu muốn thực hành thêm",
    note: "Không nên chỉ học lý thuyết toán suông. Hãy học song song với dữ liệu thực tế để dễ hiểu và nhớ lâu hơn.",
    color: "from-green-500 to-emerald-600",
    bgLight: "bg-green-50",
    borderColor: "border-green-200",
    highlight: true,
  },
  {
    number: 2,
    title: "SQL",
    subtitle: "Làm chủ ngôn ngữ truy vấn dữ liệu",
    description:
      "SQL là kỹ năng kỹ thuật quan trọng nhất và xuất hiện ở hầu hết các tin tuyển dụng Data Analyst. Dữ liệu thực tế thường lớn và nằm trong database, nên bạn cần SQL để trích xuất và xử lý.",
    topics: [
      "SELECT, WHERE, GROUP BY, ORDER BY",
      "INNER JOIN, OUTER JOIN, LEFT JOIN",
      "Subqueries",
      "Window Functions",
      "Tìm khách hàng hàng đầu",
      "Tính doanh thu hàng tháng",
      "Phân tích tỷ lệ giữ chân khách hàng",
    ],
    tools: "SQL Database",
    note: "Đây là kỹ năng bắt buộc với Data Analyst.",
    color: "from-green-600 to-emerald-700",
    bgLight: "bg-green-50",
    borderColor: "border-green-300",
    highlight: true,
  },
  {
    number: 3,
    title: "Data Visualization & BI",
    subtitle: "Trực quan hóa dữ liệu và Business Intelligence",
    description:
      "Sau khi biết cách lấy và xử lý dữ liệu, bạn cần học cách trình bày dữ liệu sao cho dễ hiểu và có giá trị với người ra quyết định kinh doanh.",
    topics: [
      "Power BI hoặc Tableau",
      "Kết nối nhiều nguồn dữ liệu",
      "Data Modeling: Star Schema",
      "DAX trong Power BI",
      "Thiết kế dashboard tương tác",
      "Data Storytelling",
      "Nguyên tắc thiết kế thông tin",
    ],
    tools: "Power BI / Tableau",
    note: "Không chỉ kéo thả biểu đồ, bạn cần biết kể chuyện bằng dữ liệu để người xem nắm được insight nhanh.",
    color: "from-teal-600 to-green-700",
    bgLight: "bg-teal-50",
    borderColor: "border-teal-200",
  },
  {
    number: 4,
    title: "Python cho Data Analytics",
    subtitle: "Xử lý dữ liệu phức tạp và tự động hóa",
    description:
      "Khi dữ liệu phức tạp hoặc cần tự động hóa, Excel và SQL có thể không đủ. Python giúp bạn xử lý, làm sạch và phân tích dữ liệu linh hoạt hơn.",
    topics: [
      "Cú pháp Python cơ bản",
      "Biến, kiểu dữ liệu, vòng lặp, hàm",
      "Pandas: thao tác, làm sạch và xử lý DataFrame",
      "Xử lý missing values",
      "NumPy: tính toán số học và mảng",
      "Matplotlib & Seaborn",
      "Exploratory Data Analysis (EDA)",
    ],
    tools: "Python, Pandas, NumPy, Matplotlib, Seaborn",
    color: "from-emerald-500 to-green-600",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    number: 5,
    title: "AI & Machine Learning cơ bản",
    subtitle: "Tăng hiệu suất và mở rộng năng lực phân tích",
    description:
      "Năm 2026, sử dụng AI là kỹ năng bắt buộc để tăng hiệu suất. AI hỗ trợ thao tác, nhưng bạn vẫn phải giữ tư duy phân tích, đặt câu hỏi kinh doanh và kiểm chứng kết quả.",
    topics: [
      "Dùng ChatGPT, Claude, Gemini để hỗ trợ workflow",
      "Viết mẫu SQL bằng AI",
      "Debug Python",
      "Giải thích thuật ngữ phức tạp",
      "Tự động hóa làm sạch dữ liệu",
      "Linear Regression",
      "Logistic Regression",
      "Decision Trees",
      "K-Means Clustering",
    ],
    tools: "ChatGPT, Claude, Gemini, Python ML libraries",
    note: "AI là công cụ hỗ trợ thao tác, không thay thế tư duy phân tích và khả năng kiểm chứng của bạn.",
    color: "from-green-700 to-emerald-800",
    bgLight: "bg-green-50",
    borderColor: "border-green-300",
    highlight: true,
  },
  {
    number: 6,
    title: "Soft Skills, Portfolio & Chứng chỉ",
    subtitle: "Biến kỹ năng thành năng lực nghề nghiệp",
    description:
      "Giai đoạn cuối giúp bạn thoát khỏi tutorial hell, xây dựng portfolio thực tế và rèn luyện các kỹ năng quyết định sự thành công của một Data Analyst.",
    topics: [
      "Tư duy phản biện",
      "Giải quyết vấn đề",
      "Business Acumen",
      "Chú ý đến chi tiết",
      "Giao tiếp và làm việc với stakeholder",
      "Làm 3-5 dự án hoàn chỉnh",
      "Đăng dự án lên GitHub kèm README rõ ràng",
      "Google Data Analytics Certificate",
      "IBM Data Analyst Certificate",
      "Microsoft PL-300 Power BI Data Analyst",
    ],
    tools: "GitHub, README, Power BI, SQL, Python",
    note: "Portfolio nên thể hiện đủ quy trình: thu thập dữ liệu, làm sạch, phân tích, dashboard và insight.",
    color: "from-emerald-700 to-green-800",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-300",
    highlight: true,
  },
];

const engineerRoadmapSteps: RoadmapStep[] = [
  {
    number: 1,
    title: "Programming & Computer Foundations",
    subtitle: "Nền tảng lập trình và hệ thống",
    description:
      "Data Engineer cần hiểu cách phần mềm, hệ điều hành và dữ liệu vận hành trong môi trường production.",
    topics: ["Python", "SQL nâng cao", "Git", "Linux basics", "CLI", "Data structures cơ bản"],
    tools: "Python, SQL, Git, Linux",
    note: "Data Engineer cần tư duy hệ thống, không chỉ viết script xử lý dữ liệu.",
    color: "from-green-600 to-emerald-700",
    bgLight: "bg-green-50",
    borderColor: "border-green-300",
    highlight: true,
  },
  {
    number: 2,
    title: "Database & Data Modeling",
    subtitle: "Thiết kế và lưu trữ dữ liệu",
    description:
      "Hiểu cách thiết kế database, schema và mô hình dữ liệu để phục vụ analytics, reporting và pipeline.",
    topics: ["Relational Database", "Indexing", "Partitioning", "Normalization", "Star Schema", "Snowflake Schema"],
    tools: "PostgreSQL, MySQL, BigQuery, Snowflake",
    color: "from-teal-600 to-green-700",
    bgLight: "bg-teal-50",
    borderColor: "border-teal-200",
  },
  {
    number: 3,
    title: "ETL / ELT Pipelines",
    subtitle: "Xây dựng pipeline dữ liệu",
    description:
      "Thiết kế luồng ingest, transform, validate và load dữ liệu từ nhiều nguồn vào data warehouse hoặc data lake.",
    topics: ["Batch pipeline", "ETL vs ELT", "Data validation", "Scheduling", "Monitoring", "Error handling"],
    tools: "Airflow, dbt, Python",
    note: "Pipeline tốt phải chạy ổn định, có log, có retry và dễ debug.",
    color: "from-emerald-600 to-green-700",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
    highlight: true,
  },
  {
    number: 4,
    title: "Data Warehouse & Lakehouse",
    subtitle: "Kiến trúc dữ liệu hiện đại",
    description:
      "Làm chủ cách tổ chức dữ liệu ở quy mô lớn, từ raw data đến curated data phục vụ phân tích.",
    topics: ["Data warehouse", "Data lake", "Lakehouse", "Medallion architecture", "Fact & dimension tables"],
    tools: "BigQuery, Snowflake, Databricks",
    color: "from-green-700 to-emerald-800",
    bgLight: "bg-green-50",
    borderColor: "border-green-300",
  },
  {
    number: 5,
    title: "Big Data & Streaming",
    subtitle: "Xử lý dữ liệu lớn và realtime",
    description:
      "Khi dữ liệu tăng về volume hoặc cần realtime, bạn cần hiểu distributed processing và streaming system.",
    topics: ["Spark basics", "Distributed processing", "Kafka basics", "Streaming ingestion", "Realtime analytics"],
    tools: "Spark, Kafka, Databricks",
    color: "from-teal-700 to-green-800",
    bgLight: "bg-teal-50",
    borderColor: "border-teal-300",
    highlight: true,
  },
  {
    number: 6,
    title: "Cloud, DevOps & DataOps",
    subtitle: "Triển khai và vận hành production",
    description:
      "Data Engineer cần biết cách deploy, monitor, bảo mật và vận hành pipeline trong môi trường cloud.",
    topics: ["Cloud storage", "Docker", "CI/CD basics", "Secrets management", "Monitoring", "Cost optimization"],
    tools: "AWS / GCP / Azure, Docker, GitHub Actions",
    note: "Một Data Engineer tốt không chỉ build được pipeline, mà còn vận hành được pipeline.",
    color: "from-emerald-700 to-green-800",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-300",
    highlight: true,
  },
];

const scienceRoadmapSteps: RoadmapStep[] = [
  {
    number: 1,
    title: "Math, Statistics & Python",
    subtitle: "Nền tảng phân tích định lượng",
    description:
      "Data Science cần nền tảng toán, thống kê và Python đủ chắc để phân tích dữ liệu và xây dựng mô hình.",
    topics: ["Probability", "Statistics", "Linear Algebra basics", "Python", "Pandas", "NumPy"],
    tools: "Python, Pandas, NumPy",
    note: "Không cần học toán quá hàn lâm, nhưng phải hiểu đủ để đánh giá mô hình và kiểm chứng giả thuyết.",
    color: "from-green-600 to-emerald-700",
    bgLight: "bg-green-50",
    borderColor: "border-green-300",
    highlight: true,
  },
  {
    number: 2,
    title: "EDA & Data Preparation",
    subtitle: "Hiểu dữ liệu trước khi model",
    description:
      "Khám phá dữ liệu, phát hiện vấn đề và chuẩn bị dữ liệu sạch trước khi đưa vào mô hình.",
    topics: ["EDA", "Missing values", "Outliers", "Data leakage", "Feature encoding", "Feature scaling"],
    tools: "Pandas, Seaborn, Matplotlib",
    color: "from-teal-600 to-green-700",
    bgLight: "bg-teal-50",
    borderColor: "border-teal-200",
  },
  {
    number: 3,
    title: "Machine Learning Core",
    subtitle: "Xây dựng và đánh giá model",
    description:
      "Học các thuật toán ML phổ biến, cách train model và cách đánh giá mô hình đúng với bài toán.",
    topics: ["Regression", "Classification", "Clustering", "Train/test split", "Cross validation", "Model metrics"],
    tools: "scikit-learn",
    note: "Mô hình tốt không chỉ accuracy cao, mà phải giải quyết đúng bài toán kinh doanh.",
    color: "from-emerald-600 to-green-700",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
    highlight: true,
  },
  {
    number: 4,
    title: "Advanced ML & Experimentation",
    subtitle: "Tối ưu và kiểm chứng mô hình",
    description:
      "Đi sâu hơn vào tuning, experiment tracking và các kỹ thuật giúp model ổn định hơn.",
    topics: ["Hyperparameter tuning", "Feature importance", "Imbalanced data", "A/B testing", "Experiment tracking"],
    tools: "scikit-learn, MLflow",
    color: "from-green-700 to-emerald-800",
    bgLight: "bg-green-50",
    borderColor: "border-green-300",
  },
  {
    number: 5,
    title: "Deep Learning & GenAI Basics",
    subtitle: "Nền tảng AI hiện đại",
    description:
      "Làm quen với deep learning, NLP và GenAI ở mức ứng dụng để hiểu khả năng, giới hạn và cách dùng đúng.",
    topics: ["Neural networks basics", "NLP basics", "Embeddings", "LLM basics", "Prompting", "Evaluation"],
    tools: "PyTorch / TensorFlow, OpenAI API",
    color: "from-teal-700 to-green-800",
    bgLight: "bg-teal-50",
    borderColor: "border-teal-300",
    highlight: true,
  },
  {
    number: 6,
    title: "Deployment, Portfolio & Career",
    subtitle: "Đưa model vào thực tế",
    description:
      "Hoàn thiện dự án end-to-end, biết cách trình bày kết quả và triển khai model ở mức cơ bản.",
    topics: ["Model deployment basics", "API serving", "Dashboard kết quả", "GitHub portfolio", "Case study writing"],
    tools: "FastAPI, Docker, Streamlit, GitHub",
    note: "Portfolio Data Science nên thể hiện rõ bài toán, dữ liệu, cách đánh giá và tác động thực tế.",
    color: "from-emerald-700 to-green-800",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-300",
    highlight: true,
  },
];

const simplifiedFlows: Record<RoadmapTrack, { step: string; icon: string; color: string }[]> = {
  analyst: [
    { step: "Nền tảng & Excel", icon: "📊", color: "bg-green-500" },
    { step: "SQL", icon: "🗄️", color: "bg-teal-500" },
    { step: "BI Dashboard", icon: "📈", color: "bg-emerald-500" },
    { step: "Python", icon: "🐍", color: "bg-green-600" },
    { step: "AI & ML cơ bản", icon: "🤖", color: "bg-teal-600" },
    { step: "Portfolio & Career", icon: "🚀", color: "bg-green-700" },
  ],
  engineer: [
    { step: "Programming", icon: "💻", color: "bg-green-500" },
    { step: "Database", icon: "🗄️", color: "bg-teal-500" },
    { step: "ETL / ELT", icon: "🔁", color: "bg-emerald-500" },
    { step: "Warehouse", icon: "🏗️", color: "bg-green-600" },
    { step: "Streaming", icon: "⚡", color: "bg-teal-600" },
    { step: "Cloud / DataOps", icon: "☁️", color: "bg-green-700" },
  ],
  science: [
    { step: "Math & Python", icon: "🧮", color: "bg-green-500" },
    { step: "EDA", icon: "🔍", color: "bg-teal-500" },
    { step: "ML Core", icon: "🤖", color: "bg-emerald-500" },
    { step: "Experiment", icon: "🧪", color: "bg-green-600" },
    { step: "GenAI", icon: "✨", color: "bg-teal-600" },
    { step: "Deploy", icon: "🚀", color: "bg-green-700" },
  ],
};

const trackMeta: Record<RoadmapTrack, { title: string; subtitle: React.ReactNode }> = {
  analyst: {
    title: "Data Analyst chuyên nghiệp",
    subtitle: (
      <>
        6 giai đoạn từ nền tảng, SQL, BI, Python đến{" "}
        <strong>AI + Portfolio + Career</strong>
      </>
    ),
  },
  engineer: {
    title: "Data Engineer chuyên nghiệp",
    subtitle: (
      <>
        Lộ trình từ lập trình, database, pipeline đến{" "}
        <strong>cloud + big data + DataOps</strong>
      </>
    ),
  },
  science: {
    title: "Data Scientist chuyên nghiệp",
    subtitle: (
      <>
        Lộ trình từ thống kê, Python, ML đến{" "}
        <strong>GenAI + deployment + portfolio</strong>
      </>
    ),
  },
};

function getActiveTrack(track?: string): RoadmapTrack {
  if (track === "engineer") return "engineer";
  if (track === "science") return "science";
  return "analyst";
}

export default function RoadmapPage({
  searchParams,
}: {
  searchParams?: { track?: string };
}) {
  const activeTrack = getActiveTrack(searchParams?.track);

  const roadmapSteps =
    activeTrack === "engineer"
      ? engineerRoadmapSteps
      : activeTrack === "science"
        ? scienceRoadmapSteps
        : analystRoadmapSteps;

  const simplifiedFlow = simplifiedFlows[activeTrack];
  const meta = trackMeta[activeTrack];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-600 to-emerald-500" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='white' opacity='0.3'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            Cập nhật 2026
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Lộ trình trở thành
            <br />
            <span className="bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent">
              {meta.title}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {meta.subtitle}
          </p>

          <a
            href="https://www.facebook.com/duadata"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:bg-green-50 transition-all duration-300 mb-8 animate-fade-in-up"
            style={{ animationDelay: "0.25s" }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            Liên hệ DUA để được tư vấn lộ trình phù hợp
          </a>

          <div className="flex flex-wrap justify-center items-center gap-2 animate-fade-in-up text-sm text-green-200 font-medium" style={{ animationDelay: "0.3s" }}>
            {simplifiedFlow.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  {item.step}
                </span>
                {i < simplifiedFlow.length - 1 && <span className="text-white/40">→</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2 animate-fade-in-up">
            Detailed Roadmap
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 animate-fade-in-up font-display" style={{ animationDelay: "0.1s" }}>
            Lộ trình chi tiết
          </h2>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {roadmapTracks.map((track) => {
              const isActive = activeTrack === track.key;

              return (
                <Link
                  key={track.key}
                  href={track.href}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all border ${
                    isActive
                      ? "bg-green-700 text-white border-green-700 shadow-lg shadow-green-200"
                      : "bg-white text-green-700 border-green-200 hover:bg-green-50"
                  }`}
                >
                  {track.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-green-200 via-emerald-400 to-green-600 hidden lg:block rounded-full" />
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-4 bg-gradient-to-b from-green-200/20 via-emerald-400/20 to-green-600/20 hidden lg:block rounded-full blur-sm" />

          <div className="space-y-12 lg:space-y-16">
            {roadmapSteps.map((step, i) => {
              const isLeft = i % 2 === 0;

              return (
                <div
                  key={`${activeTrack}-${step.number}`}
                  className="relative animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="absolute left-1/2 -translate-x-1/2 top-8 hidden lg:flex z-20">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl ring-4 ring-white text-white font-bold text-sm`}>
                      {step.number}
                    </div>
                  </div>

                  <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">
                    <div className={`${isLeft ? "lg:pr-8" : "lg:col-start-2 lg:pl-8"}`}>
                      <div className={`bg-white rounded-3xl p-6 md:p-8 border ${step.borderColor} shadow-lg hover:shadow-2xl hover:shadow-green-200/30 hover:-translate-y-2 transition-all duration-500 ${step.highlight ? "ring-2 ring-green-300 shadow-green-200/40" : ""} group relative overflow-hidden`}>
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
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-600 opacity-75" />
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-600" />
                                    </span>
                                    Quan trọng
                                  </span>
                                )}
                              </div>

                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                                {step.title}
                              </h3>
                              <p className="text-sm text-green-600 font-medium">
                                {step.subtitle}
                              </p>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                            {step.description}
                          </p>

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
                                <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
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

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type AnswerKey = "A" | "B" | "C" | "D";

type Question = {
  id: number;
  question: string;
  options: Record<AnswerKey, string>;
  correct: AnswerKey;
};

const questions: Question[] = [
  {
    id: 1,
    question:
      "Khi gặp một vấn đề thất bại hoặc có kết quả đi ngược lại với dự đoán (ví dụ: một chiến dịch không hiệu quả), phản ứng tự nhiên của bạn là gì?",
    options: {
      A: "Đổ lỗi cho các yếu tố bên ngoài hoặc cho người khác để tránh rắc rối.",
      B: "Bỏ qua kết quả đó và nhanh chóng chuyển sang dự án tiếp theo.",
      C: 'Trở nên tò mò, liên tục đặt câu hỏi "tại sao" và đào sâu nghiên cứu để tìm ra nguyên nhân gốc rễ.',
      D: "Cảm thấy chán nản, căng thẳng và đợi cấp trên chỉ định hướng giải quyết.",
    },
    correct: "C",
  },
  {
    id: 2,
    question: "Bạn đánh giá khả năng quan sát chi tiết của mình như thế nào?",
    options: {
      A: 'Tôi có "đôi mắt cú vọ", thường xuyên nhận ra những lỗi sai rất nhỏ mà người khác dễ bỏ qua (như lỗi chính tả, sai dấu phẩy trong báo cáo).',
      B: "Tôi quan tâm đến bức tranh tổng thể nhiều hơn, đôi khi bỏ lỡ các chi tiết nhỏ.",
      C: "Tôi cảm thấy khó chịu và mất kiên nhẫn khi phải dò xét từng con số hay chi tiết lặt vặt.",
      D: "Tôi chỉ kiểm tra chi tiết khi có người khác nhắc nhở hoặc yêu cầu.",
    },
    correct: "A",
  },
  {
    id: 3,
    question:
      "Nếu bạn được giao một tập dữ liệu lộn xộn, bị thiếu hụt nhiều thông tin (missing data), bạn sẽ làm gì?",
    options: {
      A: "Từ chối làm việc cho đến khi có người cung cấp cho tôi một bộ dữ liệu hoàn hảo 100%.",
      B: "Xóa bỏ hết những phần lộn xộn và chỉ dùng một số ít dữ liệu sạch, dù điều đó làm mất đi bức tranh chung.",
      C: "Đoán mò kết quả theo cảm tính vì dữ liệu đằng nào cũng không dùng được.",
      D: "Chấp nhận dữ liệu không hoàn hảo, coi đó như một bài toán xếp hình thiếu mảnh ghép, dùng trực giác và logic để chắp vá, tìm ra thông tin hữu ích.",
    },
    correct: "D",
  },
  {
    id: 4,
    question:
      "Khi phải giải thích một vấn đề kỹ thuật hoặc số liệu phức tạp cho những người không có chuyên môn (như bộ phận sale, marketing), bạn thường:",
    options: {
      A: "Trình bày y nguyên bảng số liệu phức tạp và để họ tự tìm hiểu.",
      B: "Có khả năng biến những con số thành một câu chuyện đơn giản, dễ hiểu, giống như cách bạn giải thích luật của một trò chơi khó cho người lớn tuổi.",
      C: "Thường xuyên sử dụng thuật ngữ chuyên ngành để thể hiện tính chuyên nghiệp.",
      D: "Cảm thấy bực bội nếu họ không thể hiểu được các con số và logic toán học cơ bản.",
    },
    correct: "B",
  },
  {
    id: 5,
    question:
      "Giả sử bạn phải báo cáo kết quả của một dự án quan trọng và số liệu thực tế cho thấy nó thất bại, trong khi sếp đang rất kỳ vọng vào một tin vui. Bạn sẽ:",
    options: {
      A: "Chỉ chọn những con số tích cực để báo cáo, che giấu các chỉ số xấu để sếp vui lòng.",
      B: "Đùn đẩy việc báo cáo cho một đồng nghiệp khác.",
      C: "Thẳng thắn trình bày sự thật đúng như những gì dữ liệu thể hiện, không \"tô hồng\" kết quả, dù điều này có thể gây khó chịu.",
      D: "Tự điều chỉnh lại một vài con số cho đỡ tệ hại trước khi nộp báo cáo.",
    },
    correct: "C",
  },
  {
    id: 6,
    question: "Thái độ của bạn đối với việc học các công cụ (tools) và phần mềm mới là gì?",
    options: {
      A: "Rất sẵn sàng thích nghi và coi việc học công cụ, phần mềm mới như học một ngôn ngữ mới – đầy thách thức nhưng cũng rất xứng đáng.",
      B: "Chỉ muốn dùng những gì mình đã biết (như Excel) và ngại tiếp cận các ngôn ngữ như SQL hay Python.",
      C: "Cảm thấy việc học công nghệ mới là một rào cản quá lớn và thường nhờ người khác làm hộ.",
      D: "Thích học nhưng nhanh chán, không muốn đào sâu để thành thạo bất cứ công cụ nào.",
    },
    correct: "A",
  },
  {
    id: 7,
    question: "Bạn tự nhận mình có thiên hướng tư duy như thế nào?",
    options: {
      A: "Hoàn toàn thiên về Não trái: Rất khô khan, chỉ thích logic, toán học và kỹ thuật.",
      B: "Hoàn toàn thiên về Não phải: Bay bổng, giàu cảm xúc, chỉ thích nghệ thuật và trực giác.",
      C: "Cực kỳ ngẫu hứng, làm việc không cần kế hoạch hay quy trình.",
      D: "Có sự cân bằng giữa cả hai bán cầu não: Kết hợp tốt sự nhạy bén về Kinh doanh (Business) và tư duy logic của Kỹ thuật (Tech).",
    },
    correct: "D",
  },
  {
    id: 8,
    question:
      "Khi nhìn vào một bảng tính (spreadsheet) chứa hàng ngàn hàng dữ liệu, bạn thường có cảm giác:",
    options: {
      A: "Thấy hoa mắt, chóng mặt và muốn chuyển sang làm việc khác.",
      B: "Tự nhiên nhận ra các quy luật tiềm ẩn và tưởng tượng ngay ra cách biến chúng thành các biểu đồ màu sắc trực quan.",
      C: "Chỉ lướt nhanh xuống dòng cuối cùng để xem tổng kết, không quan tâm nội dung bên trong.",
      D: "Coi đó như một nhiệm vụ nhập liệu nhàm chán và làm một cách máy móc.",
    },
    correct: "B",
  },
  {
    id: 9,
    question:
      "Khi phải đưa ra một quyết định quan trọng, phương pháp yêu thích của bạn là:",
    options: {
      A: "Quyết định nhanh dựa trên cảm tính hoặc điều gì nảy ra trong đầu đầu tiên.",
      B: "Thử nghiệm ngẫu nhiên nhiều cách cho đến khi có một cách hiệu quả.",
      C: "Thu thập đầy đủ thông tin, tìm hiểu kỹ lưỡng các quy luật (logic) và mối liên hệ của vấn đề trước khi kết luận.",
      D: "Hỏi ý kiến của đám đông và làm theo số đông mà không cần tự phân tích.",
    },
    correct: "C",
  },
  {
    id: 10,
    question:
      "Bạn đánh giá như thế nào về tính cẩn thận và trách nhiệm (Conscientiousness) của mình trong công việc?",
    options: {
      A: "Tôi rất tùy hứng, ghét sự gò bó của các nguyên tắc và làm việc theo cảm xúc.",
      B: "Tôi đề cao tốc độ, thà làm nhanh mà sai sót một chút còn hơn làm chậm.",
      C: "Tôi bất chấp mọi nguyên tắc miễn là đạt được mục tiêu cuối cùng.",
      D: "Tôi làm việc bài bản, có kỷ luật, làm việc thận trọng và cực kỳ chú ý đến đạo đức dữ liệu (ví dụ: bảo mật thông tin cá nhân).",
    },
    correct: "D",
  },
];

const scoreBands = [
  {
    min: 8,
    title: "Phù hợp cao với Data Analyst",
    description:
      "Bạn có nhiều tố chất phù hợp với nghề Data Analyst. Công việc này đòi hỏi sự tò mò, tư duy logic, tính cẩn thận, khả năng đặt câu hỏi và diễn giải dữ liệu thành những insight dễ hiểu. Với nền tảng hiện tại, bạn có thể phát triển tốt nếu tiếp tục rèn luyện kỹ năng phân tích, công cụ và tư duy kinh doanh.",
  },
  {
    min: 5,
    title: "Có tiềm năng để phát triển",
    description:
      "Bạn có tiềm năng để phát triển trong lĩnh vực Dữ liệu, nhưng vẫn cần thêm thời gian để rèn luyện. Nghề Data Analyst không chỉ cần biết dùng công cụ, mà còn cần sự kiên nhẫn khi xử lý dữ liệu, khả năng làm việc với lỗi sai, tư duy giải quyết vấn đề và kỹ năng trình bày kết quả. Nếu có lộ trình học phù hợp và thực hành đều đặn, bạn hoàn toàn có thể tiến xa hơn trong ngành này.",
  },
  {
    min: 0,
    title: "Cần cân nhắc thêm",
    description:
      "Kết quả này cho thấy bạn có thể cần cân nhắc kỹ hơn trước khi theo đuổi nghề Data Analyst. Công việc này thường yêu cầu sự tập trung, tính lặp lại, khả năng làm việc với dữ liệu và tư duy logic trong thời gian dài. Tuy nhiên, kết quả bài test không phải là kết luận cuối cùng. Nếu bạn thật sự yêu thích dữ liệu, sẵn sàng học hỏi và kiên trì rèn luyện, bạn vẫn có thể cải thiện từng bước để phù hợp hơn với ngành.",
  },
];

function getBand(score: number) {
  return scoreBands.find((band) => score >= band.min) ?? scoreBands[2];
}

function badgeClass(option: AnswerKey, selected?: AnswerKey, correct?: AnswerKey) {
  if (selected === option && correct === option) {
    return "border-emerald-500 bg-emerald-50 text-emerald-950";
  }

  if (selected === option && correct && selected !== correct) {
    return "border-rose-500 bg-rose-50 text-rose-950";
  }

  if (correct === option) {
    return "border-emerald-300 bg-emerald-50/60 text-emerald-900";
  }

  return "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40";
}

export default function AssessmentPage() {
  const [finished, setFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<number, AnswerKey>>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerKey | null>(null);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const score = useMemo(
    () =>
      questions.reduce((total, question) => {
        return total + (answers[question.id] === question.correct ? 1 : 0);
      }, 0),
    [answers],
  );

  const band = getBand(score);

  useEffect(() => {
    if (finished || selectedAnswer == null) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (currentIndex >= questions.length - 1) {
        setFinished(true);
      } else {
        setCurrentIndex((value) => value + 1);
      }
      setSelectedAnswer(null);
    }, 550);

    return () => window.clearTimeout(timer);
  }, [currentIndex, finished, selectedAnswer]);

  const handleSelect = (value: AnswerKey) => {
    if (selectedAnswer) {
      return;
    }

    setSelectedAnswer(value);
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: value,
    }));
  };

  const handleReset = () => {
    setFinished(false);
    setCurrentIndex(0);
    setAnswers({});
    setSelectedAnswer(null);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-lime-50" />
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-lime-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-20">
          <div className="animate-fade-in-up max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Assessment Data Analyst
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-emerald-950 md:text-6xl">
              Bạn có hợp theo ngành{" "}
              <span className="bg-gradient-to-r from-emerald-700 via-lime-600 to-emerald-500 bg-clip-text text-transparent">
                Data Analyst
              </span>{" "}
              không?
            </h1>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-20">
        {!finished ? (
          <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                    Câu {currentIndex + 1}/{questions.length}
                  </p>
                  <h2 className="mt-2 text-lg font-bold leading-8 text-slate-900 md:text-2xl">
                    {currentQuestion.question}
                  </h2>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                  {Math.round(((currentIndex + 1) / questions.length) * 100)}%
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {Object.entries(currentQuestion.options).map(([optionKey, text]) => {
                  const key = optionKey as AnswerKey;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelect(key)}
                      className={`rounded-2xl border p-4 text-left transition-all duration-200 ${badgeClass(
                        key,
                        selectedAnswer ?? undefined,
                        selectedAnswer ? currentQuestion.correct : undefined,
                      )}`}
                    >
                      <div className="flex gap-3">
                        <span
                          className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                            selectedAnswer === key
                              ? "bg-emerald-700 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {key}
                        </span>
                        <p className="text-sm leading-7 md:text-[15px]">{text}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span>
                  Đã trả lời: <strong className="text-slate-900">{answeredCount}/10</strong>
                </span>
                <span>
                  Chỉ còn: <strong className="text-slate-900">{questions.length - answeredCount}</strong>
                </span>
              </div>
            </section>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-100/50">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Tiến độ
                </p>
                <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">Đã hoàn thành</span>
                    <span className="font-bold text-slate-900">
                      {currentIndex + 1}/{questions.length}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-lime-500 transition-all duration-300"
                      style={{
                        width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
          </aside>
        </div>
        ) : (
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-100/50">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-800">
                Hoàn thành bài test
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-slate-900 md:text-5xl">
                Điểm: {score}/10
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                {band.description}
              </p>

              <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Đánh giá nhanh
                </div>
                <div className="mt-2 text-lg font-bold text-emerald-900">
                  {band.title}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
                >
                  Làm lại bài test
                </button>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  Khám phá khóa học Data Analyst
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

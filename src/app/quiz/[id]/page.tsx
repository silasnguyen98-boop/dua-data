import { Quiz } from "@/types/quiz";
import QuizTakePage from "./QuizTakePage";

async function getQuiz(id: string): Promise<Quiz | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/quiz/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: { id: string } }) {
  const quiz = await getQuiz(params.id);
  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤔</div>
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Quiz không tìm thấy</h1>
          <a href="/quiz" className="text-indigo-600 hover:underline">← Quay lại danh sách</a>
        </div>
      </div>
    );
  }

  return <QuizTakePage quiz={quiz} />;
}
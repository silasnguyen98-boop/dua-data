import { Quiz } from "@/types/quiz";
import QuizClientPage from "./QuizClientPage";

async function getQuizzes(): Promise<Quiz[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/quiz`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const all = await getQuizzes();
  const quizzes = all
    .filter((q) => q.published !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return <QuizClientPage quizzes={quizzes} />;
}

import { cookies } from "next/headers";
import { Quiz, QuizAttemptRecord } from "@/types/quiz";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import QuizTakePage from "./QuizTakePage";
import QuizPasswordGate from "./QuizPasswordGate";

async function getQuiz(id: string): Promise<Quiz | null> {
  const snapshot = await get(ref(db, `quiz/${id}`));
  if (!snapshot.exists()) return null;
  return { id, ...snapshot.val() } as Quiz;
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

  const cookieStore = cookies();
  const accessCookie = cookieStore.get(`quiz_access_${params.id}`)?.value;
  const isUnlocked = !quiz.password || accessCookie === quiz.password;
  const attemptCookie = cookieStore.get(`quiz_attempt_${params.id}`)?.value;
  let initialAttempt: QuizAttemptRecord | null = null;
  if (attemptCookie) {
    try {
      initialAttempt = JSON.parse(decodeURIComponent(attemptCookie)) as QuizAttemptRecord;
    } catch {
      initialAttempt = null;
    }
  }

  if (!isUnlocked) {
    return (
      <QuizPasswordGate
        quiz={{
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          imageUrl: quiz.imageUrl,
          durationMinutes: quiz.durationMinutes,
        }}
      />
    );
  }

  const { password, ...safeQuiz } = quiz;
  return <QuizTakePage quiz={safeQuiz as Quiz} initialAttempt={initialAttempt} />;
}

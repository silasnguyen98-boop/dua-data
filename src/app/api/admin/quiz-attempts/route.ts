import { NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { QuizAttemptAdminEntry, Quiz } from "@/types/quiz";

export const dynamic = "force-dynamic";

type QuizMapItem = Pick<Quiz, "id" | "title" | "category" | "difficulty" | "published">;

async function readQuizzes(): Promise<Record<string, QuizMapItem>> {
  const snapshot = await get(ref(db, "quiz"));
  if (!snapshot.exists()) return {};

  const data = snapshot.val() as Record<string, any>;
  return Object.entries(data).reduce<Record<string, QuizMapItem>>((acc, [id, value]) => {
    acc[id] = {
      id,
      title: String(value?.title || id),
      category: value?.category ? String(value.category) : undefined,
      difficulty: value?.difficulty,
      published: value?.published !== false,
    };
    return acc;
  }, {});
}

export async function GET() {
  try {
    const [quizzes, attemptsSnapshot] = await Promise.all([
      readQuizzes(),
      get(ref(db, "quiz_attempts")),
    ]);

    const rows: QuizAttemptAdminEntry[] = [];

    if (attemptsSnapshot.exists()) {
      const attemptsByQuiz = attemptsSnapshot.val() as Record<string, Record<string, any>>;
      Object.entries(attemptsByQuiz).forEach(([quizId, attempts]) => {
        const quiz = quizzes[quizId];
        const quizTitle = quiz?.title || quizId;
        Object.entries(attempts || {}).forEach(([attemptId, attempt]) => {
            rows.push({
              id: attemptId,
              quizId,
              quizTitle,
              quizCategory: quiz?.category,
              quizDifficulty: quiz?.difficulty,
              quizPublished: quiz?.published,
              participantName: String(attempt?.participantName || "Ẩn danh"),
              participantEmail: attempt?.participantEmail ? String(attempt.participantEmail) : undefined,
              participantDisplayName: attempt?.participantDisplayName ? String(attempt.participantDisplayName) : undefined,
              score: Number(attempt?.score) || 0,
              totalQuestions: Number(attempt?.totalQuestions) || 0,
              percentage: Number(attempt?.percentage) || 0,
            elapsedSeconds: Number(attempt?.elapsedSeconds) || 0,
            submittedAt: String(attempt?.submittedAt || ""),
            submittedByTimeout: Boolean(attempt?.submittedByTimeout),
          });
        });
      });
    }

    rows.sort((a, b) => {
      const timeDiff = new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      if (b.score !== a.score) return b.score - a.score;
      return a.participantName.localeCompare(b.participantName);
    });

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/admin/quiz-attempts error:", err);
    return NextResponse.json({ error: "Failed to fetch quiz attempts" }, { status: 500 });
  }
}

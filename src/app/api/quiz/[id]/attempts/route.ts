import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { Quiz, QuizLeaderboardEntry } from "@/types/quiz";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function getQuiz(id: string): Promise<Quiz | null> {
  const snapshot = await get(ref(db, `quiz/${id}`));
  if (!snapshot.exists()) return null;
  return { id, ...snapshot.val() } as Quiz;
}

async function getLeaderboard(id: string): Promise<QuizLeaderboardEntry[]> {
  const snapshot = await get(ref(db, `quiz_attempts/${id}`));
  if (!snapshot.exists()) return [];

  const data = snapshot.val();
  const entries = Object.entries(data).map(([attemptId, value]: [string, any]) => ({
    id: attemptId,
    participantName: String(value.participantName || "Ẩn danh"),
    participantEmail: value.participantEmail ? String(value.participantEmail) : undefined,
    participantDisplayName: value.participantDisplayName ? String(value.participantDisplayName) : undefined,
    score: Number(value.score) || 0,
    totalQuestions: Number(value.totalQuestions) || 0,
    percentage: Number(value.percentage) || 0,
    elapsedSeconds: Number(value.elapsedSeconds) || 0,
    submittedAt: String(value.submittedAt || ""),
    submittedByTimeout: Boolean(value.submittedByTimeout),
  }));

  return entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.elapsedSeconds !== b.elapsedSeconds) return a.elapsedSeconds - b.elapsedSeconds;
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  });
}

function normalizeAnswers(input: any): Record<number, number> {
  if (!input || typeof input !== "object") return {};
  return Object.entries(input).reduce<Record<number, number>>((acc, [key, value]) => {
    const index = Number(key);
    if (Number.isNaN(index)) return acc;
    acc[index] = Number(value);
    return acc;
  }, {});
}

function createSupabaseAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leaderboard = await getLeaderboard(params.id);
    return NextResponse.json({ leaderboard: leaderboard.slice(0, 10) });
  } catch (err) {
    console.error("GET /api/quiz/[id]/attempts error:", err);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quiz = await getQuiz(params.id);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!accessToken) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để xem kết quả" }, { status: 401 });
    }

    const supabase = createSupabaseAuthClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    const user = userData.user;
    if (userError || !user) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để xem kết quả" }, { status: 401 });
    }

    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    const answers = normalizeAnswers(body.answers);
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const elapsedSeconds = Math.max(0, Number(body.elapsedSeconds) || 0);
    const submittedAt = typeof body.submittedAt === "string" && body.submittedAt.trim()
      ? body.submittedAt.trim()
      : new Date().toISOString();
    const now = new Date().toISOString();
    const participantEmail = String(user.email || "").trim();
    const participantDisplayName = String(
      user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "Ẩn danh"
    ).trim();
    const participantName = participantDisplayName || "Ẩn danh";

    const attemptRef = push(ref(db, `quiz_attempts/${params.id}`));
    const record = {
      id: attemptRef.key!,
      quizId: params.id,
      participantName,
      participantEmail,
      participantDisplayName,
      answers,
      score,
      totalQuestions,
      percentage,
      elapsedSeconds,
      submittedAt,
      submittedByTimeout: Boolean(body.submittedByTimeout),
      createdAt: now,
    };

    await set(attemptRef, record);

    const leaderboard = await getLeaderboard(params.id);
    return NextResponse.json({ success: true, attempt: record, leaderboard: leaderboard.slice(0, 10) }, { status: 201 });
  } catch (err) {
    console.error("POST /api/quiz/[id]/attempts error:", err);
    return NextResponse.json({ error: "Failed to save quiz attempt" }, { status: 500 });
  }
}

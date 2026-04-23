import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const snapshot = await get(ref(db, `quiz/${params.id}`));
    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const quiz = snapshot.val();
    const isAdminPreview = req.headers.get("x-admin-preview") === "1";
    if (isAdminPreview) {
      return NextResponse.json({ id: params.id, ...quiz, hasPassword: Boolean(quiz.password) });
    }

    const { questions, password, ...safe } = quiz;
    return NextResponse.json({
      id: params.id,
      ...safe,
      hasPassword: Boolean(password),
      questionCount: Array.isArray(questions) ? questions.length : 0,
      questions: [],
    });
  } catch (err) {
    console.error("GET /api/quiz/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}

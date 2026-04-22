import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, push, update, remove } from "firebase/database";
import { Quiz, QuizQuestion } from "@/types/quiz";

export const dynamic = "force-dynamic";

async function readQuizzes(): Promise<Quiz[]> {
  const snapshot = await get(ref(db, "quiz"));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data).map(([key, val]: [string, any]) => ({
    ...val,
    id: key,
  }));
}

export async function GET() {
  try {
    const quizzes = await readQuizzes();
    // Strip questions from list view for performance
    const list = quizzes.map(({ questions, ...rest }) => rest);
    return NextResponse.json(list);
  } catch (err) {
    console.error("GET /api/quiz error:", err);
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, createdAt, updatedAt, ...rest } = body;

    // Validate at least one question
    const questions: QuizQuestion[] = (rest.questions || []).map((q: any, i: number) => ({
      id: q.id || `q${i + 1}`,
      question: q.question || "",
      options: q.options || [],
      correctIndex: q.correctIndex ?? -1,
      explanation: q.explanation || "",
    }));

    const now = new Date().toISOString();
    const newRef = push(ref(db, "quiz"));
    const quiz: Quiz = {
      ...rest,
      questions,
      id: newRef.key!,
      createdAt: now,
      updatedAt: now,
    };
    await set(newRef, quiz);
    return NextResponse.json(quiz, { status: 201 });
  } catch (err) {
    console.error("POST /api/quiz error:", err);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, createdAt, updatedAt, ...rest } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Re-index questions
    const questions: QuizQuestion[] = (rest.questions || []).map((q: any, i: number) => ({
      id: q.id || `q${i + 1}`,
      question: q.question || "",
      options: q.options || [],
      correctIndex: q.correctIndex ?? -1,
      explanation: q.explanation || "",
    }));

    const now = new Date().toISOString();
    await update(ref(db, `quiz/${id}`), { ...rest, questions, updatedAt: now });
    const snapshot = await get(ref(db, `quiz/${id}`));
    return NextResponse.json({ ...snapshot.val(), id });
  } catch (err) {
    console.error("PUT /api/quiz error:", err);
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await remove(ref(db, `quiz/${id}`));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/quiz error:", err);
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 });
  }
}
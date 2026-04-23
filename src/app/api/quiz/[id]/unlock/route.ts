import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = String(body.password || "").trim();
    if (!password) {
      return NextResponse.json({ error: "Missing password" }, { status: 400 });
    }

    const snapshot = await get(ref(db, `quiz/${params.id}`));
    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const quiz = snapshot.val();
    if (!quiz.password) {
      return NextResponse.json({ success: true, unlocked: true });
    }

    if (quiz.password !== password) {
      return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
    }

    const res = NextResponse.json({ success: true, unlocked: true });
    res.cookies.set({
      name: `quiz_access_${params.id}`,
      value: quiz.password,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: `/quiz/${params.id}`,
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    console.error("POST /api/quiz/[id]/unlock error:", err);
    return NextResponse.json({ error: "Failed to unlock quiz" }, { status: 500 });
  }
}

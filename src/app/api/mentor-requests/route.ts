import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, push, set, update, remove } from "firebase/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const snapshot = await get(ref(db, "mentorRequests"));
  if (!snapshot.exists()) return NextResponse.json([]);

  const data = snapshot.val();
  let requests: any[] = Object.entries(data).map(([key, val]: [string, any]) => ({
    ...val,
    id: key,
  }));

  if (status && status !== "all") {
    requests = requests.filter(r => r.status === status);
  }

  requests.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { goal, currentLevel, skills, problems, availableTime, budget, name, phone, email } = body;

  if (!goal || !currentLevel || !skills || !availableTime || !name || !phone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const newRef = push(ref(db, "mentorRequests"));
  const request = {
    goal: goal.trim(),
    currentLevel,
    skills: skills || [],
    problems: problems?.trim() || "",
    availableTime,
    budget: budget?.trim() || "",
    name: name.trim(),
    phone: phone.trim(),
    email: email?.trim() || "",
    status: "pending",
    assignedMentorId: null,
    assignedMentorName: null,
    createdAt: new Date().toISOString(),
  };

  await set(newRef, request);
  return NextResponse.json({ id: newRef.key, ...request }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, assignedMentorId, assignedMentorName } = body;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, any> = {};
  if (status) updates.status = status;
  if (assignedMentorId !== undefined) updates.assignedMentorId = assignedMentorId;
  if (assignedMentorName !== undefined) updates.assignedMentorName = assignedMentorName;

  await update(ref(db, `mentorRequests/${id}`), updates);
  const snap = await get(ref(db, `mentorRequests/${id}`));

  return NextResponse.json({ id, ...snap.val() });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await remove(ref(db, `mentorRequests/${id}`));
  return NextResponse.json({ success: true });
}

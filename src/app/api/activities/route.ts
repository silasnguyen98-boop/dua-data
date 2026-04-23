import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, push, update, remove } from "firebase/database";

export const dynamic = "force-dynamic";

export interface Activity {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  community: "student" | "genz";
  registrationLink: string;
  registrationDeadline: string;
  eventDate: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

async function readActivities(): Promise<Activity[]> {
  const snapshot = await get(ref(db, "Activity"));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data).map(([key, val]: [string, any]) => ({
    ...val,
    id: key,
  }));
}

export async function GET() {
  const activities = await readActivities();
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newRef = push(ref(db, "Activity"));
  const now = new Date().toISOString();
  const activity: Activity = {
    id: newRef.key!,
    title: body.title || "",
    summary: body.summary || "",
    content: body.content || "",
    imageUrl: body.imageUrl || "",
    community: body.community || "student",
    registrationLink: body.registrationLink || "",
    registrationDeadline: body.registrationDeadline || "",
    eventDate: body.eventDate || "",
    author: body.author || "DUA Edu",
    published: body.published !== false,
    createdAt: now,
    updatedAt: now,
  };
  await set(newRef, activity);
  return NextResponse.json(activity, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const actRef = ref(db, `Activity/${id}`);
  const snapshot = await get(actRef);
  if (!snapshot.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await update(actRef, { ...data, updatedAt: new Date().toISOString() });
  const updated = await get(actRef);
  return NextResponse.json({ id, ...updated.val() });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const actRef = ref(db, `Activity/${id}`);
  const snapshot = await get(actRef);
  if (!snapshot.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await remove(actRef);
  return NextResponse.json({ success: true });
}

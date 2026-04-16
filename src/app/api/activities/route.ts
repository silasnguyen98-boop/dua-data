import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, push, update, remove } from "firebase/database";

export const dynamic = "force-dynamic";

type UserRole = "system_admin" | "content_manager" | "sales_executive" | "teaching_assistant";
const ALLOWED_ROLES: UserRole[] = ["system_admin", "content_manager"];

function getRoleFromHeader(req: NextRequest): UserRole | null {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  try {
    const decoded = Buffer.from(auth.slice(7), "base64").toString("utf-8");
    return decoded.split(":")[1] as UserRole;
  } catch {
    return null;
  }
}

export interface Activity {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  community: "student" | "genz"; // student = Cộng đồng học viên, genz = GenZ làm Data
  registrationLink: string;
  registrationDeadline: string; // ISO date
  eventDate: string; // ISO date
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
  const role = getRoleFromHeader(req);
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
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
    author: body.author || "Dứa Data",
    published: body.published !== false,
    createdAt: now,
    updatedAt: now,
  };
  await set(newRef, activity);
  return NextResponse.json(activity, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const role = getRoleFromHeader(req);
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
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
  const role = getRoleFromHeader(req);
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const actRef = ref(db, `Activity/${id}`);
  const snapshot = await get(actRef);
  if (!snapshot.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await remove(actRef);
  return NextResponse.json({ success: true });
}

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
    return Buffer.from(auth.slice(7), "base64").toString("utf-8").split(":")[1] as UserRole;
  } catch {
    return null;
  }
}

export interface Expert {
  id: string;
  name: string;
  position: string;
  previousWork: string;
  avatarUrl: string;
  linkedin: string;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

async function readExperts(): Promise<Expert[]> {
  const snapshot = await get(ref(db, "expert"));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data)
    .map(([key, val]: [string, any]) => ({ ...val, id: key }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function GET() {
  const experts = await readExperts();
  return NextResponse.json(experts);
}

export async function POST(req: NextRequest) {
  const role = getRoleFromHeader(req);
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await req.json();
  const newRef = push(ref(db, "expert"));
  const now = new Date().toISOString();
  const expert: Expert = {
    id: newRef.key!,
    name: body.name || "",
    position: body.position || "",
    previousWork: body.previousWork || "",
    avatarUrl: body.avatarUrl || "",
    linkedin: body.linkedin || "",
    order: body.order || 0,
    published: body.published !== false,
    createdAt: now,
    updatedAt: now,
  };
  await set(newRef, expert);
  return NextResponse.json(expert, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const role = getRoleFromHeader(req);
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const expertRef = ref(db, `expert/${id}`);
  const snapshot = await get(expertRef);
  if (!snapshot.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await update(expertRef, { ...data, updatedAt: new Date().toISOString() });
  const updated = await get(expertRef);
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

  const expertRef = ref(db, `expert/${id}`);
  const snapshot = await get(expertRef);
  if (!snapshot.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await remove(expertRef);
  return NextResponse.json({ success: true });
}

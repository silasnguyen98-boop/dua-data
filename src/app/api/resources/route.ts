import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, push, update, remove } from "firebase/database";

export const dynamic = "force-dynamic";

type UserRole = "system_admin" | "content_manager" | "sales_executive" | "teaching_assistant";

// Allowed roles for resources CRUD
const ALLOWED_ROLES: UserRole[] = ["system_admin", "content_manager"];

function getRoleFromHeader(req: NextRequest): UserRole | null {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  try {
    const decoded = Buffer.from(auth.slice(7), "base64").toString("utf-8");
    const parts = decoded.split(":");
    // Support both "username:role" format and plain "role" string
    return (parts[1] || parts[0]) as UserRole;
  } catch {
    return null;
  }
}

export interface Resource {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

async function readResources(): Promise<Resource[]> {
  const snapshot = await get(ref(db, "resource"));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data).map(([key, val]: [string, any]) => ({
    ...val,
    id: key,
  }));
}

export async function GET() {
  const resources = await readResources();
  return NextResponse.json(resources);
}

export async function POST(req: NextRequest) {
  const role = getRoleFromHeader(req);
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await req.json();
  const newRef = push(ref(db, "resource"));
  const now = new Date().toISOString();
  const resource: Resource = {
    id: newRef.key!,
    title: body.title || "",
    slug: body.slug || "",
    summary: body.summary || "",
    content: body.content || "",
    category: body.category || "General",
    imageUrl: body.imageUrl || "",
    author: body.author || "Dứa Data",
    published: body.published !== false,
    createdAt: now,
    updatedAt: now,
  };
  await set(newRef, resource);
  return NextResponse.json(resource, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const role = getRoleFromHeader(req);
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const resRef = ref(db, `resource/${id}`);
  const snapshot = await get(resRef);
  if (!snapshot.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await update(resRef, { ...data, updatedAt: new Date().toISOString() });
  const updated = await get(resRef);
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

  const resRef = ref(db, `resource/${id}`);
  const snapshot = await get(resRef);
  if (!snapshot.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await remove(resRef);
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getDatabase, ref, get, push, set, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import { Alumni } from "@/types/alumni";

async function getAlumni(): Promise<Alumni[]> {
  const snapshot = await get(ref(db, "alumni"));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data).map(([key, val]) => ({ ...(val as object), id: key })) as Alumni[];
}

export async function GET() {
  try {
    const alumni = await getAlumni();
    return NextResponse.json(alumni);
  } catch (err) {
    console.error("GET /api/alumni error:", err);
    return NextResponse.json({ error: "Failed to fetch alumni" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, createdAt, updatedAt, ...rest } = body;
    const now = new Date().toISOString();
    const newRef = push(ref(db, "alumni"));
    const alumni = { ...rest, id: newRef.key!, createdAt: now, updatedAt: now };
    await set(newRef, alumni);
    return NextResponse.json(alumni, { status: 201 });
  } catch (err) {
    console.error("POST /api/alumni error:", err);
    return NextResponse.json({ error: "Failed to create alumni" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, createdAt, updatedAt, ...rest } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const now = new Date().toISOString();
    await update(ref(db, `alumni/${id}`), { ...rest, updatedAt: now });

    const snapshot = await get(ref(db, `alumni/${id}`));
    const updated = { ...snapshot.val(), id };
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/alumni error:", err);
    return NextResponse.json({ error: "Failed to update alumni" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await remove(ref(db, `alumni/${id}`));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/alumni error:", err);
    return NextResponse.json({ error: "Failed to delete alumni" }, { status: 500 });
  }
}
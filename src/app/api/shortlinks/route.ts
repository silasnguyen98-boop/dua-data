import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, remove, push } from "firebase/database";

export async function GET() {
  try {
    const snapshot = await get(ref(db, "shortlink"));
    if (!snapshot.exists()) return NextResponse.json([]);
    const data = snapshot.val();
    const list = Object.entries(data).map(([id, v]: [string, any]) => ({ id, ...v }));
    list.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return NextResponse.json(list);
  } catch {
    return NextResponse.json([]);
  }
}

function generateCode(existing: Set<string>): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  do {
    code = "";
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existing.has(code));
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, title } = body;
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    // Get existing codes
    const snapshot = await get(ref(db, "shortlink"));
    const existingCodes = new Set<string>();
    if (snapshot.exists()) {
      Object.values(snapshot.val()).forEach((v: any) => {
        if (v.code) existingCodes.add(v.code);
      });
    }

    const code = generateCode(existingCodes);
    const newRef = push(ref(db, "shortlink"));
    const shortlink = {
      url,
      title: title || url,
      code,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };
    await set(newRef, shortlink);
    return NextResponse.json({ id: newRef.key, ...shortlink });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await remove(ref(db, `shortlink/${id}`));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

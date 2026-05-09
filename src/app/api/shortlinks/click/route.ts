import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

    const snapshot = await get(ref(db, "shortlink"));
    if (!snapshot.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = snapshot.val();
    for (const [id, v] of Object.entries(data) as [string, any][]) {
      if (v.code === code) {
        // Best-effort click tracking: redirect must still work even if DB write is blocked.
        try {
          await update(ref(db, `shortlink/${id}`), { clicks: (v.clicks || 0) + 1 });
        } catch {
          // Ignore write failures so the redirect still succeeds.
        }
        return NextResponse.json({ url: normalizeUrl(String(v.url || "")) });
      }
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

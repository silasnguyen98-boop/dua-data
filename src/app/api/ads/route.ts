import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, push, update, remove } from "firebase/database";

export const dynamic = "force-dynamic";

export interface Ad {
  id?: string;
  imageUrl: string;
  link: string;
  startDate: string;
  endDate: string;
  enabled: boolean;
  createdAt?: string;
}

async function readAds(): Promise<Ad[]> {
  const snapshot = await get(ref(db, "ads"));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data).map(([key, val]: [string, any]) => ({
    ...val,
    id: key,
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const activeOnly = searchParams.get("active") === "true";

  if (id) {
    const snapshot = await get(ref(db, `ads/${id}`));
    if (!snapshot.exists()) return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    return NextResponse.json({ id, ...snapshot.val() });
  }

  const ads = await readAds();

  if (activeOnly) {
    const now = new Date().toISOString();
    const active = ads.filter(a => a.enabled && a.startDate <= now && a.endDate >= now);
    return NextResponse.json(active);
  }

  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newRef = push(ref(db, "ads"));
  const ad: Ad = {
    imageUrl: body.imageUrl || "",
    link: body.link || "",
    startDate: body.startDate || "",
    endDate: body.endDate || "",
    enabled: body.enabled !== undefined ? body.enabled : true,
    createdAt: new Date().toISOString(),
  };
  await set(newRef, ad);
  return NextResponse.json({ id: newRef.key, ...ad }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const adRef = ref(db, `ads/${id}`);
  const snapshot = await get(adRef);
  if (!snapshot.exists()) return NextResponse.json({ error: "Ad not found" }, { status: 404 });

  await update(adRef, data);
  const updated = await get(adRef);
  return NextResponse.json({ id, ...updated.val() });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const adRef = ref(db, `ads/${id}`);
  const snapshot = await get(adRef);
  if (!snapshot.exists()) return NextResponse.json({ error: "Ad not found" }, { status: 404 });

  await remove(adRef);
  return NextResponse.json({ success: true });
}

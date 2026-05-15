import { NextRequest, NextResponse } from "next/server";
// Firebase-backed ads are disabled for now to avoid Firebase connection spikes.
// import { db } from "@/lib/firebase";
// import { ref, get, set, push, update, remove } from "firebase/database";

export const dynamic = "force-dynamic";
const ADS_READ_TIMEOUT_MS = 2000;

export interface Ad {
  id?: string;
  imageUrl: string;
  link: string;
  startDate: string;
  endDate: string;
  enabled: boolean;
  type: "floating" | "top_banner";
  createdAt?: string;
  updatedAt?: string;
}

async function readAds(): Promise<Ad[]> {
  return [];

  // const snapshot = await get(ref(db, "ads"));
  // if (!snapshot.exists()) return [];
  // const data = snapshot.val();
  // return Object.entries(data).map(([key, val]: [string, any]) => ({
  //   ...val,
  //   id: key,
  // }));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), timeoutMs);
    promise
      .then((value) => resolve(value))
      .catch(() => resolve(fallback))
      .finally(() => clearTimeout(timer));
  });
}

function parseAdTime(value?: string) {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : 0;
}

function isActiveAd(ad: Ad, now: number) {
  const start = parseAdTime(ad.startDate);
  const end = parseAdTime(ad.endDate);
  return ad.enabled && start <= now && end >= now;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const activeOnly = searchParams.get("active") === "true";
  const type = searchParams.get("type");

  if (id) {
    return NextResponse.json({ error: "Firebase ads disabled" }, { status: 404 });

    // const snapshot = await withTimeout(get(ref(db, `ads/${id}`)), ADS_READ_TIMEOUT_MS, null);
    // if (!snapshot || !snapshot.exists()) return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    // return NextResponse.json({ id, ...snapshot.val() });
  }

  let ads = await withTimeout(readAds(), ADS_READ_TIMEOUT_MS, []);

  if (type) {
    ads = ads.filter(a => a.type === type);
  }

  if (activeOnly) {
    const now = Date.now();
    ads = ads.filter(a => isActiveAd(a, now));
  }

  ads = ads.sort((a, b) => parseAdTime(b.createdAt) - parseAdTime(a.createdAt));

  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: "Firebase ads disabled" }, { status: 503 });

  // const body = await req.json();
  // const newRef = push(ref(db, "ads"));
  // const ad: Ad = {
  //   imageUrl: body.imageUrl || "",
  //   link: body.link || "",
  //   startDate: body.startDate || "",
  //   endDate: body.endDate || "",
  //   enabled: body.enabled !== undefined ? body.enabled : true,
  //   type: body.type || "floating",
  //   createdAt: new Date().toISOString(),
  //   updatedAt: new Date().toISOString(),
  // };
  // await set(newRef, ad);
  // return NextResponse.json({ id: newRef.key, ...ad }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  return NextResponse.json({ error: "Firebase ads disabled" }, { status: 503 });

  // const body = await req.json();
  // const { id, ...data } = body;
  // if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  //
  // const adRef = ref(db, `ads/${id}`);
  // const snapshot = await get(adRef);
  // if (!snapshot.exists()) return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  //
  // await update(adRef, { ...data, updatedAt: new Date().toISOString() });
  // const updated = await get(adRef);
  // return NextResponse.json({ id, ...updated.val() });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ error: "Firebase ads disabled" }, { status: 503 });

  // const { searchParams } = new URL(req.url);
  // const id = searchParams.get("id");
  // if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  //
  // const adRef = ref(db, `ads/${id}`);
  // const snapshot = await get(adRef);
  // if (!snapshot.exists()) return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  //
  // await remove(adRef);
  // return NextResponse.json({ success: true });
}

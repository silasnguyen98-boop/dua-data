import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function resolveShortlink(code: string) {
  const snapshot = await get(ref(db, "shortlink"));
  if (!snapshot.exists()) return null;

  const data = snapshot.val();
  for (const [id, value] of Object.entries(data) as [string, any][]) {
    if (value.code === code) {
      const url = typeof value.url === "string" ? normalizeUrl(value.url) : "";
      try {
        await update(ref(db, `shortlink/${id}`), { clicks: (Number(value.clicks) || 0) + 1 });
      } catch {
        // Keep redirect working even if click tracking is blocked by rules.
      }
      return url || null;
    }
  }

  return null;
}

export default async function ShortlinkRedirect({
  params,
}: {
  params: { code: string };
}) {
  const { code } = params;
  if (!code) notFound();

  const url = await resolveShortlink(code);
  if (!url) notFound();

  redirect(url);
}

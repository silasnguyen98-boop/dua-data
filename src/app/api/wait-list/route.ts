import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, push, set, update, remove } from "firebase/database";
import { WaitListEntry } from "@/types/course";
import { isAppCheckEnforced, requireAppCheck } from "@/lib/app-check-server";

export const dynamic = "force-dynamic";

const MIN_FORM_AGE_MS = Number(process.env.WAITLIST_MIN_FORM_AGE_MS || 2500);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

// GET all wait-list entries across all courses
// Query params: ?courseId=xxx to filter by course
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");

  if (courseId) {
    // Get wait_list for specific course
    const snapshot = await get(ref(db, `courses/${courseId}/waitList`));
    if (!snapshot.exists()) return NextResponse.json([]);
    const data = snapshot.val();
    const entries: WaitListEntry[] = Object.entries(data).map(([key, val]: [string, any]) => ({
      ...val,
      id: key,
    }));
    return NextResponse.json(entries);
  }

  // Get all wait_lists across all courses
  const snapshot = await get(ref(db, "courses"));
  if (!snapshot.exists()) return NextResponse.json([]);

  const data = snapshot.val();
  const allEntries: (WaitListEntry & { courseId: string; courseTitle: string })[] = [];

  for (const [courseId, course] of Object.entries(data) as [string, any][]) {
    if (course.waitList) {
      for (const [entryId, entry] of Object.entries(course.waitList) as [string, any][]) {
        allEntries.push({
          ...entry,
          id: entryId,
          courseId,
          courseTitle: course.title || "Không tên",
        });
      }
    }
  }

  // Sort by registeredAt descending
  allEntries.sort((a, b) =>
    new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
  );

  return NextResponse.json(allEntries);
}

// POST: Register for wait-list
export async function POST(req: NextRequest) {
  const appCheck = await requireAppCheck(req);
  if (isAppCheckEnforced() && !appCheck) {
    return NextResponse.json({ error: "Invalid captcha token" }, { status: 401 });
  }

  const body = await req.json();
  const { courseId, name, phone, email, honeypot, formStartedAt } = body;

  if (!courseId || !name || !phone) {
    return NextResponse.json({ error: "Missing required fields: courseId, name, phone" }, { status: 400 });
  }

  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  if (typeof formStartedAt === "number" && Date.now() - formStartedAt < MIN_FORM_AGE_MS) {
    return NextResponse.json({ error: "Please wait a moment and try again" }, { status: 429 });
  }

  // Check course exists and is comingSoon
  const courseRef = ref(db, `courses/${courseId}`);
  const courseSnap = await get(courseRef);
  if (!courseSnap.exists()) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const course = courseSnap.val();
  if (!course.comingSoon) {
    return NextResponse.json({ error: "Course is not in coming-soon state" }, { status: 400 });
  }

  const waitListRef = ref(db, `courses/${courseId}/waitList`);
  const waitListSnap = await get(waitListRef);
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email || "");

  if (waitListSnap.exists()) {
    const existing = waitListSnap.val();
    for (const entry of Object.values(existing) as any[]) {
      const existingPhone = normalizePhone(entry.phone || "");
      const existingEmail = normalizeEmail(entry.email || "");
      const samePhone = existingPhone && existingPhone === normalizedPhone;
      const sameEmail = existingEmail && normalizedEmail && existingEmail === normalizedEmail;

      if (samePhone || sameEmail) {
        return NextResponse.json({ error: "You already joined this waitlist" }, { status: 409 });
      }
    }
  }

  // Add to wait_list
  const newRef = push(waitListRef);
  const entry: Omit<WaitListEntry, "id"> = {
    name: name.trim(),
    phone: phone.trim(),
    email: email?.trim() || "",
    registeredAt: new Date().toISOString(),
    status: "pending",
  };

  await set(newRef, entry);

  return NextResponse.json({ id: newRef.key, ...entry }, { status: 201 });
}

// PATCH: Update wait-list entry status
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { courseId, entryId, status, name, phone, email } = body;

  if (!courseId || !entryId) {
    return NextResponse.json({ error: "Missing courseId or entryId" }, { status: 400 });
  }

  const entryRef = ref(db, `courses/${courseId}/waitList/${entryId}`);
  const snap = await get(entryRef);
  if (!snap.exists()) {
    return NextResponse.json({ error: "Wait-list entry not found" }, { status: 404 });
  }

  const updates: Partial<WaitListEntry> = {};
  if (status) updates.status = status;
  if (name !== undefined) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (email !== undefined) updates.email = email.trim();

  await update(entryRef, updates);
  const updated = await get(entryRef);

  return NextResponse.json({ id: entryId, ...updated.val() });
}

// DELETE: Remove wait-list entry
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const entryId = searchParams.get("entryId");

  if (!courseId || !entryId) {
    return NextResponse.json({ error: "Missing courseId or entryId" }, { status: 400 });
  }

  const entryRef = ref(db, `courses/${courseId}/waitList/${entryId}`);
  const snap = await get(entryRef);
  if (!snap.exists()) {
    return NextResponse.json({ error: "Wait-list entry not found" }, { status: 404 });
  }

  await remove(entryRef);
  return NextResponse.json({ success: true });
}

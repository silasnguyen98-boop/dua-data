import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, push, update, remove } from "firebase/database";

export const dynamic = "force-dynamic";

export interface Job {
  id: string;
  title: string;
  company: string;
  summary: string;
  content: string;
  imageUrl: string;
  workType: string; // Full-time, Part-time, Internship, Freelance
  location: string;
  position: string;
  applicationLink: string;
  applicationDeadline: string; // ISO date
  salary: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

async function readJobs(): Promise<Job[]> {
  const snapshot = await get(ref(db, "Job"));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data).map(([key, val]: [string, any]) => ({
    ...val,
    id: key,
  }));
}

export async function GET() {
  const jobs = await readJobs();
  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newRef = push(ref(db, "Job"));
  const now = new Date().toISOString();
  const job: Job = {
    id: newRef.key!,
    title: body.title || "",
    company: body.company || "",
    summary: body.summary || "",
    content: body.content || "",
    imageUrl: body.imageUrl || "",
    workType: body.workType || "Full-time",
    location: body.location || "",
    position: body.position || "",
    applicationLink: body.applicationLink || "",
    applicationDeadline: body.applicationDeadline || "",
    salary: body.salary || "",
    author: body.author || "Dứa Data",
    published: body.published !== false,
    createdAt: now,
    updatedAt: now,
  };
  await set(newRef, job);
  return NextResponse.json(job, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const jobRef = ref(db, `Job/${id}`);
  const snapshot = await get(jobRef);
  if (!snapshot.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await update(jobRef, { ...data, updatedAt: new Date().toISOString() });
  const updated = await get(jobRef);
  return NextResponse.json({ id, ...updated.val() });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const jobRef = ref(db, `Job/${id}`);
  const snapshot = await get(jobRef);
  if (!snapshot.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await remove(jobRef);
  return NextResponse.json({ success: true });
}

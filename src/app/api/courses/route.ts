import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, push, update, remove } from "firebase/database";
import { Course } from "@/types/course";

export const dynamic = "force-dynamic";

async function readCourses(): Promise<Course[]> {
  const snapshot = await get(ref(db, "courses"));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data).map(([key, val]: [string, any]) => ({
    ...val,
    id: key,
  }));
}

export async function GET() {
  const courses = await readCourses();
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newRef = push(ref(db, "courses"));
  const newCourse: Course = {
    id: newRef.key!,
    slug: body.slug || "",
    title: body.title || "",
    shortDescription: body.shortDescription || "",
    description: body.description || "",
    image: body.image || "",
    imageUrl: body.imageUrl || "",
    instructor: body.instructor || "Đội Ngũ DUA Edu",
    price: Number(body.price) || 0,
    originalPrice: Number(body.originalPrice) || 0,
    discount: Number(body.discount) || 0,
    totalLessons: Number(body.totalLessons) || 0,
    students: Number(body.students) || 0,
    rating: Number(body.rating) || 0,
    reviews: Number(body.reviews) || 0,
    startDate: body.startDate || "",
    endDate: body.endDate || "",
    registrationDeadline: body.registrationDeadline || "",
    schedule: body.schedule || "",
    hours: body.hours || "",
    category: body.category || "",
    curriculum: body.curriculum || [],
    outcomes: body.outcomes || [],
    targetAudience: body.targetAudience || [],
    published: body.published !== undefined ? body.published : false,
    comingSoon: body.comingSoon || false,
    isHidden: body.isHidden || false,
  };

  await set(newRef, newCourse);
  return NextResponse.json(newCourse, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const courseRef = ref(db, `courses/${id}`);
  const snapshot = await get(courseRef);
  if (!snapshot.exists()) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  await update(courseRef, data);
  const updated = await get(courseRef);
  return NextResponse.json({ id, ...updated.val() });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const courseRef = ref(db, `courses/${id}`);
  const snapshot = await get(courseRef);
  if (!snapshot.exists()) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  await remove(courseRef);
  return NextResponse.json({ success: true });
}

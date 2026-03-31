import { NextRequest, NextResponse } from "next/server";
import { rtdb } from "@/lib/firebase";
import { ref, get, push, set, update } from "firebase/database";

const COURSES_REF = "courses";
const STUDENTS_REF = "students";

export async function GET() {
  const snapshot = await get(ref(rtdb, STUDENTS_REF));
  if (!snapshot.exists()) return NextResponse.json([]);

  const data = snapshot.val();
  const students = Object.entries(data).map(([key, val]: [string, any]) => ({
    id: key,
    ...val,
  }));

  students.sort((a, b) => (b.registeredAt || "").localeCompare(a.registeredAt || ""));
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId, fullName, facebook, birthday, phone, email, referralCode, expectations } = body;

    if (!fullName || !facebook || !birthday || !phone || !email) {
      return NextResponse.json({ error: "Vui long dien day du thong tin bat buoc" }, { status: 400 });
    }

    // Get course name and increment student count
    let courseName = "";
    if (courseId) {
      const courseSnap = await get(ref(rtdb, `${COURSES_REF}/${courseId}`));
      if (courseSnap.exists()) {
        const courseData = courseSnap.val();
        courseName = courseData.title || "";
        await update(ref(rtdb, `${COURSES_REF}/${courseId}`), {
          students: (courseData.students || 0) + 1,
        });
      }
    }

    // Save student
    const newStudent = {
      fullName,
      facebook,
      birthday,
      phone,
      email,
      referralCode: referralCode || "",
      expectations: expectations || "",
      courseId: courseId || "",
      courseName,
      registeredAt: new Date().toISOString(),
    };

    const newRef = push(ref(rtdb, STUDENTS_REF));
    await set(newRef, newStudent);

    return NextResponse.json({
      success: true,
      message: `Chuc mung ban da dang ky thanh cong khoa hoc ${courseName}!`,
      courseName,
      id: newRef.key,
    });
  } catch (err) {
    return NextResponse.json({ error: "Dang ky that bai" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, push, set, get } from "firebase/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await get(ref(db, "lead-resource"));
    if (!snapshot.exists()) return NextResponse.json([]);
    const data = snapshot.val();
    const leads = Object.entries(data).map(([key, val]: [string, any]) => ({
      ...val,
      id: key,
    }));
    return NextResponse.json(leads);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, role, resourceType } = body;

    if (!fullName || !email || !role || !resourceType) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin" },
        { status: 400 }
      );
    }

    const newRef = push(ref(db, "lead-resource"));
    await set(newRef, {
      id: newRef.key,
      fullName,
      email,
      role,
      resourceType,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Đã ghi nhận thông tin" });
  } catch {
    return NextResponse.json(
      { error: "Gửi thất bại, vui lòng thử lại" },
      { status: 500 }
    );
  }
}

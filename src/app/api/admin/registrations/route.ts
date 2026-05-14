import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing ID or status" }, { status: 400 });
    }

    const { rowCount } = await query(
      "UPDATE course_registrations SET status = $1, updated_at = NOW() WHERE id = $2",
      [status, id]
    );

    if (rowCount === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/admin/registrations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

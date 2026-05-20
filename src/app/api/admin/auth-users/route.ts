import { NextResponse } from "next/server";
import { listAuthUsers } from "@/lib/auth-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await listAuthUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching auth users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

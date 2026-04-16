import { NextRequest, NextResponse } from "next/server";
import { rtdb } from "@/lib/firebase";
import { ref, get } from "firebase/database";

// POST: Verify credentials and return role + a simple session token
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const snapshot = await get(ref(rtdb, "users/_system"));
    if (!snapshot.exists()) {
      return NextResponse.json({ error: "No users found" }, { status: 401 });
    }

    const users = snapshot.val();
    const matchedUser = Object.values(users).find(
      (u: any) => u.username === username && u.password === password
    ) as { id: string; role: string; name: string; username: string } | undefined;

    if (!matchedUser) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Simple token: base64 of id:role
    const token = Buffer.from(`${matchedUser.id}:${matchedUser.role}:${matchedUser.name}:${matchedUser.username}`).toString("base64");

    return NextResponse.json({
      token,
      role: matchedUser.role,
      name: matchedUser.name,
      username: matchedUser.username,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

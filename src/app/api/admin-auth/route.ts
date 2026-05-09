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

    const users = snapshot.val() as Record<string, any>;
    const matchedEntry = Object.entries(users).find(
      ([, user]) => user.username === username && user.password === password
    );

    if (!matchedEntry) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const [id, matchedUser] = matchedEntry;

    // Simple token: base64 of id:role
    const token = Buffer.from(`${id}:${matchedUser.role}:${matchedUser.name}:${matchedUser.username}`).toString("base64");

    return NextResponse.json({
      id,
      token,
      role: matchedUser.role,
      name: matchedUser.name,
      username: matchedUser.username,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

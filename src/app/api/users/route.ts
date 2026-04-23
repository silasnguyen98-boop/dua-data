import { NextRequest, NextResponse } from "next/server";
import { rtdb } from "@/lib/firebase";
import { ref, get, set, push, update, remove } from "firebase/database";

const USERS_REF = "users/_system";

type UserRole = "system_admin" | "content_manager" | "sales_executive" | "teaching_assistant" | "teacher";
const ALLOWED_ROLES: UserRole[] = ["system_admin"];

function getRoleFromHeader(req: NextRequest): UserRole | null {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  try {
    const decoded = Buffer.from(auth.slice(7), "base64").toString("utf-8");
    return (decoded.split(":")[1] || decoded) as UserRole;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await get(ref(rtdb, USERS_REF));
    if (!snapshot.exists()) return NextResponse.json([]);
    const data = snapshot.val();
    const users = Object.entries(data).map(([key, val]: [string, any]) => ({
      id: key,
      ...val,
      // Never send password back
      password: undefined,
    }));
    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const role = getRoleFromHeader(req);
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { username, password, role, name } = body;

    if (!username || !password || !role || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for duplicate username
    const snapshot = await get(ref(rtdb, USERS_REF));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const duplicate = Object.values(data).find((u: any) => u.username === username);
      if (duplicate) {
        return NextResponse.json({ error: "Username already exists" }, { status: 409 });
      }
    }

    const newRef = push(ref(rtdb, USERS_REF));
    const user = {
      username,
      password, // In production, hash this
      role,
      name,
      createdAt: new Date().toISOString(),
    };
    await set(newRef, user);

    return NextResponse.json({ id: newRef.key, ...user, password: undefined }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const role = getRoleFromHeader(req);
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id, username, password, role, name } = body;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updateData: Record<string, any> = {};
    if (username !== undefined) updateData.username = username;
    if (role !== undefined) updateData.role = role;
    if (name !== undefined) updateData.name = name;
    if (password !== undefined && password !== "") updateData.password = password;

    await update(ref(rtdb, `${USERS_REF}/${id}`), updateData);
    const updated = await get(ref(rtdb, `${USERS_REF}/${id}`));
    const val = updated.val();
    if (val) val.password = undefined;
    return NextResponse.json({ id, ...val });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const role = getRoleFromHeader(req);
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await remove(ref(rtdb, `${USERS_REF}/${id}`));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

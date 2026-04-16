import { NextResponse } from "next/server";
import { rtdb } from "@/lib/firebase";
import { ref, get, set } from "firebase/database";

export const dynamic = "force-dynamic";

// Seed the system admin user if not exists
// This endpoint should be called once during setup.
export async function POST() {
  try {
    const USERS_REF = "users/_system";
    const ADMIN_KEY = "system_admin";

    const snapshot = await get(ref(rtdb, USERS_REF));
    let alreadyExists = false;

    if (snapshot.exists()) {
      const users = snapshot.val() as Record<string, any>;
      alreadyExists = users[ADMIN_KEY]?.username === "duadata";
    }

    if (alreadyExists) {
      return NextResponse.json({ message: "User already exists", created: false });
    }

    await set(ref(rtdb, `${USERS_REF}/${ADMIN_KEY}`), {
      username: "duadata",
      password: "dua1234data@",
      role: "system_admin",
      name: "Quản trị viên",
      createdAt: new Date().toISOString(),
    });

    // Also seed demo users
    await set(ref(rtdb, `${USERS_REF}/content_manager_demo`), {
      username: "content",
      password: "content123",
      role: "content_manager",
      name: "Người quản lý nội dung",
      createdAt: new Date().toISOString(),
    });

    await set(ref(rtdb, `${USERS_REF}/sales_demo`), {
      username: "sales",
      password: "sales123",
      role: "sales_executive",
      name: "Nhân viên kinh doanh",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: "System admin seeded", created: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

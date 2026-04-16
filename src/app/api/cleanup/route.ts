import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, remove } from "firebase/database";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "clean_shortlinks_zero_views") {
      const snapshot = await get(ref(db, "shortlink"));
      if (!snapshot.exists()) {
        return NextResponse.json({ deleted: 0, message: "No shortlinks found" });
      }
      const data = snapshot.val();
      const toDelete: string[] = [];
      for (const [id, val] of Object.entries(data) as [string, any][]) {
        const clicks = val.clicks ?? 0;
        if (clicks === 0) {
          toDelete.push(id);
        }
      }
      let deleted = 0;
      for (const id of toDelete) {
        await remove(ref(db, `shortlink/${id}`));
        deleted++;
      }
      return NextResponse.json({ deleted, total: Object.keys(data).length, message: `Deleted ${deleted} shortlinks with 0 views` });
    }

    if (action === "clean_test_emails") {
      const TEST_EMAIL = "sample@email.tst";

      // Clean lead-resource
      const leadsSnap = await get(ref(db, "lead-resource"));
      let leadsDeleted = 0;
      if (leadsSnap.exists()) {
        const leads = leadsSnap.val();
        for (const [id, val] of Object.entries(leads) as [string, any][]) {
          if (val.email?.toLowerCase() === TEST_EMAIL) {
            await remove(ref(db, `lead-resource/${id}`));
            leadsDeleted++;
          }
        }
      }

      // Clean register
      const registerSnap = await get(ref(db, "register"));
      let registerDeleted = 0;
      if (registerSnap.exists()) {
        const reg = registerSnap.val();
        for (const [id, val] of Object.entries(reg) as [string, any][]) {
          if (val.email?.toLowerCase() === TEST_EMAIL) {
            await remove(ref(db, `register/${id}`));
            registerDeleted++;
          }
        }
      }

      return NextResponse.json({
        leadsDeleted,
        registerDeleted,
        totalDeleted: leadsDeleted + registerDeleted,
        email: TEST_EMAIL,
        message: `Deleted ${leadsDeleted} leads + ${registerDeleted} registrations with ${TEST_EMAIL}`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

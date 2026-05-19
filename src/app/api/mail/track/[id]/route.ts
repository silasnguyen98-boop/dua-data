
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// 1x1 transparent GIF
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const logId = params.id;

  if (logId && logId !== "test") {
    try {
      // Update opened_at and increment open_count
      await query(
        `UPDATE mail_logs 
         SET opened_at = COALESCE(opened_at, now()), 
             open_count = open_count + 1 
         WHERE id = $1`,
        [logId]
      );
    } catch (err) {
      console.error("Tracking error:", err);
    }
  }

  return new NextResponse(TRACKING_PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

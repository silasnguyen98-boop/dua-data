import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

import { query } from "@/lib/db";
import { normalizeExpertRows } from "@/lib/expert-data";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { rows } = await query(
      "SELECT id, name, position, previous_work, avatar_url, linkedin, display_order, published, expert_group, created_at, updated_at FROM experts ORDER BY expert_group ASC NULLS FIRST, display_order ASC, name ASC"
    );

    const experts = normalizeExpertRows((rows || []) as Record<string, unknown>[]);
    const dataDir = path.join(process.cwd(), "src/data");
    const filePath = path.join(dataDir, "experts.json");

    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(experts, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      count: experts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Expert sync error:", error);
    return NextResponse.json({ error: "Failed to sync experts" }, { status: 500 });
  }
}

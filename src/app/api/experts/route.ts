import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { buildExpertPayload, normalizeExpertRow, normalizeExpertRows } from "@/lib/expert-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows } = await query(
      "SELECT id, name, position, previous_work, avatar_url, linkedin, display_order, published FROM experts"
    );

    const experts = normalizeExpertRows(rows as Record<string, unknown>[]).sort(
      (a, b) => (a.order || 0) - (b.order || 0),
    );
    return NextResponse.json(experts, {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    console.error("Error fetching experts:", error);
    return NextResponse.json({ error: "Failed to fetch experts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = buildExpertPayload(body);
    const columns = Object.keys(payload);
    const values = Object.values(payload);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

    const { rows } = await query(
      `INSERT INTO experts (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    const data = rows[0];
    return NextResponse.json(normalizeExpertRow(data as Record<string, unknown>), { status: 201 });
  } catch (error) {
    console.error("Error creating expert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { rows: existingRows } = await query("SELECT * FROM experts WHERE id = $1", [id]);
    const existingRow = existingRows[0];

    if (!existingRow) {
      return NextResponse.json({ error: "Expert not found" }, { status: 404 });
    }

    const payload = {
      ...buildExpertPayload({ ...existingRow, ...data }, false),
      updated_at: new Date().toISOString(),
    };

    const columns = Object.keys(payload);
    const values = Object.values(payload);
    const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(", ");

    const { rows: updatedRows } = await query(
      `UPDATE experts SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    const updated = updatedRows[0];
    if (!updated) {
      return NextResponse.json({ error: "Expert not found after update" }, { status: 404 });
    }

    return NextResponse.json(normalizeExpertRow(updated as Record<string, unknown>));
  } catch (error) {
    console.error("Error updating expert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await query("DELETE FROM experts WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

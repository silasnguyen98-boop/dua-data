import { NextRequest, NextResponse } from "next/server";
import { createAdminWriteClient } from "@/lib/supabase-server";
import { buildExpertPayload, normalizeExpertRow, normalizeExpertRows } from "@/lib/expert-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminWriteClient();
    const { data, error } = await supabase
      .from("experts")
      .select('id, name, position, previous_work, avatar_url, linkedin, "order", published');

    if (error) {
      console.error("Error fetching experts:", error);
      return NextResponse.json({ error: error.message || "Failed to fetch experts" }, { status: 500 });
    }

    const experts = normalizeExpertRows((data || []) as Record<string, unknown>[]).sort(
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
    const supabase = createAdminWriteClient();
    const body = await req.json();
    const payload = buildExpertPayload(body);

    const { data, error } = await supabase
      .from("experts")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("Error creating expert:", error);
      return NextResponse.json({ error: error.message || "Failed to create expert" }, { status: 500 });
    }

    return NextResponse.json(normalizeExpertRow(data as Record<string, unknown>), { status: 201 });
  } catch (error) {
    console.error("Error creating expert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createAdminWriteClient();
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { data: existingRow, error: existingError } = await supabase
      .from("experts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error("Error loading expert before update:", existingError);
      return NextResponse.json({ error: existingError.message || "Failed to load expert" }, { status: 500 });
    }

    if (!existingRow) {
      return NextResponse.json({ error: "Expert not found" }, { status: 404 });
    }

    const payload = {
      ...buildExpertPayload({ ...existingRow, ...data }, false),
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRows, error } = await supabase
      .from("experts")
      .update(payload)
      .eq("id", id)
      .select("*");

    if (error) {
      console.error("Error updating expert:", error);
      return NextResponse.json({ error: error.message || "Failed to update expert" }, { status: 500 });
    }

    const updated = Array.isArray(updatedRows) ? updatedRows[0] : null;
    if (!updated) {
      const { data: fallbackRow, error: fallbackError } = await supabase
        .from("experts")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (fallbackError) {
        console.error("Error reloading updated expert:", fallbackError);
        return NextResponse.json({ error: fallbackError.message || "Failed to load updated expert" }, { status: 500 });
      }

      if (!fallbackRow) {
        return NextResponse.json({ error: "Expert not found after update" }, { status: 404 });
      }

      return NextResponse.json(normalizeExpertRow(fallbackRow as Record<string, unknown>));
    }

    return NextResponse.json(normalizeExpertRow(updated as Record<string, unknown>));
  } catch (error) {
    console.error("Error updating expert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createAdminWriteClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { error } = await supabase.from("experts").delete().eq("id", id);

    if (error) {
      console.error("Error deleting expert:", error);
      return NextResponse.json({ error: error.message || "Failed to delete expert" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

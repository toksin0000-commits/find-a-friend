import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

function verifyAdmin(req: Request) {
  const token = req.headers.get("x-admin-token");
  return token && token === process.env.ADMIN_SECRET;
}

// GET – načíst všechny blokace
export async function GET(req: Request) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("blocks")
      .select("id, blocker_id, blocked_id, reason, blocked_by_admin, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Chyba při načítání blokací:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ blocks: data || [] });
  } catch (error) {
    console.error("Neočekávaná chyba:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE – smazat blokaci
export async function DELETE(req: Request) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { blockId } = await req.json();

    if (!blockId) {
      return NextResponse.json({ error: "Missing blockId" }, { status: 400 });
    }

    const supabase = supabaseServer();

    // POZOR: id je BIGINT → musí být číslo
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("id", Number(blockId));

    if (error) {
      console.error("Chyba při mazání blokace:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Neočekávaná chyba:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// 🔥 Ověření admina přes admin token
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

    // ⭐ MUST: vytvořit server klienta
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("blocks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Chyba při načítání blokací:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ blocks: data || [] });
  } catch (error) {
    console.error("Neočekávaná chyba:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    // ⭐ MUST: vytvořit server klienta
    const supabase = supabaseServer();

    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("id", blockId);

    if (error) {
      console.error("Chyba při mazání blokace:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Neočekávaná chyba:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

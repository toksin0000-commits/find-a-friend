import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// 🔥 Ověření admina přes admin token
function verifyAdmin(req: Request) {
  const token = req.headers.get("x-admin-token");
  return token === "toksin-admin-secret-983274982374";
}

// ===== BAN =====
export async function POST(req: Request) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, reason } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = supabaseServer();   // 🔥 MUSÍ BÝT TADY

    // 🔥 Zabanovat uživatele
    const { error } = await supabase
      .from("profiles")
      .update({
        banned: true,
        banned_at: new Date().toISOString(),
        banned_reason: reason || "No reason provided",
        banned_by: "admin",
      })
      .eq("anon_id", userId);

    if (error) {
      console.error("Chyba při banování:", error);
      return NextResponse.json({ error: "Failed to ban user" }, { status: 500 });
    }

    // 🔥 Volitelně: smazat aktivní matche
    await supabase
      .from("matches")
      .delete()
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Neočekávaná chyba:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ===== UNBAN =====
export async function DELETE(req: Request) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = supabaseServer();   // 🔥 MUSÍ BÝT TADY

    const { error } = await supabase
      .from("profiles")
      .update({
        banned: false,
        banned_at: null,
        banned_reason: null,
        banned_by: null,
      })
      .eq("anon_id", userId);

    if (error) {
      console.error("Chyba při odbanování:", error);
      return NextResponse.json(
        { error: "Failed to unban user" },
        { status: 500 }
      );
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

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// 🔥 Ověření admina přes admin token
function verifyAdmin(req: Request) {
  const token = req.headers.get("x-admin-token");
  return token === "toksin-admin-secret-983274982374";
}

export async function POST(req: Request) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // ⭐ ZÍSKAT SERVEROVÝ SUPABASE KLIENT
    const supabase = supabaseServer();

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

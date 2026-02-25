import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// 🔥 Ověření admina přes admin token
function verifyAdmin(req: Request) {
  const token = req.headers.get("x-admin-token");
  return token === "toksin-admin-secret-983274982374";

}

// GET - načíst reporty nebo chat
export async function GET(req: Request) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = supabaseServer(); // ⭐ MUST

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chat");

    // Pokud je chatId → načíst chat
    if (chatId) {
      const { data: messages, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (msgError) {
        console.error("Chyba při načítání zpráv:", msgError);
        return NextResponse.json({ messages: [], match: null });
      }

      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("chat_id", chatId)
        .maybeSingle();

      if (matchError) {
        console.error("Chyba při načítání match info:", matchError);
      }

      // Dohledat jména odesílatelů
      const messagesWithSenders = await Promise.all(
        (messages || []).map(async (msg: any) => {

          if (msg.sender_id === "system") {
            return { ...msg, sender: { name: "System" } };
          }

          const { data: sender } = await supabase
            .from("profiles")
            .select("name")
            .eq("anon_id", msg.sender_id)
            .maybeSingle();

          return { ...msg, sender: sender || { name: null } };
        })
      );

      // Dohledat jména pro match
      let matchWithProfiles = null;
      if (match) {
        const [user1, user2] = await Promise.all([
          supabase
            .from("profiles")
            .select("name")
            .eq("anon_id", match.user1_id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("name")
            .eq("anon_id", match.user2_id)
            .maybeSingle(),
        ]);

        matchWithProfiles = {
          ...match,
          user1: user1.data || { name: null },
          user2: user2.data || { name: null },
        };
      }

      return NextResponse.json({
        messages: messagesWithSenders || [],
        match: matchWithProfiles,
      });
    }

    // ===== REPORTY =====
    const { data: reports, error } = await supabase
  .from("reports")
  .select("id, sender_id, reported_id, reason, details, chat_id, created_at")
  .order("created_at", { ascending: false });


    if (error) {
      console.error("Chyba při načítání reportů:", error);
      return NextResponse.json({ reports: [] });
    }

    const reportsWithProfiles = await Promise.all(
      (reports || []).map(async (report: any) => {

        const { data: reporter } = await supabase
          .from("profiles")
          .select("name")
          .eq("anon_id", report.sender_id)
          .maybeSingle();

        const { data: reported } = await supabase
          .from("profiles")
          .select("name")
          .eq("anon_id", report.reported_id)
          .maybeSingle();

        return {
          ...report,
          reporter: reporter || { name: null },
          reported: reported || { name: null },
        };
      })
    );

    return NextResponse.json({ reports: reportsWithProfiles });
  } catch (error) {
    console.error("Neočekávaná chyba v GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - blokovat uživatele
export async function POST(req: Request) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = supabaseServer(); // ⭐ MUST

    const { blockedId, reason } = await req.json();

    if (!blockedId) {
      return NextResponse.json({ error: "Missing blockedId" }, { status: 400 });
    }

    const { error } = await supabase.from("blocks").insert({
      blocker_id: "00000000-0000-0000-0000-000000000000",
      blocked_id: blockedId,
      reason: reason || "Blocked by admin",
      blocked_by_admin: true,
    });

    if (error) {
      console.error("Chyba při blokování:", error);
      return NextResponse.json({ error: "Failed to block" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Neočekávaná chyba v POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - smazat report nebo blokaci
export async function DELETE(req: Request) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = supabaseServer(); // ⭐ MUST

    const { type, id } = await req.json();

    if (!type || !id) {
      return NextResponse.json(
        { error: "Missing type or id" },
        { status: 400 }
      );
    }

    if (type === "report") {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Chyba při mazání reportu:", error);
        return NextResponse.json(
          { error: "Failed to delete report" },
          { status: 500 }
        );
      }
    } else if (type === "block") {
      const { error } = await supabase
        .from("blocks")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Chyba při mazání blokace:", error);
        return NextResponse.json(
          { error: "Failed to delete block" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Neočekávaná chyba v DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

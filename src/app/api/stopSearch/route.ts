import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { anonId } = await req.json();

  console.log("🔥 STOP SEARCH API CALLED with anonId:", anonId);

  if (!anonId) {
    console.log("⚠️ STOP: anonId missing");
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // ⭐ MUST: create server client instance
  const supabase = supabaseServer();

  const { error } = await supabase
    .from("matches")
    .delete()
    .or(
      `and(user1_id.eq.${anonId},user2_id.is.null),and(user2_id.eq.${anonId},user2_id.is.null)`
    );

  if (error) {
    console.error("❌ STOP SEARCH ERROR:", error);
  } else {
    console.log("✅ STOP SEARCH: waiting match deleted for", anonId);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

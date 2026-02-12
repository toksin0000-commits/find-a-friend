// supabase/functions/stopsearch/index.ts

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Pouze POST je povolen" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let body: { anonId?: string; chatId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Neplatný formát JSON" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { anonId, chatId } = body;

  if (!anonId || typeof anonId !== "string" || anonId.trim() === "") {
    console.log("⚠️ STOP SEARCH: chybí nebo neplatný anonId");
    return new Response(
      JSON.stringify({ ok: true, message: "Žádná akce – chybí anonId" }),
      {
        status: 200, // stále 200, aby klient nebyl zmatený
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    console.error("❌ STOP SEARCH: chybí SUPABASE_URL nebo SERVICE_ROLE_KEY");
    return new Response(
      JSON.stringify({ error: "Chyba konfigurace serveru" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(supabaseUrl, serviceKey);

  console.log("🔥 STOP SEARCH voláno pro anonId:", anonId, chatId ? ` (chatId: ${chatId})` : "");

  // Základní query – smažeme waiting záznamy
  let query = supabase
    .from("matches")
    .delete()
    .select("id, chat_id, user1_id, user2_id", { count: "exact" });

  // Volitelný filtr na konkrétní chatId (nejbezpečnější varianta)
  if (chatId && typeof chatId === "string" && chatId.trim() !== "") {
    query = query.eq("chat_id", chatId);
  }

  // Filtr na waiting + daný uživatel
  query = query.or(
    `and(user1_id.eq.${anonId},user2_id.is.null),and(user2_id.eq.${anonId},user1_id.is.null)`
  );

  const { data: deletedRows, error, count } = await query;

  if (error) {
    console.error("❌ STOP SEARCH chyba:", error.message, error.details, error.hint);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Chyba při mazání waiting záznamu",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const deletedCount = count ?? 0;

  if (deletedCount > 0) {
    console.log(
      `✅ STOP SEARCH: smazáno ${deletedCount} waiting záznam(ů) pro ${anonId}`,
      deletedRows?.map(r => r.chat_id).join(", ") || ""
    );

    // Volitelně: broadcast přes realtime, aby klient okamžitě věděl
    // await supabase.channel(`user:${anonId}`).send({
    //   type: "broadcast",
    //   event: "waiting_stopped",
    //   payload: { chatIds: deletedRows?.map(r => r.chat_id) ?? [] }
    // });
  } else {
    console.log(`ℹ️ STOP SEARCH: žádný waiting záznam nenalezen pro ${anonId}`);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      deleted: deletedCount,
      deletedChatIds: deletedRows?.map(r => r.chat_id) ?? [],
      message:
        deletedCount > 0
          ? `Zrušeno ${deletedCount} čekající(ch) hledání`
          : "Žádné aktivní čekající hledání nenalezeno",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
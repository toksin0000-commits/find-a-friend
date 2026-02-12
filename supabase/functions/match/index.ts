// supabase/functions/match/index.ts

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { anonId, chatId } = body;

  if (!anonId) {
    return new Response(JSON.stringify({ error: "Missing anonId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ------------------------------
  // Helper: Haversine distance (km)
  // ------------------------------
  function haversine(
    lat1?: number | null,
    lon1?: number | null,
    lat2?: number | null,
    lon2?: number | null
  ): number {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;

    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ------------------------------
  // Helper: Kompatibilita (vrací ok + distance)
  // ------------------------------
  function isCompatible(
    me: any,
    myPrefs: any,
    them: any,
    theirPrefs: any
  ): { ok: boolean; distanceKm: number } {
    let ok = true;
    let distanceKm = Infinity;

    // Interests (hard match)
    const myInterest = me?.interest?.trim().toLowerCase() ?? null;
    const theirInterest = them?.interest?.trim().toLowerCase() ?? null;
    const myPrefInterest = myPrefs?.preferred_interest?.trim().toLowerCase() ?? null;
    const theirPrefInterest = theirPrefs?.preferred_interest?.trim().toLowerCase() ?? null;

    if (myPrefInterest && theirInterest !== myPrefInterest) ok = false;
    if (theirPrefInterest && myInterest !== theirPrefInterest) ok = false;

    // Gender (mutual)
    const gMe = me?.gender?.trim().toLowerCase() ?? null;
    const gThem = them?.gender?.trim().toLowerCase() ?? null;
    const prefGMe = myPrefs?.preferred_gender?.trim().toLowerCase() ?? null;
    const prefGThem = theirPrefs?.preferred_gender?.trim().toLowerCase() ?? null;

    if (prefGMe && gThem !== prefGMe) ok = false;
    if (prefGThem && gMe !== prefGThem) ok = false;

    // Country
    const myCountry = me?.country?.trim().toLowerCase() ?? null;
    const theirCountry = them?.country?.trim().toLowerCase() ?? null;
    const myPrefCountry = myPrefs?.preferred_country?.trim().toLowerCase() ?? null;
    const theirPrefCountry = theirPrefs?.preferred_country?.trim().toLowerCase() ?? null;

    if (myPrefCountry && theirCountry !== myPrefCountry) ok = false;
    if (theirPrefCountry && myCountry !== theirPrefCountry) ok = false;

    // Age
    if (myPrefs?.preferred_min_age != null && them?.age < myPrefs.preferred_min_age) ok = false;
    if (myPrefs?.preferred_max_age != null && them?.age > myPrefs.preferred_max_age) ok = false;
    if (theirPrefs?.preferred_min_age != null && me?.age < theirPrefs.preferred_min_age) ok = false;
    if (theirPrefs?.preferred_max_age != null && me?.age > theirPrefs.preferred_max_age) ok = false;

    // Language
    if (myPrefs?.preferred_language && them?.language !== myPrefs.preferred_language) ok = false;
    if (theirPrefs?.preferred_language && me?.language !== theirPrefs.preferred_language) ok = false;

    // Distance (soft → hard, pokud máš limit)
    if (me?.latitude && me?.longitude && them?.latitude && them?.longitude) {
      distanceKm = haversine(me.latitude, me.longitude, them.latitude, them.longitude);
      if (myPrefs?.preferred_max_distance_km != null) {
        if (distanceKm > myPrefs.preferred_max_distance_km) ok = false;
      }
    }

    return { ok, distanceKm };
  }

  // Načtu sebe + preference (jednou)
  const { data: me } = await supabase
    .from("profiles")
    .select("*")
    .eq("anon_id", anonId)
    .maybeSingle();

  const { data: myPrefs } = await supabase
    .from("preferences")
    .select("*")
    .eq("anon_id", anonId)
    .maybeSingle();

  if (!me) {
    return new Response(JSON.stringify({ error: "Profile not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1. Kontrola stávajícího chatu / matchu
  if (chatId) {
    const { data } = await supabase
      .from("matches")
      .select("user1_id, user2_id, chat_id")
      .eq("chat_id", chatId)
      .maybeSingle();

    if (!data) return new Response(JSON.stringify({ status: "not_found" }), {
      headers: { "Content-Type": "application/json" },
    });
    if (data.user1_id && data.user2_id) return new Response(JSON.stringify({ status: "matched", chatId }), {
      headers: { "Content-Type": "application/json" },
    });
    return new Response(JSON.stringify({ status: "waiting", chatId }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Hledám, jestli už mám nějaký waiting / matched match
  const { data: existing } = await supabase
    .from("matches")
    .select("id, user1_id, user2_id, chat_id")
    .or(`user1_id.eq.${anonId},user2_id.eq.${anonId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    if (existing.user1_id && existing.user2_id) {
      return new Response(JSON.stringify({ status: "matched", chatId: existing.chat_id }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ status: "waiting", chatId: existing.chat_id }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Najdeme kandidáty (recent + starší)
  const { data: candidates, error: candErr } = await supabase
    .from("matches")
    .select("id, user1_id, chat_id, created_at")
    .is("user2_id", null)
    .neq("user1_id", anonId)
    .order("created_at", { ascending: true })
    .limit(12); // můžeš zvýšit na 15–20

  if (candErr || !candidates?.length) {
    // nikdo nečeká → vytvořím nový waiting
    const newChatId = crypto.randomUUID();
    await supabase.from("matches").insert({
      user1_id: anonId,
      user2_id: null,
      chat_id: newChatId,
    });
    return new Response(JSON.stringify({ status: "waiting", chatId: newChatId }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Bulk načtení všech profilů a preferencí kandidátů
  const userIds = [...new Set(candidates.map(c => c.user1_id))];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("anon_id, gender, country, age, language, interest, latitude, longitude")
    .in("anon_id", userIds);

  const { data: prefs } = await supabase
    .from("preferences")
    .select("*")
    .in("anon_id", userIds);

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.anon_id, p]));
  const prefMap = Object.fromEntries((prefs ?? []).map(p => [p.anon_id, p]));

  // Vyhodnotíme kandidáty
  const viable: { id: string; chat_id: string; distanceKm: number; created_at: string }[] = [];

  for (const c of candidates) {
    const them = profileMap[c.user1_id];
    const theirPrefs = prefMap[c.user1_id];

    if (!them) continue;

    const { ok, distanceKm } = isCompatible(me, myPrefs, them, theirPrefs);

    if (ok) {
      viable.push({
        id: c.id,
        chat_id: c.chat_id,
        distanceKm,
        created_at: c.created_at,
      });
    }
  }

  if (!viable.length) {
    // nikdo nevyhovuje → nový waiting
    const newChatId = crypto.randomUUID();
    await supabase.from("matches").insert({
      user1_id: anonId,
      user2_id: null,
      chat_id: newChatId,
    });
    return new Response(JSON.stringify({ status: "waiting", chatId: newChatId }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Seřadíme: nejprve nejnovější, pak podle vzdálenosti
  viable.sort((a, b) => {
    if (a.created_at > b.created_at) return -1;
    if (a.created_at < b.created_at) return 1;
    return a.distanceKm - b.distanceKm;
  });

  // Zkusíme je postupně zabrat (atomic)
  for (const candidate of viable) {
    const { data: match, error: fetchErr } = await supabase
      .from("matches")
      .select("id, user2_id")
      .eq("id", candidate.id)
      .is("user2_id", null)
      .single();

    if (fetchErr || !match || match.user2_id !== null) {
      continue; // někdo byl rychlejší
    }

    const { error: updateErr } = await supabase
      .from("matches")
      .update({ user2_id: anonId })
      .eq("id", candidate.id)
      .is("user2_id", null);

    if (!updateErr) {
      // Úspěch!
      return new Response(JSON.stringify({
        status: "matched",
        chatId: candidate.chat_id,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Nikoho se nepodařilo zabrat → nový waiting
  const newChatId = crypto.randomUUID();
  await supabase.from("matches").insert({
    user1_id: anonId,
    user2_id: null,
    chat_id: newChatId,
  });

  return new Response(JSON.stringify({ status: "waiting", chatId: newChatId }), {
    headers: { "Content-Type": "application/json" },
  });
});
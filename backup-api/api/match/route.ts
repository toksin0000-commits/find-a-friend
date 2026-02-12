import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabaseServer";

// SOFT DISTANCE (one‑sided) – helper
function haversine(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null) {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null
  ) return Infinity;

  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: Request) {
  const { anonId, chatId } = await req.json();

  if (!anonId) {
    return NextResponse.json({ error: "Missing anonId" }, { status: 400 });
  }

  //
  // LOAD MY PROFILE + PREFERENCES
  //
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

  const myGender = me?.gender?.trim().toLowerCase() || null;
  const myCountry = me?.country?.trim().toLowerCase() || null;

  const myPrefGender = myPrefs?.preferred_gender?.trim().toLowerCase() || null;
  const myPrefCountry = myPrefs?.preferred_country?.trim().toLowerCase() || null;

  //
  // 1) POLLING
  //
  if (chatId) {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .eq("chat_id", chatId)
      .maybeSingle();

    if (!data) return NextResponse.json({ status: "not_found" });

    if (data.user1_id && data.user2_id)
      return NextResponse.json({ status: "matched", chatId });

    return NextResponse.json({ status: "waiting" });
  }

  //
  // 2) EXISTING MATCH
  //
  const { data: existing } = await supabase
    .from("matches")
    .select("*")
    .or(`user1_id.eq.${anonId},user2_id.eq.${anonId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    if (existing.user1_id && existing.user2_id)
      return NextResponse.json({
        status: "matched",
        chatId: existing.chat_id,
      });

    return NextResponse.json({
      status: "waiting",
      chatId: existing.chat_id,
    });
  }

  //
  // 3) SOMEONE JUST CREATED WAITING MATCH
  //
  const { data: recentWaiting } = await supabase
    .from("matches")
    .select("*")
    .is("user2_id", null)
    .neq("user1_id", anonId)
    .gte("created_at", new Date(Date.now() - 5000).toISOString())
    .order("created_at", { ascending: true })
    .limit(1);

  if (recentWaiting && recentWaiting.length > 0) {
    const w = recentWaiting[0];

    const { data: wProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("anon_id", w.user1_id)
      .maybeSingle();

    const { data: wPrefs } = await supabase
      .from("preferences")
      .select("*")
      .eq("anon_id", w.user1_id)
      .maybeSingle();

    const theirGender = wProfile?.gender?.trim().toLowerCase() || null;
    const theirCountry = wProfile?.country?.trim().toLowerCase() || null;

    const theirPrefGender = wPrefs?.preferred_gender?.trim().toLowerCase() || null;
    const theirPrefCountry = wPrefs?.preferred_country?.trim().toLowerCase() || null;

    let ok = true;

    // ------------------------------
    // INTERESTS MATCHING (TVRDÝ FILTR)
    // ------------------------------
    const myInterest = me?.interest?.trim().toLowerCase() || null;
    const theirInterest = wProfile?.interest?.trim().toLowerCase() || null;

    const myPreferredInterest = myPrefs?.preferred_interest?.trim().toLowerCase() || null;
    const theirPreferredInterest = wPrefs?.preferred_interest?.trim().toLowerCase() || null;

    // 1) Já mám preference → oni musí splnit
    if (myPreferredInterest) {
      if (theirInterest !== myPreferredInterest) ok = false;
    }

    // 2) Oni mají preference → já musím splnit
    if (theirPreferredInterest) {
      if (myInterest !== theirPreferredInterest) ok = false;
    }

    // ------------------------------
    // GENDER FILTER – oboustranný
    // ------------------------------
    const gMe = myGender || null;
    const gThem = theirGender || null;

    const prefMe = myPrefGender || null;
    const prefThem = theirPrefGender || null;

    if (prefMe && prefThem) {
      if (gThem !== prefMe) ok = false;
      if (gMe !== prefThem) ok = false;
    } else if (prefMe && !prefThem) {
      if (gThem !== prefMe) ok = false;
    } else if (!prefMe && prefThem) {
      if (gMe !== prefThem) ok = false;
    } else {
      // žádný gender fallback, ok necháváme tak jak je
    }

    // COUNTRY FILTER — vzájemná kompatibilita
    if (myPrefCountry && theirCountry && theirCountry !== myPrefCountry) ok = false;
    if (theirPrefCountry && myCountry && myCountry !== theirPrefCountry) ok = false;

    if (myPrefCountry && theirPrefCountry && myPrefCountry !== theirPrefCountry) ok = false;

    // AGE FILTER
    if (myPrefs?.preferred_min_age != null && wProfile?.age < myPrefs.preferred_min_age) ok = false;
    if (myPrefs?.preferred_max_age != null && wProfile?.age > myPrefs.preferred_max_age) ok = false;

    if (wPrefs?.preferred_min_age != null && me?.age < wPrefs.preferred_min_age) ok = false;
    if (wPrefs?.preferred_max_age != null && me?.age > wPrefs.preferred_max_age) ok = false;

    // LANGUAGE FILTER
    if (myPrefs?.preferred_language) {
      if (wProfile?.language !== myPrefs.preferred_language) ok = false;
    }

    if (wPrefs?.preferred_language) {
      if (me?.language !== wPrefs.preferred_language) ok = false;
    }

    // DISTANCE – soft, one‑sided (jen spočítáme, neblokujeme)
    let distanceKm = Infinity;
    let inMyRange = true;

    if (me?.latitude && me?.longitude && wProfile?.latitude && wProfile?.longitude) {
      distanceKm = haversine(
        me.latitude,
        me.longitude,
        wProfile.latitude,
        wProfile.longitude
      );

      if (myPrefs?.preferred_max_distance_km) {
        inMyRange = distanceKm <= myPrefs.preferred_max_distance_km;
      }
    }

    // FALLBACK FLAGS – jen informace, ne přepisování ok
    const iHaveAnyPref =
      myPrefGender ||
      myPrefCountry ||
      myPrefs?.preferred_min_age ||
      myPrefs?.preferred_max_age ||
      myPrefs?.preferred_language ||
      myInterest ||
      myPreferredInterest;

    const theyHaveAnyPref =
      theirPrefGender ||
      theirPrefCountry ||
      wPrefs?.preferred_min_age ||
      wPrefs?.preferred_max_age ||
      wPrefs?.preferred_language ||
      theirInterest ||
      theirPreferredInterest;

    // žádné: if (!iHaveAnyPref && !theyHaveAnyPref) ok = true;

    if (ok) {
      await supabase
        .from("matches")
        .update({ user2_id: anonId })
        .eq("id", w.id);

      return NextResponse.json({
        status: "matched",
        chatId: w.chat_id,
      });
    }
  }

  //
  // 4) OLDER WAITING USERS
  //
  const { data: waitingList } = await supabase
    .from("matches")
    .select("*")
    .is("user2_id", null)
    .neq("user1_id", anonId)
    .order("created_at", { ascending: true })
    .limit(10);

  if (waitingList && waitingList.length > 0) {
    const inRange: { w: any; distanceKm: number }[] = [];
    const outOfRange: { w: any; distanceKm: number }[] = [];

    for (const w of waitingList) {
      const { data: wProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("anon_id", w.user1_id)
        .maybeSingle();

      const { data: wPrefs } = await supabase
        .from("preferences")
        .select("*")
        .eq("anon_id", w.user1_id)
        .maybeSingle();

      const theirGender = wProfile?.gender?.trim().toLowerCase() || null;
      const theirCountry = wProfile?.country?.trim().toLowerCase() || null;

      const theirPrefGender = wPrefs?.preferred_gender?.trim().toLowerCase() || null;
      const theirPrefCountry = wPrefs?.preferred_country?.trim().toLowerCase() || null;

      let ok = true;

      // INTERESTS MATCHING (TVRDÝ FILTR)
      const myInterest = me?.interest?.trim().toLowerCase() || null;
      const theirInterest = wProfile?.interest?.trim().toLowerCase() || null;

      const myPreferredInterest = myPrefs?.preferred_interest?.trim().toLowerCase() || null;
      const theirPreferredInterest = wPrefs?.preferred_interest?.trim().toLowerCase() || null;

      if (myPreferredInterest) {
        if (theirInterest !== myPreferredInterest) ok = false;
      }

      if (theirPreferredInterest) {
        if (myInterest !== theirPreferredInterest) ok = false;
      }

      // GENDER FILTER
      const gMe = myGender || null;
      const gThem = theirGender || null;

      const prefMe = myPrefGender || null;
      const prefThem = theirPrefGender || null;

      if (prefMe && prefThem) {
        if (gThem !== prefMe) ok = false;
        if (gMe !== prefThem) ok = false;
      } else if (prefMe && !prefThem) {
        if (gThem !== prefMe) ok = false;
      } else if (!prefMe && prefThem) {
        if (gMe !== prefThem) ok = false;
      } else {
        // žádný gender fallback
      }

      // COUNTRY FILTER
      if (myPrefCountry && theirCountry && theirCountry !== myPrefCountry) ok = false;
      if (theirPrefCountry && myCountry && myCountry !== theirPrefCountry) ok = false;

      if (myPrefCountry && theirPrefCountry && myPrefCountry !== theirPrefCountry) ok = false;

      // AGE
      if (myPrefs?.preferred_min_age != null && wProfile?.age < myPrefs.preferred_min_age) ok = false;
      if (myPrefs?.preferred_max_age != null && wProfile?.age > myPrefs.preferred_max_age) ok = false;

      if (wPrefs?.preferred_min_age != null && me?.age < wPrefs.preferred_min_age) ok = false;
      if (wPrefs?.preferred_max_age != null && me?.age > wPrefs.preferred_max_age) ok = false;

      // LANGUAGE
      if (myPrefs?.preferred_language) {
        if (wProfile?.language !== myPrefs.preferred_language) ok = false;
      }

      if (wPrefs?.preferred_language) {
        if (me?.language !== wPrefs.preferred_language) ok = false;
      }

      // FALLBACK FLAGS – jen info
      const iHaveAnyPref =
        myPrefGender ||
        myPrefCountry ||
        myPrefs?.preferred_min_age ||
        myPrefs?.preferred_max_age ||
        myPrefs?.preferred_language ||
        myInterest ||
        myPreferredInterest;

      const theyHaveAnyPref =
        theirPrefGender ||
        theirPrefCountry ||
        wPrefs?.preferred_min_age ||
        wPrefs?.preferred_max_age ||
        wPrefs?.preferred_language ||
        theirInterest ||
        theirPreferredInterest;

      // žádné: if (!iHaveAnyPref && !theyHaveAnyPref) ok = true;

      if (!ok) continue;

      // DISTANCE – soft, one‑sided
      let distanceKm = Infinity;
      let inMyRange = true;

      if (me?.latitude && me?.longitude && wProfile?.latitude && wProfile?.longitude) {
        distanceKm = haversine(
          me.latitude,
          me.longitude,
          wProfile.latitude,
          wProfile.longitude
        );

        if (myPrefs?.preferred_max_distance_km) {
          inMyRange = distanceKm <= myPrefs.preferred_max_distance_km;
        }
      }

      if (inMyRange) {
        inRange.push({ w, distanceKm });
      } else {
        outOfRange.push({ w, distanceKm });
      }
    }

    if (inRange.length > 0) {
      inRange.sort((a, b) => a.distanceKm - b.distanceKm);
      const best = inRange[0].w;

      await supabase
        .from("matches")
        .update({ user2_id: anonId })
        .eq("id", best.id);

      return NextResponse.json({
        status: "matched",
        chatId: best.chat_id,
      });
    }

    if (outOfRange.length > 0) {
      outOfRange.sort((a, b) => a.distanceKm - b.distanceKm);
      const best = outOfRange[0].w;

      await supabase
        .from("matches")
        .update({ user2_id: anonId })
        .eq("id", best.id);

      return NextResponse.json({
        status: "matched",
        chatId: best.chat_id,
      });
    }
  }

  //
  // 5) CREATE NEW WAITING MATCH
  //
  const newChatId = crypto.randomUUID();

  await supabase.from("matches").insert({
    user1_id: anonId,
    user2_id: null,
    chat_id: newChatId,
  });

  return NextResponse.json({
    status: "waiting",
    chatId: newChatId,
  });
}

import { getSupabase } from "@/lib/supabase";
const supabase = getSupabase();


// Haversine distance
function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function findMatches(anonId: string) {
  // Load my profile
  const { data: me } = await supabase
    .from("profiles")
    .select("*")
    .eq("anon_id", anonId)
    .single();

  if (!me) return [];

  // Load my preferences
  const { data: prefs } = await supabase
    .from("preferences")
    .select("*")
    .eq("anon_id", anonId)
    .single();

  // Load all other profiles
  const { data: all } = await supabase
    .from("profiles")
    .select("*")
    .neq("anon_id", anonId);

  if (!all) return [];

  let results = all;

  // Hard filters
  if (prefs?.preferred_gender) {
    results = results.filter((p) => p.gender === prefs.preferred_gender);
  }

  if (prefs?.preferred_country) {
    results = results.filter((p) => p.country === prefs.preferred_country);
  }

  if (prefs?.preferred_language) {
    results = results.filter((p) => p.language === prefs.preferred_language);
  }

  if (prefs?.preferred_min_age) {
    results = results.filter((p) => p.age >= prefs.preferred_min_age);
  }

  if (prefs?.preferred_max_age) {
    results = results.filter((p) => p.age <= prefs.preferred_max_age);
  }

  // Distance filter
  if (
    prefs?.preferred_max_distance_km &&
    me.latitude &&
    me.longitude
  ) {
    results = results.filter((p) => {
      if (!p.latitude || !p.longitude) return false;

      const d = distanceKm(
        me.latitude,
        me.longitude,
        p.latitude,
        p.longitude
      );

      return d <= prefs.preferred_max_distance_km;
    });
  }

  return results;
}

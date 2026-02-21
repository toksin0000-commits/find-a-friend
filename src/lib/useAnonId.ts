"use client";

import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { getSupabase } from "@/lib/supabase";
const supabase = getSupabase();

// ✔️ Validátor UUID
function isValidUUID(str: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ✔️ Zajistí existenci profilu + uloží návštěvu
async function ensureProfileExists(id: string) {
  try {
    console.log("📝 Zajišťuji existenci profilu pro:", id);

    // 1) počkáme na country
    let country = localStorage.getItem("country");
    if (!country) {
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 100));
        country = localStorage.getItem("country");
        if (country) break;
      }
    }

    // 2) upsert profilu
    await supabase.from("profiles").upsert(
      {
        anon_id: id,
        created_at: new Date().toISOString(),
      },
      { onConflict: "anon_id" }
    );

    console.log("✅ Profil existuje nebo byl vytvořen");

    // 3) log návštěvy
    await supabase.from("visit_sessions").insert({
      anon_id: id,
      country: country || "unknown",
      visited_at: new Date().toISOString(),
    });

    console.log("📌 Návštěva uložena:", country);
  } catch (err) {
    console.error("❌ Chyba při práci s profiles:", err);
  }
}

export function useAnonId() {
  const [anonId, setAnonId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      let stored = localStorage.getItem("anon_id");

      // ❌ Pokud není validní → vytvoříme nový
      if (!isValidUUID(stored)) {
        stored = uuid();
        localStorage.setItem("anon_id", stored);
        console.log("🆕 Generuji nové UUID:", stored);
      } else {
        console.log("🔄 Používám existující anon_id:", stored);
      }

      // ⭐ Tady TS už ví, že stored je string
      const id = stored as string;

      // ✔️ Ověříme, zda účet není smazaný
      const { data: profile } = await supabase
        .from("profiles")
        .select("deleted_at")
        .eq("anon_id", id)
        .maybeSingle();

      if (profile?.deleted_at) {
        console.log("⚠️ Účet byl smazán → generuji nové ID");
        const newId = uuid();
        localStorage.setItem("anon_id", newId);
        await ensureProfileExists(newId);
        setAnonId(newId);
        return;
      }

      // ✔️ Zajistíme profil + návštěvu
      await ensureProfileExists(id);

      setAnonId(id);
    }

    init();

    // Sync mezi taby
    const onStorage = (e: StorageEvent) => {
      if (e.key === "anon_id") setAnonId(e.newValue);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return anonId;
}

"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

const supabase = getSupabase();

export function useProfileName(anonId: string) {
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("name")
          .eq("anon_id", anonId)
          .maybeSingle();

        if (!cancelled) {
          setName(data?.name ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (anonId) load();

    return () => {
      cancelled = true;
    };
  }, [anonId]);

  return { name, loading };
}

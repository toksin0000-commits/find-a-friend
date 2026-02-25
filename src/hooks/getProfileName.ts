"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
const supabase = getSupabase();

export function useProfileName(anonId?: string | null) {
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!anonId) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("anon_id", anonId)
        .single();

      if (error) {
        setError(error.message);
        setName(null);
      } else {
        setName(data?.name ?? null);
      }

      setLoading(false);
    };

    load();
  }, [anonId]);

  return { name, loading, error };
}

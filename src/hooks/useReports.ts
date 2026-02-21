"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1️⃣ Načíst existující reporty při mountu
  async function loadReports() {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReports(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadReports();

    // 2️⃣ Realtime listener
    const channel = supabase
      .channel("reports-listener")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          console.log("📨 NEW REPORT:", payload.new);

          // Přidáme nový report do seznamu
          setReports((prev) => [payload.new, ...prev]);
        }
      );

    // 3️⃣ SUBSCRIBE + RETRY FIX (stejné jako u presence)
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("🟢 REPORT CHANNEL READY");

        // Retry po 300ms – fixne propásnuté eventy
        setTimeout(() => {
          console.log("🔁 RETRY SUBSCRIBE FOR REPORTS");
          channel.track?.({});
        }, 300);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { reports, loading };
}

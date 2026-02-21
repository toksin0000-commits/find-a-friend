"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
const supabase = getSupabase();

import { initBeep, playBeep } from "@/lib/sound";

export default function SearchAlerts() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    initBeep("/beep.mp3", 0.6);

    const channel = supabase
      .channel("search-events")
      .on("broadcast", { event: "search_started" }, (payload) => {
        console.log("🔔 Someone started searching:", payload);

        // zvuk
        playBeep();

        // bliknutí
        setFlash(true);
        setTimeout(() => setFlash(false), 300);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 w-full h-full pointer-events-none transition-all duration-300 ${
        flash ? "bg-white/40" : "bg-transparent"
      }`}
      style={{ zIndex: 999999 }}
    />
  );
}

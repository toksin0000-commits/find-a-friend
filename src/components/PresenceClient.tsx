"use client";

import { useEffect, useState } from "react";
import { usePresence } from "@/hooks/usePresence";

export default function PresenceClient() {
  const [country, setCountry] = useState<string>("Unknown");

  // 1️⃣ Hook se zavolá vždy — pořadí hooků je stabilní
  const { onlineCount } = usePresence(country);

  // 2️⃣ Country načteme až po renderu
  useEffect(() => {
    const stored = localStorage.getItem("country");

    if (stored) {
      setCountry(stored);
      return;
    }

    async function detectCountry() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();

        localStorage.setItem("country", data.country);
        setCountry(data.country);
      } catch (e) {
        console.log("Geo error:", e);
        setCountry("Unknown");
      }
    }

    detectCountry();
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      {onlineCount}
    </div>
  );
}

"use client";

import Globe from "@/components/Globe";
import Orbit2 from "@/components/Orbit2";
import Orbit1 from "@/components/Orbit1";
import { FindFriendButton } from "@/components/FindFriendButton";
import Stars from "@/components/Stars";
import GuideButton from "@/components/GuideButton";
import Nebula from "@/components/Nebula";
import StarDust from "@/components/StarDust";
import LaserLines from "@/components/LaserLines";
import Nodes from "@/components/Nodes";
import AnimatedHeadline from "@/components/AnimatedHeadline";
import { usePresence } from "@/hooks/usePresence";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// ============================================
// CONFIG
// ============================================
const CONFIG = {
  background: true,

  stars: true,
  nebula: true,
  stardust: true,

  lasers: true,
  nodes: true,
  globe: true,

  orbits: true,
  orbit1: true,
  orbit2: true,
  orbit3: false,

  headline: true,
  features: true,
};

// ============================================
// ORBITS
// ============================================
const Orbit3 = () =>
  CONFIG.orbits &&
  CONFIG.orbit3 && (
    <div className="absolute inset-7 w-36 h-36 bg-linear-to-r from-white/40 via-emerald-500/40 to-white/40 rounded-full animate-pulse orbit3 opacity-80 shadow-lg z-5"></div>
  );

// ============================================
// HEADLINE
// ============================================
const Headline = () =>
  CONFIG.headline && (
    <div className="text-center max-w-4xl mx-auto mb-120">
      <h1 className="-mt-5.5 text-3xl md:text-6xl lg:text-7xl font-black bg-linear-to-r from-white via-slate-200 to-purple-200 bg-clip-text text-transparent drop-shadow-2xl">
        Find a Friend
      </h1>

      <AnimatedHeadline />
    </div>
  );


// ============================================
// MAIN RETURN
// ============================================
export default function Page() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  // ⭐ 1) Zjistíme skutečnou zemi uživatele
  const [country, setCountry] = useState("unknown");

  useEffect(() => {
    async function loadCountry() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        setCountry(data.country || "unknown");
      } catch {
        setCountry("unknown");
      }
    }
    loadCountry();
  }, []);

  // ⭐ 2) Hook se volá VŽDY → žádné porušení pravidel
  const presence = usePresence(country);

  // ⭐ 3) Ale použijeme ho jen mimo admin
  const onlineCount = isAdmin ? 0 : presence.onlineCount;

  return (
    <main className="min-h-screen bg-linear-to-br from-black via-slate-950 to-black relative overflow-hidden">

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {CONFIG.nebula && <Nebula />}
        {CONFIG.stardust && <StarDust />}
        {CONFIG.stars && <Stars />}
        {CONFIG.lasers && <LaserLines />}
        {CONFIG.nodes && <Nodes />}
      </div>

      {/* ONLINE USERS – NEVIDITELNÉ */}
      <div
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        Online users: {onlineCount}
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center justify-start pt-20 md:pt-32 text-white min-h-screen">
        <Headline />

        {/* GLOBE + ORBITS */}
        <div className="relative -mt-80 pointer-events-none">
          <div className="pointer-events-auto">
            <FindFriendButton />
          </div>
        </div>
      </div>

      {/* GUIDE BUTTON */}
      <div className="fixed bottom-3 right-3 z-9999 pointer-events-auto">
        <GuideButton />
      </div>

    </main>
  );
}

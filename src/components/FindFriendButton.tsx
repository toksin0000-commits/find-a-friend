"use client";

// 🔥 TypeScript fix — deklarace persistentního stavu v window
declare global {
  interface Window {
    __matchState: {
      locked: boolean;
      counterInterval: any;
      pollInterval: any;
    };
  }
}

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAnonId } from "@/lib/useAnonId";
import { playBeep, stopBeep, initBeep } from "@/lib/sound";
import Globe from "./Globe";
import Orbit1 from "./Orbit1";
import Orbit2 from "./Orbit2";

export function FindFriendButton() {
  const anonId = useAnonId();
  const router = useRouter();

  const [searching, setSearching] = useState(false);
  const [counter, setCounter] = useState(1);

  // 🔥 persistent state in window (survives unmount)
  let matchState: Window["__matchState"];

  if (typeof window !== "undefined") {
    if (!window.__matchState) {
      window.__matchState = {
        locked: false,
        counterInterval: null,
        pollInterval: null,
      };
    }

    matchState = window.__matchState;
  } else {
    matchState = {
      locked: false,
      counterInterval: null,
      pollInterval: null,
    };
  }

  useEffect(() => {
    initBeep("/beep.mp3", 0.4);
  }, []);

  // ⭐ Reset persistentního stavu při návratu na Home
  useEffect(() => {
    matchState.locked = false;

    clearInterval(matchState.counterInterval);
    clearInterval(matchState.pollInterval);

    matchState.counterInterval = null;
    matchState.pollInterval = null;

    setSearching(false);
    setCounter(1);
  }, []);

  // 🔥 FINÁLNÍ HARD STOP — vždy smaže waiting match
  function hardStop() {
    stopBeep();

    clearInterval(matchState.counterInterval);
    clearInterval(matchState.pollInterval);

    matchState.counterInterval = null;
    matchState.pollInterval = null;
    matchState.locked = false;

    setSearching(false);
    setCounter(1);

    // ⭐ VŽDY použít anonId z localStorage (hook je nespolehlivý)
    const currentAnon = localStorage.getItem("anon_id");

    // ⭐ smaž waiting match na serveru
    fetch("/api/stopSearch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonId: currentAnon }),
    });
  }

  async function startSearch() {
    if (!anonId) return;

    // 🔥 okamžitý lock – zabrání dvojkliku i dvojím eventům
    if (matchState.locked) return;
    matchState.locked = true;

    setSearching(true);
    playBeep();

    // COUNTER
    let i = 1;
    matchState.counterInterval = setInterval(() => {
      setCounter(i++);
    }, 500);

    //
    // FIRST REQUEST
    //
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonId }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      hardStop();
      return;
    }

    if (data.status === "matched") {
      hardStop();
      router.push(`/chat/${data.chatId}`);
      return;
    }

    const chatId = data.chatId;
    if (!chatId) {
      hardStop();
      return;
    }

    //
    // POLLING
    //
    matchState.pollInterval = setInterval(async () => {
      const r = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonId, chatId }),
      });

      let d;
      try {
        d = await r.json();
      } catch {
        hardStop();
        return;
      }

      if (d.status === "matched") {
        hardStop();
        router.push(`/chat/${chatId}`);
      }
    }, 1000);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex items-center justify-center">
        <Globe
          searching={searching}
          onClick={() => {
            if (!searching) startSearch();
            else hardStop();
          }}
        />

        <Orbit1 onStopSearch={hardStop} />
        <Orbit2 onStopSearch={hardStop} />

        {searching && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-white text-5xl font-bold animate-fast-blink">
              {counter}
            </div>
            <div className="text-white/70 text-sm mt-1 tracking-wide">
              searching…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

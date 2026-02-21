"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
const supabase = getSupabase();

import { useAnonId } from "@/lib/useAnonId";

export function usePresence(country: string) {
  const anonId = useAnonId(); // 🔥 JEDINÝ zdroj identity
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!anonId) return;

    console.log("🔵 usePresence mounted with anonId:", anonId);

    const channel = supabase.channel("presence-room", {
      config: {
        presence: {
          key: anonId, // 🔥 presence key = anon_id
        },
      },
    });

    console.log("📡 Subscribing to channel...");

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        console.log("🟢 SUBSCRIBED → sending track()");

        // 1️⃣ první track
        await channel.track({
          country,
          online_at: new Date().toISOString(),
        });

        // 2️⃣ retry track po 300ms (fix race condition)
        setTimeout(() => {
          console.log("🔁 RETRY TRACK()");
          channel.track({
            country,
            online_at: new Date().toISOString(),
          });
        }, 300);
      }
    });

    channel.on("presence", { event: "sync" }, () => {
      console.log("🔄 SYNC EVENT");
      const state = channel.presenceState();
      console.log("📦 CURRENT STATE:", state);

      const users = Object.entries(state).map(([key, sessions]: any) => {
        const lastSession = sessions[sessions.length - 1];
        return {
          id: key,
          ...lastSession,
        };
      });

      console.log("👥 USERS PARSED:", users);

      setOnlineUsers(users);
      setOnlineCount(users.length);
    });

    return () => {
      console.log("🔴 Unsubscribing from channel");
      channel.unsubscribe();
    };
  }, [anonId, country]);

  return { onlineCount, onlineUsers };
}

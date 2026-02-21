"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
const supabase = getSupabase();

import { PresenceUserRow } from "./PresenceUserRow";

type PresenceUser = {
  id: string;
  country: string;
  online_at: string;
};

export default function AdminPresenceWidget() {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [openOnline, setOpenOnline] = useState(false);
  const [openStats, setOpenStats] = useState(false);

  // 📊 STATISTIKY
  const [uniqueUsers, setUniqueUsers] = useState(0);
  const [uniqueToday, setUniqueToday] = useState(0);
  const [visitsToday, setVisitsToday] = useState(0);
  const [visitsYesterday, setVisitsYesterday] = useState(0);
  const [visitsLast7, setVisitsLast7] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);

  // 🌍 COUNTRY STATISTICS
  const [topCountriesToday, setTopCountriesToday] = useState<any[]>([]);

  // 🟢 REALTIME ONLINE USERS
  useEffect(() => {
    const channel = supabase
      .channel("presence-room", {
        config: {
          presence: { key: "admin-listener" },
        },
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();

        const users = Object.entries(state).map(
          ([id, sessions]: [string, any[]]) => {
            const last = sessions[sessions.length - 1];
            return {
              id,
              country: last.country ?? "unknown",
              online_at: last.online_at ?? "unknown",
            };
          }
        );

        setOnlineUsers(users);
        setOnlineCount(users.length);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // 📊 NAČTENÍ STATISTIK
  useEffect(() => {
    async function loadStats() {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
        .toISOString()
        .split("T")[0];

      // Unikátní uživatelé (celkem)
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("anon_id");
      setUniqueUsers(allProfiles?.length || 0);

      // Unikátní uživatelé dnes
      const { data: todaySessions } = await supabase
  .from("visit_sessions")
  .select("anon_id")
  .gte("visited_at", `${today}T00:00:00.000Z`)
  .lte("visited_at", `${today}T23:59:59.999Z`);

const unique = new Set(todaySessions?.map(s => s.anon_id));
setUniqueToday(unique.size);


      // Dnešní návštěvy
      const { data: todayVisits } = await supabase
        .from("visit_sessions")
        .select("id")
        .gte("visited_at", `${today}T00:00:00.000Z`)
        .lte("visited_at", `${today}T23:59:59.999Z`);
      setVisitsToday(todayVisits?.length || 0);

      // Včerejší návštěvy
      const { data: yesterdayVisits } = await supabase
        .from("visit_sessions")
        .select("id")
        .gte("visited_at", `${yesterday}T00:00:00.000Z`)
        .lte("visited_at", `${yesterday}T23:59:59.999Z`);
      setVisitsYesterday(yesterdayVisits?.length || 0);

      // Posledních 7 dní
      const { data: last7 } = await supabase
        .from("visit_sessions")
        .select("id")
        .gte("visited_at", `${sevenDaysAgo}T00:00:00.000Z`);
      setVisitsLast7(last7?.length || 0);

      // Celkové návštěvy
      const { data: allVisits } = await supabase
        .from("visit_sessions")
        .select("id");
      setTotalVisits(allVisits?.length || 0);

      // 🌍 TOP COUNTRIES TODAY
      const { data: countriesToday } = await supabase
        .from("visit_sessions")
        .select("country")
        .gte("visited_at", `${today}T00:00:00.000Z`)
        .lte("visited_at", `${today}T23:59:59.999Z`);

      if (countriesToday) {
        const counts: Record<string, number> = {};

        countriesToday.forEach((row) => {
          const c = row.country || "Unknown";
          counts[c] = (counts[c] || 0) + 1;
        });

        const sorted = Object.entries(counts)
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count);

        setTopCountriesToday(sorted);
      }
    }

    loadStats();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        marginTop: 10,
      }}
    >
      {/* 🟢 ONLINE USERS BOX — 2/3 šířky */}
      <div
        style={{
          flex: 2,
          background: "rgba(255,255,255,0.05)",
          padding: 10,
          borderRadius: 10,
          color: "white",
          fontSize: 13,
          lineHeight: 1.2,
        }}
      >
        <div
          onClick={() => setOpenOnline(!openOnline)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            cursor: "pointer",
            marginBottom: 6,
          }}
        >
          <h2 style={{ fontSize: 16 }}>🟢 Online users</h2>
          <span style={{ fontSize: 18 }}>{openOnline ? "▲" : "▼"}</span>
        </div>

        <p style={{ fontSize: 14, marginBottom: 6 }}>Total: {onlineCount}</p>

        {openOnline && (
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              paddingRight: "4px",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
            }}
          >
            {onlineUsers.map((u) => (
              <PresenceUserRow key={u.id} user={u} />
            ))}

            {onlineUsers.length === 0 && (
              <div style={{ padding: "6px", opacity: 0.6 }}>
                No users online
              </div>
            )}
          </div>
        )}
      </div>

      {/* 📊 STATISTICS BOX — 1/3 šířky */}
      <div
        style={{
          flex: 1,
          background: "rgba(255,255,255,0.05)",
          padding: 10,
          borderRadius: 10,
          color: "white",
          fontSize: 13,
          lineHeight: 1.2,
        }}
      >
        <div
          onClick={() => setOpenStats(!openStats)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            cursor: "pointer",
            marginBottom: 6,
          }}
        >
          <h2 style={{ fontSize: 16 }}>📊 Statistics</h2>
          <span style={{ fontSize: 18 }}>{openStats ? "▲" : "▼"}</span>
        </div>

        {openStats && (
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              paddingRight: "4px",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
            }}
          >
            <p>Unique users: {uniqueUsers}</p>
            <p>Unique today: {uniqueToday}</p>
            <p>Visits today: {visitsToday}</p>
            <p>Visits yesterday: {visitsYesterday}</p>
            <p>Visits last 7 days: {visitsLast7}</p>
            <p>Total visits: {totalVisits}</p>

            {/* 🌍 TOP COUNTRIES TODAY */}
            <div style={{ marginTop: 10 }}>
              <h3 style={{ fontSize: 14, marginBottom: 4 }}>
                🌍 Top countries today
              </h3>

              {topCountriesToday.length === 0 && (
                <p style={{ opacity: 0.6 }}>No data</p>
              )}

              {topCountriesToday.map((c) => (
                <p key={c.country}>
                  {c.country}: {c.count}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

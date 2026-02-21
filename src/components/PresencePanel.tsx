"use client";

import { usePresence } from "@/hooks/usePresence";

export default function PresencePanel() {
  const { onlineCount, onlineUsers } = usePresence("Česko");

  return (
    <div style={{ padding: 20 }}>
      <h2>🟢 Online: {onlineCount}</h2>

      <h3>Uživatelé:</h3>
      <ul>
        {onlineUsers.map((u) => (
          <li key={u.id}>
            {u.id.slice(0, 6)} — {u.country}
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { getProfileName } from "@/hooks/getProfileName";

type PresenceUser = {
  id: string;
  country: string;
  online_at: string;
};

export function PresenceUserRow({ user }: { user: PresenceUser }) {
  const { name, loading } = getProfileName(user.id);

  return (
    <div
      style={{
        padding: "4px 0",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div>ID: {user.id}</div>
      <div>Name: {loading ? "Loading..." : name ?? "Unknown"}</div>
      <div>Country: {user.country}</div>
      <div>Online since: {user.online_at}</div>
    </div>
  );
}

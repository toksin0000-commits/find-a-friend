"use client";

import { useEffect, useState } from "react";
import { findMatches } from "@/utils/matching";

export default function MatchesPage() {
  const [anonId, setAnonId] = useState<string | null>(null);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    const id = localStorage.getItem("anon_id");
    setAnonId(id);
  }, []);

  useEffect(() => {
    if (!anonId) return;

    const load = async () => {
      const results = await findMatches(anonId);
      setMatches(results);
    };

    load();
  }, [anonId]);

  return (
    <div className="p-4 max-w-sm mx-auto text-sm">
      <h1 className="text-xl font-bold mb-3">Your Matches</h1>

      {matches.length === 0 && <p>No matches found.</p>}

      {matches.map((m) => (
        <div
          key={m.anon_id}
          className="border rounded p-3 mb-2 shadow-sm bg-white"
        >
          <div className="font-medium">{m.name}</div>
          <div>Age: {m.age}</div>
          <div>Gender: {m.gender}</div>
          <div>Country: {m.country}</div>
          <div>Language: {m.language}</div>
        </div>
      ))}
    </div>
  );
}

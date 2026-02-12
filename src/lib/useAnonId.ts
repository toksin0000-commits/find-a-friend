"use client";

import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

export function useAnonId() {
  const [anonId, setAnonId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("anon_id");

    if (stored) {
      setAnonId(stored);
      return;
    }

    const newId = uuid();
    localStorage.setItem("anon_id", newId);
    setAnonId(newId);
  }, []);

  return anonId;
}

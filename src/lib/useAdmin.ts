import { useState, useEffect } from "react";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    setIsAdmin(token === "toksin-admin-secret-983274982374");
    setLoading(false);
  }, []);

  return { isAdmin, loading };
}


'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    console.log("🔍 AdminLayout - Starting check");
    console.log("🔍 Pathname:", pathname);

    // Login stránka → nekontrolujeme
    if (pathname === "/admin/login") {
      console.log("📌 On login page, skipping admin check");
      setLoading(false);
      return;
    }

    const adminToken = localStorage.getItem("admin_token");

    if (!adminToken) {
      console.log("❌ No admin token, redirecting to login");
      router.push("/admin/login");
      return;
    }

    async function verify() {
      try {
        console.log("📡 Verifying admin token:", adminToken);

        const res = await fetch(`/api/admin/check`, {
          headers: {
            "x-admin-token": adminToken ?? ""
          }
        });

        const data = await res.json();
        console.log("📦 API response:", data);

        if (data.isAdmin) {
          console.log("✅ Admin verified");
          setIsAdmin(true);
        } else {
          console.log("❌ Invalid token, redirecting");
          localStorage.removeItem("admin_token");
          router.push("/admin/login");
        }
      } catch (err) {
        console.error("❌ Error verifying admin:", err);
        localStorage.removeItem("admin_token");
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [pathname, router]);

  // LOADING SCREEN
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⏳</div>
          <div>Ověřuji přístup…</div>
        </div>
      </div>
    );
  }

  // LOGIN PAGE
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // AUTHORIZED ADMIN
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900">

        {/* TOP BAR */}
        <nav className="bg-gray-800 px-4 py-2 text-white">
          <div className="max-w-7xl mx-auto flex justify-between items-center">

            <div className="text-lg font-semibold">
              ADMIN PANEL
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("admin_token");
                router.push("/admin/login");
              }}
              className="text-sm bg-red-600 px-3 py-1 rounded hover:bg-red-700"
            >
              Logout
            </button>

          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="max-w-7xl mx-auto p-6">
          {children}
        </main>

      </div>
    );
  }

  return null;
}

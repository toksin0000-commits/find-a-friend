import { createClient } from "@supabase/supabase-js";

export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During Railway build, env vars are missing → avoid initializing Supabase.
  const isBuild = process.env.NODE_ENV === "production" && (!url || !key);

  if (isBuild) {
    return {
      from() {
        throw new Error("Supabase client cannot be used during build.");
      }
    } as any;
  }

  return createClient(url!, key!, {
    auth: { persistSession: false }
  });
}

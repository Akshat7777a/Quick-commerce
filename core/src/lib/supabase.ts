import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const supabaseConfigured = Boolean(url && key);

/**
 * Public browser client. Only the publishable/anon key belongs here — every
 * table is protected by Row Level Security, so shipping this key is safe.
 */
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  key || "placeholder-publishable-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "lmart.auth",
    },
  },
);

// ============================================================================
// Supabase settings. Fill in the two values from your Supabase project:
//   Supabase dashboard > Project Settings > API
//     - Project URL            -> SUPABASE_URL
//     - anon / public key      -> SUPABASE_ANON_KEY
// The anon key is meant to be inside the app. Your data is protected by the
// row level security rules in supabase/setup.sql, not by hiding this key.
// ============================================================================

export const SUPABASE_URL = "https://eetvfgpbvczsqztabocp.supabase.co";
export const SUPABASE_ANON_KEY =
  "sb_publishable_qlSPmAe_u_PXMGNxVQZZpA_PeITDfHm";

export function isConfigured() {
  return (
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("PASTE_") &&
    !SUPABASE_ANON_KEY.includes("PASTE_")
  );
}

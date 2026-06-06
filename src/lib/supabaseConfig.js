// Public Supabase config for the shared backend.
//
// These are the PUBLISHABLE (client-safe) credentials — they are designed to
// live in the browser bundle. Access is gated by Row Level Security plus the
// shared "house code" passphrase, not by hiding this key. Never put the
// service-role/secret key here.
//
// Values can be overridden at build time via VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY env vars; otherwise these baked defaults are used.
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ljcwsrfmojbjdveefoqa.supabase.co'

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_E5Cx7TlcIzJv6245MwFbLQ_e6Sg_ZlL'

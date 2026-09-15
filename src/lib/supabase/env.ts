/**
 * Single place for Supabase public env (inlined at build time for NEXT_PUBLIC_*).
 * Import this module from browser and server clients so Turbopack/Next embed keys consistently.
 */

function trimEnv(value: string | undefined): string {
  return value?.trim() ?? ""
}

export const supabaseUrl = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
export const supabaseAnonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export function hasSupabasePublicEnv(): boolean {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0
}

/** `supabase start` serves the local stack from 127.0.0.1 / localhost, not *.supabase.co. */
function isLocalSupabaseUrl(url: string): boolean {
  return /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?/i.test(url)
}

export function supabasePublicEnvIssue(): string | null {
  if (!supabaseUrl && !supabaseAnonKey) {
    return "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them in Vercel → Settings → Environment Variables, then redeploy."
  }
  if (!supabaseUrl) {
    return "Missing NEXT_PUBLIC_SUPABASE_URL (Supabase Project URL, e.g. https://xxxx.supabase.co)."
  }
  if (!supabaseAnonKey) {
    return "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (use the anon / public key from Supabase → API, not the service_role secret)."
  }
  if (!supabaseUrl.includes(".supabase.co") && !isLocalSupabaseUrl(supabaseUrl)) {
    return "NEXT_PUBLIC_SUPABASE_URL does not look like a Supabase project URL."
  }
  if (supabaseAnonKey.startsWith("sb_")) {
    return "This app expects the legacy anon JWT (starts with eyJ). In Supabase → API, use the anon public key, not only the new publishable key label, or enable the legacy anon key."
  }
  if (!supabaseAnonKey.startsWith("eyJ")) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY should be a JWT starting with eyJ (anon public key)."
  }
  return null
}

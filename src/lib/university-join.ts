export type UniversityJoinMeta = {
  name: string | null
  website: string | null
}

/**
 * Supabase relationship selects can be returned as either one object or a
 * one-element array depending on the generated relationship metadata.
 */
export function universityJoinMeta(raw: unknown): UniversityJoinMeta {
  const row = Array.isArray(raw) ? raw[0] : raw
  if (!row || typeof row !== "object") {
    return { name: null, website: null }
  }

  const value = row as { name?: unknown; website?: unknown }
  return {
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : null,
    website:
      typeof value.website === "string" && value.website.trim()
        ? value.website.trim()
        : null,
  }
}

export function universityJoinName(raw: unknown): string | null {
  return universityJoinMeta(raw).name
}

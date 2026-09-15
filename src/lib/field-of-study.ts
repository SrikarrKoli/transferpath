import type { PrereqKey } from "@/lib/prereq-catalog"

/**
 * Stored on `user_profiles.field_of_study`. Kept in sync with DB check constraint
 * (supabase/migrations/*_user_profiles_field_of_study.sql).
 */
export type FieldOfStudy =
  | "stem_engineering"
  | "stem_non_engineering"
  | "business"
  | "liberal_arts"
  | "health"
  | "other"

export const FIELD_OF_STUDY_VALUES: readonly FieldOfStudy[] = [
  "stem_engineering",
  "stem_non_engineering",
  "business",
  "liberal_arts",
  "health",
  "other",
] as const

const FIELD_SET = new Set<string>(FIELD_OF_STUDY_VALUES)

/** UI: onboarding + settings — one-line helper under each option. */
export const FIELD_OF_STUDY_OPTIONS: {
  value: FieldOfStudy
  label: string
  helper: string
}[] = [
  {
    value: "stem_engineering",
    label: "Engineering / CE / CS-heavy STEM",
    helper: "Heavy math, physics, and CS prep is typical for these tracks—still verify every course on official guides.",
  },
  {
    value: "stem_non_engineering",
    label: "STEM (not engineering)",
    helper: "CS, math, or science without the full engineering lab sequence—we’ll show lighter CS/math suggestions, not universal requirements.",
  },
  {
    value: "business",
    label: "Business",
    helper: "Focus on core transfer prep—we won’t imply every STEM course applies to you.",
  },
  {
    value: "liberal_arts",
    label: "Liberal arts / social sciences / humanities",
    helper: "Core transfer coursework framing without STEM-only checklist items.",
  },
  {
    value: "health",
    label: "Health / pre-health / nursing",
    helper: "Track-specific sciences live in official program pages—here we keep statewide core context only unless you pick STEM above.",
  },
  {
    value: "other",
    label: "Other / undecided",
    helper: "General transfer planning without field-specific STEM assumptions.",
  },
]

export function parseFieldOfStudy(raw: string | null | undefined): FieldOfStudy | null {
  if (raw == null) return null
  const v = raw.trim()
  if (!v) return null
  return FIELD_SET.has(v) ? (v as FieldOfStudy) : null
}

/** DB NULL or unknown → treat as `other` for planner UI. */
export function fieldOfStudyOrDefault(raw: string | null | undefined): FieldOfStudy {
  return parseFieldOfStudy(raw) ?? "other"
}

/**
 * Prerequisite keys to show for this field (English + gov are “common”; STEM math/CS/physics are field-only).
 * Order is display order. Catalog matchers in `prereq-catalog.ts`.
 */
export function prereqKeysForField(field: FieldOfStudy): PrereqKey[] {
  const common: PrereqKey[] = ["english_comp_1", "english_comp_2", "gov"]
  switch (field) {
    case "stem_engineering":
      return [
        ...common,
        "calculus_1",
        "calculus_2",
        "cs_1",
        "discrete_math",
        "physics_1",
      ]
    case "stem_non_engineering":
      // Softer framing in UI copy — same keys except physics (per product spec).
      return [...common, "calculus_1", "calculus_2", "cs_1", "discrete_math"]
    default:
      return [...common]
  }
}

/** “Required” column text on Requirements academic tables for field-specific rows (not english/gov). */
export function fieldPrereqRowFraming(field: FieldOfStudy, key: PrereqKey): string {
  if (field === "stem_non_engineering" && (key === "cs_1" || key === "discrete_math")) {
    return "Recommended for demonstrated prep — not a universal requirement"
  }
  if (field === "stem_engineering") {
    return "Often recommended for STEM applicants — confirm on official guides"
  }
  if (field === "stem_non_engineering") {
    return "Often recommended — confirm on official guides"
  }
  return "Common transfer prep"
}

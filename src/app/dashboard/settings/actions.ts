"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

import { parseFieldOfStudy, type FieldOfStudy } from "@/lib/field-of-study"

export type SettingsSaveResult = { ok: true } | { ok: false; message: string }

const NO_ROW_MESSAGE =
  "Couldn't save—nothing was updated. Try signing out and signing in again, or complete onboarding if you haven't created a profile yet."

function parseGpa(raw: string): number | null {
  const t = raw.trim()
  if (t === "") return null
  const n = parseFloat(t)
  if (Number.isNaN(n)) return null
  return Math.min(4, Math.max(0, n))
}

function parseCredits(raw: string): number | null {
  const t = raw.trim()
  if (t === "") return null
  const n = parseInt(t, 10)
  if (Number.isNaN(n)) return null
  return Math.max(0, n)
}

/** Lenient hyphenated UUID (8-4-4-4-12 hex). Accepts v1–v7 and other DB/Postgres forms without version/variant nibble checks. */
const LENIENT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeOptionalUniversityId(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const t = raw.trim()
  if (t === "" || t.toLowerCase() === "null") return null
  return t
}

function assertUuidOrNull(v: string | null, label: string): SettingsSaveResult | null {
  if (v === null) return null
  if (!LENIENT_UUID_RE.test(v)) {
    return { ok: false, message: `Invalid ${label}. Choose a school from search again.` }
  }
  return null
}

/** Invalidate dashboard layout and nested pages so sidebar, home, and feature routes pick up profile changes without a hard reload. */
function revalidateDashboardSegment() {
  revalidatePath("/dashboard", "layout")
  const paths = [
    "/dashboard",
    "/dashboard/plan",
    "/dashboard/deadlines",
    "/dashboard/requirements",
    "/dashboard/essay",
    "/dashboard/settings",
    // Legacy routes still revalidated for redirect pages.
    "/dashboard/timeline",
    "/dashboard/checklist",
    "/dashboard/competitiveness",
  ] as const
  for (const p of paths) {
    revalidatePath(p, "page")
  }
}

export async function saveProfileAndTransferAction(input: {
  fullName: string
  currentUniversityId: string | null
  targetUniversityId: string | null
  targetMajor: string
  fieldOfStudy: string
  expectedTransferTerm: string
  gpaInput: string
  creditsInput: string
}): Promise<SettingsSaveResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr) {
    return { ok: false, message: authErr.message }
  }
  if (!user) {
    return { ok: false, message: "Not signed in." }
  }

  const currentUniversityId = normalizeOptionalUniversityId(input.currentUniversityId)
  const targetUniversityId = normalizeOptionalUniversityId(input.targetUniversityId)

  const badCurrent = assertUuidOrNull(currentUniversityId, "current school")
  if (badCurrent) return badCurrent
  const badTarget = assertUuidOrNull(targetUniversityId, "target school")
  if (badTarget) return badTarget

  const gpa = parseGpa(input.gpaInput)
  const creditsCompleted = parseCredits(input.creditsInput)
  const fieldRaw = input.fieldOfStudy.trim()
  const fieldParsed = parseFieldOfStudy(fieldRaw)
  if (fieldRaw !== "" && fieldParsed == null) {
    return { ok: false, message: "Invalid field of study. Choose an option from the list." }
  }
  const fieldOfStudyDb: FieldOfStudy = fieldParsed ?? "other"

  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      full_name: input.fullName.trim() || null,
      current_university_id: currentUniversityId,
      target_university_id: targetUniversityId,
      target_major: input.targetMajor.trim() || null,
      field_of_study: fieldOfStudyDb,
      expected_transfer_term: input.expectedTransferTerm.trim() || null,
      gpa,
      credits_completed: creditsCompleted,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle()

  if (error) {
    return { ok: false, message: error.message }
  }
  if (!data) {
    return { ok: false, message: NO_ROW_MESSAGE }
  }

  revalidateDashboardSegment()
  return { ok: true }
}

export async function saveNotificationSettingsAction(input: {
  notifyDeadlineReminders: boolean
  notifyProductUpdates: boolean
}): Promise<SettingsSaveResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr) {
    return { ok: false, message: authErr.message }
  }
  if (!user) {
    return { ok: false, message: "Not signed in." }
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      notify_deadline_reminders: input.notifyDeadlineReminders,
      notify_product_updates: input.notifyProductUpdates,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle()

  if (error) {
    return { ok: false, message: error.message }
  }
  if (!data) {
    return { ok: false, message: NO_ROW_MESSAGE }
  }

  revalidateDashboardSegment()
  return { ok: true }
}

export async function savePreferenceSettingsAction(input: {
  preferCompactDashboard: boolean
}): Promise<SettingsSaveResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr) {
    return { ok: false, message: authErr.message }
  }
  if (!user) {
    return { ok: false, message: "Not signed in." }
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      prefer_compact_dashboard: input.preferCompactDashboard,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle()

  if (error) {
    return { ok: false, message: error.message }
  }
  if (!data) {
    return { ok: false, message: NO_ROW_MESSAGE }
  }

  revalidateDashboardSegment()
  return { ok: true }
}

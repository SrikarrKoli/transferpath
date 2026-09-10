import type { SupabaseClient } from "@supabase/supabase-js"
import {
  parseExpectedTransferTerm,
  type ParsedTransferTerm,
} from "@/lib/transfer-term-options"

/** Compare due_date (PostgreSQL DATE) to this YYYY-MM-DD. Uses the server\u2019s UTC calendar date; can differ from a user\u2019s local date by one day at boundaries. */
export function serverTodayYmdUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDueDateDisplay(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt)
}

function daysBetweenUtc(fromYmd: string, toYmd: string): number {
  const a = new Date(`${fromYmd}T12:00:00.000Z`)
  const b = new Date(`${toYmd}T12:00:00.000Z`)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

type UniWebsiteJoin = { website: string | null } | null

function normalizeUniversitiesJoin(raw: unknown): UniWebsiteJoin {
  if (raw == null) return null
  if (Array.isArray(raw)) {
    const first = raw[0] as { website?: string | null } | undefined
    if (!first) return null
    return { website: first.website ?? null }
  }
  if (typeof raw === "object" && raw !== null && "website" in raw) {
    const o = raw as { website: string | null }
    return { website: o.website ?? null }
  }
  return null
}

function resolveOfficialUrl(
  officialInfoUrl: string | null | undefined,
  universitiesRaw: unknown
): string | null {
  const direct = officialInfoUrl?.trim()
  if (direct) return direct
  const universities = normalizeUniversitiesJoin(universitiesRaw)
  const site = universities?.website?.trim()
  return site || null
}

export type NextDeadline = {
  title: string
  /** Display label e.g. Mar 1, 2027 */
  dueDate: string
  /** ISO YYYY-MM-DD from DB */
  dueDateIso: string
  daysUntil: number
  /** From `deadlines.official_info_url`, or `universities.website` when joined */
  officialUrl: string | null
  sourceCheckedAt: string | null
  timelineScope: "target" | "statewide"
  category: string
} | null

function rowToNextDeadline(
  row: {
    title: string
    due_date: string
    category?: string | null
    university_id?: string | null
    source_checked_at?: string | null
  },
  today: string,
  officialUrl: string | null,
  timelineScope: "target" | "statewide"
): NextDeadline {
  const dueIso = row.due_date as string
  return {
    title: row.title,
    dueDate: formatDueDateDisplay(dueIso),
    dueDateIso: dueIso,
    daysUntil: daysBetweenUtc(today, dueIso),
    officialUrl,
    sourceCheckedAt: row.source_checked_at ?? null,
    timelineScope,
    category: row.category ?? "deadline",
  }
}

type NextDeadlineQueryRow = {
  title: string
  due_date: string
  category: string
  official_info_url: string | null
  academic_term: string | null
  academic_year: number | null
  university_id: string | null
  source_checked_at: string | null
  universities?: unknown
}

const NEXT_DEADLINE_SELECT =
  "title, due_date, category, official_info_url, academic_term, academic_year, university_id, source_checked_at, universities(website)"

/**
 * When `expected_transfer_term` parses (e.g. "Fall 2026"), keep rows that are generic intakes
 * (`academic_term` and `academic_year` both null) or that match that season/year.
 * Rows with only one of (term, year) set are treated as visible (incomplete seed data).
 */
export function deadlineRowMatchesIntakeFilter(
  academicTerm: string | null | undefined,
  academicYear: number | null | undefined,
  parsedTerm: ParsedTransferTerm | null
): boolean {
  if (!parsedTerm) return true
  if (academicTerm == null && academicYear == null) return true
  if (academicTerm == null || academicYear == null) return true
  return (
    academicTerm.toLowerCase() === parsedTerm.season.toLowerCase() &&
    academicYear === parsedTerm.year
  )
}

/** Drop school-scoped rows that are not for the user’s target (defensive; queries should already restrict). */
export function deadlineRowMatchesTargetUniversity(
  rowUniversityId: string | null | undefined,
  targetUniversityId: string | null
): boolean {
  if (rowUniversityId == null) return true
  if (!targetUniversityId) return false
  return rowUniversityId === targetUniversityId
}

function firstUpcomingFiltered(
  rows: NextDeadlineQueryRow[] | null | undefined,
  parsedTerm: ParsedTransferTerm | null
): NextDeadlineQueryRow | undefined {
  if (!rows?.length) return undefined
  return rows.find((r) => deadlineRowMatchesIntakeFilter(r.academic_term, r.academic_year, parsedTerm))
}

/**
 * Next upcoming deadline. With a target school:
 * 1) Earliest row with `university_id = target` (never another school\u2019s id).
 * 2) If none, earliest global row (`university_id IS NULL`).
 * Without a target: globals only.
 *
 * When `expected_transfer_term` is set and parses, prefers milestones for that intake (or generic any-intake rows).
 */
export async function getNextDeadline(
  supabase: SupabaseClient,
  targetUniversityId: string | null,
  expectedTransferTerm: string | null = null
): Promise<NextDeadline> {
  const today = serverTodayYmdUtc()
  const parsedTerm = parseExpectedTransferTerm(expectedTransferTerm)

  if (targetUniversityId) {
    const { data: schoolRows, error: schoolErr } = await supabase
      .from("deadlines")
      .select(NEXT_DEADLINE_SELECT)
      .eq("university_id", targetUniversityId)
      .gte("due_date", today)
      .order("due_date", { ascending: true })
      .limit(48)

    if (!schoolErr && schoolRows?.length) {
      const row = firstUpcomingFiltered(schoolRows as NextDeadlineQueryRow[], parsedTerm)
      if (row) {
        const url = resolveOfficialUrl(row.official_info_url, row.universities)
        return rowToNextDeadline(row, today, url, "target")
      }
    }

    const { data: globalRows, error: globalErr } = await supabase
      .from("deadlines")
      .select(NEXT_DEADLINE_SELECT)
      .is("university_id", null)
      .gte("due_date", today)
      .order("due_date", { ascending: true })
      .limit(48)

    if (!globalErr && globalRows?.length) {
      const row = firstUpcomingFiltered(globalRows as NextDeadlineQueryRow[], parsedTerm)
      if (row) {
        const url = resolveOfficialUrl(row.official_info_url, null)
        return rowToNextDeadline(row, today, url, "statewide")
      }
    }
    return null
  }

  const { data, error } = await supabase
    .from("deadlines")
    .select(NEXT_DEADLINE_SELECT)
    .is("university_id", null)
    .gte("due_date", today)
    .order("due_date", { ascending: true })
    .limit(48)

  if (error || !data?.length) return null
  const row = firstUpcomingFiltered(data as NextDeadlineQueryRow[], parsedTerm)
  if (!row) return null
  return rowToNextDeadline(
    row,
    today,
    resolveOfficialUrl(row.official_info_url, null),
    "statewide"
  )
}

export type RequirementDeadlineRow = {
  id: string
  title: string
  due_date: string
  category: string
  description: string | null
  university_id: string | null
  academic_term: string | null
  academic_year: number | null
  /** School-specific row for your target vs ApplyTexas / statewide milestones */
  timelineScope: "target" | "statewide"
  officialUrl: string | null
  sourceCheckedAt: string | null
}

type RawTimelineRow = {
  id: string
  title: string
  due_date: string
  category: string
  description: string | null
  university_id: string | null
  academic_term: string | null
  academic_year: number | null
  official_info_url: string | null
  source_checked_at: string | null
  universities: unknown
}

function toRequirementRow(r: RawTimelineRow): RequirementDeadlineRow {
  return {
    id: r.id,
    title: r.title,
    due_date: r.due_date,
    category: r.category,
    description: r.description,
    university_id: r.university_id,
    academic_term: r.academic_term,
    academic_year: r.academic_year,
    timelineScope: r.university_id == null ? "statewide" : "target",
    officialUrl: resolveOfficialUrl(r.official_info_url, r.universities),
    sourceCheckedAt: r.source_checked_at ?? null,
  }
}

const TIMELINE_SELECT =
  "id, title, due_date, category, description, university_id, academic_term, academic_year, official_info_url, source_checked_at, universities(website)"

/**
 * Upcoming deadlines in the next 24 months (UTC), max 12 rows.
 * With target: school-specific rows for `targetUniversityId` plus statewide rows (`university_id` null),
 * sorted by `due_date`, after defensive filtering and optional intake filter from `expected_transfer_term`.
 */
export async function getRequirementTimelineDeadlines(
  supabase: SupabaseClient,
  targetUniversityId: string | null,
  expectedTransferTerm: string | null = null
): Promise<RequirementDeadlineRow[]> {
  const today = serverTodayYmdUtc()
  const upper = new Date()
  upper.setUTCFullYear(upper.getUTCFullYear() + 2)
  const upperYmd = upper.toISOString().slice(0, 10)
  const parsedTerm = parseExpectedTransferTerm(expectedTransferTerm)

  if (!targetUniversityId) {
    const { data, error } = await supabase
      .from("deadlines")
      .select(TIMELINE_SELECT)
      .is("university_id", null)
      .gte("due_date", today)
      .lte("due_date", upperYmd)
      .order("due_date", { ascending: true })
      .limit(64)

    if (error || !data?.length) return []
    const rows = (data as unknown as RawTimelineRow[])
      .filter((r) => deadlineRowMatchesTargetUniversity(r.university_id, targetUniversityId))
      .filter((r) => deadlineRowMatchesIntakeFilter(r.academic_term, r.academic_year, parsedTerm))
      .slice(0, 12)
      .map(toRequirementRow)
    return rows
  }

  const [schoolRes, globalRes] = await Promise.all([
    supabase
      .from("deadlines")
      .select(TIMELINE_SELECT)
      .eq("university_id", targetUniversityId)
      .gte("due_date", today)
      .lte("due_date", upperYmd)
      .order("due_date", { ascending: true })
      .limit(64),
    supabase
      .from("deadlines")
      .select(TIMELINE_SELECT)
      .is("university_id", null)
      .gte("due_date", today)
      .lte("due_date", upperYmd)
      .order("due_date", { ascending: true })
      .limit(64),
  ])

  const school = (schoolRes.data ?? []) as unknown as RawTimelineRow[]
  const global = (globalRes.data ?? []) as unknown as RawTimelineRow[]
  const mergedRaw = [...school, ...global]
    .filter((r) => deadlineRowMatchesTargetUniversity(r.university_id, targetUniversityId))
    .filter((r) => deadlineRowMatchesIntakeFilter(r.academic_term, r.academic_year, parsedTerm))
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 12)

  return mergedRaw.map(toRequirementRow)
}

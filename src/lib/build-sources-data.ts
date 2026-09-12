import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  SourcesData,
  SourcesInstitutionRow,
  SourcesStatewideRow,
} from "@/types/sources"

type UniversityRow = {
  id: string
  name: string
  website: string | null
  deadline_source_url: string | null
  coverage_checked_at: string | null
}

type DeadlineRow = {
  university_id: string | null
  source_checked_at: string | null
  source_kind: string | null
  official_info_url: string | null
}

function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function resolveOfficialPage(
  deadlineSourceUrl: string | null,
  website: string | null,
  sampleOfficialInfoUrl: string | null
): { url: string | null; label: string | null } {
  const url =
    deadlineSourceUrl?.trim() ||
    website?.trim() ||
    sampleOfficialInfoUrl?.trim() ||
    null

  if (!url) return { url: null, label: null }

  return { url, label: hostnameFromUrl(url) }
}

function buildInstitutionRows(
  universities: UniversityRow[],
  deadlines: DeadlineRow[]
): SourcesInstitutionRow[] {
  const byUniversity = new Map<
    string,
    { count: number; sampleOfficialUrl: string | null }
  >()

  for (const row of deadlines) {
    if (!row.university_id) continue
    const existing = byUniversity.get(row.university_id) ?? {
      count: 0,
      sampleOfficialUrl: null,
    }
    existing.count += 1
    if (!existing.sampleOfficialUrl && row.official_info_url?.trim()) {
      existing.sampleOfficialUrl = row.official_info_url.trim()
    }
    byUniversity.set(row.university_id, existing)
  }

  return universities.map((uni) => {
    const held = byUniversity.get(uni.id)
    const dateCount = held?.count ?? 0
    const { url, label } = resolveOfficialPage(
      uni.deadline_source_url,
      uni.website,
      held?.sampleOfficialUrl ?? null
    )

    return {
      id: uni.id,
      name: uni.name,
      dateCount,
      lastCheckedAt: uni.coverage_checked_at,
      officialPageUrl: url,
      officialPageLabel: label,
      hasDates: dateCount > 0,
    }
  })
}

function buildStatewideRow(deadlines: DeadlineRow[]): SourcesStatewideRow | null {
  const statewide = deadlines.filter((row) => row.university_id === null)
  if (statewide.length === 0) return null

  const lastCheckedAt = statewide.reduce<string | null>((latest, row) => {
    const checked = row.source_checked_at
    if (!checked) return latest
    if (!latest || checked > latest) return checked
    return latest
  }, null)

  const sampleUrl =
    statewide.find((row) => row.official_info_url?.trim())?.official_info_url?.trim() ??
    null

  const { url, label } = resolveOfficialPage(null, null, sampleUrl)

  return {
    label: "Statewide · ApplyTexas, FAFSA / TASFA",
    dateCount: statewide.length,
    lastCheckedAt,
    officialPageUrl: url,
    officialPageLabel: label ?? "goapplytexas.org",
  }
}

export async function buildSourcesData(
  supabase: SupabaseClient
): Promise<SourcesData> {
  const [universitiesResult, deadlinesResult] = await Promise.all([
    supabase
      .from("universities")
      .select(
        "id, name, website, deadline_source_url, coverage_checked_at"
      )
      .eq("type", "four_year")
      .order("name", { ascending: true }),
    supabase
      .from("deadlines")
      .select("university_id, source_checked_at, source_kind, official_info_url"),
  ])

  if (universitiesResult.error || deadlinesResult.error) {
    return {
      totalSchools: 0,
      coveredSchools: 0,
      uncoveredSchools: 0,
      confirmedDateCount: 0,
      totalHeldDates: 0,
      anyDatesConfirmed: false,
      institutions: [],
      statewide: null,
      loadError: "We could not load source coverage just now. Try again in a moment.",
    }
  }

  const universities = (universitiesResult.data ?? []) as UniversityRow[]
  const deadlines = (deadlinesResult.data ?? []) as DeadlineRow[]

  const institutions = buildInstitutionRows(universities, deadlines)
  const coveredSchools = institutions.filter((row) => row.hasDates).length
  const totalSchools = institutions.length
  const confirmedDateCount = deadlines.filter(
    (row) => row.source_kind === "official"
  ).length
  const totalHeldDates = deadlines.length

  return {
    totalSchools,
    coveredSchools,
    uncoveredSchools: totalSchools - coveredSchools,
    confirmedDateCount,
    totalHeldDates,
    anyDatesConfirmed: confirmedDateCount > 0,
    institutions,
    statewide: buildStatewideRow(deadlines),
    loadError: null,
  }
}

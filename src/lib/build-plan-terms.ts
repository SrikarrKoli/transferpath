import { isCalendarTermBucket, isReservedTimelinePhase } from "@/lib/timeline-phase-buckets"
import type {
  PlanCourseInput,
  PlanTermCourse,
  PlanTermSection,
  PlanTermsResult,
  PlanTermTemporalState,
} from "@/types/plan-terms"

export const PLAN_UNSCHEDULED_LABEL = "Later / Not scheduled"

export type BuildPlanTermsInput = {
  courses: PlanCourseInput[]
  expectedTransferTerm: string | null
  targetSchoolName: string | null
  /** ISO date (YYYY-MM-DD) for temporal state; defaults to today. */
  todayYmd?: string
}

type ParsedTerm = {
  label: string
  year: number
  season: "spring" | "summer" | "fall"
  sortKey: number
  rangeStartYmd: string
  rangeEndYmd: string
}

function parseCalendarTerm(label: string): ParsedTerm | null {
  const m = /^(\w+)\s+(\d{4})$/i.exec(label.trim())
  if (!m) return null
  const seasonRaw = m[1].toLowerCase()
  const year = parseInt(m[2], 10)
  let season: ParsedTerm["season"] | null = null
  if (seasonRaw === "spring") season = "spring"
  else if (seasonRaw === "summer") season = "summer"
  else if (seasonRaw === "fall") season = "fall"
  if (!season) return null

  const month =
    season === "spring" ? 2 : season === "summer" ? 6 : 9
  const sortKey = year * 12 + month

  let rangeStartYmd: string
  let rangeEndYmd: string
  if (season === "spring") {
    rangeStartYmd = `${year}-01-01`
    rangeEndYmd = `${year}-05-31`
  } else if (season === "summer") {
    rangeStartYmd = `${year}-06-01`
    rangeEndYmd = `${year}-08-31`
  } else {
    rangeStartYmd = `${year}-09-01`
    rangeEndYmd = `${year}-12-31`
  }

  return { label: label.trim(), year, season, sortKey, rangeStartYmd, rangeEndYmd }
}

export function termSortKey(label: string): number {
  const parsed = parseCalendarTerm(label)
  if (parsed) return parsed.sortKey
  return 1e12 + label.charCodeAt(0)
}

export function compareTermLabels(a: string, b: string): number {
  const ka = termSortKey(a)
  const kb = termSortKey(b)
  if (ka !== kb) {
    if (ka >= 1e12 && kb >= 1e12) return a.localeCompare(b)
    if (ka >= 1e12) return 1
    if (kb >= 1e12) return -1
    return ka - kb
  }
  return a.localeCompare(b)
}

export function termToDateRange(term: string): string {
  const parsed = parseCalendarTerm(term)
  if (!parsed) return ""
  const { season, year } = parsed
  if (season === "fall") return `Sep — Dec ${year}`
  if (season === "spring") return `Jan — May ${year}`
  return `Jun — Aug ${year}`
}

function temporalStateForTerm(termLabel: string, todayYmd: string): PlanTermTemporalState {
  const parsed = parseCalendarTerm(termLabel)
  if (!parsed) return "planned"
  if (todayYmd > parsed.rangeEndYmd) return "completed"
  if (todayYmd >= parsed.rangeStartYmd && todayYmd <= parsed.rangeEndYmd) return "current"
  return "planned"
}

function courseBelongsInCalendarBucket(semesterTaken: string | null | undefined): boolean {
  const raw = semesterTaken?.trim() ?? ""
  if (raw === "") return false
  if (isReservedTimelinePhase(raw)) return false
  return isCalendarTermBucket(raw)
}

function toPlanCourse(c: PlanCourseInput): PlanTermCourse {
  return {
    id: c.id,
    course_name: c.course_name,
    status: c.status,
    semester_taken: c.semester_taken,
  }
}

function sortCourses(list: PlanTermCourse[]): PlanTermCourse[] {
  return [...list].sort((a, b) => a.course_name.localeCompare(b.course_name))
}

/**
 * Groups coursework into calendar terms (from semester_taken), an entry-term marker,
 * and Later / Not scheduled — state-agnostic, no phase-bucket merge.
 */
export function buildPlanTerms(input: BuildPlanTermsInput): PlanTermsResult {
  const todayYmd = input.todayYmd ?? new Date().toISOString().slice(0, 10)
  const calendarBuckets = new Map<string, PlanTermCourse[]>()
  const unscheduled: PlanTermCourse[] = []

  for (const course of input.courses) {
    const row = toPlanCourse(course)
    if (courseBelongsInCalendarBucket(course.semester_taken)) {
      const key = course.semester_taken!.trim()
      const list = calendarBuckets.get(key) ?? []
      list.push(row)
      calendarBuckets.set(key, list)
    } else {
      unscheduled.push(row)
    }
  }

  const calendarLabels = [...calendarBuckets.keys()].sort(compareTermLabels)
  const sections: PlanTermSection[] = calendarLabels.map((termLabel) => ({
    kind: "calendar",
    termLabel,
    dateRange: termToDateRange(termLabel),
    temporalState: temporalStateForTerm(termLabel, todayYmd),
    courses: sortCourses(calendarBuckets.get(termLabel) ?? []),
  }))

  const entryTerm = input.expectedTransferTerm?.trim() ?? ""
  if (entryTerm) {
    sections.push({
      kind: "entry_marker",
      termLabel: entryTerm,
      dateRange: termToDateRange(entryTerm) || entryTerm,
      temporalState: "entry",
      courses: [],
      targetSchoolName: input.targetSchoolName,
    })
  }

  if (unscheduled.length > 0) {
    sections.push({
      kind: "unscheduled",
      termLabel: PLAN_UNSCHEDULED_LABEL,
      dateRange: "",
      temporalState: "planned",
      courses: sortCourses(unscheduled),
    })
  }

  const railLabels = sections.map((s) => s.termLabel)

  return { sections, railLabels }
}

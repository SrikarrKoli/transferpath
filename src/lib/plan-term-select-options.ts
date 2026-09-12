import { compareTermLabels, PLAN_UNSCHEDULED_LABEL } from "@/lib/build-plan-terms"
import {
  FOUNDATION_PHASE_BUCKET,
  MAJOR_PREREQ_PHASE_BUCKET,
  isReservedTimelinePhase,
} from "@/lib/timeline-phase-buckets"
import { getNextTransferTermOptions } from "@/lib/transfer-term-options"

const CALENDAR_SEASONS = ["Spring", "Summer", "Fall"] as const

function rollingCalendarTerms(now = new Date(), yearsBack = 2, yearsForward = 4): string[] {
  const y = now.getFullYear()
  const out: string[] = []
  for (let dy = -yearsBack; dy <= yearsForward; dy++) {
    const yr = y + dy
    for (const season of CALENDAR_SEASONS) {
      out.push(`${season} ${yr}`)
    }
  }
  return out
}

/** Term picker options derived from the student's data plus a rolling calendar window. */
export function buildPlanTermSelectOptions(
  courses: { semester_taken: string | null }[],
  expectedTransferTerm: string | null,
  now = new Date()
): { value: string; label: string }[] {
  const seen = new Set<string>()
  const calendar: string[] = []

  const add = (v: string) => {
    const t = v.trim()
    if (!t || seen.has(t) || isReservedTimelinePhase(t)) return
    seen.add(t)
    calendar.push(t)
  }

  for (const c of courses) {
    if (c.semester_taken?.trim()) add(c.semester_taken.trim())
  }
  if (expectedTransferTerm?.trim()) add(expectedTransferTerm.trim())
  for (const t of rollingCalendarTerms(now)) add(t)
  for (const t of getNextTransferTermOptions(6, now)) add(t)

  calendar.sort(compareTermLabels)

  return [
    ...calendar.map((label) => ({ value: label, label })),
    { value: FOUNDATION_PHASE_BUCKET, label: FOUNDATION_PHASE_BUCKET },
    { value: MAJOR_PREREQ_PHASE_BUCKET, label: MAJOR_PREREQ_PHASE_BUCKET },
    { value: "", label: PLAN_UNSCHEDULED_LABEL },
  ]
}

import {
  deadlineRowMatchesIntakeFilter,
  type RequirementDeadlineRow,
} from "@/lib/next-deadline"
import { parseExpectedTransferTerm } from "@/lib/transfer-term-options"
import { settingsPath } from "@/lib/settings-tab"
import type { TodayNeedsDate } from "@/types/overview"

function isApplicationDeadlineRow(row: RequirementDeadlineRow): boolean {
  const cat = row.category.toLowerCase()
  return cat.includes("application") || /transfer application/i.test(row.title)
}

/** When we hold no application deadline for the student's target intake. */
export function buildMissingApplicationDeadline(input: {
  deadlineRows: RequirementDeadlineRow[]
  targetUniversityId: string | null
  expectedTransferTerm: string | null
  targetSchoolName: string | null
  deadlineSourceUrl: string | null
  targetWebsite: string | null
}): TodayNeedsDate | null {
  if (!input.targetUniversityId || !input.expectedTransferTerm?.trim()) return null

  const parsed = parseExpectedTransferTerm(input.expectedTransferTerm)
  if (!parsed) return null

  const schoolApps = input.deadlineRows.filter(
    (r) => r.university_id === input.targetUniversityId && isApplicationDeadlineRow(r)
  )

  const forIntake = schoolApps.filter((r) =>
    deadlineRowMatchesIntakeFilter(r.academic_term, r.academic_year, parsed)
  )
  if (forIntake.length > 0) return null

  const schoolLabel = input.targetSchoolName?.trim() || "your target school"
  const termLabel = input.expectedTransferTerm.trim()

  const otherIntakes = [
    ...new Set(
      schoolApps
        .filter((r) => r.academic_term && r.academic_year)
        .map((r) => `${r.academic_term} ${r.academic_year}`)
    ),
  ]

  const detail =
    otherIntakes.length > 0
      ? `The ${schoolLabel} dates we hold are for ${otherIntakes.join(" and ")}. Their transfer admissions page publishes each cycle's dates when available.`
      : `Check ${schoolLabel}'s transfer admissions page for the ${termLabel} application deadline.`

  return {
    headline: `We do not have a ${termLabel} transfer application deadline for ${schoolLabel}.`,
    provenance: {
      what: detail,
    },
    officialUrl: input.deadlineSourceUrl ?? input.targetWebsite,
    recordHref: settingsPath("help"),
  }
}

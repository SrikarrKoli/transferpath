import type { UserCourseRow } from "@/lib/get-course-requirement-status"
import type { PrereqKey } from "@/lib/prereq-catalog"
import {
  academicDisplayToRequirementStatus,
  buildRecLettersApplicationStatus,
  buildSimpleApplicationStatus,
  buildTransferEssayApplicationStatus,
  mergedPrereqAcademicRow,
  type ChecklistCompleteByTaskKey,
} from "@/lib/requirements-checklist-sync"
import {
  fieldOfStudyOrDefault,
  fieldPrereqRowFraming,
  prereqKeysForField,
} from "@/lib/field-of-study"
import {
  formatDueDateDisplay,
  type NextDeadline,
  type RequirementDeadlineRow,
} from "@/lib/next-deadline"
import { PLANNER_CREDIT_TARGET } from "@/lib/planner-constants"
import { isChecklistTaskComplete } from "@/lib/requirements-checklist-sync"
import { settingsPath } from "@/lib/settings-tab"
import type { UniversityRequirementNote } from "@/types"
import type {
  RequirementWorkspaceCategory,
  RequirementWorkspaceItem,
  RequirementsWorkspaceData,
} from "@/types/requirements-workspace"

const PLAN_COURSES_HASH = "/dashboard/plan"

const COMMON_PREREQ_KEYS = new Set(["english_comp_1", "english_comp_2", "gov"])

export type RequirementsBuildProfile = {
  gpa: number | null
  credits_completed: number | null
  target_major: string | null
  field_of_study: string | null
  expected_transfer_term: string | null
  current_university: { name: string } | null
  target_university: { name: string } | null
}

type EssaySnippet = { id: string; content: string | null }

type AcademicDisplayStatus = "done" | "in-progress" | "warning"

type AcademicRow = {
  rowKey: string
  name: string
  required: string
  have: string
  status: AcademicDisplayStatus
}

const MINIMAL_FALLBACK_REQUIREMENT_NOTES: UniversityRequirementNote[] = [
  {
    id: "static-fallback-applytexas",
    university_id: null,
    sort_order: 0,
    title: "Texas application platforms",
    body: "Many Texas public institutions use ApplyTexas; others may require a separate portal. Confirm on each school\u2019s official application instructions.",
    optional_url: "https://www.goapplytexas.org/",
  },
]

function buildAcademicRows(
  userCourses: UserCourseRow[],
  gpa: number | null,
  credits: number | null,
  fieldRaw: string | null,
  checklist: ChecklistCompleteByTaskKey
): { common: AcademicRow[]; fieldSpecific: AcademicRow[]; profile: AcademicRow[] } {
  const field = fieldOfStudyOrDefault(fieldRaw)
  const keys = prereqKeysForField(field)
  const commonKeys = keys.filter((k) => COMMON_PREREQ_KEYS.has(k))
  const fieldKeys = keys.filter((k) => !COMMON_PREREQ_KEYS.has(k))

  const common: AcademicRow[] = commonKeys.map((k) =>
    mergedPrereqAcademicRow(
      k as PrereqKey,
      userCourses,
      checklist,
      "Common transfer prep (statewide context)"
    )
  )

  const fieldSpecific: AcademicRow[] = fieldKeys.map((k) =>
    mergedPrereqAcademicRow(
      k as PrereqKey,
      userCourses,
      checklist,
      fieldPrereqRowFraming(field, k as PrereqKey)
    )
  )

  let creditsHave: string
  let creditsStatus: AcademicDisplayStatus
  const creditsChecklistDone = isChecklistTaskComplete(checklist, "reach_30_credits")
  if (credits === null) {
    if (creditsChecklistDone) {
      creditsHave = "Marked complete on checklist"
      creditsStatus = "done"
    } else {
      creditsHave = "—"
      creditsStatus = "warning"
    }
  } else if (credits >= PLANNER_CREDIT_TARGET || creditsChecklistDone) {
    creditsHave = `${credits} completed`
    creditsStatus = "done"
  } else if (credits > 0) {
    creditsHave = `${credits} completed`
    creditsStatus = "in-progress"
  } else {
    creditsHave = `${credits} completed`
    creditsStatus = "warning"
  }

  let gpaHave: string
  let gpaStatus: AcademicDisplayStatus
  const gpaChecklistDone = isChecklistTaskComplete(checklist, "maintain_gpa_3_5")
  if (gpa === null) {
    if (gpaChecklistDone) {
      gpaHave = "Marked complete on checklist"
      gpaStatus = "done"
    } else {
      gpaHave = "—"
      gpaStatus = "warning"
    }
  } else if (gpa >= 3.0 || gpaChecklistDone) {
    gpaHave = gpa.toFixed(2)
    gpaStatus = "done"
  } else {
    gpaHave = gpa.toFixed(2)
    gpaStatus = "warning"
  }

  const profile: AcademicRow[] = [
    {
      rowKey: "credits",
      name: `Minimum ${PLANNER_CREDIT_TARGET} credit hours (planner target)`,
      required: "Planner target (verify with your school)",
      have: creditsHave,
      status: creditsStatus,
    },
    {
      rowKey: "gpa",
      name: "Minimum 3.0 GPA (common benchmark)",
      required: "Planner benchmark — confirm on official pages",
      have: gpaHave,
      status: gpaStatus,
    },
  ]

  return { common, fieldSpecific, profile }
}

function coursePrereqRowToItem(row: AcademicRow): RequirementWorkspaceItem {
  return {
    id: `academic-${row.rowKey}`,
    code: "—",
    title: row.name,
    credits: 0,
    equiv: `${row.required} · You: ${row.have}`,
    status: academicDisplayToRequirementStatus(row.status),
    ctaLabel: "Open Plan",
    href: PLAN_COURSES_HASH,
    provenanceBasis:
      "Matched by course name. TransferPath is a planner, not an equivalency service.",
  }
}

function profileMetricRowToItem(row: AcademicRow): RequirementWorkspaceItem {
  const isGpa = row.rowKey === "gpa"
  return {
    id: `academic-${row.rowKey}`,
    code: "—",
    title: row.name,
    credits: 0,
    equiv: `${row.required} · You: ${row.have}`,
    status: academicDisplayToRequirementStatus(row.status),
    ctaLabel: isGpa ? "Edit in Settings" : "Open Plan",
    href: isGpa ? "/dashboard/settings" : PLAN_COURSES_HASH,
    provenanceBasis: isGpa
      ? "Planner benchmark. We have not confirmed a published transfer minimum for your target school."
      : "Planner target, not an institutional minimum.",
  }
}

function buildDeadlineTimeline(deadlines: RequirementDeadlineRow[], todayYmd: string) {
  let assignedCurrent = false
  return deadlines.map((d) => {
    const passed = d.due_date < todayYmd
    const current = !passed && !assignedCurrent
    if (current) assignedCurrent = true
    const recommended =
      /priority|early/i.test(d.title) ||
      (d.description?.toLowerCase().includes("[priority]") ?? false)
    return {
      id: d.id,
      dateLabel: formatDueDateDisplay(d.due_date),
      label: d.title,
      scope: d.timelineScope,
      description: d.description?.trim() ? d.description.trim() : null,
      officialUrl: d.officialUrl,
      passed,
      current,
      recommended,
    }
  })
}

export type BuildRequirementsWorkspaceInput = {
  profile: RequirementsBuildProfile | null
  userCourses: UserCourseRow[]
  essays: EssaySnippet[]
  deadlines: RequirementDeadlineRow[]
  requirementNotes: UniversityRequirementNote[]
  nextDeadline: NextDeadline
  hasTargetUniversity: boolean
  timelineTodayYmd: string
  checklistCompleteByTaskKey: ChecklistCompleteByTaskKey
}

export function buildRequirementsWorkspaceData(
  input: BuildRequirementsWorkspaceInput
): RequirementsWorkspaceData {
  const profile = input.profile
  const gpa = profile?.gpa ?? null
  const credits = profile?.credits_completed ?? null
  const currentName = profile?.current_university?.name ?? "your college"
  const major = profile?.target_major ?? "your major"
  const fieldBucket = profile?.field_of_study ?? null

  const checklist = input.checklistCompleteByTaskKey

  const { common, fieldSpecific, profile: profileRows } = buildAcademicRows(
    input.userCourses,
    gpa,
    credits,
    fieldBucket,
    checklist
  )

  const essayStarted = input.essays.some((e) => (e.content ?? "").trim().length > 0)
  const essayApp = buildTransferEssayApplicationStatus(checklist, essayStarted)
  const recApp = buildRecLettersApplicationStatus(checklist)
  const transcriptApp = buildSimpleApplicationStatus("app-transcript", checklist, {
    missingEquiv: "Not requested",
    doneEquiv: "Requested",
  })
  const applyTexasApp = buildSimpleApplicationStatus("app-applytexas", checklist, {
    missingEquiv: "Confirm open dates on official pages",
    doneEquiv: "Account created",
  })

  const applicationItems: RequirementWorkspaceItem[] = [
    {
      id: "app-essay",
      code: "—",
      title: "Transfer essay",
      credits: 0,
      equiv: essayApp.equiv,
      status: essayApp.status,
      ctaLabel: "Start essay",
      href: "/dashboard/essay",
    },
    {
      id: "app-transcript",
      code: "—",
      title: `Official transcript from ${currentName}`,
      credits: 0,
      equiv: transcriptApp.equiv,
      status: transcriptApp.status,
      ctaLabel: "How to request",
      href: settingsPath("help", "request-transcript"),
    },
    {
      id: "app-rec",
      code: "—",
      title: "Recommendation letters",
      credits: 0,
      equiv: recApp.equiv,
      status: recApp.status,
      ctaLabel: "Who to ask",
      href: settingsPath("help", "rec-letters"),
    },
    {
      id: "app-applytexas",
      code: "—",
      title: "ApplyTexas application",
      credits: 0,
      equiv: applyTexasApp.equiv,
      status: applyTexasApp.status,
      ctaLabel: "ApplyTexas",
      href: "https://www.goapplytexas.org/",
      external: true,
    },
  ]

  const categories: RequirementWorkspaceCategory[] = []

  if (common.length > 0) {
    categories.push({
      id: "common",
      name: "Common transfer prep",
      items: common.map(coursePrereqRowToItem),
    })
  }

  if (fieldSpecific.length > 0) {
    categories.push({
      id: "field",
      name: `For your field · ${major}`,
      items: fieldSpecific.map(coursePrereqRowToItem),
    })
  }

  if (profileRows.length > 0) {
    categories.push({
      id: "profile",
      name: "On your profile",
      items: profileRows.map(profileMetricRowToItem),
    })
  }

  categories.push({
    id: "application",
    name: "Application materials",
    items: applicationItems,
  })

  // Fetcher already returns school notes first (by sort_order), then statewide.
  const planningNotes =
    input.requirementNotes.length > 0
      ? input.requirementNotes
      : MINIMAL_FALLBACK_REQUIREMENT_NOTES

  const hasSchoolNotes = planningNotes.some((n) => n.university_id != null)
  const hasStatewideNotes = planningNotes.some((n) => n.university_id == null)
  const planningNotesIntro =
    hasSchoolNotes && hasStatewideNotes
      ? "Notes for your target school, then Texas-wide transfer context — planning only, not official requirements."
      : hasSchoolNotes
        ? "Notes for your target school — planning only, not official requirements."
        : "Texas-wide transfer context that applies no matter which school you choose — planning only, not official requirements."

  // Subtitle removed: keep requirements header concise.
  return {
    header: {
      eyebrow: "Requirements",
      title: "Requirements",
      titleItalic: "",
      subtitle:
        "What stands between you and an application — each row says where the claim came from and how to act on it here.",
      fromInstitution: input.profile?.current_university?.name?.trim() || "Current school not set",
      toInstitution: input.profile?.target_university?.name?.trim() || "Target school not set",
      program: input.profile?.target_major?.trim() || input.profile?.field_of_study?.trim() || "Program not set",
      term: input.profile?.expected_transfer_term?.trim() || "Term not set",
    },
    categories,
    planningNotes: planningNotes.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      optionalUrl: n.optional_url,
    })),
    planningNotesIntro,
    timelineRows: buildDeadlineTimeline(input.deadlines, input.timelineTodayYmd),
  }
}

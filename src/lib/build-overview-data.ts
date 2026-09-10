import type { DashboardOverallReadinessBreakdown } from "@/lib/dashboard-overall-readiness"
import type { UserCourseRow } from "@/lib/get-course-requirement-status"
import { buildPlanTerms, termToDateRange } from "@/lib/build-plan-terms"
import {
  buildTaskDefinitions,
  type ChecklistProfileSummary,
} from "@/lib/checklist-task-definitions"
import {
  type ChecklistDerivedInput,
  isChecklistTaskDerivedInProgress,
  isChecklistTaskEffectivelyComplete,
} from "@/lib/checklist-derived-status"
import {
  getCompletenessLadderState,
  hasPathwayComplete,
  shouldShowReadinessScore,
} from "@/lib/completeness-ladder"
import { buildMissingApplicationDeadline } from "@/lib/missing-application-deadline"
import {
  type NextDeadline,
  type RequirementDeadlineRow,
} from "@/lib/next-deadline"
import {
  buildTodayReadinessInputs,
  todayReadinessFocusSentence,
} from "@/lib/today-readiness-display"
import type { ProvenanceProps } from "@/components/ui/provenance"
import type {
  OverviewData,
  TodayComingUpItem,
  TodayNextAction,
  TodayThisTerm,
} from "@/types/overview"

function dateLine(): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())
}

function shortDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt)
}

function categoryMeta(category: string): string {
  return category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function scopeChipLabel(
  scope: "target" | "statewide",
  targetSchoolName: string | null
): string {
  if (scope === "statewide") return "Statewide"
  return targetSchoolName?.trim() || "Your target school"
}

function deadlineProvenance(
  row: Pick<RequirementDeadlineRow, "officialUrl" | "sourceCheckedAt" | "timelineScope">,
  sourceName: string
): ProvenanceProps {
  return {
    level: "verified",
    source: sourceName,
    checkedAt: row.sourceCheckedAt,
    href: row.officialUrl,
  }
}

function dueDetailForDeadline(next: {
  daysUntil: number
  sourceCheckedAt: string | null
}): string | null {
  if (next.sourceCheckedAt) {
    return `${next.daysUntil} day${next.daysUntil === 1 ? "" : "s"} away`
  }
  return null
}

function deadlinePrimaryLabel(next: NonNullable<NextDeadline>): string {
  const title = next.title.toLowerCase()
  if (next.category === "financial_aid" || /fafsa|tasfa/.test(title)) {
    return "Open FAFSA"
  }
  if (next.category === "application" || /applytexas|application/.test(title)) {
    return "Open application page"
  }
  if (next.category === "housing") return "Open housing page"
  if (next.category === "registration") return "Open registration page"
  return "Open official page"
}

function buildNextFromDeadline(
  next: NonNullable<NextDeadline>,
  targetSchoolName: string | null
): TodayNextAction {
  const sourceName =
    next.timelineScope === "statewide"
      ? "Statewide milestone"
      : `${targetSchoolName?.trim() || "Target school"} admissions`

  const officialUrl = next.officialUrl?.trim() || null

  return {
    title: next.title,
    dateLabel: shortDateLabel(next.dueDateIso),
    scopeChips: [
      scopeChipLabel(next.timelineScope, targetSchoolName),
      categoryMeta(next.category),
    ],
    dueDetail: dueDetailForDeadline(next),
    primaryHref: officialUrl ?? "/dashboard/deadlines",
    primaryLabel: officialUrl ? deadlinePrimaryLabel(next) : "View in Tasks & deadlines",
    primaryExternal: Boolean(officialUrl),
    secondaryHref: officialUrl ? "/dashboard/deadlines" : undefined,
    secondaryLabel: officialUrl ? "Tasks & deadlines" : undefined,
    provenance: deadlineProvenance(next, sourceName),
  }
}

function buildNextFromChecklistTask(task: {
  task_key: string
  text: string
  action?: string
  actionHref?: string
}): TodayNextAction {
  const href = task.actionHref ?? "/dashboard/deadlines"
  return {
    title: task.text,
    dateLabel: null,
    scopeChips: ["Your task"],
    dueDetail: null,
    primaryHref: href,
    primaryLabel: task.action?.replace(/\s*→\s*$/, "").trim() || "Open task",
    primaryExternal: href.startsWith("http"),
    secondaryHref: "/dashboard/deadlines",
    secondaryLabel: "See all tasks",
    taskKey: task.task_key,
    provenance: {
      level: "estimated",
      basis: "Your task · no institutional date attached",
    },
  }
}

function buildComingUpFromDeadline(
  row: RequirementDeadlineRow,
  targetSchoolName: string | null,
  excludeTitle: string | null
): TodayComingUpItem | null {
  if (excludeTitle && row.title === excludeTitle) return null
  const sourceName =
    row.timelineScope === "statewide"
      ? "Statewide milestone"
      : `${targetSchoolName?.trim() || "Target school"} admissions`

  const officialUrl = row.officialUrl?.trim() || null
  return {
    dateLabel: shortDateLabel(row.due_date),
    title: row.title,
    meta: categoryMeta(row.category),
    scopeChip: scopeChipLabel(row.timelineScope, targetSchoolName),
    href: officialUrl ?? "/dashboard/deadlines",
    actionLabel: officialUrl ? "Open official page" : "View",
    provenance: deadlineProvenance(row, sourceName),
  }
}

function buildComingUpFromTask(task: {
  task_key: string
  text: string
  action?: string
  actionHref?: string
}): TodayComingUpItem {
  return {
    dateLabel: "No date",
    title: task.text,
    meta: "Your task · no institutional date attached",
    href: task.actionHref ?? "/dashboard/deadlines",
    actionLabel: task.action?.replace(/\s*→\s*$/, "").trim() || "Open",
    taskKey: task.task_key,
  }
}

function resolveIncompleteTasks(
  checklistProfile: ChecklistProfileSummary,
  checklistCompleteByTaskKey: Record<string, boolean | undefined>,
  derived: ChecklistDerivedInput
) {
  const sections = buildTaskDefinitions(checklistProfile)
  const out: {
    task_key: string
    text: string
    action?: string
    actionHref?: string
    priority: number
  }[] = []

  for (const section of sections) {
    for (const task of section.tasks) {
      const manual = checklistCompleteByTaskKey[task.task_key]
      if (isChecklistTaskEffectivelyComplete(task.task_key, manual, derived)) continue
      const priority =
        section.title === "Application Tasks"
          ? 80
          : section.title === "Academic Tasks"
            ? 60
            : 40
      out.push({
        task_key: task.task_key,
        text: task.text,
        action: task.action,
        actionHref: task.actionHref,
        priority: isChecklistTaskDerivedInProgress(task.task_key, derived) ? priority + 5 : priority,
      })
    }
  }

  out.sort((a, b) => b.priority - a.priority)
  return out
}

function buildThisTerm(input: {
  timelineCourses: {
    id: string
    course_name: string
    status: "completed" | "in_progress" | "planned"
    semester_taken: string | null
  }[]
  expectedTransferTerm: string | null
  targetSchoolName: string | null
}): TodayThisTerm | null {
  const plan = buildPlanTerms({
    courses: input.timelineCourses,
    expectedTransferTerm: input.expectedTransferTerm,
    targetSchoolName: input.targetSchoolName,
  })

  const current = plan.sections.find(
    (s) => s.kind === "calendar" && s.temporalState === "current"
  )
  if (!current) return null

  const inProgress = current.courses.filter((c) => c.status === "in_progress")
  const planned = current.courses.filter((c) => c.status === "planned")
  const completed = current.courses.filter((c) => c.status === "completed")

  let summary = "No courses in this term"
  if (inProgress.length > 0) {
    summary = `${inProgress.length} course${inProgress.length === 1 ? "" : "s"} in progress`
  } else if (planned.length > 0) {
    summary = `${planned.length} course${planned.length === 1 ? "" : "s"} planned`
  } else if (completed.length > 0) {
    summary = `${completed.length} course${completed.length === 1 ? "" : "s"} completed`
  }

  const preview = inProgress[0] ?? planned[0] ?? completed[0] ?? null

  return {
    termLabel: current.termLabel,
    dateRange: current.dateRange || termToDateRange(current.termLabel),
    summary,
    previewTitle: preview?.course_name ?? null,
    previewMeta: preview ? preview.status.replace(/_/g, " ") : null,
  }
}

export function buildOverviewData(input: {
  displayName: string
  currentSchoolName: string | null
  targetSchoolName: string | null
  targetUniversityId: string | null
  targetWebsite: string | null
  deadlineSourceUrl: string | null
  targetMajor: string | null
  transferTerm: string | null
  overallReadinessScore: number
  readinessBreakdown: DashboardOverallReadinessBreakdown
  nextDeadline: NextDeadline
  deadlineRows: RequirementDeadlineRow[]
  timelineCourses: {
    id: string
    course_name: string
    status: "completed" | "in_progress" | "planned"
    semester_taken: string | null
  }[]
  checklistProfile: ChecklistProfileSummary
  checklistCompleteByTaskKey: Record<string, boolean | undefined>
  userCourseRows: UserCourseRow[]
  fieldOfStudy: string | null
  gpa: number | null
  creditsCompleted: number | null
  essayStarted: boolean
  hasTargetUniversity: boolean
  courseCount: number
}): OverviewData {
  const score = Math.round(Math.min(100, Math.max(0, input.overallReadinessScore)))
  const pathwayComplete = hasPathwayComplete({
    hasTargetSchool: input.hasTargetUniversity,
    hasExpectedTransferTerm: Boolean(input.transferTerm?.trim()),
  })

  const completenessLadderState = getCompletenessLadderState({
    hasTargetSchool: input.hasTargetUniversity,
    hasExpectedTransferTerm: Boolean(input.transferTerm?.trim()),
    courseCount: input.courseCount,
    nearestDeadlineDaysUntil: input.nextDeadline?.daysUntil ?? null,
  })

  if (!pathwayComplete) {
    return {
      completenessLadderState,
      dateLine: dateLine(),
      pathwayPrompt: {
        title: "Where are you hoping to transfer, and when?",
        body: "Those two answers decide which deadlines, requirements and terms we can show you. Everything else on TransferPath follows from them, so there is nothing useful we can put on this screen until we have them.",
        settingsHref: "/dashboard/settings",
      },
      nextAction: null,
      comingUp: [],
      thisTerm: null,
      needsDate: null,
      readiness: null,
    }
  }

  const derived: ChecklistDerivedInput = {
    userCourses: input.userCourseRows,
    fieldOfStudy: input.fieldOfStudy,
    creditsCompleted: input.creditsCompleted,
    gpa: input.gpa,
    essayHasContent: input.essayStarted,
  }

  const incompleteTasks = resolveIncompleteTasks(
    input.checklistProfile,
    input.checklistCompleteByTaskKey,
    derived
  )

  let nextAction: TodayNextAction | null = null
  if (input.nextDeadline) {
    nextAction = buildNextFromDeadline(input.nextDeadline, input.targetSchoolName)
  } else if (input.courseCount < 1 && incompleteTasks.length === 0) {
    nextAction = {
      title: "Add your first course",
      dateLabel: null,
      scopeChips: [input.transferTerm?.trim() || "Your plan"],
      dueDetail: null,
      primaryHref: "/dashboard/plan",
      primaryLabel: "Open Plan",
      provenance: {
        level: "estimated",
        basis: "Your plan starts with the courses you have taken and intend to take before your entry term.",
      },
    }
  } else if (incompleteTasks[0]) {
    nextAction = buildNextFromChecklistTask(incompleteTasks[0])
  }

  const comingUp: TodayComingUpItem[] = []
  const nextTitle = input.nextDeadline?.title ?? null
  for (const row of input.deadlineRows) {
    if (comingUp.length >= 2) break
    const item = buildComingUpFromDeadline(row, input.targetSchoolName, nextTitle)
    if (item) comingUp.push(item)
  }

  let taskIdx = nextAction && !input.nextDeadline ? 1 : 0
  while (comingUp.length < 2 && incompleteTasks[taskIdx]) {
    const task = incompleteTasks[taskIdx]
    if (!nextAction || task.text !== nextAction.title) {
      comingUp.push(buildComingUpFromTask(task))
    }
    taskIdx++
  }

  const thisTerm = buildThisTerm({
    timelineCourses: input.timelineCourses,
    expectedTransferTerm: input.transferTerm,
    targetSchoolName: input.targetSchoolName,
  })

  const needsDate = buildMissingApplicationDeadline({
    deadlineRows: input.deadlineRows,
    targetUniversityId: input.targetUniversityId,
    expectedTransferTerm: input.transferTerm,
    targetSchoolName: input.targetSchoolName,
    deadlineSourceUrl: input.deadlineSourceUrl,
    targetWebsite: input.targetWebsite,
  })

  const readiness = shouldShowReadinessScore(completenessLadderState)
    ? {
        score,
        oneLiner: "How complete your plan is — not a prediction of admission.",
        inputs: buildTodayReadinessInputs({
          breakdown: input.readinessBreakdown,
          userCourses: input.userCourseRows,
          fieldOfStudy: input.fieldOfStudy,
          creditsCompleted: input.creditsCompleted,
          gpa: input.gpa,
          essayStarted: input.essayStarted,
          hasTargetUniversity: input.hasTargetUniversity,
          expectedTransferTerm: input.transferTerm,
          displayName: input.displayName,
        }),
        focusSentence: todayReadinessFocusSentence(
          input.readinessBreakdown,
          input.creditsCompleted
        ),
        showGpaNullNote: input.gpa == null,
      }
    : null

  return {
    completenessLadderState,
    dateLine: dateLine(),
    pathwayPrompt: null,
    nextAction,
    comingUp,
    thisTerm,
    needsDate,
    readiness,
  }
}

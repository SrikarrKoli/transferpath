import {
  buildTaskDefinitions,
  CHECKLIST_APPLICATION_TASK_KEYS,
  type ChecklistProfileSummary,
} from "@/lib/checklist-task-definitions"
import {
  type ChecklistDerivedInput,
  isChecklistTaskDerivedInProgress,
  isChecklistTaskEffectivelyComplete,
} from "@/lib/checklist-derived-status"
import { buildMissingApplicationDeadline } from "@/lib/missing-application-deadline"
import {
  serverTodayYmdUtc,
  type RequirementDeadlineRow,
} from "@/lib/next-deadline"
import type { ProvenanceProps } from "@/components/ui/provenance"
import type { PlanStatus } from "@/components/ui/status"
import type {
  TasksDeadlinesData,
  TasksDeadlinesDeadlineRow,
  TasksDeadlinesFilterCounts,
  TasksDeadlinesTaskRow,
} from "@/types/tasks-deadlines"

const ERRAND_SECTIONS = new Set(["Application Tasks", "Preparation Tasks"])

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

function formatCompletedAt(iso: string | null | undefined): string | undefined {
  if (!iso?.trim()) return undefined
  const d = new Date(iso.trim())
  if (Number.isNaN(d.getTime())) return undefined
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d)
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

function daysBetweenUtc(fromYmd: string, toYmd: string): number {
  const a = new Date(`${fromYmd}T12:00:00.000Z`)
  const b = new Date(`${toYmd}T12:00:00.000Z`)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function countdownLabel(daysUntil: number): string {
  return `${daysUntil} day${daysUntil === 1 ? "" : "s"} away`
}

function deadlineRowFromDb(
  row: RequirementDeadlineRow,
  targetSchoolName: string | null,
  today: string
): TasksDeadlinesDeadlineRow {
  const sourceName =
    row.timelineScope === "statewide"
      ? "Statewide milestone"
      : `${targetSchoolName?.trim() || "Target school"} admissions`

  const daysUntil = daysBetweenUtc(today, row.due_date)

  return {
    id: row.id,
    dateLabel: shortDateLabel(row.due_date),
    dueDateIso: row.due_date,
    countdownLabel: row.sourceCheckedAt ? countdownLabel(daysUntil) : null,
    title: row.title,
    scopeChip: scopeChipLabel(row.timelineScope, targetSchoolName),
    categoryMeta: categoryMeta(row.category),
    officialUrl: row.officialUrl,
    provenance: deadlineProvenance(row, sourceName),
  }
}

function sectionCategoryLabel(sectionTitle: string): "Application" | "Preparation" {
  return sectionTitle === "Application Tasks" ? "Application" : "Preparation"
}

function taskStatus(
  taskKey: string,
  manualComplete: boolean | undefined,
  derived: ChecklistDerivedInput
): PlanStatus {
  if (isChecklistTaskEffectivelyComplete(taskKey, manualComplete, derived)) return "done"
  if (isChecklistTaskDerivedInProgress(taskKey, derived)) return "in_progress"
  return "not_started"
}

function openTaskMeta(
  taskKey: string,
  status: PlanStatus,
  derived: ChecklistDerivedInput
): string | undefined {
  if (status === "in_progress" && (taskKey === "write_essay_part1" || taskKey === "write_essay_part2")) {
    return derived.essayHasContent ? "draft saved" : undefined
  }
  return undefined
}

function buildErrandTasks(input: {
  profile: ChecklistProfileSummary
  completionMap: Record<string, { is_complete: boolean; completed_at: string | null } | undefined>
  derived: ChecklistDerivedInput
}): { open: TasksDeadlinesTaskRow[]; completed: TasksDeadlinesTaskRow[] } {
  const sections = buildTaskDefinitions(input.profile).filter((s) => ERRAND_SECTIONS.has(s.title))
  const open: TasksDeadlinesTaskRow[] = []
  const completed: TasksDeadlinesTaskRow[] = []

  for (const section of sections) {
    const categoryLabel = sectionCategoryLabel(section.title)
    for (const task of section.tasks) {
      const completion = input.completionMap[task.task_key]
      const manual = completion?.is_complete
      const status = taskStatus(task.task_key, manual, input.derived)
      const done = status === "done"

      const action =
        task.action && task.actionHref
          ? {
              label: task.action.replace(/\s*→\s*$/, "").trim(),
              href: task.actionHref,
            }
          : undefined

      if (done) {
        const doneLabel = formatCompletedAt(completion?.completed_at)
        completed.push({
          id: task.task_key,
          title: task.text,
          categoryLabel,
          status,
          done: true,
          meta: doneLabel ? `Done ${doneLabel}` : "Done",
          action,
        })
      } else {
        const progressMeta = openTaskMeta(task.task_key, status, input.derived)
        const metaParts = [categoryLabel, progressMeta].filter(Boolean).join(" · ")
        open.push({
          id: task.task_key,
          title: task.text,
          categoryLabel,
          status,
          done: false,
          meta: metaParts,
          action,
        })
      }
    }
  }

  return { open, completed }
}

function tasksMissingDateProvenance(sharedWhat: string): string {
  const match = sharedWhat.match(
    /^The .+ dates we hold are for (.+)\. Their transfer admissions page publishes each cycle's dates when available\.$/
  )
  if (match) {
    return `We do not have this date. The dates we hold are for ${match[1]}, so they are not shown on your plan.`
  }
  return `We do not have this date. ${sharedWhat}`
}

function buildFilterCounts(input: {
  upcomingDeadlines: TasksDeadlinesDeadlineRow[]
  openTasks: TasksDeadlinesTaskRow[]
  completedTasks: TasksDeadlinesTaskRow[]
  missingDate: TasksDeadlinesData["missingDate"]
}): TasksDeadlinesFilterCounts {
  return {
    upcoming: input.upcomingDeadlines.length + input.openTasks.length,
    tasks: input.openTasks.length,
    deadlines: input.upcomingDeadlines.length,
    completed: input.completedTasks.length,
    missing_dates: input.missingDate ? 1 : 0,
  }
}

export function buildTasksDeadlinesData(input: {
  profile: ChecklistProfileSummary
  completionMap: Record<string, { is_complete: boolean; completed_at: string | null } | undefined>
  deadlineRows: RequirementDeadlineRow[]
  targetUniversityId: string | null
  targetSchoolName: string | null
  targetWebsite: string | null
  deadlineSourceUrl: string | null
  derived: ChecklistDerivedInput
}): TasksDeadlinesData {
  const cur = input.profile.currentUniversityName?.trim() || "your community college"
  const tgt = input.profile.targetUniversityName?.trim() || "your target university"
  const program = input.profile.targetMajor?.trim() || "your program"
  const term = input.profile.expectedTransferTerm?.trim() || "your entry term"

  const today = serverTodayYmdUtc()
  const upcomingDeadlines = input.deadlineRows.map((row) =>
    deadlineRowFromDb(row, input.targetSchoolName, today)
  )

  const { open: openTasks, completed: completedTasks } = buildErrandTasks({
    profile: input.profile,
    completionMap: input.completionMap,
    derived: input.derived,
  })

  const needsDate = buildMissingApplicationDeadline({
    deadlineRows: input.deadlineRows,
    targetUniversityId: input.targetUniversityId,
    expectedTransferTerm: input.profile.expectedTransferTerm,
    targetSchoolName: input.targetSchoolName,
    deadlineSourceUrl: input.deadlineSourceUrl,
    targetWebsite: input.targetWebsite,
  })

  const missingDate = needsDate
    ? {
        headline: `${input.profile.expectedTransferTerm?.trim() || "Your entry term"} transfer application deadline · ${input.targetSchoolName?.trim() || "your target school"}`,
        provenanceWhat: tasksMissingDateProvenance(needsDate.provenance.what),
        officialUrl: needsDate.officialUrl,
        recordHref: needsDate.recordHref,
      }
    : null

  const filterCounts = buildFilterCounts({
    upcomingDeadlines,
    openTasks,
    completedTasks,
    missingDate,
  })

  return {
    header: {
      fromInstitution: cur,
      toInstitution: tgt,
      program,
      term,
    },
    filterCounts,
    upcomingDeadlines,
    openTasks,
    completedTasks,
    missingDate,
  }
}

/** Category slug stored in user_checklist_items.category */
export function checklistCategoryForTaskKey(taskKey: string): "application" | "preparation" {
  if (CHECKLIST_APPLICATION_TASK_KEYS.has(taskKey)) return "application"
  return "preparation"
}

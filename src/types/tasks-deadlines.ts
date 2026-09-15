import type { ProvenanceProps } from "@/components/ui/provenance"
import type { PlanStatus } from "@/components/ui/status"

export type TasksDeadlinesFilterId =
  | "upcoming"
  | "tasks"
  | "deadlines"
  | "completed"
  | "missing_dates"

export type TasksDeadlinesDeadlineRow = {
  id: string
  dateLabel: string
  dueDateIso: string
  /** Only when `sourceCheckedAt` is set — same rule as Today. */
  countdownLabel: string | null
  title: string
  scopeChip: string
  categoryMeta: string
  officialUrl: string | null
  provenance: ProvenanceProps
}

export type TasksDeadlinesTaskRow = {
  id: string
  title: string
  categoryLabel: "Application" | "Preparation"
  status: PlanStatus
  done: boolean
  meta?: string
  action?: { label: string; href: string }
}

export type TasksDeadlinesMissingDate = {
  headline: string
  provenanceWhat: string
  officialUrl: string | null
  recordHref: string
}

export type TasksDeadlinesFilterCounts = Record<TasksDeadlinesFilterId, number>

export type TasksDeadlinesData = {
  header: {
    fromInstitution: string
    toInstitution: string
    program: string
    term: string
  }
  filterCounts: TasksDeadlinesFilterCounts
  upcomingDeadlines: TasksDeadlinesDeadlineRow[]
  openTasks: TasksDeadlinesTaskRow[]
  completedTasks: TasksDeadlinesTaskRow[]
  missingDate: TasksDeadlinesMissingDate | null
}

import type { PlanStatus } from "@/components/ui/status"
import type { PlanCourseStatus } from "@/types/plan-terms"

/**
 * Maps stored course status to Plan UI vocabulary.
 * Calendar placement does not change a course’s recorded progress.
 */
export function courseStatusToPlanDisplayStatus(
  status: PlanCourseStatus,
  _options: { hasCalendarTerm: boolean }
): PlanStatus {
  if (status === "completed") return "done"
  if (status === "in_progress") return "in_progress"
  return "not_started"
}

export function planDisplayStatusLabel(status: PlanCourseStatus): string {
  if (status === "completed") return "Completed"
  if (status === "in_progress") return "In progress"
  return "Planned"
}

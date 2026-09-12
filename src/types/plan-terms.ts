export type PlanCourseStatus = "completed" | "in_progress" | "planned"

export type PlanCourseInput = {
  id: string
  course_name: string
  status: PlanCourseStatus
  semester_taken: string | null
}

export type PlanTermKind = "calendar" | "entry_marker" | "unscheduled"

export type PlanTermTemporalState = "completed" | "current" | "planned" | "entry"

export type PlanTermCourse = {
  id: string
  course_name: string
  status: PlanCourseStatus
  semester_taken: string | null
}

export type PlanTermSection = {
  kind: PlanTermKind
  termLabel: string
  dateRange: string
  temporalState: PlanTermTemporalState
  courses: PlanTermCourse[]
  /** Populated on entry-term marker sections. */
  targetSchoolName?: string | null
}

export type PlanTermsResult = {
  sections: PlanTermSection[]
  /** Ordered labels for the term rail (Slice B UI). */
  railLabels: string[]
}

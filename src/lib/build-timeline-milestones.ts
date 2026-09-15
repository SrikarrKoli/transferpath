import {
  buildTaskDefinitions,
  CHECKLIST_APPLICATION_TASK_KEYS,
  type ChecklistProfileSummary,
} from "@/lib/checklist-task-definitions"
import { formatDueDateDisplay, type NextDeadline, type RequirementDeadlineRow } from "@/lib/next-deadline"
import {
  FOUNDATION_PHASE_BUCKET,
  isCalendarTermBucket,
  MAJOR_PREREQ_PHASE_BUCKET,
} from "@/lib/timeline-phase-buckets"
import type {
  TimelineMilestone,
  TimelineMilestonesResult,
  TimelineMilestoneState,
  TimelineRecordedCourse,
  TimelineTaskItem,
} from "@/types/timeline-milestone"

export type TimelineCourseInput = {
  id: string
  course_name: string
  status: "completed" | "in_progress" | "planned"
  semester_taken: string | null
}

const UNASSIGNED_BUCKET = ""

const ESSAY_TASK_KEYS = new Set(["write_essay_part1", "write_essay_part2"])

function termSortKey(label: string): number {
  const m = /^(\w+)\s+(\d{4})$/i.exec(label.trim())
  if (!m) return 1e12
  const season = m[1].toLowerCase()
  const year = parseInt(m[2], 10)
  let month = 6
  if (season === "spring") month = 2
  else if (season === "summer") month = 6
  else if (season === "fall") month = 9
  else return 1e12 + label.charCodeAt(0)
  return year * 12 + month
}

function compareBucketKeys(a: string, b: string): number {
  if (a === UNASSIGNED_BUCKET && b !== UNASSIGNED_BUCKET) return 1
  if (b === UNASSIGNED_BUCKET && a !== UNASSIGNED_BUCKET) return -1
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

function termToDateRange(term: string): string {
  const m = /^(\w+)\s+(\d{4})$/i.exec(term.trim())
  if (!m) return ""
  const season = m[1].toLowerCase()
  const year = m[2]
  if (season === "fall") return `Sep — Dec ${year}`
  if (season === "spring") return `Jan — May ${year}`
  if (season === "summer") return `Jun — Aug ${year}`
  return ""
}

function coursesState(
  courses: TimelineRecordedCourse[],
  activeAssigned: { current: boolean }
): TimelineMilestoneState {
  if (courses.length === 0) return "upcoming"
  const allDone = courses.every((c) => c.status === "completed")
  const anyActive =
    courses.some((c) => c.status === "in_progress") ||
    courses.some((c) => c.status === "planned")
  if (allDone) return "done"
  if (!activeAssigned.current && anyActive) {
    activeAssigned.current = true
    return "active"
  }
  return "upcoming"
}

function summarizeFoundation(
  courses: TimelineRecordedCourse[],
  gpa: number | null,
  targetSchool: string | null
): string {
  if (courses.length === 0) {
    return "Add core coursework you have completed or plan to take at your current school."
  }
  const completed = courses.filter((c) => c.status === "completed").length
  const tgt = targetSchool?.trim() || "your target program"
  if (completed === courses.length) {
    return gpa != null
      ? `${completed} foundation course${completed === 1 ? "" : "s"} completed · GPA ${gpa.toFixed(2)} on profile.`
      : `${completed} foundation course${completed === 1 ? "" : "s"} completed — strong base for ${tgt}.`
  }
  return `Track general education and core credits that support your path to ${tgt}.`
}

function summarizeMajorPrereqs(courses: TimelineRecordedCourse[], targetMajor: string | null): string {
  const major = targetMajor?.trim() || "your intended major"
  if (courses.length === 0) {
    return `Add courses required for ${major} at your target school — use any name from your degree audit or transfer guide.`
  }
  const done = courses.filter((c) => c.status === "completed").length
  if (done === courses.length) {
    return `All ${courses.length} prerequisite course${courses.length === 1 ? "" : "s"} you listed are marked complete.`
  }
  return `${courses.length} prerequisite course${courses.length === 1 ? "" : "s"} on your timeline — update status as you progress.`
}

function pickApplicationDeadline(
  rows: RequirementDeadlineRow[],
  next: NextDeadline
): RequirementDeadlineRow | null {
  const appish = rows.filter((r) => {
    const c = r.category.toLowerCase()
    return c.includes("application") || c.includes("priority") || c.includes("admission")
  })
  if (appish[0]) return appish[0]
  if (next) {
    return {
      id: "next",
      title: next.title,
      due_date: next.dueDateIso,
      category: "application",
      description: null,
      university_id: null,
      academic_term: null,
      academic_year: null,
      timelineScope: next.timelineScope,
      officialUrl: next.officialUrl,
      sourceCheckedAt: next.sourceCheckedAt,
    }
  }
  return null
}

function incompleteTasks(
  profile: ChecklistProfileSummary,
  completeMap: Record<string, boolean | undefined>,
  allowedKeys: Set<string>,
  limit: number
): TimelineTaskItem[] {
  const sections = buildTaskDefinitions(profile)
  const out: TimelineTaskItem[] = []
  for (const section of sections) {
    for (const task of section.tasks) {
      if (!allowedKeys.has(task.task_key)) continue
      if (completeMap[task.task_key]) continue
      out.push({
        task_key: task.task_key,
        text: task.text,
        href: task.actionHref ?? "/dashboard/deadlines",
        done: false,
      })
      if (out.length >= limit) return out
    }
  }
  return out
}

function attachRecordedAndTasks(
  milestones: TimelineMilestone[],
  activeAssigned: { current: boolean }
): TimelineMilestone[] {
  return milestones.map((m) => {
    if (m.kind === "essay" || m.kind === "application" || m.kind === "target") {
      return m
    }
    if (m.state === "done") {
      return { ...m, recorded: m.courses, tasks: [], isCurrent: false }
    }
    if (m.isCurrent) {
      return { ...m, recorded: [], tasks: m.tasks }
    }
    return { ...m, recorded: [], tasks: [] }
  })
}

export function buildTimelineMilestones(input: {
  courses: TimelineCourseInput[]
  profile: ChecklistProfileSummary
  gpa: number | null
  creditsCompleted: number | null
  checklistCompleteByTaskKey: Record<string, boolean | undefined>
  deadlineRows: RequirementDeadlineRow[]
  nextDeadline: NextDeadline
  essayStarted: boolean
}): TimelineMilestonesResult {
  const buckets = new Map<string, TimelineRecordedCourse[]>()
  for (const c of input.courses) {
    const raw = c.semester_taken?.trim() ?? ""
    const key = raw === "" ? UNASSIGNED_BUCKET : raw
    const list = buckets.get(key) ?? []
    list.push({
      id: c.id,
      course_name: c.course_name,
      status: c.status,
      semester_taken: c.semester_taken,
    })
    buckets.set(key, list)
  }

  for (const list of buckets.values()) {
    list.sort((a, b) => a.course_name.localeCompare(b.course_name))
  }

  const calendarKeys = [...buckets.keys()]
    .filter((k) => isCalendarTermBucket(k) || k === UNASSIGNED_BUCKET)
    .sort(compareBucketKeys)

  const foundationExplicit = buckets.get(FOUNDATION_PHASE_BUCKET) ?? []
  const majorPrereqCourses = buckets.get(MAJOR_PREREQ_PHASE_BUCKET) ?? []

  const calendarOnly = calendarKeys.filter((k) => k !== UNASSIGNED_BUCKET)
  const firstCalendarKey = calendarOnly[0]
  const unassigned = buckets.get(UNASSIGNED_BUCKET) ?? []

  const foundationCourses = [
    ...foundationExplicit,
    ...(firstCalendarKey ? buckets.get(firstCalendarKey)! : []),
    ...(calendarOnly.length === 0 ? unassigned : []),
  ]

  const targetSchool = input.profile.targetUniversityName
  const targetMajor = input.profile.targetMajor
  const transferTerm = input.profile.expectedTransferTerm?.trim()
  const hasTarget = Boolean(targetSchool && transferTerm)

  const activeAssigned = { current: false }
  const draft: TimelineMilestone[] = []

  let foundationState: TimelineMilestoneState
  if (foundationCourses.length === 0) {
    if (!activeAssigned.current) {
      activeAssigned.current = true
      foundationState = "active"
    } else {
      foundationState = "upcoming"
    }
  } else {
    foundationState = coursesState(foundationCourses, activeAssigned)
  }
  draft.push({
    key: "foundation",
    kind: "foundation",
    termLabel: firstCalendarKey || FOUNDATION_PHASE_BUCKET,
    stepIndex: 0,
    totalSteps: 0,
    dateRange:
      foundationState === "active"
        ? "Now"
        : firstCalendarKey
          ? termToDateRange(firstCalendarKey) || "—"
          : "—",
    isCurrent: foundationState === "active",
    phaseTitle: "Foundation & core",
    summary: summarizeFoundation(foundationCourses, input.gpa, targetSchool),
    state: foundationState,
    recorded: [],
    tasks: [],
    editableCourses: true,
    showCoursePanel: true,
    courses: foundationCourses,
  })

  let majorState: TimelineMilestoneState
  if (majorPrereqCourses.length === 0) {
    if (foundationState === "done" && !activeAssigned.current) {
      activeAssigned.current = true
      majorState = "active"
    } else {
      majorState = "upcoming"
    }
  } else {
    majorState = coursesState(majorPrereqCourses, activeAssigned)
  }

  draft.push({
    key: "major-prereqs",
    kind: "major_prereqs",
    termLabel: MAJOR_PREREQ_PHASE_BUCKET,
    stepIndex: 0,
    totalSteps: 0,
    dateRange: majorState === "active" ? "Now" : "Your requirements",
    isCurrent: majorState === "active",
    phaseTitle: "Major prerequisites",
    summary: summarizeMajorPrereqs(majorPrereqCourses, targetMajor),
    state: majorState,
    recorded: [],
    tasks: [],
    editableCourses: true,
    showCoursePanel: true,
    courses: majorPrereqCourses,
  })

  const essayTasks = incompleteTasks(
    input.profile,
    input.checklistCompleteByTaskKey,
    ESSAY_TASK_KEYS,
    4
  )
  const essayDone =
    input.checklistCompleteByTaskKey.write_essay_part1 &&
    input.checklistCompleteByTaskKey.write_essay_part2
  let essayState: TimelineMilestoneState
  if (essayDone) {
    essayState = "done"
  } else if (!activeAssigned.current) {
    activeAssigned.current = true
    essayState = "active"
  } else {
    essayState = input.essayStarted ? "active" : "upcoming"
  }

  const tgt = targetSchool?.trim() || "your target university"
  draft.push({
    key: "essay",
    kind: "essay",
    termLabel: "Essay workspace",
    stepIndex: 0,
    totalSteps: 0,
    dateRange: essayState === "active" ? "Now" : "—",
    isCurrent: essayState === "active",
    phaseTitle: "Essay writing",
    summary: input.essayStarted
      ? `Continue your transfer essays for ${tgt} in the essay workspace.`
      : `Draft your personal statement and supplemental essays for ${tgt}.`,
    state: essayState,
    recorded: [],
    tasks: essayTasks.length > 0 ? essayTasks : [
      {
        task_key: "open_essay",
        text: `Open essay workspace for ${tgt}`,
        href: "/dashboard/essay",
        done: false,
      },
    ],
    editableCourses: false,
    courses: [],
  })

  const appDeadline = pickApplicationDeadline(input.deadlineRows, input.nextDeadline)
  if (targetSchool && (appDeadline || transferTerm)) {
    const isCurrent = !activeAssigned.current
    if (isCurrent) activeAssigned.current = true
    const appTasks = incompleteTasks(
      input.profile,
      input.checklistCompleteByTaskKey,
      CHECKLIST_APPLICATION_TASK_KEYS,
      6
    )
    let summary = `Prepare and submit materials for ${targetSchool}.`
    if (appDeadline?.description?.trim()) summary = appDeadline.description.trim()
    else if (appDeadline) {
      summary = `${appDeadline.title} — due ${formatDueDateDisplay(appDeadline.due_date)}.`
    }

    draft.push({
      key: "application",
      kind: "application",
      termLabel: transferTerm ?? "Application window",
      stepIndex: 0,
      totalSteps: 0,
      dateRange: appDeadline ? formatDueDateDisplay(appDeadline.due_date) : "—",
      isCurrent,
      phaseTitle: "Application submission",
      summary,
      state: isCurrent ? "active" : "upcoming",
      recorded: [],
      tasks: appTasks,
      editableCourses: false,
      courses: [],
    })
  }

  if (hasTarget) {
    draft.push({
      key: "target",
      kind: "target",
      termLabel: transferTerm!,
      stepIndex: 0,
      totalSteps: 0,
      dateRange: termToDateRange(transferTerm!) || transferTerm!,
      isCurrent: false,
      phaseTitle: `${targetSchool!.trim()} · Enrollment`,
      summary: `Plan upper-division coursework at ${targetSchool} for ${transferTerm}.`,
      state: "target",
      recorded: [],
      tasks: [],
      showTargetBadge: true,
      editableCourses: false,
      courses: [],
    })
  }

  const totalSteps = draft.length
  let milestones = draft.map((m, i) => ({
    ...m,
    stepIndex: i + 1,
    totalSteps,
  }))

  milestones = attachRecordedAndTasks(milestones, activeAssigned)

  const mappedSemesters = Math.max(
    1,
    calendarOnly.length + (majorPrereqCourses.length > 0 ? 1 : 0) + (hasTarget ? 1 : 0)
  )

  return { milestones, mappedSemesters, hasTarget }
}

import type { DashboardOverallReadinessBreakdown } from "@/lib/dashboard-overall-readiness"
import { actionableChecklistTaskKeysForReadiness } from "@/lib/checklist-task-keys"
import { fieldOfStudyOrDefault, prereqKeysForField } from "@/lib/field-of-study"
import { getPrereqKeyStatus, type UserCourseRow } from "@/lib/get-course-requirement-status"
import { PLANNER_CREDIT_TARGET } from "@/lib/planner-constants"
import type { TodayReadinessInput } from "@/types/overview"

const W = {
  credits: 0.25,
  prereq: 0.25,
  checklist: 0.2,
  essay: 0.1,
  gpa: 0.15,
  profile: 0.05,
} as const

export function buildTodayReadinessInputs(input: {
  breakdown: DashboardOverallReadinessBreakdown
  userCourses: UserCourseRow[]
  fieldOfStudy: string | null
  creditsCompleted: number | null
  gpa: number | null
  essayStarted: boolean
  hasTargetUniversity: boolean
  expectedTransferTerm: string | null
  displayName: string
}): TodayReadinessInput[] {
  const keys = prereqKeysForField(fieldOfStudyOrDefault(input.fieldOfStudy))
  let prereqDone = 0
  for (const k of keys) {
    if (getPrereqKeyStatus(k, input.userCourses) === "done") prereqDone++
  }

  const taskKeys = actionableChecklistTaskKeysForReadiness()
  const tasksDone = Math.round((input.breakdown.checklist0To100 / 100) * taskKeys.length)

  let profileParts = 0
  if (input.hasTargetUniversity) profileParts++
  if (input.expectedTransferTerm?.trim()) profileParts++
  if (input.displayName.trim()) profileParts++

  return [
    {
      label: "Coursework matched to requirements",
      weightLabel: "25%",
      valueLabel:
        keys.length === 0 ? "—" : `${prereqDone} of ${keys.length} matched`,
      href: "/dashboard/requirements",
    },
    {
      label: "Credits toward the 30-credit planner target",
      weightLabel: "25%",
      valueLabel:
        input.creditsCompleted != null
          ? `${input.creditsCompleted} of ${PLANNER_CREDIT_TARGET}`
          : "Not on file",
      href: "/dashboard/plan",
    },
    {
      label: "Tasks completed",
      weightLabel: "20%",
      valueLabel: `${tasksDone} of ${taskKeys.length}`,
      href: "/dashboard/deadlines",
    },
    {
      label: "GPA on file",
      weightLabel: "15%",
      valueLabel: input.gpa != null ? input.gpa.toFixed(2) : "Not on file",
      href: "/dashboard/settings",
    },
    {
      label: "Essay started",
      weightLabel: "10%",
      valueLabel: input.essayStarted ? "Draft saved" : "Not started",
      href: "/dashboard/essay",
    },
    {
      label: "Pathway complete",
      weightLabel: "5%",
      valueLabel:
        profileParts >= 3
          ? "School, term, name"
          : `${profileParts} of 3 on file`,
      href: "/dashboard/settings",
    },
  ]
}

export function todayReadinessFocusSentence(
  breakdown: DashboardOverallReadinessBreakdown,
  creditsCompleted: number | null
): string {
  const gaps: { label: string; remaining: number }[] = [
    {
      label: "coursework",
      remaining: W.prereq * (100 - breakdown.prereq0To100),
    },
    {
      label: "credits",
      remaining: W.credits * (100 - breakdown.credits0To100),
    },
    {
      label: "tasks",
      remaining: W.checklist * (100 - breakdown.checklist0To100),
    },
    {
      label: "GPA",
      remaining: W.gpa * (100 - breakdown.gpa0To100),
    },
    {
      label: "essay",
      remaining: W.essay * (100 - breakdown.essay0To100),
    },
    {
      label: "pathway details",
      remaining: W.profile * (100 - breakdown.profile0To100),
    },
  ]

  gaps.sort((a, b) => b.remaining - a.remaining)
  const top = gaps.filter((g) => g.remaining >= 1).slice(0, 2)
  if (top.length === 0) {
    return "Your planner inputs are in strong shape — keep deadlines on your radar."
  }

  const phrases = top.map((g) => {
    if (g.label === "credits" && creditsCompleted != null) {
      const left = Math.max(0, PLANNER_CREDIT_TARGET - creditsCompleted)
      return left > 0 ? `${left} more credits` : "remaining credits"
    }
    if (g.label === "tasks") {
      const left = Math.max(
        0,
        actionableChecklistTaskKeysForReadiness().length -
          Math.round((breakdown.checklist0To100 / 100) * actionableChecklistTaskKeysForReadiness().length)
      )
      return left > 0 ? `${left} unfinished tasks` : "remaining tasks"
    }
    if (g.label === "GPA") return "GPA on your profile"
    if (g.label === "essay") return "your transfer essay"
    if (g.label === "coursework") return "requirement coursework"
    return "pathway details in Settings"
  })

  if (phrases.length === 1) {
    return `The largest remaining piece is ${phrases[0]}.`
  }
  return `The largest remaining pieces are ${phrases[0]} and ${phrases[1]}.`
}

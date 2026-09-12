"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  buildTaskDefinitions,
  CHECKLIST_ACADEMIC_TASK_KEYS,
  CHECKLIST_APPLICATION_TASK_KEYS,
  type ChecklistProfileSummary,
} from "@/lib/checklist-task-definitions"
import { buildChecklistWorkspaceData } from "@/lib/build-checklist-workspace-data"
import {
  type ChecklistDerivedInput,
  isChecklistTaskDerivedInProgress,
  isChecklistTaskEffectivelyComplete,
} from "@/lib/checklist-derived-status"
import { ChecklistWorkspaceUi } from "@/components/dashboard/checklist-workspace-ui"
import type { UserCourseRow } from "@/lib/get-course-requirement-status"

export type { ChecklistProfileSummary } from "@/lib/checklist-task-definitions"

const CHECKLIST_URGENCY_MAX_DAYS_UNTIL = 45

const URGENCY_TASK_KEYS = new Set<string>([
  "write_essay_part1",
  "submit_application",
])

function isDeadlineTriggeredUrgent(nextDeadlineDaysUntil: number | null | undefined): boolean {
  return nextDeadlineDaysUntil != null && nextDeadlineDaysUntil <= CHECKLIST_URGENCY_MAX_DAYS_UNTIL
}

function resolvedTaskStatus(
  task: { task_key: string; status: "done" | "in-progress" | "not-started" | "urgent" },
  completionRow: { is_complete: boolean } | undefined,
  deadlineUrgent: boolean,
  derived: ChecklistDerivedInput
): "done" | "in-progress" | "not-started" | "urgent" {
  if (isChecklistTaskEffectivelyComplete(task.task_key, completionRow?.is_complete, derived)) {
    return "done"
  }
  if (deadlineUrgent && URGENCY_TASK_KEYS.has(task.task_key)) return "urgent"
  if (isChecklistTaskDerivedInProgress(task.task_key, derived)) return "in-progress"
  return task.status
}

function getCategoryForTaskKey(task_key: string): "academic" | "application" | "preparation" {
  if (CHECKLIST_ACADEMIC_TASK_KEYS.has(task_key)) return "academic"
  if (CHECKLIST_APPLICATION_TASK_KEYS.has(task_key)) return "application"
  return "preparation"
}

interface ChecklistClientProps {
  userId: string
  initialCompletionMap: Record<string, { is_complete: boolean; completed_at: string | null }>
  checklistProfile: ChecklistProfileSummary
  nextDeadlineDaysUntil?: number | null
  userCourses: UserCourseRow[]
  creditsCompleted: number | null
  gpa: number | null
  essayHasContent: boolean
}

export function ChecklistClient({
  userId,
  initialCompletionMap,
  checklistProfile,
  nextDeadlineDaysUntil = null,
  userCourses,
  creditsCompleted,
  gpa,
  essayHasContent,
}: ChecklistClientProps) {
  const router = useRouter()
  const [completionMap, setCompletionMap] = useState(initialCompletionMap)

  const derivedInput = useMemo<ChecklistDerivedInput>(
    () => ({
      userCourses,
      fieldOfStudy: checklistProfile.fieldOfStudy,
      creditsCompleted,
      gpa,
      essayHasContent,
    }),
    [userCourses, checklistProfile.fieldOfStudy, creditsCompleted, gpa, essayHasContent]
  )

  const sections = useMemo(() => {
    const taskDefinitions = buildTaskDefinitions(checklistProfile)
    const deadlineUrgent = isDeadlineTriggeredUrgent(nextDeadlineDaysUntil)
    return taskDefinitions.map((section) => ({
      ...section,
      tasks: section.tasks.map((task) => ({
        ...task,
        status: resolvedTaskStatus(
          task,
          completionMap[task.task_key],
          deadlineUrgent,
          derivedInput
        ),
      })),
    }))
  }, [checklistProfile, completionMap, nextDeadlineDaysUntil, derivedInput])

  const lastChecklistCompletionIso = useMemo(() => {
    let maxIso: string | null = null
    for (const v of Object.values(completionMap)) {
      if (!v?.is_complete) continue
      const at = v.completed_at?.trim()
      if (!at) continue
      if (!maxIso || at > maxIso) maxIso = at
    }
    return maxIso
  }, [completionMap])

  const workspaceData = useMemo(
    () =>
      buildChecklistWorkspaceData({
        profile: checklistProfile,
        sections,
        completionMap,
        lastUpdatedIso: lastChecklistCompletionIso,
      }),
    [checklistProfile, sections, completionMap, lastChecklistCompletionIso]
  )

  async function handleToggleTask(task_key: string, newIsComplete: boolean) {
    const now = new Date().toISOString()

    setCompletionMap((prev) => ({
      ...prev,
      [task_key]: {
        is_complete: newIsComplete,
        completed_at: newIsComplete ? now : null,
      },
    }))

    const supabase = createClient()
    const { error } = await supabase.from("user_checklist_items").upsert(
      {
        user_id: userId,
        task_key,
        category: getCategoryForTaskKey(task_key),
        is_complete: newIsComplete,
        completed_at: newIsComplete ? now : null,
      },
      { onConflict: "user_id,task_key" }
    )
    if (!error) router.refresh()
  }

  return (
    <ChecklistWorkspaceUi
      data={workspaceData}
      onToggleTask={(id, done) => void handleToggleTask(id, done)}
      LinkComponent={({ href, className, children }) => (
        <Link href={href} className={className}>
          {children}
        </Link>
      )}
    />
  )
}

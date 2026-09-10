import type { ChecklistTaskDef, ChecklistSectionDef } from "@/lib/checklist-task-definitions"
import type { ChecklistProfileSummary } from "@/lib/checklist-task-definitions"
import type { ChecklistWorkspaceData } from "@/types/checklist-workspace"

const SECTION_TO_CATEGORY: Record<string, { id: string; label: string }> = {
  "Academic Tasks": { id: "academic", label: "Academic" },
  "Application Tasks": { id: "application", label: "Application" },
  "Preparation Tasks": { id: "preparation", label: "Preparation" },
}

function formatUpdatedLabel(iso: string | null): string | undefined {
  if (!iso?.trim()) return undefined
  const d = new Date(iso.trim())
  if (Number.isNaN(d.getTime())) return undefined
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
    .format(d)
    .replace(",", "")
    .toUpperCase()
}

function readinessFocusMessage(sections: ChecklistSectionDef[]): string {
  const incompleteByCat = (title: string) => {
    const sec = sections.find((s) => s.title === title)
    if (!sec) return 0
    return sec.tasks.filter((t) => t.status !== "done").length
  }
  const appLeft = incompleteByCat("Application Tasks")
  const acadLeft = incompleteByCat("Academic Tasks")
  const prepLeft = incompleteByCat("Preparation Tasks")
  if (appLeft > 0) return "Focus on application materials next."
  if (acadLeft > 0) return "Focus on academic requirements next."
  if (prepLeft > 0) return "Focus on preparation tasks next."
  return "You're in great shape — review deadlines before you submit."
}

function taskToWorkspaceTask(task: ChecklistTaskDef): {
  id: string
  title: string
  hint?: string
  done: boolean
  urgent: boolean
  link?: { label: string; href: string }
} {
  const hint =
    task.deadline && !task.deadline.toLowerCase().includes("ongoing")
      ? task.deadline.replace(/^Work toward /i, "").trim()
      : undefined

  const link =
    task.action && task.actionHref
      ? {
          label: task.action.replace(/\s*→\s*$/, "").trim(),
          href: task.actionHref,
        }
      : undefined

  return {
    id: task.task_key,
    title: task.text,
    hint,
    done: task.status === "done",
    urgent: task.status === "urgent",
    link,
  }
}

export function buildChecklistWorkspaceData(input: {
  profile: ChecklistProfileSummary
  sections: ChecklistSectionDef[]
  completionMap: Record<string, { is_complete: boolean; completed_at: string | null } | undefined>
  lastUpdatedIso: string | null
}): ChecklistWorkspaceData {
  const cur = input.profile.currentUniversityName?.trim() || "your community college"
  const tgt = input.profile.targetUniversityName?.trim() || "your target university"
  const program = input.profile.targetMajor?.trim() || "your program"
  const term = input.profile.expectedTransferTerm?.trim() || "your entry term"

  const categories = input.sections.map((section) => {
    const meta = SECTION_TO_CATEGORY[section.title] ?? {
      id: section.title.toLowerCase().replace(/\s+/g, "-"),
      label: section.title.replace(/ Tasks$/, ""),
    }
    return {
      id: meta.id,
      label: meta.label,
      tasks: section.tasks.map(taskToWorkspaceTask),
    }
  })

  return {
    header: {
      eyebrow: "Tasks & deadlines",
      title: "Tasks & deadlines",
      fromInstitution: cur,
      toInstitution: tgt,
      program,
      term,
      lastUpdatedLabel: formatUpdatedLabel(input.lastUpdatedIso),
      readinessMessage: readinessFocusMessage(input.sections),
    },
    categories,
  }
}

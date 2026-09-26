import type { ChecklistTaskDef, ChecklistSectionDef } from "@/lib/checklist-task-definitions"
import type { ChecklistProfileSummary } from "@/lib/checklist-task-definitions"
import type { ChecklistWorkspaceData, ChecklistWorkspaceTask } from "@/types/checklist-workspace"

const LOGISTICS = [
  { id: "transcripts", label: "Transcripts", keys: ["request_transcript", "review_credit_equiv"] },
  { id: "accounts", label: "Accounts", keys: ["create_applytexas", "pay_application_fee", "confirm_financial_aid", "review_financial_aid", "check_tsi"] },
  { id: "materials", label: "Materials", keys: ["write_essay_part1", "write_essay_part2", "request_rec_letter_1", "request_rec_letter_2"] },
  { id: "submit", label: "Submit prep", keys: ["research_requirements", "submit_application"] },
  { id: "arrival", label: "Housing & arrival", keys: ["research_housing", "attend_info_session", "connect_peer_mentor", "plan_first_semester"] },
  { id: "academic", label: "Academics", keys: [] },
]

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

function taskToWorkspaceTask(task: ChecklistTaskDef): ChecklistWorkspaceTask {
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
  nextDeadlineDaysUntil?: number | null
  lastUpdatedIso: string | null
}): ChecklistWorkspaceData {
  const cur = input.profile.currentUniversityName?.trim() || "Current school not set"
  const tgt = input.profile.targetUniversityName?.trim() || "Target school not set"
  const program = input.profile.targetMajor?.trim() || input.profile.fieldOfStudy?.trim() || "Program not set"
  const term = input.profile.expectedTransferTerm?.trim() || "Term not set"

  const days = input.nextDeadlineDaysUntil
  const countdown = days == null ? undefined : days < 0
    ? `Next deadline passed ${Math.abs(days)} days ago`
    : days === 0 ? "Next deadline today" : `${days} days to next deadline`
  const allTasks = input.sections.flatMap((section) => section.tasks)
  const categories = LOGISTICS.map((category) => ({
    id: category.id,
    label: category.label,
    tasks: allTasks.filter((task) => category.id === "academic"
      ? !LOGISTICS.some((group) => group.keys.includes(task.task_key))
      : category.keys.includes(task.task_key)
    ).map((task) => {
      const result = taskToWorkspaceTask(task)
      result.meta = task.task_key === "request_transcript" ? cur : tgt
      if (["request_transcript", "write_essay_part1", "write_essay_part2", "submit_application", "confirm_financial_aid"].includes(task.task_key)) {
        result.countdownLabel = countdown
        result.dueContext = "Check your dates in Clock Tower"
      }
      if (task.task_key === "submit_application") {
        result.link = { label: "Open Deadlines", href: "/dashboard/deadlines" }
        result.hint = `Confirm application dates for ${term}`
      }
      if (task.task_key.startsWith("write_essay")) result.link = { label: "Open Essays", href: "/dashboard/essay" }
      if (task.task_key.startsWith("request_rec_letter")) result.hint = "Check whether your program accepts or requires a recommendation"
      if (task.task_key === "review_credit_equiv") result.link = { label: "Requirements", href: "/dashboard/requirements" }
      if (task.task_key === "plan_first_semester") result.link = { label: "Open Plan", href: "/dashboard/plan" }
      return result
    }),
  })).filter((category) => category.tasks.length > 0)

  return {
    header: {
      eyebrow: "Checklist",
      title: "Transfer checklist ledger",
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

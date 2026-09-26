import type { ChecklistTaskDef, ChecklistSectionDef } from "@/lib/checklist-task-definitions"
import type { ChecklistProfileSummary } from "@/lib/checklist-task-definitions"
import type { ChecklistWorkspaceData, ChecklistWorkspaceTask } from "@/types/checklist-workspace"

export const logisticsDoneWhen: Record<string, string> = {
  "request_transcript": "the registrar confirms your official transcript was sent to your target school.",
  "review_credit_equiv": "you have compared your completed courses with the transfer equivalency guide.",
  "create_applytexas": "you can sign in to your application account.",
  "pay_application_fee": "the portal confirms payment or an approved fee waiver.",
  "confirm_financial_aid": "you have submitted your aid application and listed your target school.",
  "review_financial_aid": "you have reviewed how transferring affects your aid and noted any questions for the aid office.",
  "check_tsi": "you have verified your TSI completion or exemption in your academic record.",
  "write_essay_part1": "your essay draft is saved and ready for review.",
  "write_essay_part2": "your revised essay is ready to include in the application.",
  "request_rec_letter_1": "a recommender agrees to write and has the submission instructions, or you confirm no letter is needed.",
  "request_rec_letter_2": "a second recommender agrees and has the submission instructions, or you confirm no second letter is needed.",
  "research_requirements": "you have reviewed your program’s transfer requirements and identified any remaining gaps.",
  "submit_application": "the application portal confirms your submission. Track receipt of supporting materials separately.",
  "research_housing": "you have a shortlist of housing options with costs and application dates.",
  "attend_info_session": "you have attended a transfer information session and noted your next steps.",
  "connect_peer_mentor": "you have connected with a current student and discussed your transfer questions.",
  "plan_first_semester": "you have saved a tentative course plan to discuss with an advisor."
}

const LOGISTICS = [
  { id: "transcripts", label: "Transcripts", keys: ["request_transcript"] },
  { id: "credits", label: "Credits", keys: ["review_credit_equiv"] },
  { id: "accounts", label: "Apply & aid", keys: ["create_applytexas", "pay_application_fee", "confirm_financial_aid", "review_financial_aid", "check_tsi"] },
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
    doneWhen: logisticsDoneWhen[task.task_key] || "you have verified this requirement against your academic record.",
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
      if (result.link) {
        const labels: Record<string, string> = {
          research_requirements: "Review requirements", pay_application_fee: "Open ApplyTexas",
          confirm_financial_aid: "Open FAFSA", review_financial_aid: "Open aid guide",
          request_rec_letter_1: "See who to ask", request_rec_letter_2: "See who to ask",
          attend_info_session: "Find sessions", connect_peer_mentor: "Review requirements",
          check_tsi: "Review TSI",
        }
        result.link.label = labels[task.task_key] || result.link.label
      }
      if (task.task_key === "attend_info_session") result.link = {
        label: "Find sessions",
        href: `https://www.google.com/search?q=${encodeURIComponent(`${tgt} transfer admissions information sessions`)}`,
      }
      if (task.task_key === "request_transcript") result.hint = "Order with time for delivery and receipt before your application deadline"
      result.meta = task.task_key === "request_transcript" ? cur : tgt
      if (["request_transcript", "write_essay_part1", "write_essay_part2", "submit_application"].includes(task.task_key)) {
        result.countdownLabel = countdown
        result.dueContext = "Check your dates in Clock Tower"
      }
      if (task.task_key === "submit_application") {
        result.link = { label: "Open Deadlines", href: "/dashboard/deadlines" }
        result.hint = `Confirm application dates for ${term}`
      }
      if (task.task_key.startsWith("write_essay")) result.link = { label: "Open Essays", href: "/dashboard/essay" }
      if (task.task_key.startsWith("request_rec_letter")) result.hint = "Check whether your program accepts or requires a recommendation"
      if (task.task_key === "review_credit_equiv") result.link = { label: "Review requirements", href: "/dashboard/requirements" }
      if (task.task_key === "plan_first_semester") result.link = { label: "Open Plan", href: "/dashboard/plan" }
      return result
    }),
  })).filter((category) => category.tasks.length > 0)

  return {
    header: {
      eyebrow: "Checklist",
      title: "Application logistics",
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

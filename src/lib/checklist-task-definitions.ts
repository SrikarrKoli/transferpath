import { PLANNER_CREDIT_TARGET } from "@/lib/planner-constants"
import { settingsPath } from "@/lib/settings-tab"
import { buildAcademicChecklistTaskKeyList } from "@/lib/checklist-task-keys"
import { PREREQ_TO_CHECKLIST_TASK_KEY, PREREQ_ROW_LABEL, type PrereqKey } from "@/lib/prereq-catalog"
import { fieldOfStudyOrDefault } from "@/lib/field-of-study"

/** Passed from server; drives header + task copy (no hardcoded school names). */
export type ChecklistProfileSummary = {
  currentUniversityName: string | null
  targetUniversityName: string | null
  targetMajor: string | null
  fieldOfStudy: string | null
  expectedTransferTerm: string | null
}

export type ChecklistTaskDef = {
  task_key: string
  text: string
  status: "done" | "in-progress" | "not-started" | "urgent"
  deadline?: string
  action?: string
  actionHref?: string
}

export type ChecklistSectionDef = {
  title: string
  tasks: ChecklistTaskDef[]
}

const CHECKLIST_TASK_KEY_TO_PREREQ: Partial<Record<string, PrereqKey>> = Object.fromEntries(
  (Object.entries(PREREQ_TO_CHECKLIST_TASK_KEY) as [PrereqKey, string][]).map(([pk, tk]) => [tk, pk])
)

const PREREQ_CHECKLIST_TASK_KEYS = new Set(Object.values(PREREQ_TO_CHECKLIST_TASK_KEY))

export const CHECKLIST_ACADEMIC_TASK_KEYS = new Set([
  ...PREREQ_CHECKLIST_TASK_KEYS,
  "complete_english_comp_1",
  "complete_english_comp_2",
  "complete_us_government",
  "reach_30_credits",
  "maintain_gpa_3_5",
])

export const CHECKLIST_APPLICATION_TASK_KEYS = new Set([
  "create_applytexas",
  "research_requirements",
  "write_essay_part1",
  "write_essay_part2",
  "request_transcript",
  "request_rec_letter_1",
  "request_rec_letter_2",
  "submit_application",
  "pay_application_fee",
  "confirm_financial_aid",
])

export const CHECKLIST_PREPARATION_TASK_KEYS = new Set([
  "research_housing",
  "review_credit_equiv",
  "attend_info_session",
  "connect_peer_mentor",
  "review_financial_aid",
  "check_tsi",
  "plan_first_semester",
])

export function getChecklistTaskCategory(
  task_key: string
): "academic" | "application" | "preparation" {
  if (CHECKLIST_ACADEMIC_TASK_KEYS.has(task_key)) return "academic"
  if (CHECKLIST_APPLICATION_TASK_KEYS.has(task_key)) return "application"
  return "preparation"
}

function academicTaskDefForKey(
  task_key: string,
  stemPrefix: string,
  creditDeadline: string
): ChecklistTaskDef {
  if (task_key === "complete_english_comp_1") {
    return { task_key, text: "Complete English Composition I", status: "not-started" }
  }
  if (task_key === "complete_english_comp_2") {
    return { task_key, text: "Complete English Composition II", status: "not-started" }
  }
  if (task_key === "complete_us_government") {
    return { task_key, text: "Complete U.S. Government", status: "not-started" }
  }
  if (task_key === "reach_30_credits") {
    return {
      task_key,
      text: `Reach ${PLANNER_CREDIT_TARGET} credit hours`,
      status: "not-started",
      deadline: creditDeadline,
    }
  }
  if (task_key === "maintain_gpa_3_5") {
    return {
      task_key,
      text: "Maintain GPA above 3.5",
      status: "not-started",
      deadline: "Ongoing",
    }
  }

  const pk = CHECKLIST_TASK_KEY_TO_PREREQ[task_key]
  if (pk) {
    const line = `Complete ${PREREQ_ROW_LABEL[pk]}`
    return {
      task_key,
      text: stemPrefix ? `${stemPrefix}${line}` : line,
      status: "not-started",
    }
  }

  return { task_key, text: task_key, status: "not-started" }
}

function buildAcademicTasks(p: ChecklistProfileSummary): ChecklistTaskDef[] {
  const field = fieldOfStudyOrDefault(p.fieldOfStudy)
  const term = p.expectedTransferTerm?.trim()
  const creditDeadline = term
    ? `Work toward ${PLANNER_CREDIT_TARGET} credits before ${term}`
    : "Work toward your credit goal before transfer"

  const stemPrefix =
    field === "stem_engineering"
      ? "Recommended for STEM applicants — "
      : field === "stem_non_engineering"
        ? "Often recommended to strengthen STEM-style prep — "
        : ""

  const keys = buildAcademicChecklistTaskKeyList(p.fieldOfStudy)
  return keys.map((tk) => academicTaskDefForKey(tk, stemPrefix, creditDeadline))
}

/** All checklist task definitions for a profile (labels use profile schools/major). */
export function buildTaskDefinitions(p: ChecklistProfileSummary): ChecklistSectionDef[] {
  const cur = p.currentUniversityName?.trim() || "your current school"
  const tgt = p.targetUniversityName?.trim() || "your target school"
  const major = p.targetMajor?.trim() || "your intended major"
  const term = p.expectedTransferTerm?.trim()
  const termPhrase = term ?? "your planned entry term"

  return [
    { title: "Academic Tasks", tasks: buildAcademicTasks(p) },
    {
      title: "Application Tasks",
      tasks: [
        {
          task_key: "create_applytexas",
          text: "Create ApplyTexas account",
          status: "not-started",
          action: "Open ApplyTexas →",
          actionHref: "https://www.goapplytexas.org",
        },
        {
          task_key: "research_requirements",
          text: `Research ${tgt} ${major} requirements`,
          status: "not-started",
          action: "Open requirements →",
          actionHref: "/dashboard/requirements",
        },
        {
          task_key: "write_essay_part1",
          text: `Draft essay — Part 1: Why ${tgt}? (essay workspace)`,
          status: "not-started",
          action: "Open workspace →",
          actionHref: "/dashboard/essay",
        },
        {
          task_key: "write_essay_part2",
          text: "Draft essay — Part 2: Leadership/Diversity (same workspace)",
          status: "not-started",
          action: "Open workspace →",
          actionHref: "/dashboard/essay",
        },
        {
          task_key: "request_transcript",
          text: `Request official transcript from ${cur}`,
          status: "not-started",
          action: "How to request →",
          actionHref: settingsPath("help", "request-transcript"),
        },
        {
          task_key: "request_rec_letter_1",
          text: "Request recommendation letter #1",
          status: "not-started",
          action: "Who to ask guide →",
          actionHref: settingsPath("help", "rec-letters"),
        },
        {
          task_key: "request_rec_letter_2",
          text: "Request recommendation letter #2",
          status: "not-started",
          action: "Who to ask guide →",
          actionHref: settingsPath("help", "rec-letters"),
        },
        {
          task_key: "submit_application",
          text: `Submit transfer application (${termPhrase})`,
          status: "not-started",
          deadline: "Confirm dates on Requirements",
          action: "Review deadlines →",
          actionHref: "/dashboard/requirements",
        },
        {
          task_key: "pay_application_fee",
          text: "Pay application fee (amount varies by school)",
          status: "not-started",
          action: "Fee info →",
          actionHref: "https://www.goapplytexas.org",
        },
        {
          task_key: "confirm_financial_aid",
          text: "Confirm financial aid/FAFSA for transfer",
          status: "not-started",
          action: "FAFSA →",
          actionHref: "https://studentaid.gov/h/apply-for-aid/fafsa",
        },
      ],
    },
    {
      title: "Preparation Tasks",
      tasks: [
        { task_key: "research_housing", text: `Research housing options at ${tgt}`, status: "not-started" },
        {
          task_key: "review_credit_equiv",
          text: `Review ${tgt} transfer credit equivalency guide`,
          status: "not-started",
        },
        {
          task_key: "attend_info_session",
          text: `Attend a ${tgt} virtual transfer info session`,
          status: "not-started",
          action: "Find sessions →",
          actionHref: "/dashboard/requirements",
        },
        {
          task_key: "connect_peer_mentor",
          text: `Connect with a current student at ${tgt} (peer mentor)`,
          status: "not-started",
          action: "Planning hub →",
          actionHref: "/dashboard/requirements",
        },
        {
          task_key: "review_financial_aid",
          text: "Review financial aid implications of transferring",
          status: "not-started",
          action: "Guide →",
          actionHref: "https://studentaid.gov/understand-aid/how-aid-works",
        },
        {
          task_key: "check_tsi",
          text: "Check TSI assessment completion",
          status: "not-started",
          action: "Verify →",
          actionHref:
            "https://www.highered.texas.gov/our-work/supporting-our-institutions/college-career-and-military-preparation/the-texas-success-initiative-tsi/",
        },
        {
          task_key: "plan_first_semester",
          text: `Plan first semester at ${tgt} (tentative schedule)`,
          status: "not-started",
          action: "Preview →",
          actionHref: "/dashboard/plan",
        },
      ],
    },
  ]
}

export function buildChecklistHeaderSubtitle(p: ChecklistProfileSummary): string {
  const cur = p.currentUniversityName?.trim() || "your current school"
  const tgt = p.targetUniversityName?.trim() || "your target school"
  const parts = [`${cur} → ${tgt}`]
  const major = p.targetMajor?.trim()
  if (major) parts.push(major)
  const term = p.expectedTransferTerm?.trim()
  if (term) parts.push(term)
  return parts.join(" · ")
}

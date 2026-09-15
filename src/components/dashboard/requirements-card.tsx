import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { getPrereqKeyStatus, type UserCourseRow } from "@/lib/get-course-requirement-status"
import { PLANNER_CREDIT_TARGET } from "@/lib/planner-constants"
import { fieldOfStudyOrDefault, prereqKeysForField } from "@/lib/field-of-study"

export interface RequirementsCardProps {
  gpa: number | null
  creditsCompleted: number | null
  userCourses: UserCourseRow[]
  essayStarted: boolean
  recommendationLettersDone: boolean
  officialTranscriptRequested: boolean
  fieldOfStudy?: string | null
}

type ReqRow = { text: string; done: boolean }

export function RequirementsCard({
  gpa,
  creditsCompleted,
  userCourses,
  essayStarted,
  recommendationLettersDone,
  officialTranscriptRequested,
  fieldOfStudy = null,
}: RequirementsCardProps) {
  const keys = prereqKeysForField(fieldOfStudyOrDefault(fieldOfStudy))
  const calculusDone = getPrereqKeyStatus("calculus_1", userCourses) === "done"

  const requirements: ReqRow[] = [
    {
      text: `${PLANNER_CREDIT_TARGET} credit hours (planner target)`,
      done:
        creditsCompleted != null && creditsCompleted >= PLANNER_CREDIT_TARGET,
    },
    {
      text: "3.0 GPA (planner benchmark)",
      done: gpa != null && gpa >= 3.0,
    },
  ]

  if (keys.includes("calculus_1")) {
    requirements.push({
      text: "Calculus I (for your selected field prep)",
      done: calculusDone,
    })
  }

  requirements.push(
    {
      text: "Transfer essay",
      done: essayStarted,
    },
    { text: "2 recommendation letters", done: recommendationLettersDone },
    { text: "Official transcript", done: officialTranscriptRequested }
  )

  const completed = requirements.filter((r) => r.done).length
  const total = requirements.length
  const percentage = Math.round((completed / total) * 100)

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors duration-150 sm:p-6 tp-interactive-panel">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Requirements</h3>
        <Link
          href="/dashboard/requirements"
          className="text-sm font-medium text-primary underline-offset-4 transition-colors duration-150 hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-3">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-3">
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                req.done ? "border border-chart-2/30 bg-chart-2/10" : "border border-border"
              }`}
            >
              {req.done && <CheckCircle2 className="h-4 w-4 text-chart-2" strokeWidth={1.5} />}
            </div>
            <span
              className={`text-sm leading-relaxed ${
                req.done ? "text-muted-foreground line-through" : "text-foreground"
              }`}
            >
              {req.text}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span>
            {completed} of {total} complete
          </span>
          <span className="text-chart-2">{percentage}%</span>
        </div>
        <svg
          className="h-1.5 w-full"
          viewBox="0 0 100 4"
          preserveAspectRatio="none"
          aria-hidden
        >
          <rect width="100" height="4" rx="2" className="fill-muted" />
          <rect width={percentage} height="4" rx="2" className="fill-chart-2 transition-opacity duration-150" />
        </svg>
      </div>
    </div>
  )
}

"use client"

import { Meter } from "@/components/ui/progress"
import { Provenance } from "@/components/ui/provenance"
import { shouldShowReadinessScore, type CompletenessLadderState } from "@/lib/completeness-ladder"
import { PLANNER_CREDIT_TARGET } from "@/lib/planner-constants"
import type { PlanTermSection } from "@/types/plan-terms"

function termCourseSummary(section: PlanTermSection): string {
  const n = section.courses.length
  if (n === 0) return "—"
  const completed = section.courses.filter((c) => c.status === "completed").length
  const inProgress = section.courses.filter((c) => c.status === "in_progress").length
  const planned = section.courses.filter((c) => c.status === "planned").length

  if (completed === n) return `${n} · completed`
  if (inProgress > 0) return `${n} · in progress`
  if (planned > 0) return `${n} · planned`
  return `${n} course${n === 1 ? "" : "s"}`
}

interface PlanReadinessAsideProps {
  sections: PlanTermSection[]
  completenessLadderState: CompletenessLadderState
  pathwayReadinessScore: number
  creditsCompleted: number | null
}

export function PlanReadinessAside({
  sections,
  completenessLadderState,
  pathwayReadinessScore,
  creditsCompleted,
}: PlanReadinessAsideProps) {
  const showReadiness = shouldShowReadinessScore(completenessLadderState)
  const readinessPct = Math.round(Math.min(100, Math.max(0, pathwayReadinessScore)))
  const calendarSections = sections.filter((s) => s.kind === "calendar")
  const creditsLabel =
    creditsCompleted != null ? `${creditsCompleted} of ${PLANNER_CREDIT_TARGET}` : "Not on file"

  return (
    <aside className="space-y-4">
      {showReadiness ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="tp-eyebrow text-muted-foreground">Planner readiness</p>
          <div className="mt-4 flex items-center gap-3">
            <Meter
              value={readinessPct}
              label={`Planner readiness: ${readinessPct} percent`}
              className="flex-1"
              size="md"
            />
            <span className="font-mono text-sm font-medium tabular-nums text-foreground">
              {readinessPct}%
            </span>
          </div>
          <p className="mt-3 text-caption leading-snug text-muted-foreground">
            How complete your plan is — not a prediction of admission.
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="tp-eyebrow text-muted-foreground">Courses by term</p>
        {calendarSections.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No terms scheduled yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {calendarSections.map((section) => (
              <li
                key={section.termLabel}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-muted-foreground">{section.termLabel}</span>
                <span className="tabular-nums text-foreground">{termCourseSummary(section)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Credits completed</span>
            <span className="tabular-nums font-medium">{creditsLabel}</span>
          </div>
        </div>
        <Provenance
          level="estimated"
          basis={`${PLANNER_CREDIT_TARGET} credit hours is a TransferPath planning target, not an institutional minimum.`}
          className="mt-3"
        />
      </div>
    </aside>
  )
}

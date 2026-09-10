"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { MAJOR_PREREQ_PHASE_BUCKET } from "@/lib/timeline-phase-buckets"
import type {
  TimelineMilestone,
  TimelineMilestoneState,
  TimelineRecordedCourse,
} from "@/types/timeline-milestone"

function MilestoneDot({ state }: { state: TimelineMilestoneState }) {
  if (state === "done") {
    return (
      <div
        className="grid size-6 shrink-0 place-items-center rounded-full bg-chart-3 text-primary-foreground ring-4 ring-background"
        aria-hidden
      >
        <CheckCircle2 className="size-3.5" strokeWidth={2.5} />
      </div>
    )
  }
  if (state === "active") {
    return (
      <div className="relative shrink-0" aria-hidden>
        <div className="size-6 rounded-full bg-accent ring-4 ring-background" />
        <span className="absolute inset-0 -m-2 rounded-full bg-accent/15 animate-pulse-ring" />
      </div>
    )
  }
  if (state === "target") {
    return (
      <div
        className="grid size-6 shrink-0 place-items-center rounded-full bg-primary ring-4 ring-background"
        aria-hidden
      >
        <div className="size-2 rounded-full bg-accent" />
      </div>
    )
  }
  return (
    <div
      className="size-6 shrink-0 rounded-full border-2 border-muted-foreground/35 bg-background ring-4 ring-background"
      aria-hidden
    />
  )
}

function statusLabel(status: string): string {
  if (status === "completed") return "Completed"
  if (status === "in_progress") return "In progress"
  return "Planned"
}

interface TimelineMilestoneTrackProps {
  milestones: TimelineMilestone[]
  savingId: string | null
  deletingId: string | null
  termOptions: { value: string; label: string }[]
  onPatchCourse: (
    rowId: string,
    updates: { semester_taken?: string | null; status?: string }
  ) => void
  onAddMajorPrereq: (name: string, status: "planned" | "in_progress" | "completed") => Promise<void>
  onDeleteCourse: (rowId: string) => Promise<void>
  addMajorBusy: boolean
}

export function TimelineMilestoneTrack({
  milestones,
  savingId,
  deletingId,
  termOptions,
  onPatchCourse,
  onAddMajorPrereq,
  onDeleteCourse,
  addMajorBusy,
}: TimelineMilestoneTrackProps) {
  const [majorName, setMajorName] = useState("")
  const [majorStatus, setMajorStatus] = useState<"planned" | "in_progress" | "completed">("planned")
  const [majorError, setMajorError] = useState("")

  if (milestones.length === 0) return null

  async function submitMajorPrereq() {
    const name = majorName.trim()
    if (!name) {
      setMajorError("Enter a course name.")
      return
    }
    setMajorError("")
    await onAddMajorPrereq(name, majorStatus)
    setMajorName("")
    setMajorStatus("planned")
  }

  return (
    <div className="space-y-0">
      {milestones.map((m, idx) => {
        const isLast = idx === milestones.length - 1
        const metaLeft = [
          m.kind === "major_prereqs"
            ? "MAJOR PREREQUISITES"
            : m.kind === "essay"
              ? "ESSAY"
              : m.kind === "foundation"
                ? m.termLabel.toUpperCase()
                : m.termLabel.toUpperCase(),
          m.isCurrent ? "CURRENT" : null,
          `STEP ${m.stepIndex} OF ${m.totalSteps}`,
        ]
          .filter(Boolean)
          .join(" · ")

        return (
          <div
            key={m.key}
            className={cn("grid grid-cols-[auto_1fr] gap-x-4 md:gap-x-8", !isLast && "pb-12")}
          >
            <div className="flex flex-col items-center pt-1">
              <MilestoneDot state={m.state} />
              {!isLast ? (
                <div className="mt-2 w-px flex-1 min-h-[4rem] bg-accent/35" aria-hidden />
              ) : null}
            </div>

            <div className="min-w-0 pb-2">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="tp-eyebrow text-muted-foreground">
                  {metaLeft || `STEP ${m.stepIndex} OF ${m.totalSteps}`}
                </p>
                <p className="tp-eyebrow text-muted-foreground">
                  {m.dateRange}
                </p>
              </div>

              <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                {m.phaseTitle}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-body">
                {m.summary}
              </p>

              {m.showTargetBadge ? (
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-chart-3/30 bg-chart-3/10 px-3 py-1.5">
                  <span className="size-1.5 rounded-full bg-chart-3" aria-hidden />
                  <span className="tp-eyebrow text-chart-3">
                    Target university
                  </span>
                </div>
              ) : null}

              {m.recorded.length > 0 ? (
                <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm tp-interactive-panel">
                  <p className="tp-eyebrow text-accent">
                    Recorded
                  </p>
                  <ul className="mt-4 space-y-3">
                    {m.recorded.map((c) => (
                      <li key={c.id} className="flex items-center gap-3">
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-chart-3"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            c.status === "completed" &&
                              "text-muted-foreground line-through decoration-chart-3/40"
                          )}
                        >
                          {c.course_name}
                          <span className="ml-2 tp-eyebrow text-muted-foreground no-underline">
                            {statusLabel(c.status)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {m.showCoursePanel ? (
                <CoursePanel
                  milestone={m}
                  savingId={savingId}
                  deletingId={deletingId}
                  termOptions={termOptions}
                  onPatch={onPatchCourse}
                  onDelete={onDeleteCourse}
                  majorName={majorName}
                  majorStatus={majorStatus}
                  majorError={majorError}
                  addMajorBusy={addMajorBusy}
                  onMajorNameChange={setMajorName}
                  onMajorStatusChange={setMajorStatus}
                  onSubmitMajor={submitMajorPrereq}
                />
              ) : null}

              {m.tasks.length > 0 ? (
                <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm tp-interactive-panel">
                  <p className="tp-eyebrow text-muted-foreground">
                    Tasks
                  </p>
                  <ul className="mt-4 space-y-3">
                    {m.tasks.map((t) => (
                      <li key={t.task_key}>
                        <Link
                          href={t.href}
                          className="group flex items-start gap-3 text-sm font-medium text-foreground hover:text-primary"
                        >
                          <Circle
                            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-accent"
                            strokeWidth={1.5}
                            aria-hidden
                          />
                          <span>{t.text}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CoursePanel({
  milestone,
  savingId,
  deletingId,
  termOptions,
  onPatch,
  onDelete,
  majorName,
  majorStatus,
  majorError,
  addMajorBusy,
  onMajorNameChange,
  onMajorStatusChange,
  onSubmitMajor,
}: {
  milestone: TimelineMilestone
  savingId: string | null
  deletingId: string | null
  termOptions: { value: string; label: string }[]
  onPatch: TimelineMilestoneTrackProps["onPatchCourse"]
  onDelete: TimelineMilestoneTrackProps["onDeleteCourse"]
  majorName: string
  majorStatus: "planned" | "in_progress" | "completed"
  majorError: string
  addMajorBusy: boolean
  onMajorNameChange: (v: string) => void
  onMajorStatusChange: (v: "planned" | "in_progress" | "completed") => void
  onSubmitMajor: () => Promise<void>
}) {
  const isMajor = milestone.kind === "major_prereqs"
  const label = isMajor ? "Your prerequisites" : "Courses"

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm tp-interactive-panel">
      <p className="tp-eyebrow text-accent">
        {label}
      </p>

      {milestone.courses.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {milestone.courses.map((course) => (
            <li key={course.id}>
              <CourseEditorRow
                course={course}
                savingId={savingId}
                deletingId={deletingId}
                termOptions={termOptions}
                hideTermSelect={isMajor}
                onPatch={onPatch}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {isMajor
            ? "No prerequisite courses yet. Add any course name from your degree audit below."
            : "No courses in this section yet."}
        </p>
      )}

      {isMajor ? (
        <div className="mt-5 space-y-3 border-t border-border pt-5">
          <p className="text-sm font-medium text-foreground">Add required course</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <label htmlFor="major-prereq-name" className="sr-only">
                Course name
              </label>
              <Input
                id="major-prereq-name"
                value={majorName}
                onChange={(e) => onMajorNameChange(e.target.value)}
                placeholder="e.g. MATH 2414, COSC 1337"
                className="h-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onSubmitMajor()
                }}
              />
            </div>
            <select
              value={majorStatus}
              onChange={(e) =>
                onMajorStatusChange(e.target.value as "planned" | "in_progress" | "completed")
              }
              className="h-10 min-w-[130px] rounded-lg border border-border bg-background px-2 text-sm"
              aria-label="Status for new prerequisite course"
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
            <Button
              type="button"
              variant="accent"
              size="sm"
              className="shrink-0"
              disabled={addMajorBusy || !majorName.trim()}
              onClick={() => void onSubmitMajor()}
            >
              {addMajorBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add
                </>
              )}
            </Button>
          </div>
          {majorError ? <p className="text-sm text-destructive">{majorError}</p> : null}
          <p className="text-xs text-muted-foreground">
            Saved under {MAJOR_PREREQ_PHASE_BUCKET} on your timeline.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function CourseEditorRow({
  course,
  savingId,
  deletingId,
  termOptions,
  hideTermSelect,
  onPatch,
  onDelete,
}: {
  course: TimelineRecordedCourse
  savingId: string | null
  deletingId: string | null
  termOptions: { value: string; label: string }[]
  hideTermSelect?: boolean
  onPatch: TimelineMilestoneTrackProps["onPatchCourse"]
  onDelete: TimelineMilestoneTrackProps["onDeleteCourse"]
}) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-sm text-foreground">{course.course_name}</p>
        <div className="flex flex-wrap items-center gap-2">
          {(savingId === course.id || deletingId === course.id) && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
          {!hideTermSelect ? (
            <select
              value={course.semester_taken?.trim() || ""}
              onChange={(e) => {
                const v = e.target.value
                void onPatch(course.id, {
                  semester_taken: v === "" ? null : v.slice(0, 64),
                })
              }}
              className="h-9 min-w-[140px] rounded-lg border border-border bg-background px-2 text-sm"
              aria-label={`Term for ${course.course_name}`}
            >
              {termOptions.map((o) => (
                <option key={o.value || "un"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : null}
          <select
            value={course.status}
            onChange={(e) => void onPatch(course.id, { status: e.target.value })}
            className="h-9 min-w-[130px] rounded-lg border border-border bg-background px-2 text-sm"
            aria-label={`Status for ${course.course_name}`}
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${course.course_name}`}
            onClick={() => void onDelete(course.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

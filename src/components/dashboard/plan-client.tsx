"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CANONICAL_COURSE_CATEGORIES } from "@/data/canonical-course-catalog"
import { buildPlanTerms, PLAN_UNSCHEDULED_LABEL } from "@/lib/build-plan-terms"
import {
  courseStatusToPlanDisplayStatus,
  planDisplayStatusLabel,
} from "@/lib/plan-course-display-status"
import { buildPlanTermSelectOptions } from "@/lib/plan-term-select-options"
import type { ChecklistProfileSummary } from "@/lib/checklist-task-definitions"
import type { CompletenessLadderState } from "@/lib/completeness-ladder"
import type { PlanTermSection } from "@/types/plan-terms"
import { StatusBadge } from "@/components/ui/status"
import { Provenance } from "@/components/ui/provenance"
import { cn } from "@/lib/utils"
import { PlanTermRail } from "@/components/dashboard/plan-term-rail"
import { PlanReadinessAside } from "@/components/dashboard/plan-readiness-aside"

export type PlanCourseRow = {
  id: string
  course_name: string
  status: "completed" | "in_progress" | "planned"
  semester_taken: string | null
  canonical_course_id: string | null
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

function sectionDomId(termLabel: string): string {
  return `plan-term-${termLabel.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`
}

function sectionTrailing(section: PlanTermSection): string {
  const n = section.courses.length
  if (section.kind === "entry_marker") return "entry term"
  if (section.kind === "unscheduled") return n === 1 ? "1 item" : `${n} items`
  if (n === 0) return "no courses"
  const completed = section.courses.every((c) => c.status === "completed")
  if (completed && section.temporalState === "completed") {
    return `collapsed · ${n} course${n === 1 ? "" : "s"} · complete`
  }
  const planned = section.courses.filter((c) => c.status === "planned").length
  if (planned > 0) return `${n} course${n === 1 ? "" : "s"} planned`
  return `${n} course${n === 1 ? "" : "s"}`
}

interface PlanClientProps {
  userId: string
  initialCourses: PlanCourseRow[]
  checklistProfile: ChecklistProfileSummary
  completenessLadderState: CompletenessLadderState
  pathwayReadinessScore: number
  creditsCompleted: number | null
}

export function PlanClient({
  userId,
  initialCourses,
  checklistProfile,
  completenessLadderState,
  pathwayReadinessScore,
  creditsCompleted,
}: PlanClientProps) {
  const [rows, setRows] = useState<PlanCourseRow[]>(initialCourses)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [listError, setListError] = useState("")
  const [activeRailLabel, setActiveRailLabel] = useState<string | null>(null)
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(() => new Set())

  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState("")
  const [addStatus, setAddStatus] = useState<"planned" | "in_progress" | "completed">("planned")
  const [addTerm, setAddTerm] = useState("")
  const [addBusy, setAddBusy] = useState(false)
  const [addError, setAddError] = useState("")

  const termOptions = useMemo(
    () =>
      buildPlanTermSelectOptions(rows, checklistProfile.expectedTransferTerm ?? null),
    [rows, checklistProfile.expectedTransferTerm]
  )

  const planTerms = useMemo(
    () =>
      buildPlanTerms({
        courses: rows,
        expectedTransferTerm: checklistProfile.expectedTransferTerm ?? null,
        targetSchoolName: checklistProfile.targetUniversityName ?? null,
      }),
    [rows, checklistProfile.expectedTransferTerm, checklistProfile.targetUniversityName]
  )

  const calendarTermCount = planTerms.sections.filter((s) => s.kind === "calendar").length

  const toggleExpanded = useCallback((termLabel: string) => {
    setExpandedTerms((prev) => {
      const next = new Set(prev)
      if (next.has(termLabel)) next.delete(termLabel)
      else next.add(termLabel)
      return next
    })
  }, [])

  const scrollToTerm = useCallback((termLabel: string) => {
    setActiveRailLabel(termLabel)
    const el = document.getElementById(sectionDomId(termLabel))
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const patchCourse = useCallback(
    async (rowId: string, updates: { semester_taken?: string | null; status?: string }) => {
      let prev: PlanCourseRow | undefined
      setSavingId(rowId)
      setListError("")
      setRows((r) => {
        prev = r.find((x) => x.id === rowId)
        return r.map((x) => (x.id === rowId ? ({ ...x, ...updates } as PlanCourseRow) : x))
      })
      if (!prev) {
        setSavingId(null)
        return
      }

      const supabase = createClient()
      const payload: Record<string, unknown> = {}
      if ("semester_taken" in updates) {
        const v = updates.semester_taken
        payload.semester_taken = v && v.trim() !== "" ? v.trim().slice(0, 64) : null
      }
      if ("status" in updates && updates.status) payload.status = updates.status

      const { error } = await supabase
        .from("user_courses")
        .update(payload)
        .eq("id", rowId)
        .eq("user_id", userId)

      setSavingId(null)

      if (error) {
        setRows((r) => r.map((x) => (x.id === rowId ? prev! : x)))
        setListError(error.message)
      }
    },
    [userId]
  )

  const deleteCourse = useCallback(
    async (rowId: string) => {
      let prev: PlanCourseRow | undefined
      setDeletingId(rowId)
      setListError("")
      setRows((r) => {
        prev = r.find((x) => x.id === rowId)
        return r.filter((x) => x.id !== rowId)
      })
      if (!prev) {
        setDeletingId(null)
        return
      }

      const supabase = createClient()
      const { error } = await supabase
        .from("user_courses")
        .delete()
        .eq("id", rowId)
        .eq("user_id", userId)

      setDeletingId(null)

      if (error) {
        setRows((r) => [...r, prev!])
        setListError(error.message)
      }
    },
    [userId]
  )

  async function handleAddCourse() {
    const name = addName.trim()
    if (!name) {
      setAddError("Select a course.")
      return
    }

    const sem = addTerm.trim() === "" ? null : addTerm.trim().slice(0, 64)

    const duplicate = rows.some(
      (r) =>
        norm(r.course_name) === norm(name) &&
        (r.semester_taken?.trim() || "") === (sem || "")
    )
    if (duplicate) {
      setAddError("You already have this course for this term.")
      return
    }

    setAddBusy(true)
    setAddError("")

    const supabase = createClient()
    const { data: canon } = await supabase
      .from("canonical_courses")
      .select("id")
      .eq("course_name", name)
      .maybeSingle()

    const { data: inserted, error } = await supabase
      .from("user_courses")
      .insert({
        user_id: userId,
        course_name: name,
        status: addStatus,
        canonical_course_id: canon?.id ?? null,
        semester_taken: sem,
      })
      .select("id, course_name, status, semester_taken, canonical_course_id")
      .single()

    setAddBusy(false)

    if (error) {
      setAddError(error.message)
      return
    }

    if (inserted) {
      setRows((r) => [
        ...r,
        {
          id: inserted.id,
          course_name: inserted.course_name,
          status: inserted.status as PlanCourseRow["status"],
          semester_taken: inserted.semester_taken,
          canonical_course_id: inserted.canonical_course_id,
        },
      ])
    }
    setAddOpen(false)
    setAddName("")
    setAddStatus("planned")
    setAddTerm("")
  }

  function openAddForTerm(termLabel: string) {
    if (termLabel === PLAN_UNSCHEDULED_LABEL) {
      setAddTerm("")
    } else if (termLabel === checklistProfile.expectedTransferTerm) {
      setAddTerm("")
    } else {
      setAddTerm(termLabel)
    }
    setAddError("")
    setAddOpen(true)
  }

  const journeySubtitle = `Every term on your path, in calendar order. ${calendarTermCount} term${calendarTermCount === 1 ? "" : "s"} scheduled.`

  return (
    <div className="mx-auto max-w-6xl space-y-6 tp-stagger-children">
      <div className="space-y-3">
        <p className="tp-eyebrow text-accent">Plan</p>
        <h1 className="font-heading text-balance text-3xl font-semibold tracking-tight text-foreground">
          Your plan
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {journeySubtitle}
        </p>
        {(!checklistProfile.targetUniversityName || !checklistProfile.expectedTransferTerm) && (
          <p className="text-sm text-muted-foreground">
            Missing details?{" "}
            <Link
              href="/dashboard/settings"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Set in Settings
            </Link>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <span className="tp-eyebrow text-muted-foreground">Term-by-term plan</span>
        <Button
          type="button"
          variant="accent"
          onClick={() => {
            setAddTerm("")
            setAddError("")
            setAddOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add course
        </Button>
      </div>

      {listError ? (
        <p className="text-sm text-destructive" role="alert">
          {listError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[132px_minmax(0,1fr)_200px] lg:gap-8">
        <div className="hidden lg:block">
          <PlanTermRail
            sections={planTerms.sections}
            activeLabel={activeRailLabel}
            onSelect={scrollToTerm}
          />
        </div>

        <div className="min-w-0 space-y-3">
          {planTerms.sections.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-5 py-8 text-sm text-muted-foreground">
              No courses yet.{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => setAddOpen(true)}
              >
                Add your first course
              </button>
            </div>
          ) : (
            planTerms.sections.map((section) => (
              <PlanTermSectionCard
                key={`${section.kind}-${section.termLabel}`}
                section={section}
                expanded={expandedTerms.has(section.termLabel)}
                onToggleExpand={() => toggleExpanded(section.termLabel)}
                savingId={savingId}
                deletingId={deletingId}
                termOptions={termOptions}
                onPatchCourse={patchCourse}
                onDeleteCourse={deleteCourse}
                onAddToTerm={() => openAddForTerm(section.termLabel)}
              />
            ))
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <PlanReadinessAside
            sections={planTerms.sections}
            completenessLadderState={completenessLadderState}
            pathwayReadinessScore={pathwayReadinessScore}
            creditsCompleted={creditsCompleted}
          />
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add course</DialogTitle>
            <DialogDescription>
              Choose from the catalog and assign a term. Use Later / Not scheduled for courses you
              have not placed yet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="plan-add-course" className="text-sm font-medium text-foreground">
                Course
              </label>
              <select
                id="plan-add-course"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                <option value="">Select a course…</option>
                {CANONICAL_COURSE_CATEGORIES.map((g) => (
                  <optgroup key={g.category} label={g.category}>
                    {g.courses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="plan-add-status" className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="plan-add-status"
                value={addStatus}
                onChange={(e) =>
                  setAddStatus(e.target.value as "planned" | "in_progress" | "completed")
                }
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="plan-add-term" className="text-sm font-medium text-foreground">
                Term
              </label>
              <select
                id="plan-add-term"
                value={addTerm}
                onChange={(e) => setAddTerm(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {termOptions.map((o) => (
                  <option key={o.value || "u"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {addError ? <p className="text-sm text-destructive">{addError}</p> : null}
            <Button
              type="button"
              onClick={() => void handleAddCourse()}
              disabled={addBusy || !addName}
              className="w-full"
            >
              {addBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add to plan"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PlanTermSectionCard({
  section,
  expanded,
  onToggleExpand,
  savingId,
  deletingId,
  termOptions,
  onPatchCourse,
  onDeleteCourse,
  onAddToTerm,
}: {
  section: PlanTermSection
  expanded: boolean
  onToggleExpand: () => void
  savingId: string | null
  deletingId: string | null
  termOptions: { value: string; label: string }[]
  onPatchCourse: (
    rowId: string,
    updates: { semester_taken?: string | null; status?: string }
  ) => void
  onDeleteCourse: (rowId: string) => Promise<void>
  onAddToTerm: () => void
}) {
  const isEntry = section.kind === "entry_marker"
  const isUnscheduled = section.kind === "unscheduled"
  const isCompletedCalendar =
    section.kind === "calendar" &&
    section.temporalState === "completed" &&
    section.courses.every((c) => c.status === "completed")
  const canCollapse = isCompletedCalendar && section.courses.length > 0
  const isCollapsed = canCollapse && !expanded

  const headerLabel = isEntry
    ? section.targetSchoolName
      ? `${section.termLabel} · ${section.targetSchoolName}`
      : section.termLabel
    : section.dateRange
      ? `${section.termLabel} · ${section.dateRange}`
      : section.termLabel

  return (
    <section
      id={sectionDomId(section.termLabel)}
      className={cn(
        "scroll-mt-24 rounded-lg border border-border bg-card",
        section.temporalState === "current" && "border-accent/50",
        isUnscheduled && "border-dashed bg-muted/20",
        isEntry && "border-border/80 bg-transparent"
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {canCollapse ? (
              <button
                type="button"
                onClick={onToggleExpand}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden />
                )}
                <span className="sr-only">{isCollapsed ? "Expand" : "Collapse"} term</span>
              </button>
            ) : null}
            <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">
              {headerLabel}
              {section.temporalState === "current" ? (
                <span className="ml-2 text-sm font-normal text-accent">· now</span>
              ) : null}
            </h2>
          </div>
          <p className="mt-0.5 text-caption text-muted-foreground">{sectionTrailing(section)}</p>
        </div>
      </div>

      {isEntry ? (
        <div className="space-y-2 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Transfer target. Not editable — set your entry term in Settings.
          </p>
          <Provenance
            level="estimated"
            basis="Your answer during onboarding — we have not confirmed an admission decision or entry date with your target school."
          />
        </div>
      ) : isCollapsed ? (
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground">
            All {section.courses.length} course{section.courses.length === 1 ? "" : "s"} complete.
            Expand to edit.
          </p>
        </div>
      ) : (
        <div className="space-y-2 px-4 py-3">
          {section.courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isUnscheduled
                ? "Nothing waiting to be scheduled. Add a course without a term and it will land here."
                : "No courses in this term yet."}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {section.courses.map((course) => (
                <li key={course.id} className="py-2.5 first:pt-0 last:pb-0">
                  <PlanCourseEditorRow
                    course={course}
                    savingId={savingId}
                    deletingId={deletingId}
                    termOptions={termOptions}
                    hasCalendarTerm={!isUnscheduled}
                    onPatch={onPatchCourse}
                    onDelete={onDeleteCourse}
                  />
                </li>
              ))}
            </ul>
          )}

          {!isEntry ? (
            <button
              type="button"
              onClick={onAddToTerm}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              + Add a course
              {section.kind === "calendar" ? ` to ${section.termLabel}` : ""}
            </button>
          ) : null}
        </div>
      )}
    </section>
  )
}

function PlanCourseEditorRow({
  course,
  savingId,
  deletingId,
  termOptions,
  hasCalendarTerm,
  onPatch,
  onDelete,
}: {
  course: {
    id: string
    course_name: string
    status: "completed" | "in_progress" | "planned"
    semester_taken: string | null
  }
  savingId: string | null
  deletingId: string | null
  termOptions: { value: string; label: string }[]
  hasCalendarTerm: boolean
  onPatch: (
    rowId: string,
    updates: { semester_taken?: string | null; status?: string }
  ) => void
  onDelete: (rowId: string) => Promise<void>
}) {
  const displayStatus = courseStatusToPlanDisplayStatus(course.status, { hasCalendarTerm })
  const statusMeta = planDisplayStatusLabel(course.status)
  const termName = course.semester_taken?.trim()

  return (
    <div>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-medium text-foreground">{course.course_name}</p>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={displayStatus} labelFrom="sm" />
            {course.status === "planned" && termName ? (
              <span className="text-caption text-muted-foreground">
                Planned · {termName}
              </span>
            ) : (
              <span className="text-caption text-muted-foreground">{statusMeta}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(savingId === course.id || deletingId === course.id) && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
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

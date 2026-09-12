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
  planDisplayStatusLabel,
} from "@/lib/plan-course-display-status"
import { buildPlanTermSelectOptions } from "@/lib/plan-term-select-options"
import type { ChecklistProfileSummary } from "@/lib/checklist-task-definitions"
import type { PlanTermSection } from "@/types/plan-terms"
import { Provenance } from "@/components/ui/provenance"
import { cn } from "@/lib/utils"
import { useHall } from "@/components/campus-ui/hall-context"
import { HallPlan, type HallPlanBlock } from "@/components/campus-ui/hall-plan"

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
}

export function PlanClient({
  userId,
  initialCourses,
  checklistProfile,
}: PlanClientProps) {
  const [rows, setRows] = useState<PlanCourseRow[]>(initialCourses)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [listError, setListError] = useState("")
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(() => {
    const firstPopulatedTerm = buildPlanTerms({
      courses: initialCourses,
      expectedTransferTerm: checklistProfile.expectedTransferTerm ?? null,
      targetSchoolName: checklistProfile.targetUniversityName ?? null,
    }).sections.find((section) => section.kind === "calendar" && section.courses.length > 0)

    return new Set(firstPopulatedTerm ? [firstPopulatedTerm.termLabel] : [])
  })

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
  const hall = useHall()
  const hallBlocks: HallPlanBlock[] = planTerms.sections.map((section) => ({
    term: section.termLabel,
    range: section.dateRange,
    courses:
      section.kind === "entry_marker"
        ? [
            {
              title: section.targetSchoolName
                ? `Entry — ${section.targetSchoolName}`
                : "Entry term",
              status: "",
            },
          ]
        : section.courses.map((c) => ({
            title: c.course_name,
            status: planDisplayStatusLabel(c.status),
          })),
  }))

  return (
    <div className={hall ? undefined : "plan-table mx-auto max-w-6xl tp-stagger-children"}>
      {hall ? (
        <>
          <HallPlan
            blocks={hallBlocks}
            note="Terms are ordered to the entry date. Requirements stay on the Registrar; this page only places courses on a calendar."
          />
          <button
            type="button"
            className="hall-ledger-link mt-8"
            onClick={() => {
              setAddTerm("")
              setAddError("")
              setAddOpen(true)
            }}
          >
            Add a course
          </button>
          {listError ? (
            <p className="mt-4 text-sm text-[color:var(--hall-clay)]" role="alert">
              {listError}
            </p>
          ) : null}
        </>
      ) : (
        <>
      <div className="plan-route-line">
        <p className="tp-eyebrow">Academic route</p>
        <p>
          <span>{checklistProfile.currentUniversityName ?? "Current school not set"}</span>
          <span aria-hidden> → </span>
          <strong>{checklistProfile.targetUniversityName ?? "Target school not set"}</strong>
        </p>
        <p>{checklistProfile.targetMajor ?? checklistProfile.fieldOfStudy ?? "Program not set"} · {checklistProfile.expectedTransferTerm ?? "Term not set"}</p>
      </div>
      <div className="plan-table-heading">
        <p className="tp-eyebrow text-accent">Classroom / official working copy</p>
        <h1 className="font-heading text-balance text-3xl font-semibold tracking-tight text-foreground">
          Term plan register
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

      <div className="plan-table-toolbar">
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

      <div className="plan-register-column-headings" aria-hidden>
        <span>Term</span>
        <span>Course</span>
        <span>Status</span>
        <span>Schedule</span>
        <span>Action</span>
      </div>

      <div className="plan-drawing-sheet min-w-0">
        {planTerms.sections.length === 0 ? (
          <div className="plan-empty-row text-sm text-muted-foreground">
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
        </>
      )}

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
        "plan-term-section scroll-mt-24",
        section.kind === "calendar" && "is-calendar",
        section.temporalState === "current" && "border-accent/50",
        isUnscheduled && "border-dashed bg-muted/20",
        isEntry && "border-border/80 bg-transparent"
      )}
    >
      <div className="plan-term-heading">
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
        <div className="plan-term-body">
          <p className="text-sm text-muted-foreground">
            Transfer target. Not editable — set your entry term in Settings.
          </p>
          <Provenance
            level="estimated"
            basis="Your answer during onboarding — we have not confirmed an admission decision or entry date with your target school."
          />
        </div>
      ) : isCollapsed ? (
        <div className="plan-term-body">
          <p className="text-sm text-muted-foreground">
            All {section.courses.length} course{section.courses.length === 1 ? "" : "s"} complete.
            Expand to edit.
          </p>
        </div>
      ) : (
        <div className="plan-term-body">
          {section.courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isUnscheduled
                ? "Nothing waiting to be scheduled. Add a course without a term and it will land here."
                : "No courses in this term yet."}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {section.courses.map((course) => (
                <li key={course.id} className="plan-course-line">
                  <PlanCourseEditorRow
                    course={course}
                    savingId={savingId}
                    deletingId={deletingId}
                    termOptions={termOptions}
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
  onPatch: (
    rowId: string,
    updates: { semester_taken?: string | null; status?: string }
  ) => void
  onDelete: (rowId: string) => Promise<void>
}) {
  const statusMeta = planDisplayStatusLabel(course.status)
  const termName = course.semester_taken?.trim()

  return (
    <div className="plan-course-editor">
      <div className="plan-course-identity">
        <p className="text-sm font-medium text-foreground">{course.course_name}</p>
        {course.status === "planned" && termName ? (
          <span className="text-caption text-muted-foreground">Filed for {termName}</span>
        ) : null}
      </div>
      <div className="plan-course-status">
        <span className="plan-status-notation">{statusMeta}</span>
        <select
          value={course.status}
          onChange={(e) => void onPatch(course.id, { status: e.target.value })}
          aria-label={`Status for ${course.course_name}`}
        >
          <option value="planned">Planned</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <select
        value={course.semester_taken?.trim() || ""}
        onChange={(e) => {
          const v = e.target.value
          void onPatch(course.id, {
            semester_taken: v === "" ? null : v.slice(0, 64),
          })
        }}
        aria-label={`Term for ${course.course_name}`}
      >
        {termOptions.map((o) => (
          <option key={o.value || "un"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="plan-course-review">
        {(savingId === course.id || deletingId === course.id) && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
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
  )
}

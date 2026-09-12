"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { CANONICAL_COURSE_CATEGORIES } from "@/data/canonical-course-catalog"
import { TimelineMilestoneTrack } from "@/components/dashboard/timeline-milestone-track"
import { buildTimelineMilestones } from "@/lib/build-timeline-milestones"
import type { ChecklistProfileSummary } from "@/lib/checklist-task-definitions"
import type { NextDeadline, RequirementDeadlineRow } from "@/lib/next-deadline"
import {
  FOUNDATION_PHASE_BUCKET,
  MAJOR_PREREQ_PHASE_BUCKET,
} from "@/lib/timeline-phase-buckets"
import { Plus, Loader2 } from "lucide-react"

export type TimelineCourseRow = {
  id: string
  course_name: string
  status: "completed" | "in_progress" | "planned"
  semester_taken: string | null
  canonical_course_id: string | null
}

function suggestedTermOptions(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [
    { value: FOUNDATION_PHASE_BUCKET, label: FOUNDATION_PHASE_BUCKET },
    { value: MAJOR_PREREQ_PHASE_BUCKET, label: MAJOR_PREREQ_PHASE_BUCKET },
    { value: "", label: "Unassigned" },
  ]
  const y = new Date().getFullYear()
  for (let dy = -1; dy <= 3; dy++) {
    const yr = y + dy
    for (const season of ["Spring", "Summer", "Fall"] as const) {
      const label = `${season} ${yr}`
      out.push({ value: label, label })
    }
  }
  return out
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

interface TimelineClientProps {
  userId: string
  initialCourses: TimelineCourseRow[]
  checklistProfile: ChecklistProfileSummary
  checklistCompleteByTaskKey: Record<string, boolean | undefined>
  deadlineRows: RequirementDeadlineRow[]
  nextDeadline: NextDeadline
  gpa: number | null
  creditsCompleted: number | null
  essayStarted: boolean
}

export function TimelineClient({
  userId,
  initialCourses,
  checklistProfile,
  checklistCompleteByTaskKey,
  deadlineRows,
  nextDeadline,
  gpa,
  creditsCompleted,
  essayStarted,
}: TimelineClientProps) {
  const [rows, setRows] = useState<TimelineCourseRow[]>(initialCourses)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [listError, setListError] = useState("")
  const [addMajorBusy, setAddMajorBusy] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState("")
  const [addStatus, setAddStatus] = useState<"planned" | "in_progress" | "completed">("planned")
  const [addTerm, setAddTerm] = useState("")
  const [addBusy, setAddBusy] = useState(false)
  const [addError, setAddError] = useState("")

  const termOptions = useMemo(() => suggestedTermOptions(), [])

  const { milestones, mappedSemesters, hasTarget } = useMemo(
    () =>
      buildTimelineMilestones({
        courses: rows,
        profile: checklistProfile,
        gpa,
        creditsCompleted,
        checklistCompleteByTaskKey,
        deadlineRows,
        nextDeadline,
        essayStarted,
      }),
    [
      rows,
      checklistProfile,
      gpa,
      creditsCompleted,
      checklistCompleteByTaskKey,
      deadlineRows,
      nextDeadline,
      essayStarted,
    ]
  )

  const patchCourse = useCallback(
    async (rowId: string, updates: { semester_taken?: string | null; status?: string }) => {
      let prev: TimelineCourseRow | undefined
      setSavingId(rowId)
      setListError("")
      setRows((r) => {
        prev = r.find((x) => x.id === rowId)
        return r.map((x) =>
          x.id === rowId ? ({ ...x, ...updates } as TimelineCourseRow) : x
        )
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
      let prev: TimelineCourseRow | undefined
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

  const addMajorPrereq = useCallback(
    async (name: string, status: "planned" | "in_progress" | "completed") => {
      const trimmed = name.trim()
      if (!trimmed) return

      const duplicate = rows.some(
        (r) =>
          norm(r.course_name) === norm(trimmed) &&
          r.semester_taken?.trim() === MAJOR_PREREQ_PHASE_BUCKET
      )
      if (duplicate) {
        setListError("You already have this course under Major prerequisites.")
        return
      }

      setAddMajorBusy(true)
      setListError("")

      const supabase = createClient()
      const { data: canon } = await supabase
        .from("canonical_courses")
        .select("id")
        .eq("course_name", trimmed)
        .maybeSingle()

      const { data: inserted, error } = await supabase
        .from("user_courses")
        .insert({
          user_id: userId,
          course_name: trimmed,
          status,
          canonical_course_id: canon?.id ?? null,
          semester_taken: MAJOR_PREREQ_PHASE_BUCKET,
        })
        .select("id, course_name, status, semester_taken, canonical_course_id")
        .single()

      setAddMajorBusy(false)

      if (error) {
        setListError(error.message)
        return
      }

      if (inserted) {
        setRows((r) => [
          ...r,
          {
            id: inserted.id,
            course_name: inserted.course_name,
            status: inserted.status as TimelineCourseRow["status"],
            semester_taken: inserted.semester_taken,
            canonical_course_id: inserted.canonical_course_id,
          },
        ])
      }
    },
    [rows, userId]
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
          status: inserted.status as TimelineCourseRow["status"],
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

  const targetCount = hasTarget ? 1 : 0
  const journeySubtitle = `Plan your courses term by term and keep deadlines in view. ${mappedSemesters} semester${mappedSemesters === 1 ? "" : "s"} mapped · ${targetCount} target school.`

  return (
    <div className="mx-auto max-w-3xl space-y-10 tp-stagger-children">
      <div className="space-y-4">
        <p className="tp-eyebrow text-accent">
          Plan
        </p>
        <h1 className="font-heading text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Your plan
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-body">
          {journeySubtitle}
        </p>
        {(!checklistProfile.targetUniversityName ||
          !checklistProfile.expectedTransferTerm) && (
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

      <div
        id="semester-roadmap"
        className="flex scroll-mt-24 flex-wrap items-center justify-between gap-4 border-b border-border pb-6"
      >
        <span className="tp-eyebrow text-muted-foreground">
          Semester roadmap
        </span>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="accent"
            onClick={() => {
              setAddOpen(true)
              setAddError("")
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add course
          </Button>
        </div>
      </div>

      {listError && (
        <p className="text-sm text-destructive" role="alert">
          {listError}
        </p>
      )}

      <TimelineMilestoneTrack
        milestones={milestones}
        savingId={savingId}
        deletingId={deletingId}
        termOptions={termOptions}
        onPatchCourse={patchCourse}
        onAddMajorPrereq={addMajorPrereq}
        onDeleteCourse={deleteCourse}
        addMajorBusy={addMajorBusy}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add course</DialogTitle>
            <DialogDescription>
              Choose from the catalog or assign to Foundation & core. For major-specific
              requirements, use the add form under Major prerequisites on the timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="add-course" className="text-sm font-medium text-foreground">
                Course
              </label>
              <select
                id="add-course"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm"
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
              <label htmlFor="add-status" className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="add-status"
                value={addStatus}
                onChange={(e) =>
                  setAddStatus(e.target.value as "planned" | "in_progress" | "completed")
                }
                className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="add-term" className="text-sm font-medium text-foreground">
                Term / section
              </label>
              <select
                id="add-term"
                value={addTerm}
                onChange={(e) => setAddTerm(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm"
              >
                {termOptions.map((o) => (
                  <option key={o.value || "u"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {addError && <p className="text-sm text-destructive">{addError}</p>}
            <Button
              type="button"
              onClick={() => void handleAddCourse()}
              disabled={addBusy || !addName}
              className="w-full"
            >
              {addBusy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add to timeline"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

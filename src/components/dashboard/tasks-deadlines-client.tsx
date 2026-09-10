"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Check, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  checklistCategoryForTaskKey,
} from "@/lib/build-tasks-deadlines-data"
import {
  type ChecklistDerivedInput,
  isChecklistTaskDerivedInProgress,
  isChecklistTaskEffectivelyComplete,
} from "@/lib/checklist-derived-status"
import { cn } from "@/lib/utils"
import { Provenance } from "@/components/ui/provenance"
import { StatusBadge } from "@/components/ui/status"
import {
  ExternalActionLink,
  ScopeChip,
} from "@/components/dashboard/overview/today-readiness-panel"
import type {
  TasksDeadlinesData,
  TasksDeadlinesDeadlineRow,
  TasksDeadlinesFilterId,
  TasksDeadlinesTaskRow,
} from "@/types/tasks-deadlines"

const FILTER_LABELS: Record<TasksDeadlinesFilterId, string> = {
  upcoming: "Upcoming",
  tasks: "Tasks",
  deadlines: "Deadlines",
  completed: "Completed",
  missing_dates: "Missing dates",
}

type TasksDeadlinesClientProps = {
  userId: string
  initialData: TasksDeadlinesData
  initialCompletionMap: Record<string, { is_complete: boolean; completed_at: string | null }>
  derivedInput: ChecklistDerivedInput
}

export function TasksDeadlinesClient({
  userId,
  initialData,
  initialCompletionMap,
  derivedInput,
}: TasksDeadlinesClientProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<TasksDeadlinesFilterId>("upcoming")
  const [completionMap, setCompletionMap] =
    useState(initialCompletionMap)

  const data = useMemo(() => {
    const open: TasksDeadlinesTaskRow[] = []
    const completed: TasksDeadlinesTaskRow[] = []

    for (const task of [...initialData.openTasks, ...initialData.completedTasks]) {
      const row = completionMap[task.id]
      const manual = row?.is_complete
      const done = isChecklistTaskEffectivelyComplete(task.id, manual, derivedInput)
      const status = done
        ? "done"
        : isChecklistTaskDerivedInProgress(task.id, derivedInput)
          ? "in_progress"
          : "not_started"

      const next: TasksDeadlinesTaskRow = {
        ...task,
        done,
        status,
      }

      if (done) {
        const doneLabel = row?.completed_at
          ? formatDoneDate(row.completed_at)
          : undefined
        completed.push({
          ...next,
          meta: doneLabel ? `Done ${doneLabel}` : "Done",
        })
      } else {
        open.push(next)
      }
    }

    const filterCounts = {
      upcoming: initialData.upcomingDeadlines.length + open.length,
      tasks: open.length,
      deadlines: initialData.upcomingDeadlines.length,
      completed: completed.length,
      missing_dates: initialData.missingDate ? 1 : 0,
    }

    return {
      ...initialData,
      openTasks: open,
      completedTasks: completed,
      filterCounts,
    }
  }, [initialData, completionMap, derivedInput])

  async function handleToggleTask(taskId: string, newIsComplete: boolean) {
    const now = new Date().toISOString()

    setCompletionMap((prev) => ({
      ...prev,
      [taskId]: {
        is_complete: newIsComplete,
        completed_at: newIsComplete ? now : null,
      },
    }))

    const supabase = createClient()
    const { error } = await supabase.from("user_checklist_items").upsert(
      {
        user_id: userId,
        task_key: taskId,
        category: checklistCategoryForTaskKey(taskId),
        is_complete: newIsComplete,
        completed_at: newIsComplete ? now : null,
      },
      { onConflict: "user_id,task_key" }
    )
    if (!error) router.refresh()
  }

  const h = data.header
  const showDeadlines =
    filter === "upcoming" || filter === "deadlines"
  const showOpenTasks =
    filter === "upcoming" || filter === "tasks"
  const showCompleted = filter === "completed"
  const showMissingSection =
    filter === "missing_dates" || (filter === "upcoming" && data.missingDate)

  return (
    <div className="mx-auto max-w-6xl space-y-8 tp-stagger-children">
      <header className="space-y-3">
        <p className="tp-eyebrow text-accent">Tasks & deadlines</p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Tasks & deadlines
        </h1>
        <p className="text-sm text-muted-foreground">
          {h.fromInstitution}{" "}
          <span className="text-muted-foreground/40">→</span>{" "}
          <span className="font-medium text-foreground">
            {h.toInstitution} · {h.program} · {h.term}
          </span>
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          One destination for institution-owned dates and your application work — kept visibly
          distinct because one belongs to a school and the other belongs to you.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(FILTER_LABELS) as TasksDeadlinesFilterId[]).map((id) => {
          const count = data.filterCounts[id]
          const active = filter === id
          const alwaysEnabled = id === "missing_dates"
          const disabled = !alwaysEnabled && count === 0

          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => setFilter(id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-all",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : disabled
                    ? "cursor-not-allowed border-border bg-muted/40 text-muted-foreground/60"
                    : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
              )}
            >
              {FILTER_LABELS[id]}
              <span
                className={cn(
                  "ml-0.5 tabular-nums text-xs",
                  active ? "text-primary-foreground/90" : undefined
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:gap-8">
        <div className="space-y-6">
          {showDeadlines ? (
            <Section
              title="Deadlines"
              subtitle="Institution-owned · no checkbox"
              trailing={`${data.upcomingDeadlines.length} row${data.upcomingDeadlines.length === 1 ? "" : "s"}`}
              empty="No upcoming deadlines in the next two years."
            >
              {data.upcomingDeadlines.map((row, i) => (
                <DeadlineRow key={row.id} row={row} first={i === 0} />
              ))}
            </Section>
          ) : null}

          {showOpenTasks ? (
            <Section
              title="Tasks"
              subtitle="Yours · checkbox-led"
              trailing={`${data.openTasks.length} open`}
              empty="No open application or preparation tasks."
            >
              {data.openTasks.map((row, i) => (
                <TaskRow
                  key={row.id}
                  row={row}
                  first={i === 0}
                  onToggle={(done) => void handleToggleTask(row.id, done)}
                />
              ))}
            </Section>
          ) : null}

          {showMissingSection ? (
            <MissingDatesSection
              missingDate={data.missingDate}
              emptyVoice={filter === "missing_dates"}
            />
          ) : null}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {showCompleted ? (
            <Section
              title="Completed"
              trailing={`${data.completedTasks.length} row${data.completedTasks.length === 1 ? "" : "s"}`}
              empty="Nothing completed yet."
            >
              {data.completedTasks.map((row, i) => (
                <CompletedTaskRow key={row.id} row={row} first={i === 0} />
              ))}
            </Section>
          ) : filter === "upcoming" ? (
            <Section
              title="Completed"
              trailing={`${data.completedTasks.length} row${data.completedTasks.length === 1 ? "" : "s"}`}
              empty="Nothing completed yet."
            >
              {data.completedTasks.slice(0, 5).map((row, i) => (
                <CompletedTaskRow key={row.id} row={row} first={i === 0} />
              ))}
            </Section>
          ) : null}

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <p className="tp-eyebrow text-muted-foreground">Not on this page</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Academic prerequisites — English Composition, Calculus, and field-specific courses —
              are requirements, not errands. They live on Requirements and are satisfied by logging
              a course.
            </p>
            <Link
              href="/dashboard/requirements"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-accent"
            >
              Open Requirements
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  trailing,
  empty,
  children,
}: {
  title: string
  subtitle?: string
  trailing?: string
  empty?: string
  children: React.ReactNode
}) {
  const hasChildren = React.Children.count(children) > 0

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-heading text-lg text-foreground">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-caption text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {trailing ? (
          <p className="font-mono text-eyebrow uppercase tracking-wider text-muted-foreground">
            {trailing}
          </p>
        ) : null}
      </div>
      {hasChildren ? (
        <ul className="divide-y divide-border">{children}</ul>
      ) : empty ? (
        <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">{empty}</p>
      ) : null}
    </section>
  )
}

function DeadlineRow({
  row,
  first,
}: {
  row: TasksDeadlinesDeadlineRow
  first: boolean
}) {
  return (
    <li
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 px-5 py-4 sm:px-6",
        !first && undefined
      )}
    >
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="w-24 shrink-0">
          <p className="text-sm tabular-nums text-muted-foreground">{row.dateLabel}</p>
          {row.countdownLabel ? (
            <p className="mt-0.5 text-caption text-accent">{row.countdownLabel}</p>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ScopeChip label={row.scopeChip} />
            <span className="text-caption text-muted-foreground">{row.categoryMeta}</span>
          </div>
          <p className="mt-1 font-medium text-foreground">{row.title}</p>
          <Provenance {...row.provenance} className="mt-2" />
        </div>
      </div>
      {row.officialUrl ? (
        <ExternalActionLink href={row.officialUrl} label="Open" />
      ) : (
        <Link
          href="/dashboard/requirements"
          className="text-sm font-medium text-primary hover:text-accent"
        >
          Open
        </Link>
      )}
    </li>
  )
}

function TaskRow({
  row,
  first,
  onToggle,
}: {
  row: TasksDeadlinesTaskRow
  first: boolean
  onToggle: (done: boolean) => void
}) {
  return (
    <li
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 px-5 py-4 sm:px-6",
        !first && undefined
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <button
          type="button"
          aria-pressed={row.done}
          aria-label={row.done ? "Mark incomplete" : "Mark complete"}
          onClick={() => onToggle(!row.done)}
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-all",
            row.done
              ? "border-accent bg-accent text-accent-foreground"
              : "border-muted-foreground/30 bg-transparent hover:border-accent hover:bg-accent/10"
          )}
        >
          {row.done ? <Check className="size-3" strokeWidth={3} aria-hidden /> : null}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={row.status} labelFrom="sm" />
            {row.meta ? (
              <span className="text-caption text-muted-foreground">{row.meta}</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-foreground">{row.title}</p>
        </div>
      </div>
      {row.action ? (
        <Link
          href={row.action.href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:text-accent"
        >
          {row.action.label}
          {row.action.href.startsWith("http") ? (
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          )}
        </Link>
      ) : null}
    </li>
  )
}

function CompletedTaskRow({
  row,
  first,
}: {
  row: TasksDeadlinesTaskRow
  first: boolean
}) {
  return (
    <li
      className={cn(
        "flex items-start justify-between gap-4 px-5 py-4 sm:px-6",
        !first && undefined
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-accent bg-accent text-accent-foreground"
          aria-hidden
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground line-through">{row.title}</p>
          {row.meta ? (
            <p className="mt-0.5 text-caption text-muted-foreground">{row.meta}</p>
          ) : null}
        </div>
      </div>
      {row.action ? (
        <Link
          href={row.action.href}
          className="shrink-0 text-sm font-medium text-primary hover:text-accent"
        >
          {row.action.label}
        </Link>
      ) : null}
    </li>
  )
}

function MissingDatesSection({
  missingDate,
  emptyVoice = false,
}: {
  missingDate: TasksDeadlinesData["missingDate"]
  emptyVoice?: boolean
}) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-card p-5 sm:p-6",
        missingDate ? "border-accent/40 bg-accent/5" : "border-border"
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="tp-eyebrow text-muted-foreground">Missing dates</p>
        <p className="font-mono text-eyebrow uppercase tracking-wider text-muted-foreground">
          {missingDate ? "1 row" : "0 rows"}
        </p>
      </div>

      {missingDate ? (
        <>
          <p className="mt-3 text-sm font-medium text-foreground">{missingDate.headline}</p>
          <Provenance level="missing" what={missingDate.provenanceWhat} className="mt-3" />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {missingDate.officialUrl ? (
              <a
                href={missingDate.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Open official page
                <span className="sr-only">
                  {` (${hostLabel(missingDate.officialUrl)}, opens in a new tab)`}
                </span>
              </a>
            ) : null}
            <Link
              href="/sources"
              className="text-sm font-medium text-primary hover:text-accent"
            >
              Why this is missing
            </Link>
            <Link
              href={missingDate.recordHref}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              How to keep your own note
            </Link>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {emptyVoice
            ? "We hold application deadline dates for your entry term, or your pathway is not set up yet. When a date is genuinely unknown, it appears here with an explanation — not as a blank row."
            : "No missing application deadlines for your entry term."}
        </p>
      )}
    </section>
  )
}

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "official page"
  }
}

function formatDoneDate(iso: string): string | undefined {
  const d = new Date(iso.trim())
  if (Number.isNaN(d.getTime())) return undefined
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d)
}
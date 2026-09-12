"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { ChecklistWorkspaceData, ChecklistWorkspaceTask } from "@/types/checklist-workspace"

type Filter = "all" | "urgent" | "completed" | string

export type ChecklistWorkspaceUiProps = {
  data: ChecklistWorkspaceData
  onToggleTask?: (taskId: string, nextDone: boolean) => void
  LinkComponent?: React.ComponentType<{
    href: string
    className?: string
    children: React.ReactNode
  }>
  categoryIcons?: Record<string, React.ReactNode>
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ChevronIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function ArrowUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  )
}

function FlameIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2s4 5 4 9a4 4 0 11-8 0c0-1.5.5-2.5 1-3-.5 3 1 4 1 4S8 9 12 2zm-2 14a4 4 0 108 0c0 4-4 6-4 6s-4-2-4-6z" />
    </svg>
  )
}

export function ChecklistWorkspaceUi({
  data,
  onToggleTask,
  LinkComponent,
}: ChecklistWorkspaceUiProps) {
  const initial = React.useMemo(
    () =>
      Object.fromEntries(
        data.categories.flatMap((c) => c.tasks.map((t) => [t.id, !!t.done]))
      ) as Record<string, boolean>,
    [data]
  )
  const taskSyncKey = React.useMemo(
    () => data.categories.flatMap((c) => c.tasks.map((t) => `${t.id}:${t.done}`)).join("|"),
    [data]
  )

  return (
    <ChecklistWorkspaceBody
      key={taskSyncKey}
      data={data}
      initial={initial}
      onToggleTask={onToggleTask}
      LinkComponent={LinkComponent}
    />
  )
}

function ChecklistWorkspaceBody({
  data,
  initial,
  onToggleTask,
  LinkComponent,
}: ChecklistWorkspaceUiProps & { initial: Record<string, boolean> }) {
  const Link =
    LinkComponent ??
    (({ href, className, children }) => (
      <a href={href} className={className}>
        {children}
      </a>
    ))

  const [tasks, setTasks] = React.useState(initial)

  const [filter, setFilter] = React.useState<Filter>("all")
  const [open, setOpen] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(data.categories.map((c) => [c.id, true]))
  )

  const toggle = (id: string) => {
    const next = !tasks[id]
    setTasks((s) => ({ ...s, [id]: next }))
    onToggleTask?.(id, next)
  }

  const stats = React.useMemo(() => {
    const per = data.categories.map((c) => ({
      id: c.id,
      label: c.label,
      total: c.tasks.length,
      done: c.tasks.filter((t) => tasks[t.id]).length,
    }))
    const total = per.reduce((s, p) => s + p.total, 0)
    const done = per.reduce((s, p) => s + p.done, 0)
    const urgent = data.categories
      .flatMap((c) => c.tasks)
      .filter((t) => t.urgent && !tasks[t.id]).length
    return { per, total, done, pct: total ? Math.round((done / total) * 100) : 0, urgent }
  }, [data, tasks])

  const chips: { id: Filter; label: string; count?: number }[] = [
    { id: "all", label: "All" },
    { id: "urgent", label: "Urgent", count: stats.urgent },
    ...data.categories.map((c) => ({ id: c.id, label: c.label })),
    { id: "completed", label: "Completed" },
  ]

  const visibleCats = data.categories.filter((c) =>
    filter === "all" || filter === "urgent" || filter === "completed" ? true : c.id === filter
  )

  const isTaskVisible = (t: ChecklistWorkspaceTask) => {
    if (filter === "urgent") return t.urgent && !tasks[t.id]
    if (filter === "completed") return tasks[t.id]
    return true
  }

  const h = data.header

  return (
    <div className="checklist-register tp-stagger-children">
      <header className="checklist-register-header">
        <p className="tp-eyebrow text-accent">
          Dormitory / move-forward record
        </p>
        <h1>{h.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{h.fromInstitution}</span>
          <span className="text-muted-foreground/40">→</span>
          <span className="font-medium text-foreground">
            {h.toInstitution} · {h.program} · {h.term}
          </span>
          {h.lastUpdatedLabel ? (
            <>
              <span aria-hidden>·</span>
              <span className="font-mono text-eyebrow uppercase tracking-wider text-muted-foreground">
                Updated · {h.lastUpdatedLabel}
              </span>
            </>
          ) : null}
        </div>
      </header>

      <section className="checklist-register-summary" aria-label="Checklist completion summary">
        <div>
          <span className="checklist-score">{stats.done}</span>
          <span className="checklist-score-denominator"> / {stats.total} filed</span>
        </div>
        <div className="checklist-summary-columns">
          {stats.per.map((p) => (
            <p key={p.id}><span>{p.label}</span><strong>{p.done}/{p.total}</strong></p>
          ))}
        </div>
        <p>{stats.pct}% complete{h.readinessMessage ? ` · ${h.readinessMessage}` : ""}</p>
      </section>

      <div className="checklist-register-filters" aria-label="Filter checklist">
        {chips.map((c) => {
          const active = filter === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={cn(
                "checklist-filter",
                active
                  ? "is-active"
                  : undefined
              )}
            >
              {c.id === "urgent" && (
                <FlameIcon
                  className={cn("size-3.5", active ? "text-accent-foreground" : "text-accent")}
                />
              )}
              {c.label}
              {typeof c.count === "number" && c.count > 0 ? (
                <span
                  className={cn(
                    "ml-0.5 tabular-nums",
                    active ? "text-current" : "text-accent"
                  )}
                >
                  {c.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="checklist-register-body">
        {visibleCats.map((cat) => {
          const visibleTasks = cat.tasks.filter(isTaskVisible)
          if (visibleTasks.length === 0) return null
          const done = cat.tasks.filter((t) => tasks[t.id]).length
          const isOpen = open[cat.id]
          return (
            <section
              key={cat.id}
              className="checklist-register-section"
            >
              <button
                type="button"
                onClick={() => setOpen((s) => ({ ...s, [cat.id]: !s[cat.id] }))}
                className="checklist-section-heading"
              >
                <div>
                  <h2>{cat.label} register</h2>
                  <p>{done}/{cat.tasks.length} complete</p>
                </div>
                <ChevronIcon
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {isOpen ? (
                <ul>
                  {visibleTasks.map((t) => {
                    const isDone = tasks[t.id]
                    return (
                      <li
                        key={t.id}
                        className={cn("checklist-register-row", t.urgent && !isDone && "is-urgent")}
                      >
                        {t.urgent && !isDone ? (
                          <span
                            className="checklist-urgent-rule"
                            aria-hidden
                          />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => toggle(t.id)}
                          aria-pressed={isDone}
                          aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                          className={cn(
                            "checklist-box",
                            isDone
                              ? "is-done"
                              : undefined
                          )}
                        >
                          {isDone ? <CheckIcon className="size-3" /> : null}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm transition-colors",
                              isDone
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            )}
                          >
                            {t.title}
                            {t.hint ? (
                              <span className="ml-2 font-mono text-eyebrow uppercase tracking-wider text-muted-foreground">
                                [{t.hint}]
                              </span>
                            ) : null}
                          </p>
                        </div>
                        {t.urgent && !isDone ? (
                          <span className="checklist-urgent-label">
                            Urgent
                          </span>
                        ) : null}
                        {t.link ? (
                          <Link
                            href={t.link.href}
                            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary opacity-80 transition-opacity hover:opacity-100"
                          >
                            {t.link.label}
                            <ArrowUpIcon className="size-3" />
                          </Link>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </section>
          )
        })}
      </div>
    </div>
  )
}

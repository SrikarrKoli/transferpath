"use client"

import * as React from "react"
import { Meter } from "@/components/ui/progress"
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
  categoryIcons = {},
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
      categoryIcons={categoryIcons}
    />
  )
}

function ChecklistWorkspaceBody({
  data,
  initial,
  onToggleTask,
  LinkComponent,
  categoryIcons = {},
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

  const R = 34
  const C = 2 * Math.PI * R
  const offset = C - (stats.pct / 100) * C
  const h = data.header

  return (
    <div className="mx-auto max-w-5xl space-y-10 tp-stagger-children">
      <header className="space-y-3">
        <p className="tp-eyebrow text-accent">
          {h.eyebrow ?? "Checklist"}
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {h.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{h.fromInstitution}</span>
          <span className="text-muted-foreground/40">→</span>
          <span className="font-medium text-foreground">
            {h.toInstitution} · {h.program} · {h.term}
          </span>
          {h.lastUpdatedLabel ? (
            <>
              <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/30 md:inline-block" />
              <span className="font-mono text-eyebrow uppercase tracking-wider text-muted-foreground">
                Updated · {h.lastUpdatedLabel}
              </span>
            </>
          ) : null}
        </div>
      </header>

      <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
          <div className="relative mx-auto grid size-36 place-items-center sm:mx-0">
            <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/80" />
              <circle
                cx="40"
                cy="40"
                r={R}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={offset}
                className="text-accent transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>
            <div className="text-center">
              <div className="font-heading text-3xl font-semibold leading-none text-foreground">
                {stats.done}
              </div>
              <div className="mt-1 tp-eyebrow text-muted-foreground">
                of {stats.total}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {stats.per.map((p) => {
              const pct = p.total ? (p.done / p.total) * 100 : 0
              return (
                <div key={p.id}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-sm font-medium text-foreground">{p.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {p.done}
                      <span className="text-muted-foreground/50">/{p.total}</span>
                    </span>
                  </div>
                  <Meter value={pct} label={`${p.label}: ${p.done} of ${p.total} complete`} size="md" />
                </div>
              )
            })}
            {h.readinessMessage ? (
              <p className="pt-2 text-sm text-muted-foreground">
                You&apos;ve completed{" "}
                <span className="font-semibold text-foreground">{stats.pct}%</span> of your
                checklist. <span>{h.readinessMessage}</span>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {chips.map((c) => {
          const active = filter === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-all",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
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
                    "ml-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-eyebrow font-semibold",
                    active ? "bg-accent text-accent-foreground" : "bg-accent/15 text-accent"
                  )}
                >
                  {c.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="space-y-5">
        {visibleCats.map((cat) => {
          const visibleTasks = cat.tasks.filter(isTaskVisible)
          if (visibleTasks.length === 0) return null
          const done = cat.tasks.filter((t) => tasks[t.id]).length
          const isOpen = open[cat.id]
          const icon = categoryIcons[cat.id] ?? cat.icon

          return (
            <section
              key={cat.id}
              className="overflow-hidden rounded-2xl border border-border bg-card tp-interactive-panel"
            >
              <button
                type="button"
                onClick={() => setOpen((s) => ({ ...s, [cat.id]: !s[cat.id] }))}
                className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  {icon ? (
                    <div className="grid size-9 place-items-center rounded-lg bg-primary/5 text-primary">
                      {icon}
                    </div>
                  ) : null}
                  <div>
                    <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                      {cat.label} Tasks
                    </h2>
                    <p className="font-mono text-eyebrow uppercase tracking-wider text-muted-foreground">
                      {done}/{cat.tasks.length} complete
                    </p>
                  </div>
                </div>
                <ChevronIcon
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {isOpen ? (
                <ul className="divide-y divide-border border-t border-border">
                  {visibleTasks.map((t) => {
                    const isDone = tasks[t.id]
                    return (
                      <li
                        key={t.id}
                        className="group relative flex items-center gap-4 px-6 py-4 transition-colors hover:bg-accent/5"
                      >
                        {t.urgent && !isDone ? (
                          <span
                            className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-accent"
                            aria-hidden
                          />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => toggle(t.id)}
                          aria-pressed={isDone}
                          aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-all",
                            isDone
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-muted-foreground/30 bg-transparent hover:border-accent hover:bg-accent/10"
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
                          <span className="hidden items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 tp-eyebrow text-accent sm:inline-flex">
                            <FlameIcon className="size-3" /> Urgent
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

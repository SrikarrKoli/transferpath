"use client"

import { useState } from "react"
import Link from "next/link"
import { splitHallDate } from "@/lib/hall-date"
import type { ChecklistWorkspaceData } from "@/types/checklist-workspace"

export function HallChecklist({ data, tasks, onToggle }: {
  data: ChecklistWorkspaceData
  tasks: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  const [filter, setFilter] = useState("open")
  const all = data.categories.flatMap((c) => c.tasks.map((t) => ({ ...t, category: c.label, categoryId: c.id })))
  const isDone = (task: (typeof all)[number]) => tasks[task.id] ?? task.done ?? false
  const open = all.filter((t) => !isDone(t))
  const done = all.filter(isDone)
  const logistics = open.filter((t) => t.categoryId !== "academic")
  const next = logistics.find((t) => t.urgent) || logistics.find((t) => t.link) || logistics[0] || open[0]
  const date = splitHallDate(next?.dueLabel || "Now")
  const filters = [
    { id: "open", label: "Open", count: open.length },
    ...data.categories.map((c) => ({ id: c.id, label: c.label, count: open.filter((t) => t.categoryId === c.id).length })),
    { id: "done", label: "Done", count: done.length },
  ]
  const visible = filter === "done" ? done : filter === "open" ? open : open.filter((t) => t.categoryId === filter)

  return (
    <div className="hall-split hall-dorm">
      <div>
        <section className="union-next-block" aria-labelledby="checklist-next-heading">
          <p className="hall-caption" id="checklist-next-heading">Do this next</p>
          {next ? <>
            <p className="hall-hero-date">{date.primary}
              <span className="hall-dorm-date-context">{[date.year, next.dueContext || (next.dueLabel ? "Application milestone" : "Your next move")].filter(Boolean).join(" · ")}</span>
            </p>
            <h2 className="hall-hero-title">{next.title}</h2>
            <p className="hall-date-meta mt-3">{[next.category, next.meta, next.countdownLabel].filter(Boolean).join(" · ")}</p>
            <div className="union-step-actions mt-6">
              {next.link ? <Link href={next.link.href} className="union-primary-cta">{next.link.label}</Link>
                : <button type="button" className="union-primary-cta" onClick={() => onToggle(next.id)}>Mark done</button>}
              {next.link ? <button type="button" className="hall-ledger-link" onClick={() => onToggle(next.id)}>Mark done</button> : null}
              <Link href="/dashboard/deadlines" className="hall-ledger-link">Check dates</Link>
            </div>
          </> : <>
            <h2 className="hall-hero-title">Your checklist is complete</h2>
            <p className="hall-date-meta mt-3">Review your dates and materials before you submit.</p>
            <div className="union-step-actions mt-6">
              <Link href="/dashboard/deadlines" className="union-primary-cta">Open Deadlines</Link>
              <Link href="/dashboard/essay" className="hall-ledger-link">Open Essays</Link>
            </div>
          </>}
        </section>

        <nav className="hall-index mt-6" aria-label="Checklist filters">
          {filters.map((item) => <button key={item.id} type="button" data-on={filter === item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
            {item.label} <span className="opacity-50 tabular-nums">{item.count}</span>
          </button>)}
        </nav>
        <div className="hall-dorm-columns" aria-hidden="true"><span /><span>{filter === "done" ? "Completed logistics" : "Application logistics"}</span><span>Next move</span></div>
        {filter === "done" ? <p className="hall-date-meta mt-4">Completed work stays here. Uncheck an item to reopen it.</p> : null}
        {data.categories.map((category) => {
          const rows = visible.filter((t) => t.categoryId === category.id)
          if (!rows.length) return null
          const remaining = open.filter((t) => t.categoryId === category.id).length
          const completed = category.tasks.length - remaining
          return <section className="hall-dorm-category" key={category.id} aria-labelledby={`checklist-${category.id}`}>
            <h3 className="hall-caption" id={`checklist-${category.id}`}>{category.label} <span>· {remaining} open · {completed} done</span></h3>
            <ul className="hall-checks">
              {rows.map((task) => <li key={task.id} className="hall-check-row">
                <button type="button" className="hall-box" aria-pressed={isDone(task)} aria-label={`Mark ${task.title} ${isDone(task) ? "open" : "done"}`} onClick={() => onToggle(task.id)} />
                <div>
                  <p className={isDone(task) ? "line-through opacity-50" : undefined}>{task.title}</p>
                  <p className="hall-date-meta">{[task.meta, task.hint].filter(Boolean).join(" · ")}</p>
                  {task.dueLabel || task.countdownLabel ? <p className="hall-dorm-due">{[task.dueContext, task.dueLabel, task.countdownLabel].filter(Boolean).join(" · ")}</p> : null}
                </div>
                {task.link ? <Link href={task.link.href} className="hall-ledger-link">{task.link.label}</Link> : <span />}
              </li>)}
            </ul>
          </section>
        })}
        {!visible.length ? <p className="hall-date-meta mt-6">{filter === "done" ? "Nothing marked done yet. Completed items will appear here." : "No open items in this view. Check Done to review completed work."}</p> : null}
      </div>
      <aside className="hall-margin">
        <p className="hall-caption">Your transfer</p>
        <p className="mt-2"><span className="text-[color:var(--hall-stone)]">{data.header.fromInstitution}</span> → <strong>{data.header.toInstitution}</strong></p>
        <p className="mt-1 text-sm text-[color:var(--hall-stone)]">{data.header.program} · {data.header.term}</p>
        <div className="mt-6 flex flex-col items-start gap-2">
          <Link href="/dashboard/deadlines" className="hall-ledger-link">Open Deadlines</Link>
          <Link href="/dashboard/requirements" className="hall-ledger-link">Open Requirements</Link>
          <Link href="/dashboard/essay" className="hall-ledger-link">Open Essays</Link>
          <Link href="/dashboard/plan" className="hall-ledger-link">Open Plan</Link>
        </div>
      </aside>
    </div>
  )
}

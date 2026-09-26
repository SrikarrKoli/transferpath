"use client"

import { useState } from "react"
import Link from "next/link"
import { splitHallDate } from "@/lib/hall-date"
import type { ChecklistWorkspaceData, ChecklistWorkspaceTask } from "@/types/checklist-workspace"

function hasTiming(task: ChecklistWorkspaceTask) {
  return Boolean(task.urgent || task.dueLabel || task.countdownLabel)
}

function timingOrder(task: ChecklistWorkspaceTask) {
  const label = task.countdownLabel?.toLowerCase() || ""
  if (label.includes("today")) return 0
  const days = label.match(/-?\d+/)
  if (days) return /passed|ago|overdue/.test(label) ? -Math.abs(Number(days[0])) : Number(days[0])
  const date = task.dueLabel ? Date.parse(task.dueLabel) : NaN
  return Number.isNaN(date) ? Infinity : (date - Date.now()) / 86400000
}

function priority(a: ChecklistWorkspaceTask, b: ChecklistWorkspaceTask) {
  return Number(Boolean(b.urgent)) - Number(Boolean(a.urgent))
    || Number(hasTiming(b)) - Number(hasTiming(a))
    || (timingOrder(a) - timingOrder(b) || 0)
}

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
  const next = [...logistics].sort(priority)[0] || [...open].sort(priority)[0]
  const dueSoon = open.filter(hasTiming)
  const date = splitHallDate(next?.dueLabel || "Now")
  const filters = [
    { id: "open", label: "Open", count: open.length },
    { id: "soon", label: "Due soon", count: dueSoon.length },
    ...data.categories.map((c) => ({ id: c.id, label: c.label, count: open.filter((t) => t.categoryId === c.id).length })),
    { id: "done", label: "Done", count: done.length },
  ]
  const visible = filter === "done" ? done : filter === "open" ? open : filter === "soon" ? dueSoon : open.filter((t) => t.categoryId === filter)

  return (
    <div className="hall-split hall-dorm">
      <div>
        <section className="union-next-block" aria-labelledby="checklist-next-heading">
          <p className="hall-caption">{filter === "done" ? "Application logistics · Done" : "Do this next"}</p>
          {filter === "done" ? <>
            <h2 className="hall-hero-title" id="checklist-next-heading">Completed logistics</h2>
            <p className="hall-dorm-why">{done.length} completed · {open.length} still open. Uncheck any item below to reopen it.</p>
            <div className="union-step-actions">
              <button type="button" className="union-primary-cta" onClick={() => setFilter("open")}>Back to Open · {open.length}</button>
            </div>
          </> : next ? <>
            <h2 className="hall-hero-title" id="checklist-next-heading">{next.title}</h2>
            {hasTiming(next) ? <div className="hall-dorm-timing">
              {next.dueLabel ? <p className="hall-hero-date">{date.primary}{date.year ? <> <span>{date.year}</span></> : null}</p> : null}
              <p><span className="hall-dorm-countdown">{next.countdownLabel || (next.urgent ? "Priority task" : "")}</span>{next.dueContext ? <span className="hall-dorm-context">{next.dueContext}</span> : null}</p>
            </div> : null}
            <p className="hall-date-meta">{[next.category, next.meta].filter(Boolean).join(" · ")}</p>
            <p className="hall-dorm-why">{next.hint
              ? `${next.dueContext && next.countdownLabel ? `${next.dueContext} · ${next.countdownLabel} — ` : ""}${next.hint.replace(/[.!]$/, "")}.`
              : next.dueContext && next.countdownLabel
                ? `${next.dueContext} · ${next.countdownLabel} — prepare this item before that milestone.`
                : next.urgent ? "This item is marked urgent — review its next step now." : `Next open item in ${next.category.toLowerCase()}.`}</p>
            <div className="union-step-actions">
              {next.link ? <Link href={next.link.href} className="union-primary-cta">{next.link.label}</Link>
                : <button type="button" className="union-primary-cta" onClick={() => onToggle(next.id)}>Mark done</button>}
              {next.link ? <button type="button" className="hall-ledger-link" onClick={() => onToggle(next.id)}>Mark done</button> : null}
              <Link href="/dashboard/deadlines" className="hall-ledger-link">Check dates</Link>
            </div>
          </> : <>
            <h2 className="hall-hero-title" id="checklist-next-heading">Your checklist is complete</h2>
            <p className="hall-date-meta mt-3">Review your dates and materials before you submit.</p>
            <div className="union-step-actions">
              <Link href="/dashboard/deadlines" className="union-primary-cta">Open Deadlines</Link>
              <Link href="/dashboard/essay" className="hall-ledger-link">Open Essays</Link>
            </div>
          </>}
        </section>

        <nav className="hall-index" aria-label="Checklist filters">
          {filters.map((item) => <button key={item.id} type="button" data-on={filter === item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
            {item.label} <span className="tabular-nums">{item.count}</span>
          </button>)}
        </nav>
        <div className="hall-dorm-columns" aria-hidden="true"><span /><span>{filter === "done" ? "Completed logistics" : "Application logistics"}</span><span>Next move</span></div>
        {filter === "done" ? <p className="hall-date-meta mt-4">Completed work stays here. Uncheck an item to reopen it.</p> : null}
        {data.categories.map((category) => {
          const rows = visible.filter((t) => t.categoryId === category.id).sort(priority)
          if (!rows.length) return null
          const remaining = open.filter((t) => t.categoryId === category.id).length
          const completed = category.tasks.length - remaining
          return <section className="hall-dorm-category" key={category.id} aria-labelledby={`checklist-${category.id}`}>
            <h3 className="hall-caption" id={`checklist-${category.id}`}>{category.label} <span>· {remaining} open · {completed} done</span></h3>
            <ul className="hall-checks">
              {rows.map((task) => <li key={task.id} className="hall-check-row">
                <button type="button" className="hall-box" aria-pressed={isDone(task)} aria-label={`Mark ${task.title} ${isDone(task) ? "open" : "done"}`} onClick={() => onToggle(task.id)} />
                <div>
                  <p className={isDone(task) ? "hall-dorm-completed" : undefined}>{task.title}</p>
                  <p className="hall-date-meta">{[isDone(task) ? "Done" : undefined, task.meta, task.hint].filter(Boolean).join(" · ")}</p>
                  {!isDone(task) && (task.dueLabel || task.countdownLabel) ? <p className="hall-dorm-due">{[task.dueContext, task.dueLabel, task.countdownLabel].filter(Boolean).join(" · ")}</p> : null}
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
        <section className="hall-dorm-progress" aria-label="Logistics progress">
          <h3 className="hall-caption">Application logistics</h3>
          <p className="hall-dorm-total">{open.length} open <span>· {done.length} done</span></p>
          <dl>{data.categories.map((category) => {
            const remaining = open.filter((task) => task.categoryId === category.id).length
            return <div key={category.id}><dt>{category.label}</dt><dd>{remaining} / {category.tasks.length - remaining}</dd></div>
          })}</dl>
          <p className="hall-date-meta">Open / done by category</p>
          {data.header.readinessMessage ? <p className="hall-dorm-focus">{data.header.readinessMessage}</p> : null}
        </section>
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

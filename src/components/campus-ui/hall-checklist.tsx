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

function isDueSoon(task: ChecklistWorkspaceTask) {
  return Boolean(task.urgent || timingOrder(task) <= 60)
}

function milestoneCopy(task: ChecklistWorkspaceTask) {
  const date = splitHallDate(task.dueLabel || "")
  const context = task.dueContext?.toLowerCase()
  const timing = context === "priority application"
    ? `Before ${date.primary} priority`
    : context === "aid milestone"
      ? `Aid milestone · ${date.primary}`
      : [task.dueContext, task.dueLabel].filter(Boolean).join(" · ")
  return [timing, task.countdownLabel, task.urgent ? "Due soon" : undefined].filter(Boolean).join(" · ")
}

function priority(a: ChecklistWorkspaceTask, b: ChecklistWorkspaceTask) {
  return Number(Boolean(b.urgent)) - Number(Boolean(a.urgent))
    || Number(hasTiming(b)) - Number(hasTiming(a))
    || (timingOrder(a) - timingOrder(b) || 0)
}

function stage(task: ChecklistWorkspaceTask) {
  if (task.id === "request_transcript") return "Order now"
  if (task.id.startsWith("write_essay")) return "Draft"
  if (task.id === "submit_application") return "Submit later"
  if (task.id.includes("financial_aid")) return "Prepare aid application"
  return "Review & prepare"
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
  const dueSoon = open.filter(isDueSoon).sort((a, b) => (timingOrder(a) - timingOrder(b) || 0))
  const date = splitHallDate(next?.dueLabel || "Now")
  const filters = [
    { id: "open", label: "Open", count: open.length },
    { id: "soon", label: "Due soon", count: dueSoon.length },
    { id: "done", label: "Done", count: done.length },
  ]
  const subjects = data.categories.map((c) => ({ id: c.id, label: c.label, count: open.filter((t) => t.categoryId === c.id).length }))
  const visible = filter === "done" ? done : filter === "open" ? open.filter((t) => t.id !== next?.id) : filter === "soon" ? dueSoon : open.filter((t) => t.categoryId === filter)

  return (
    <div className="hall-split hall-dorm">
      <div className="hall-dorm-main">
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
              <div>
                <p className="hall-caption">Shared milestone</p>
                <p className="hall-dorm-milestone">{next.dueContext === "Priority application" ? "Before priority application" : next.dueContext || "Check dates before proceeding"}</p>
                <p className="hall-dorm-context">{next.dueContext === "Priority application" ? "Order materials ahead · " : ""}<span className={isDueSoon(next) ? "hall-dorm-due" : "hall-date-meta"}>{next.countdownLabel || (next.urgent ? "Due soon" : "")}</span></p>
              </div>
            </div> : null}
            <p className="hall-date-meta">{[next.category, next.meta, hasTiming(next) ? `Stage · ${stage(next)}` : undefined].filter(Boolean).join(" · ")}</p>
            <p className="hall-dorm-why">Mark done when {next.doneWhen || "you have completed this task and checked the result."}</p>
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

        <div className="hall-dorm-ledger">
          <nav className="hall-index" aria-label="Checklist status">
            {filters.map((item) => <button key={item.id} type="button" data-on={filter === item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
              {item.label} <span className="tabular-nums">{item.count}</span>
            </button>)}
          </nav>
          {filter !== "done" && filter !== "soon" ? <nav className="hall-index hall-dorm-subjects" aria-label="Checklist subjects">
            {subjects.map((item) => <button key={item.id} type="button" data-on={filter === item.id} aria-pressed={filter === item.id} onClick={() => setFilter(filter === item.id ? "open" : item.id)}>
              {item.label} <span className="tabular-nums">{item.count}</span>
            </button>)}
          </nav> : null}
          <p className="hall-date-meta hall-dorm-filter-note">{filter === "soon" ? "Due within 60 days or marked urgent · soonest first" : filter === "done" ? "Completed tasks across all subjects" : filter === "open" ? "Remaining open tasks · Next action featured above · Due soon means within 60 days or marked urgent" : "Open tasks in this subject"}</p>
          <div className="hall-dorm-columns" aria-hidden="true"><span /><span>{filter === "done" ? "Completed logistics" : "Application logistics"}</span><span>Next move</span></div>
          {filter === "done" ? <p className="hall-date-meta mt-4">Completed work stays here. Uncheck an item to reopen it.</p> : null}
          {(filter === "soon" ? [{ id: "soon", label: "Due soon", tasks: dueSoon }] : data.categories).map((category) => {
            const rows = filter === "soon" ? dueSoon : visible.filter((t) => t.categoryId === category.id).sort(priority)
            if (!rows.length) return null
            const remaining = filter === "soon" ? dueSoon.length : open.filter((t) => t.categoryId === category.id).length
            const completed = category.tasks.length - remaining
            return <section className="hall-dorm-category" key={category.id} aria-labelledby={`checklist-${category.id}`}>
              <h3 className="hall-caption" id={`checklist-${category.id}`}>{category.label} <span>{filter === "done" ? `· ${completed} completed` : `· ${rows.length} ${filter === "soon" ? "due soon" : "open below"}`}</span></h3>
              <ul className="hall-checks">
                {rows.map((task) => <li key={task.id} id={`task-${task.id}`} className="hall-check-row">
                  <button type="button" className="hall-box" aria-pressed={isDone(task)} aria-label={`Mark ${task.title} ${isDone(task) ? "open" : "done"}`} onClick={() => onToggle(task.id)} />
                  <div>
                    <p className={isDone(task) ? "hall-dorm-completed" : undefined}>{task.title}</p>
                    <p className="hall-date-meta">{[isDone(task) ? "Done" : undefined, task.meta, !hasTiming(task) ? task.hint : undefined, !isDone(task) && hasTiming(task) ? stage(task) : undefined].filter(Boolean).join(" · ")}</p>
                    {!isDone(task) && hasTiming(task) ? <p className={isDueSoon(task) ? "hall-dorm-due" : "hall-date-meta"}>{milestoneCopy(task)}</p> : null}
                  </div>
                  {task.link ? <Link href={task.link.href} className="hall-ledger-link">{task.link.label}</Link> : <span />}
                </li>)}
              </ul>
            </section>
          })}
          {!visible.length ? <p className="hall-date-meta mt-6">{filter === "done" ? "Nothing marked done yet. Completed items will appear here." : "No additional open items in this view. Check the featured action above or review Done."}</p> : null}
        </div>
      </div>
      <aside className="hall-margin">
        <p className="hall-caption">Your transfer</p>
        <p className="mt-2"><span className="hall-dorm-transfer-school">{data.header.fromInstitution}</span> → <strong>{data.header.toInstitution}</strong></p>
        <p className="mt-1 text-sm">{data.header.program} · {data.header.term}</p>
        <section className="hall-dorm-progress" aria-label="After this, next moves">
          <h3 className="hall-caption">After this, next moves</h3>
          <ol className="hall-dorm-moves">{[...logistics].filter((task) => task.id !== next?.id).sort(priority).slice(0, 3).map((task) => <li key={task.id}>
            <a href={`#task-${task.id}`} className="hall-ledger-link" onClick={() => setFilter("open")}>{task.title}</a>
          </li>)}</ol>
        </section>
        <div className="hall-dorm-resources">
          <Link href="/dashboard/deadlines" className="hall-ledger-link">Open Deadlines</Link>
          <Link href="/dashboard/requirements" className="hall-ledger-link">Open Requirements</Link>
          <Link href="/dashboard/essay" className="hall-ledger-link">Open Essays</Link>
          <Link href="/dashboard/plan" className="hall-ledger-link">Open Plan</Link>
        </div>
      </aside>
    </div>
  )
}

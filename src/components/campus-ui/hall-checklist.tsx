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
  if (context === "priority application") {
    return [`Before ${date.primary}`, task.countdownLabel].filter(Boolean).join(" · ")
  }
  return [date.primary, task.countdownLabel, context === "aid milestone" ? "aid" : task.dueContext].filter(Boolean).join(" · ")
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
  const dueSoon = open.filter(isDueSoon).sort(priority)
  const sharedPriorityDate = dueSoon.length > 0 && dueSoon[0].dueLabel
    && dueSoon.every((task) => task.dueContext?.toLowerCase() === "priority application" && task.dueLabel === dueSoon[0].dueLabel)
    ? splitHallDate(dueSoon[0].dueLabel).primary : null
  const priorityBandLabel = sharedPriorityDate ? `Due soon · before ${sharedPriorityDate}` : "Due soon"
  const priorityIds = new Set(dueSoon.map((task) => task.id))
  const dueSoonAfterHero = dueSoon.filter((task) => task.id !== next?.id)
  const then = (dueSoonAfterHero.length ? dueSoonAfterHero : [...logistics].filter((task) => task.id !== next?.id).sort(priority)).slice(0, 3)
  const filters = [
    { id: "open", label: "Open", count: open.length },
    { id: "soon", label: "Due soon", count: dueSoon.length },
    { id: "done", label: "Done", count: done.length },
  ]
  const subjects = data.categories.map((c) => ({ id: c.id, label: c.label, count: open.filter((t) => t.categoryId === c.id).length }))
  const visible = filter === "done" ? done : filter === "open" ? open : filter === "soon" ? dueSoon : open.filter((t) => t.categoryId === filter)

  return (
    <div className="hall-split hall-dorm" data-view={filter}>
      <div className="hall-dorm-main">
        <section className={`union-next-block${filter === "done" ? " hall-dorm-done-summary" : ""}`} aria-labelledby="checklist-next-heading">
          <p className="hall-caption">{filter === "done" ? "Checklist" : "Do this next"}</p>
          {filter === "done" ? <>
            <h2 className="hall-hero-title" id="checklist-next-heading">{done.length} completed</h2>
            <p className="hall-dorm-why">Uncheck an item to reopen it.</p>
            <div className="union-step-actions">
              <button type="button" className="union-primary-cta" onClick={() => setFilter("open")}>Back to open</button>
            </div>
          </> : next ? <>
            <div className="hall-dorm-feature">
              <h2 className="hall-hero-title" id="checklist-next-heading">{next.title}</h2>
              <p className="hall-dorm-context">
                {next.countdownLabel || next.urgent ? <><span className={isDueSoon(next) ? "hall-dorm-due" : undefined}>{next.countdownLabel || "Due soon"}</span>{" · "}</> : null}
                {[
                  next.dueContext?.toLowerCase() === "priority application" ? "before priority application" : next.dueContext,
                  next.dueLabel,
                ].filter(Boolean).join(" · ")}
              </p>
            </div>
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
          {filter !== "done" ? <p className="hall-dorm-finish" aria-live="polite">{done.length} of {all.length} finished{dueSoon.length > 0 ? ` · ${dueSoon.length} due soon` : ""}</p> : null}
          <nav className="hall-index" aria-label="Checklist status">
            {filters.map((item) => <button key={item.id} type="button" data-on={filter === item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
              {item.label} <span className="tabular-nums">{item.count}</span>
            </button>)}
          </nav>
          {filter !== "done" && filter !== "soon" && !(filter === "open" && dueSoon.length > 0) ? <nav className="hall-index hall-dorm-subjects" aria-label="Checklist subjects">
            {subjects.map((item) => <button key={item.id} type="button" data-on={filter === item.id} aria-pressed={filter === item.id} onClick={() => setFilter(filter === item.id ? "open" : item.id)}>
              {item.label} <span className="tabular-nums">{item.count}</span>
            </button>)}
          </nav> : null}
          {filter === "soon" ? <p className="hall-date-meta hall-dorm-filter-note">Due within 60 days or marked urgent</p> : null}
          {(filter === "soon" ? [{ id: "soon", label: "Due soon", tasks: dueSoon }]
            : filter === "open" && dueSoon.length ? [{ id: "priority", label: priorityBandLabel, tasks: dueSoon }, ...data.categories]
            : data.categories).map((category) => {
            const isPriorityBand = filter === "open" && category.id === "priority"
            const rows = filter === "soon" || isPriorityBand ? dueSoon : visible.filter((t) => t.categoryId === category.id && (filter !== "open" || !priorityIds.has(t.id))).sort(priority)
            if (!rows.length) return null
            const remaining = filter === "soon" ? dueSoon.length : open.filter((t) => t.categoryId === category.id).length
            const completed = category.tasks.length - remaining
            return <section className={`hall-dorm-category${isPriorityBand ? " hall-dorm-priority" : ""}`} key={category.id} aria-labelledby={`checklist-${category.id}`}>
              <h3 id={`checklist-${category.id}`}>{category.label} <span>{filter === "done" ? `· ${completed} completed` : `· ${rows.length} ${filter === "soon" ? "due soon" : "open"}`}</span></h3>
              <ul className="hall-checks">
                {rows.map((task, index) => <li key={task.id} id={`task-${task.id}`} className="hall-check-row">
                  <button type="button" className="hall-box" aria-pressed={isDone(task)} aria-label={`Mark ${task.title} ${isDone(task) ? "open" : "done"}`} onClick={() => onToggle(task.id)} />
                  <div className="hall-dorm-row-copy">
                    <div className="hall-dorm-row-task">
                      <p className={isDone(task) ? "hall-dorm-completed" : undefined}>{isPriorityBand || filter === "soon" ? <span className="hall-dorm-order">{index + 1}<span className="sr-only">. </span></span> : null}{task.title}{!isDone(task) && task.id === next?.id ? <span className="hall-dorm-featured"> · Featured</span> : null}</p>
                      <p className="hall-date-meta">{[task.meta, !hasTiming(task) && !task.doneWhen ? task.hint : undefined].filter(Boolean).join(" · ")}</p>
                      {!isDone(task) && hasTiming(task) ? <p className={isDueSoon(task) ? "hall-dorm-due" : "hall-date-meta"}>{milestoneCopy(task)}</p> : null}
                      {!isDone(task) && task.doneWhen ? <p className="hall-dorm-done-when">Done when {task.doneWhen}</p> : null}
                    </div>
                    {task.link ? <div className="hall-dorm-row-action">
                      <Link href={task.link.href} className="hall-ledger-link">{task.link.label}</Link>
                    </div> : null}
                  </div>
                </li>)}
              </ul>
            </section>
          })}
          {!visible.length ? <p className="hall-date-meta mt-6">{filter === "done" ? "Nothing marked done yet. Completed items will appear here." : "No open items in this view."}</p> : null}
        </div>
      </div>
      <aside className="hall-margin">
        <p className="hall-caption">Your transfer</p>
        <p className="mt-2"><span className="hall-dorm-transfer-school">{data.header.fromInstitution}</span> → <strong>{data.header.toInstitution}</strong></p>
        <p className="mt-1 text-sm">{data.header.program} · {data.header.term}</p>
        {filter !== "done" && then.length > 0 ? <section className="hall-dorm-progress" aria-label="Then">
          <h3 className="hall-caption">Then</h3>
          <ol className="hall-dorm-moves">{then.map((task) => <li key={task.id}>
            <a href={`#task-${task.id}`} className="hall-ledger-link" onClick={() => setFilter("open")}>{task.title}</a>
          </li>)}</ol>
        </section> : null}
      </aside>
    </div>
  )
}

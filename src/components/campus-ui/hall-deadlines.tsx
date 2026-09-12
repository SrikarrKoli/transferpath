"use client"

import Link from "next/link"
import { splitHallDate } from "@/lib/hall-date"
import type {
  TasksDeadlinesData,
  TasksDeadlinesDeadlineRow,
  TasksDeadlinesFilterId,
  TasksDeadlinesTaskRow,
} from "@/types/tasks-deadlines"

const FILTERS: { id: TasksDeadlinesFilterId; label: string }[] = [
  { id: "upcoming", label: "Dates" },
  { id: "deadlines", label: "Institution" },
  { id: "tasks", label: "Your work" },
  { id: "completed", label: "Done" },
  { id: "missing_dates", label: "Missing" },
]

export function HallDeadlines({
  data,
  filter,
  onFilter,
  onToggleTask,
}: {
  data: TasksDeadlinesData
  filter: TasksDeadlinesFilterId
  onFilter: (id: TasksDeadlinesFilterId) => void
  onToggleTask: (id: string, done: boolean) => void
}) {
  const showDeadlines = filter === "upcoming" || filter === "deadlines"
  const showOpenTasks = filter === "tasks"
  const showCompleted = filter === "completed"
  const showMissing = filter === "missing_dates" || (filter === "upcoming" && data.missingDate)

  return (
    <div className="hall-split">
      <div>
        <div className="hall-index" role="tablist" aria-label="Ledger view">
          {FILTERS.map((item) => {
            const count = data.filterCounts[item.id]
            const disabled = item.id !== "missing_dates" && count === 0
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                data-on={filter === item.id ? "true" : "false"}
                aria-selected={filter === item.id}
                disabled={disabled}
                onClick={() => onFilter(item.id)}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {showDeadlines ? (
          <ol className="hall-dates">
            {data.upcomingDeadlines.length === 0 ? (
              <li className="hall-date-row" style={{ gridTemplateColumns: "1fr" }}>
                <p className="hall-date-meta">No institution dates in the next two years.</p>
              </li>
            ) : (
              data.upcomingDeadlines.map((row) => <DeadlineLine key={row.id} row={row} />)
            )}
          </ol>
        ) : null}

        {showOpenTasks ? (
          <ul className="hall-checks">
            {data.openTasks.length === 0 ? (
              <li className="hall-check-row" style={{ gridTemplateColumns: "1fr" }}>
                <p className="hall-date-meta">No open application or preparation tasks.</p>
              </li>
            ) : (
              data.openTasks.map((row) => (
                <TaskLine key={row.id} row={row} onToggle={onToggleTask} />
              ))
            )}
          </ul>
        ) : null}

        {showCompleted ? (
          <ul className="hall-checks">
            {data.completedTasks.length === 0 ? (
              <li className="hall-check-row" style={{ gridTemplateColumns: "1fr" }}>
                <p className="hall-date-meta">Nothing marked done yet.</p>
              </li>
            ) : (
              data.completedTasks.map((row) => (
                <TaskLine key={row.id} row={row} onToggle={onToggleTask} />
              ))
            )}
          </ul>
        ) : null}

        {showMissing && data.missingDate ? (
          <div className="mt-8">
            <p className="hall-date-title">{data.missingDate.headline}</p>
            <p className="hall-date-meta mt-2">{data.missingDate.provenanceWhat}</p>
            <div className="mt-3 flex flex-wrap gap-4">
              {data.missingDate.officialUrl ? (
                <a href={data.missingDate.officialUrl} className="hall-source" target="_blank" rel="noreferrer">
                  Official page
                </a>
              ) : null}
              <Link href="/sources" className="hall-ledger-link">
                Why this is missing
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      <aside className="hall-margin">
        <p>
          {data.header.fromInstitution} → {data.header.toInstitution}
        </p>
        <p className="mt-1">
          {data.header.program} · {data.header.term}
        </p>
        {data.openTasks.length > 0 ? (
          <p className="mt-6">
            {data.openTasks.length} open {data.openTasks.length === 1 ? "task" : "tasks"} sit on
            the Dorms list — this page is the calendar.
          </p>
        ) : null}
        <p className="mt-6">
          English Composition, Calculus, and field courses are satisfied by logging a course on the
          Registrar, not by a date here.
        </p>
        <Link href="/dashboard/requirements" className="hall-ledger-link mt-3 inline-block">
          Open Registrar
        </Link>
      </aside>
    </div>
  )
}

function DeadlineLine({ row }: { row: TasksDeadlinesDeadlineRow }) {
  const { primary, year } = splitHallDate(row.dateLabel)
  return (
    <li className="hall-date-row">
      <div>
        <span className="hall-date-big">{primary}</span>
        {year ? <span className="hall-date-year">{year}</span> : null}
        {row.countdownLabel ? <span className="hall-date-count">{row.countdownLabel}</span> : null}
      </div>
      <div>
        <p className="hall-date-title">{row.title}</p>
        <p className="hall-date-meta">
          {row.scopeChip}
          {row.categoryMeta ? ` · ${row.categoryMeta}` : ""}
        </p>
      </div>
      {row.officialUrl ? (
        <a href={row.officialUrl} className="hall-source" target="_blank" rel="noreferrer">
          Official
        </a>
      ) : (
        <Link href="/dashboard/requirements" className="hall-ledger-link">
          Record
        </Link>
      )}
    </li>
  )
}

function TaskLine({
  row,
  onToggle,
}: {
  row: TasksDeadlinesTaskRow
  onToggle: (id: string, done: boolean) => void
}) {
  return (
    <li className="hall-check-row">
      <button
        type="button"
        aria-pressed={row.done}
        aria-label={row.done ? "Mark incomplete" : "Mark complete"}
        onClick={() => onToggle(row.id, !row.done)}
        className="hall-box"
      />
      <div>
        <p className={row.done ? "line-through opacity-50" : undefined}>{row.title}</p>
        <p className="hall-date-meta">
          {row.categoryLabel}
          {row.meta ? ` · ${row.meta}` : ""}
        </p>
      </div>
      {row.action ? (
        <Link href={row.action.href} className="hall-ledger-link">
          {row.action.label}
        </Link>
      ) : (
        <span />
      )}
    </li>
  )
}

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

function PrimaryAction({
  href,
  label,
  external,
}: {
  href: string
  label: string
  external?: boolean
}) {
  if (external || href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="union-primary-cta">
        {label}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  }
  return (
    <Link href={href} className="union-primary-cta">
      {label}
    </Link>
  )
}

function pathwayLooksUnset(header: TasksDeadlinesData["header"]) {
  return (
    header.toInstitution === "Target school not set" ||
    header.term === "Term not set" ||
    header.fromInstitution === "Current school not set"
  )
}

function DeadlinesNextBlock({
  data,
  onFilter,
  onToggleTask,
}: {
  data: TasksDeadlinesData
  onFilter: (id: TasksDeadlinesFilterId) => void
  onToggleTask: (id: string, done: boolean) => void
}) {
  const soonest = data.upcomingDeadlines[0] ?? null
  const missing = data.missingDate
  const nextTask = data.openTasks[0] ?? null
  const unset = pathwayLooksUnset(data.header)

  if (soonest) {
    const dateParts = splitHallDate(soonest.dateLabel)
    const primaryHref = soonest.officialUrl ?? "/dashboard/requirements"
    const primaryLabel = soonest.officialUrl ? "Open official page" : "Open requirements"
    return (
      <section className="union-next-block" aria-labelledby="deadlines-next-heading">
        <p className="hall-caption" id="deadlines-next-heading">
          Do this next
        </p>
        <p className="hall-hero-date">
          {dateParts.primary}
          {dateParts.year ? (
            <span className="mt-2 block text-[0.28em] font-normal tracking-normal text-[color:var(--hall-stone)]">
              {dateParts.year}
            </span>
          ) : null}
        </p>
        <h2 className="hall-hero-title">{soonest.title}</h2>
        <p className="mt-3 text-sm text-[color:var(--hall-stone)]">
          {[soonest.scopeChip, soonest.categoryMeta, soonest.countdownLabel]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="union-step-actions mt-6">
          <PrimaryAction href={primaryHref} label={primaryLabel} external={Boolean(soonest.officialUrl)} />
          <Link href="/dashboard/checklist" className="hall-ledger-link">
            Open checklist
          </Link>
          <button type="button" className="hall-ledger-link" onClick={() => onFilter("deadlines")}>
            See all dates
          </button>
        </div>
      </section>
    )
  }

  if (missing) {
    return (
      <section className="union-next-block" aria-labelledby="deadlines-next-heading">
        <p className="hall-caption" id="deadlines-next-heading">
          Do this next
        </p>
        <p className="hall-hero-date">
          Needed
          <span className="mt-2 block text-[0.28em] font-normal tracking-normal text-[color:var(--hall-stone)]">
            Confirm the date
          </span>
        </p>
        <h2 className="hall-hero-title">{missing.headline}</h2>
        <p className="hall-prompt mt-4">{missing.provenanceWhat}</p>
        <div className="union-step-actions mt-6">
          {missing.officialUrl ? (
            <PrimaryAction href={missing.officialUrl} label="Open official page" external />
          ) : (
            <PrimaryAction href={missing.recordHref || "/dashboard/requirements"} label="Confirm this date" />
          )}
          <Link href="/sources" className="hall-ledger-link">
            Why this is missing
          </Link>
          {missing.officialUrl ? (
            <Link href={missing.recordHref || "/dashboard/requirements"} className="hall-ledger-link">
              Open requirements
            </Link>
          ) : (
            <button type="button" className="hall-ledger-link" onClick={() => onFilter("missing_dates")}>
              See missing
            </button>
          )}
        </div>
      </section>
    )
  }

  if (nextTask) {
    return (
      <section className="union-next-block" aria-labelledby="deadlines-next-heading">
        <p className="hall-caption" id="deadlines-next-heading">
          Do this next
        </p>
        <p className="hall-hero-date">
          Now
          <span className="mt-2 block text-[0.28em] font-normal tracking-normal text-[color:var(--hall-stone)]">
            Your work
          </span>
        </p>
        <h2 className="hall-hero-title">{nextTask.title}</h2>
        <p className="mt-3 text-sm text-[color:var(--hall-stone)]">
          {[nextTask.categoryLabel, nextTask.meta].filter(Boolean).join(" · ")}
        </p>
        <div className="union-step-actions mt-6">
          {nextTask.action ? (
            <PrimaryAction href={nextTask.action.href} label={nextTask.action.label} />
          ) : (
            <button
              type="button"
              className="union-primary-cta"
              onClick={() => onToggleTask(nextTask.id, true)}
            >
              Mark done
            </button>
          )}
          {nextTask.action ? (
            <button
              type="button"
              className="hall-ledger-link"
              onClick={() => onToggleTask(nextTask.id, true)}
            >
              Mark done
            </button>
          ) : null}
          <button type="button" className="hall-ledger-link" onClick={() => onFilter("tasks")}>
            See your work
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="union-next-block" aria-labelledby="deadlines-next-heading">
      <p className="hall-caption" id="deadlines-next-heading">
        Do this next
      </p>
      <p className="hall-hero-title">Nothing dated yet</p>
      <div className="union-step-actions mt-6">
        <PrimaryAction
          href="/dashboard/settings?tab=transfer"
          label={unset ? "Set school & term" : "Edit schools & term"}
        />
        <Link href="/dashboard/checklist" className="hall-ledger-link">
          Open checklist
        </Link>
        <button type="button" className="hall-ledger-link" onClick={() => onFilter("missing_dates")}>
          Review missing dates
        </button>
      </div>
    </section>
  )
}

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
  const showMissing =
    filter === "missing_dates" ||
    (filter === "upcoming" && (Boolean(data.missingDate) || data.upcomingDeadlines.length === 0))

  return (
    <div className="hall-split">
      <div>
        <DeadlinesNextBlock data={data} onFilter={onFilter} onToggleTask={onToggleTask} />

        <div className="hall-index mt-6" role="tablist" aria-label="Deadline views">
          {FILTERS.map((item) => {
            const count = data.filterCounts[item.id]
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                data-on={filter === item.id ? "true" : "false"}
                aria-selected={filter === item.id}
                onClick={() => onFilter(item.id)}
              >
                {item.label}
                {typeof count === "number" ? (
                  <span className="ml-1 tabular-nums opacity-50">{count}</span>
                ) : null}
              </button>
            )
          })}
        </div>

        {showDeadlines ? (
          <ol className="hall-dates">
            {data.upcomingDeadlines.length === 0 ? (
              <li className="hall-date-row hall-date-empty">
                <div>
                  <span className="hall-date-big">00</span>
                  <span className="hall-date-year">No date</span>
                </div>
                <div>
                  <p className="hall-date-title">No official deadlines yet</p>
                  <div className="deadline-empty-actions union-step-actions mt-3">
                    <PrimaryAction href="/dashboard/settings?tab=transfer" label="Set school & term" />
                    <Link href="/dashboard/checklist" className="hall-ledger-link">
                      Open checklist
                    </Link>
                    <button
                      type="button"
                      className="hall-ledger-link"
                      onClick={() => onFilter("missing_dates")}
                    >
                      Review missing dates
                    </button>
                  </div>
                </div>
                <span className="hall-urgent text-[0.8rem]">No date</span>
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
          <ol className="hall-dates mt-2">
            <li className="hall-date-row hall-date-empty">
              <div>
                <span className="hall-date-big">—</span>
                <span className="hall-date-year">Needed</span>
              </div>
              <div>
                <p className="hall-date-title">{data.missingDate.headline}</p>
                <p className="hall-date-meta">{data.missingDate.provenanceWhat}</p>
                <div className="mt-3 flex flex-wrap gap-4">
                  {data.missingDate.officialUrl ? (
                    <a
                      href={data.missingDate.officialUrl}
                      className="hall-source"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Official page
                    </a>
                  ) : null}
                  <Link href="/sources" className="hall-ledger-link">
                    Why this is missing
                  </Link>
                </div>
              </div>
              <span className="hall-urgent text-[0.8rem]">No date</span>
            </li>
          </ol>
        ) : showMissing && !data.missingDate ? (
          <p className="hall-date-meta mt-4">Nothing missing for this term.</p>
        ) : null}
      </div>

      <aside className="hall-margin">
        <p className="hall-caption">Your transfer</p>
        <p className="mt-2">
          <span className="text-[color:var(--hall-stone)]">{data.header.fromInstitution}</span>
          <span aria-hidden> → </span>
          <strong>{data.header.toInstitution}</strong>
        </p>
        <p className="mt-1 text-[0.9rem] text-[color:var(--hall-stone)]">
          {data.header.program} · {data.header.term}
        </p>
        <div className="mt-6 flex flex-col items-start gap-2">
          <Link href="/dashboard/requirements" className="hall-ledger-link">
            Open Requirements
          </Link>
          <Link href="/dashboard/checklist" className="hall-ledger-link">
            Open Checklist
          </Link>
          <Link href="/dashboard/plan" className="hall-ledger-link">
            Open Plan
          </Link>
        </div>
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

"use client"

import Link from "next/link"
import type { ChecklistWorkspaceData } from "@/types/checklist-workspace"

type FlatTask = {
  id: string
  title: string
  category: string
  hint?: string
  urgent?: boolean
  link?: { href: string; label: string }
}

function ChecklistNextBlock({
  open,
  allCount,
  doneCount,
  onToggle,
}: {
  open: FlatTask[]
  allCount: number
  doneCount: number
  onToggle: (id: string) => void
}) {
  if (open.length === 0) {
    return (
      <section className="union-next-block" aria-labelledby="checklist-next-heading">
        <p className="hall-caption" id="checklist-next-heading">
          Do this next
        </p>
        <h2 className="hall-hero-title">Checklist is clear</h2>
        <p className="hall-prompt mt-4">
          Personal apply tasks here are done. Confirm dates or keep essays moving.
        </p>
        <div className="union-step-actions mt-6">
          <Link href="/dashboard/deadlines" className="union-primary-cta">
            Open Deadlines
          </Link>
          <Link href="/dashboard/essay" className="hall-ledger-link">
            Open Essays
          </Link>
          <Link href="/dashboard/requirements" className="hall-ledger-link">
            Open Requirements
          </Link>
        </div>
      </section>
    )
  }

  const next =
    open.find((t) => t.urgent) || open.find((t) => t.link) || open[0]

  return (
    <section className="union-next-block" aria-labelledby="checklist-next-heading">
      <p className="hall-caption" id="checklist-next-heading">
        Do this next
      </p>
      <h2 className="hall-hero-title">{next.title}</h2>
      <p className="mt-3 text-sm text-[color:var(--hall-stone)]">
        {[next.category, next.hint, next.urgent ? "Soon" : null].filter(Boolean).join(" · ")}
      </p>
      <p className="hall-prompt mt-4">
        {doneCount} of {allCount} done. Finish this one, then pick the next open task below.
      </p>
      <div className="union-step-actions mt-6">
        {next.link ? (
          <Link href={next.link.href} className="union-primary-cta">
            {next.link.label}
          </Link>
        ) : (
          <button
            type="button"
            className="union-primary-cta"
            onClick={() => onToggle(next.id)}
          >
            Mark done
          </button>
        )}
        {next.link ? (
          <button type="button" className="hall-ledger-link" onClick={() => onToggle(next.id)}>
            Mark done
          </button>
        ) : (
          <Link href="/dashboard/deadlines" className="hall-ledger-link">
            Open Deadlines
          </Link>
        )}
        <Link href="/dashboard/essay" className="hall-ledger-link">
          Open Essays
        </Link>
      </div>
    </section>
  )
}

export function HallChecklist({
  data,
  tasks,
  onToggle,
}: {
  data: ChecklistWorkspaceData
  tasks: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  const all: FlatTask[] = data.categories.flatMap((c) =>
    c.tasks.map((t) => ({ ...t, category: c.label })),
  )
  const doneCount = all.filter((t) => tasks[t.id]).length
  const open = all.filter((t) => !tasks[t.id])
  const done = all.filter((t) => tasks[t.id])

  return (
    <div className="hall-split">
      <div>
        <ChecklistNextBlock
          open={open}
          allCount={all.length}
          doneCount={doneCount}
          onToggle={onToggle}
        />

        <p className="hall-mid mt-8">
          {doneCount} of {all.length}
        </p>
        <p className="hall-date-meta mt-2">personal apply tasks</p>

        <div className="hall-dorm-columns mt-6" aria-hidden>
          <span aria-hidden="true" />
          <span>Task</span>
          <span>Standing</span>
        </div>

        {open.length === 0 ? (
          <p className="hall-prompt mt-8">All personal tasks here are done.</p>
        ) : (
          <ul className="hall-checks">
            {open.map((t) => (
              <li key={t.id} className="hall-check-row">
                <button
                  type="button"
                  aria-pressed={false}
                  aria-label="Mark complete"
                  onClick={() => onToggle(t.id)}
                  className="hall-box"
                />
                <div>
                  <p>{t.title}</p>
                  <p className="hall-date-meta">
                    {t.category}
                    {t.hint ? ` · ${t.hint}` : ""}
                  </p>
                </div>
                {t.link ? (
                  <Link href={t.link.href} className="hall-ledger-link">
                    {t.link.label}
                  </Link>
                ) : t.urgent ? (
                  <span className="hall-urgent text-[0.8rem]">Soon</span>
                ) : (
                  <span className="hall-date-meta text-[0.8rem]">Open</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {done.length > 0 ? (
          <div className="mt-10">
            <p className="hall-caption">Done</p>
            <ul className="hall-checks">
              {done.map((t) => (
                <li key={t.id} className="hall-check-row">
                  <button
                    type="button"
                    aria-pressed={true}
                    aria-label="Mark incomplete"
                    onClick={() => onToggle(t.id)}
                    className="hall-box"
                  />
                  <div>
                    <p className="line-through opacity-50">{t.title}</p>
                    <p className="hall-date-meta">{t.category}</p>
                  </div>
                  <span className="hall-date-meta text-[0.8rem]">Done</span>
                </li>
              ))}
            </ul>
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
        <p className="mt-6">
          Personal apply work lives here — transcripts, letters, fees, and submitting. School dates
          stay under Deadlines.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/dashboard/deadlines" className="hall-ledger-link">
            Open Deadlines
          </Link>
          <Link href="/dashboard/requirements" className="hall-ledger-link">
            Open Requirements
          </Link>
          <Link href="/dashboard/essay" className="hall-ledger-link">
            Open Essays
          </Link>
        </div>
        {data.header.readinessMessage ? (
          <p className="mt-6">{data.header.readinessMessage}</p>
        ) : null}
      </aside>
    </div>
  )
}

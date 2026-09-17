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
  const open = all.filter((t) => !tasks[t.id])
  const done = all.filter((t) => tasks[t.id])
  const next = open.find((t) => t.urgent) || open.find((t) => t.link) || open[0] || null

  return (
    <div className="hall-split">
      <div>
        <section className="union-next-block" aria-labelledby="checklist-next-heading">
          <p className="hall-caption" id="checklist-next-heading">
            {next ? "Do this next" : "Checklist"}
          </p>
          {next ? (
            <>
              <h2 className="hall-hero-title">{next.title}</h2>
              {next.urgent ? (
                <p className="hall-urgent mt-3 text-[0.95rem]">Soon</p>
              ) : null}
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
                  <button
                    type="button"
                    className="hall-ledger-link"
                    onClick={() => onToggle(next.id)}
                  >
                    Mark done
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <h2 className="hall-hero-title">Nothing left here</h2>
              <div className="union-step-actions mt-6">
                <Link href="/dashboard/deadlines" className="union-primary-cta">
                  Open Deadlines
                </Link>
                <Link href="/dashboard/essay" className="hall-ledger-link">
                  Open Essays
                </Link>
              </div>
            </>
          )}
        </section>

        {open.length > 1 ? (
          <ul className="hall-checks mt-10" aria-label="Still open">
            {open
              .filter((t) => t.id !== next?.id)
              .map((t) => (
                <li key={t.id} className="hall-check-row">
                  <button
                    type="button"
                    aria-pressed={false}
                    aria-label={`Mark ${t.title} done`}
                    onClick={() => onToggle(t.id)}
                    className="hall-box"
                  />
                  <p>{t.title}</p>
                  {t.link ? (
                    <Link href={t.link.href} className="hall-ledger-link">
                      {t.link.label}
                    </Link>
                  ) : t.urgent ? (
                    <span className="hall-urgent text-[0.8rem]">Soon</span>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
          </ul>
        ) : null}

        {done.length > 0 ? (
          <details className="mt-10">
            <summary className="hall-caption cursor-pointer select-none">
              Done · {done.length}
            </summary>
            <ul className="hall-checks mt-4">
              {done.map((t) => (
                <li key={t.id} className="hall-check-row">
                  <button
                    type="button"
                    aria-pressed={true}
                    aria-label={`Mark ${t.title} open`}
                    onClick={() => onToggle(t.id)}
                    className="hall-box"
                  />
                  <p className="line-through opacity-50">{t.title}</p>
                  <span />
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>

      <aside className="hall-margin">
        <p className="hall-caption">Your path</p>
        <p className="mt-2">
          {data.header.fromInstitution} → {data.header.toInstitution}
        </p>
        <p className="mt-1 text-sm text-[color:var(--hall-stone)]">
          {data.header.program} · {data.header.term}
        </p>
        <div className="mt-6 flex flex-col items-start gap-2">
          <Link href="/dashboard/deadlines" className="hall-ledger-link">
            Deadlines
          </Link>
          <Link href="/dashboard/requirements" className="hall-ledger-link">
            Requirements
          </Link>
          <Link href="/dashboard/essay" className="hall-ledger-link">
            Essays
          </Link>
        </div>
      </aside>
    </div>
  )
}

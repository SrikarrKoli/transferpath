"use client"

import Link from "next/link"
import type { ChecklistWorkspaceData } from "@/types/checklist-workspace"

export function HallChecklist({
  data,
  tasks,
  onToggle,
}: {
  data: ChecklistWorkspaceData
  tasks: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  const all = data.categories.flatMap((c) =>
    c.tasks.map((t) => ({ ...t, category: c.label })),
  )
  const doneCount = all.filter((t) => tasks[t.id]).length
  const open = all.filter((t) => !tasks[t.id])
  const done = all.filter((t) => tasks[t.id])

  return (
    <div className="hall-split">
      <div>
        <p className="hall-mid">
          {doneCount} of {all.length}
        </p>
        <p className="hall-date-meta mt-2">filed on the dorms list</p>

        <div className="hall-dorm-columns" aria-hidden>
          <span aria-hidden="true" />
          <span>Task</span>
          <span>Standing</span>
        </div>

        {open.length === 0 ? (
          <p className="hall-prompt mt-8">Every personal task on this list is marked done.</p>
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
                  <span className="hall-date-meta text-[0.8rem]">Filed</span>
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
          This room holds the personal work: transcripts, letters, fees, and the application itself.
          Institution dates stay in the Clock Tower.
        </p>
        {data.header.readinessMessage ? (
          <p className="mt-6">{data.header.readinessMessage}</p>
        ) : null}
      </aside>
    </div>
  )
}

"use client"

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
  const all = data.categories.flatMap((c) => c.tasks)
  const done = all.filter((t) => tasks[t.id]).length
  const ordered = [...all].sort((a, b) => Number(tasks[a.id]) - Number(tasks[b.id]))

  return (
    <div>
      <p className="hall-mid">
        {done} of {all.length}
      </p>
      <p className="hall-date-meta mt-2">personal tasks</p>
      <ul className="hall-checks">
        {ordered.map((t) => {
          const isDone = tasks[t.id]
          return (
            <li key={t.id} className="hall-check-row">
              <button
                type="button"
                aria-pressed={isDone}
                aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                onClick={() => onToggle(t.id)}
                className="hall-box"
              />
              <p className={isDone ? "line-through opacity-50" : undefined}>{t.title}</p>
              <span className="hall-urgent text-[0.8rem]">
                {t.urgent && !isDone ? "Soon" : ""}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

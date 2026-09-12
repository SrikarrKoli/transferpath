import Link from "next/link"
import type { RequirementsWorkspaceData } from "@/types/requirements-workspace"

export type HallReadinessData = {
  score: number
  line: string
  rows: { label: string; value: string; warn?: boolean }[]
}

export function readinessFromRequirements(data: RequirementsWorkspaceData): HallReadinessData {
  const items = data.categories.flatMap((c) => c.items)
  const done = items.filter((i) => i.status === "done").length
  const total = items.length || 1
  const next = data.timelineRows.find((r) => !r.passed)
  const rows: HallReadinessData["rows"] = [
    { label: "Core logged", value: `${done} of ${total}` },
  ]
  if (next) {
    rows.push({ label: "Next date", value: `${next.dateLabel} · ${next.label}` })
  }
  if (data.planningNotes[0]) {
    rows.push({ label: "Note", value: data.planningNotes[0].title })
  }
  return {
    score: Math.round((done / total) * 100),
    line: data.header.subtitle || "What is on file for this path.",
    rows,
  }
}

export function HallReadiness({ data }: { data: HallReadinessData }) {
  return (
    <div className="hall-split">
      <div>
        <p className="hall-score">{data.score}</p>
        <p className="hall-prompt mt-6 max-w-md">{data.line}</p>
        <dl className="hall-measures">
          {data.rows.map((row) => (
            <div key={row.label} className="hall-measure">
              <dt>{row.label}</dt>
              <dd className={row.warn ? "hall-urgent" : undefined}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <aside className="hall-margin">
        <p>
          This number is a reading of what is already on file — courses, dates, and the essay — not
          an admission prediction.
        </p>
        <p className="mt-6 hall-caption">Raise the reading</p>
        <div className="mt-2 flex flex-col gap-2 items-start">
          <Link href="/dashboard/requirements" className="hall-ledger-link">
            Log requirements · Registrar
          </Link>
          <Link href="/dashboard/deadlines" className="hall-ledger-link">
            File dates · Clock Tower
          </Link>
          <Link href="/dashboard/essay" className="hall-ledger-link">
            Draft essay · Library
          </Link>
          <Link href="/dashboard/settings?tab=transfer" className="hall-ledger-link">
            Confirm schools · Counselor
          </Link>
        </div>
      </aside>
    </div>
  )
}

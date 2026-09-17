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

function pickReadinessNext(data: HallReadinessData) {
  const core = data.rows.find((r) => r.label === "Core logged")
  const nextDate = data.rows.find((r) => r.label === "Next date")
  if (data.score < 40) {
    return {
      caption: "Start here" as const,
      title: "Log the courses that still show open",
      prompt: "Readiness climbs when requirements move onto Plan. Start with the open ones.",
      primary: { href: "/dashboard/requirements", label: "Open Requirements" },
      secondaries: [
        { href: "/dashboard/plan", label: "Open Plan" },
        { href: "/dashboard/checklist", label: "Open Checklist" },
      ],
    }
  }
  if (nextDate) {
    return {
      caption: "Do this next" as const,
      title: nextDate.value,
      prompt: "Confirm this date, then keep filing requirements and drafts.",
      primary: { href: "/dashboard/deadlines", label: "Open Deadlines" },
      secondaries: [
        { href: "/dashboard/requirements", label: "Open Requirements" },
        { href: "/dashboard/essay", label: "Open Essays" },
      ],
    }
  }
  if (data.score < 80) {
    return {
      caption: "Do this next" as const,
      title: "Close the gaps still on file",
      prompt: core
        ? `${core.value} core items logged. Place the rest on Plan or finish checklist work.`
        : "Place remaining requirements on Plan or finish checklist work.",
      primary: { href: "/dashboard/requirements", label: "Open Requirements" },
      secondaries: [
        { href: "/dashboard/checklist", label: "Open Checklist" },
        { href: "/dashboard/essay", label: "Open Essays" },
      ],
    }
  }
  return {
    caption: "Do this next" as const,
    title: "Readiness looks solid on paper",
    prompt: "Use the time to polish essays and double-check dates before you apply.",
    primary: { href: "/dashboard/essay", label: "Open Essays" },
    secondaries: [
      { href: "/dashboard/deadlines", label: "Open Deadlines" },
      { href: "/dashboard/checklist", label: "Open Checklist" },
    ],
  }
}

export function HallReadiness({ data }: { data: HallReadinessData }) {
  const next = pickReadinessNext(data)
  return (
    <div className="hall-split">
      <div>
        <section className="union-next-block" aria-labelledby="readiness-next-heading">
          <p className="hall-caption" id="readiness-next-heading">
            {next.caption}
          </p>
          <h2 className="hall-hero-title">{next.title}</h2>
          <p className="hall-prompt mt-4">{next.prompt}</p>
          <div className="union-step-actions mt-6">
            <Link href={next.primary.href} className="union-primary-cta">
              {next.primary.label}
            </Link>
            {next.secondaries.map((action) => (
              <Link key={action.href} href={action.href} className="hall-ledger-link">
                {action.label}
              </Link>
            ))}
          </div>
        </section>

        <p className="hall-score mt-8">{data.score}</p>
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
          This number reads what is already on file — courses, dates, and essays — not an admission
          prediction.
        </p>
        <p className="mt-6 hall-caption">Ways to raise your score</p>
        <div className="mt-2 flex flex-col items-start gap-2">
          <Link href="/dashboard/requirements" className="hall-ledger-link">
            Open Requirements
          </Link>
          <Link href="/dashboard/deadlines" className="hall-ledger-link">
            Open Deadlines
          </Link>
          <Link href="/dashboard/essay" className="hall-ledger-link">
            Open Essays
          </Link>
          <Link href="/dashboard/settings?tab=transfer" className="hall-ledger-link">
            Confirm schools
          </Link>
        </div>
      </aside>
    </div>
  )
}

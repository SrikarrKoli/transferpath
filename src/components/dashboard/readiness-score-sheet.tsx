import Link from "next/link"
import type { DashboardOverallReadinessResult } from "@/lib/dashboard-overall-readiness"

type ReadinessScoreSheetProps = {
  readiness: DashboardOverallReadinessResult
  currentSchoolName: string | null
  targetSchoolName: string | null
  targetMajor: string | null
  expectedTransferTerm: string | null
}

const ROWS = [
  { key: "prereq0To100", label: "Requirement coursework", weight: "25%", href: "/dashboard/requirements" },
  { key: "credits0To100", label: "Transfer credits", weight: "25%", href: "/dashboard/plan" },
  { key: "checklist0To100", label: "Application tasks", weight: "20%", href: "/dashboard/checklist" },
  { key: "gpa0To100", label: "GPA on file", weight: "15%", href: "/dashboard/settings" },
  { key: "essay0To100", label: "Essay draft", weight: "10%", href: "/dashboard/essay" },
  { key: "profile0To100", label: "Pathway details", weight: "5%", href: "/dashboard/settings" },
] as const

export function ReadinessScoreSheet({
  readiness,
  currentSchoolName,
  targetSchoolName,
  targetMajor,
  expectedTransferTerm,
}: ReadinessScoreSheetProps) {
  return (
    <section className="readiness-score-sheet" aria-label="Path readiness score sheet">
      <div className="readiness-route-line">
        <p className="tp-eyebrow">Training route</p>
        <p>
          <span>{currentSchoolName ?? "Current school not set"}</span>
          <span aria-hidden> → </span>
          <strong>{targetSchoolName ?? "Target school not set"}</strong>
        </p>
        <p>{targetMajor ?? "Program not set"} · {expectedTransferTerm ?? "Term not set"}</p>
      </div>

      <header className="readiness-sheet-heading">
        <div>
          <p className="tp-eyebrow text-accent">Recreation Center / readiness instrument</p>
          <h1>Path readiness score sheet</h1>
          <p>A planning measure of work recorded in TransferPath, not an admission prediction.</p>
        </div>
        <div className="readiness-total" aria-label={`${readiness.score} out of 100`}>
          <strong>{readiness.score}</strong>
          <span>/ 100</span>
        </div>
      </header>

      <div className="readiness-scale" aria-hidden>
        <span style={{ width: `${readiness.score}%` }} />
      </div>

      <div className="readiness-column-headings" aria-hidden>
        <span>Measure</span><span>Weight</span><span>Recorded</span><span>Review</span>
      </div>
      <ol className="readiness-register">
        {ROWS.map((row, index) => {
          const value = Math.round(readiness.breakdown[row.key])
          return (
            <li key={row.key}>
              <span className="readiness-row-number">{String(index + 1).padStart(2, "0")}</span>
              <strong>{row.label}</strong>
              <span>{row.weight}</span>
              <span className="readiness-row-value">{value}%</span>
              <Link href={row.href}>Open record ↗</Link>
            </li>
          )
        })}
      </ol>

      <footer className="readiness-sheet-note">
        <span>Method note</span>
        <p>Credits and requirement coursework carry half the instrument; application tasks, GPA, essay work, and pathway details make up the balance.</p>
      </footer>
    </section>
  )
}

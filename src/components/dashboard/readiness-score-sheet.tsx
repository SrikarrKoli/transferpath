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
  { key: "prereq0To100", label: "Requirement coursework", action: "Open Requirements", weight: "25%", href: "/dashboard/requirements" },
  { key: "credits0To100", label: "Transfer credits", action: "Open Plan", weight: "25%", href: "/dashboard/plan" },
  { key: "checklist0To100", label: "Application tasks", action: "Open Checklist", weight: "20%", href: "/dashboard/checklist" },
  { key: "gpa0To100", label: "GPA on file", action: "Update GPA", weight: "15%", href: "/dashboard/settings?tab=transfer" },
  { key: "essay0To100", label: "Essay draft", action: "Open Essays", weight: "10%", href: "/dashboard/essay" },
  { key: "profile0To100", label: "Pathway details", action: "Confirm pathway", weight: "5%", href: "/dashboard/settings?tab=transfer" },
] as const

export function ReadinessScoreSheet({
  readiness,
  currentSchoolName,
  targetSchoolName,
  targetMajor,
  expectedTransferTerm,
}: ReadinessScoreSheetProps) {
  const ranked = [...ROWS]
    .map((row) => ({ ...row, value: readiness.breakdown[row.key] }))
    .sort((a, b) => a.value - b.value)
  const weakest = ranked.filter((r) => r.value < 100).slice(0, 3)

  const next = weakest[0]
  const empty = ranked.every((row) => row.value === 0)
  const prompt = next
    ? next.key === "essay0To100"
      ? "Your transfer essay draft is still empty on file. Save a draft to record this measure."
      : `${next.label} is the thinnest measure on this sheet. Review what is on file and fill in the missing work.`
    : "Every measure on this sheet is fully recorded. Review your essay and check your dates before applying."

  return (
    <section className="readiness-score-sheet" aria-label="Path readiness score sheet">
      <section className="readiness-next" aria-labelledby="readiness-next-heading">
        <p className="hall-caption">{empty ? "Start here" : "Do this next"}</p>
        <h2 id="readiness-next-heading" className="readiness-next-title">
          {next ? <>{next.label} <span>· {Math.round(next.value)}%</span></> : "Fully recorded"}
        </h2>
        <p className="readiness-next-prompt">{prompt}</p>
        <div className="union-step-actions readiness-next-actions">
          <Link href={next?.href ?? "/dashboard/essay"} className="union-primary-cta">
            {next?.action ?? "Review Essays"}
          </Link>
          {weakest.slice(1).map((row) => (
            <Link key={row.key} href={row.href} className="hall-ledger-link">
              {row.label} · {Math.round(row.value)}%
            </Link>
          ))}
          {!next ? <Link href="/dashboard/deadlines" className="hall-ledger-link">Check Deadlines</Link> : null}
        </div>
      </section>

      <div className="readiness-route-line">
        <p className="hall-caption">Training route</p>
        <p>
          <span>{currentSchoolName ?? "Current school not set"}</span>
          <span aria-hidden> → </span>
          <strong>{targetSchoolName ?? "Target school not set"}</strong>
        </p>
        <p>
          {targetMajor ?? "Program not set"} · {expectedTransferTerm ?? "Term not set"}
        </p>
      </div>

      <header className="readiness-sheet-heading">
        <div>
          <p className="hall-caption">Instrument on file</p>
          <p className="readiness-sheet-lead">
            A planning measure of work recorded in TransferPath — not an admission prediction.
          </p>
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
        <span>Measure</span>
        <span>Weight</span>
        <span>Recorded</span>
        <span>Review</span>
      </div>
      <ol className="readiness-register">
        {ROWS.map((row, index) => {
          const value = Math.round(readiness.breakdown[row.key])
          return (
            <li key={row.key}>
              <span className="readiness-row-number">{String(index + 1).padStart(2, "0")}</span>
              <strong>{row.label}</strong>
              <span><span className="sr-only">Weight </span>{row.weight}</span>
              <span className="readiness-row-value"><span className="sr-only">Recorded </span>{value}%</span>
              <Link href={row.href} className="hall-ledger-link" aria-label={`Review ${row.label}`}>
                Open
              </Link>
            </li>
          )
        })}
      </ol>

      <footer className="readiness-sheet-note">
        <span>Method note</span>
        <p>
          Credits and requirement coursework carry half the instrument; application tasks, GPA, essay
          work, and pathway details make up the balance. Essay records draft presence, not quality; this is not an admission prediction.
        </p>
      </footer>
    </section>
  )
}

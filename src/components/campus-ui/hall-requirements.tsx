import Link from "next/link"
import { institutionColumnLabels } from "@/lib/institution-column-labels"
import type {
  RequirementsWorkspaceData,
  RequirementWorkspaceItem,
} from "@/types/requirements-workspace"

function planStatus(status: string) {
  if (status === "done") return "Complete"
  if (status === "active") return "On plan"
  return "Open"
}

function pathwayUnset(header: RequirementsWorkspaceData["header"]) {
  const to = (header.toInstitution || "").toLowerCase()
  const term = (header.term || "").toLowerCase()
  return (
    !to ||
    to.includes("not set") ||
    to.includes("choose") ||
    !term ||
    term.includes("not set")
  )
}

type NextAction = {
  caption: "Do this next" | "Start here"
  title: string
  requirement?: RequirementWorkspaceItem
  primary: { href: string; label: string }
  secondaries: { href: string; label: string }[]
}

function pickNext(data: RequirementsWorkspaceData): NextAction {
  const items = data.categories.flatMap((c) => c.items)
  const missing = items.find((i) => i.status === "missing")
  const active = items.find((i) => i.status === "active")
  const unset = pathwayUnset(data.header)

  if (unset) {
    return {
      caption: "Start here",
      title: "Set your school and entry term",
      primary: { href: "/dashboard/settings?tab=transfer", label: "Set school & term" },
      secondaries: [
        { href: "/dashboard/plan", label: "Open Plan" },
      ],
    }
  }

  if (items.length === 0) {
    return {
      caption: "Start here",
      title: "No requirements on file yet",
      primary: { href: "/dashboard/settings?tab=transfer", label: "Edit schools" },
      secondaries: [
        { href: "/dashboard/plan", label: "Open Plan" },
      ],
    }
  }

  const requirement = missing ?? active
  if (requirement) {
    return {
      caption: "Do this next",
      title: requirement.title,
      requirement,
      primary: { href: "/dashboard/plan", label: requirement.status === "active" ? "Open Plan" : "Place on Plan" },
      secondaries: [],
    }
  }

  return {
    caption: "Do this next",
    title: "Requirements look covered",
    primary: { href: "/dashboard/deadlines", label: "Open Deadlines" },
    secondaries: [
      { href: "/dashboard/plan", label: "Review Plan" },
    ],
  }
}

function RequirementsNextBlock({ next, currentLabel, targetLabel, term }: {
  next: NextAction
  currentLabel: string
  targetLabel: string
  term: string
}) {
  const item = next.requirement
  return (
    <section className="union-next-block" aria-labelledby="requirements-next-heading">
      <p className="hall-caption" id="requirements-next-heading">
        {next.caption}
      </p>
      {item ? (
        <>
          <h2 className="registrar-equivalence">
            <span className="registrar-equivalence-side">
              <span className="hall-caption">{currentLabel}</span>
              <span className="registrar-course-code">{item.code || "Not listed"}</span>
            </span>
            <span className="registrar-equivalence-mark">
              <span aria-hidden>↔</span>
              <span className="sr-only">equivalent to</span>
            </span>
            <span className="registrar-equivalence-side">
              <span className="hall-caption">{targetLabel}</span>
              <span className="registrar-course-code">{item.equiv || "Not listed"}</span>
            </span>
          </h2>
          <p className="registrar-course-name">
            <strong>{item.title}</strong><span> · {item.credits} cr</span>
          </p>
          <p className="registrar-rationale">
            {item.status === "missing"
              ? `Next open requirement · place on Plan${term ? ` for ${term}` : ""}`
              : "On plan · review your course in Plan"}
          </p>
          {item.provenanceBasis ? (
            <p className="registrar-provenance">Source · <strong>{item.provenanceBasis}</strong></p>
          ) : null}
        </>
      ) : <h2 className="hall-hero-title">{next.title}</h2>}
      <div className="union-step-actions mt-6">
        <Link href={next.primary.href} className="union-primary-cta">
          {next.primary.label}
        </Link>
        {next.secondaries.slice(0, 1).map((action) => (
          <Link key={action.href + action.label} href={action.href} className="hall-ledger-link">
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  )
}

export function HallRequirements({ data }: { data: RequirementsWorkspaceData }) {
  const items = data.categories.flatMap((c) => c.items)
  const done = items.filter((i) => i.status === "done").length
  const open = items.filter((i) => i.status === "missing").length
  const active = items.filter((i) => i.status === "active").length
  const { currentLabel, targetLabel } = institutionColumnLabels(
    data.header.fromInstitution,
    data.header.toInstitution,
  )
  const next = pickNext(data)

  return (
    <div className="hall-split hall-registrar">
      <div>
        <RequirementsNextBlock next={next} currentLabel={currentLabel} targetLabel={targetLabel} term={data.header.term} />
      </div>

      <section className="registrar-ledger" aria-label="Course equivalence">
        <p className="registrar-ledger-summary">
          Course equivalence · <strong>{active + done} of {items.length} on plan</strong> · {open} open
          {done > 0 ? ` · ${done} complete` : ""}
        </p>

        <div className="hall-matrix-wrap mt-4">
          <table className="hall-matrix">
            <colgroup>
              <col style={{ width: "38%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Requirement</th>
                <th scope="col">{currentLabel}</th>
                <th scope="col">{targetLabel}</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <p className="hall-prompt">No requirement rows yet. Set schools or place a course on Plan.</p>
                  </td>
                </tr>
              ) : (
                items.map((item: RequirementWorkspaceItem, index: number) => (
                  <tr key={item.id}>
                    <td>
                      <span className="hall-row-num" aria-hidden>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item.title}
                      <span className="registrar-row-credits">{item.credits} cr</span>
                    </td>
                    <td>{item.code || "—"}</td>
                    <td>{item.equiv || "—"}</td>
                    <td className="registrar-status" data-status={item.status}>
                      {planStatus(item.status)}
                    </td>
                    <td className="registrar-row-action">
                      <Link href="/dashboard/plan" className="hall-ledger-link" aria-label={`${item.status === "missing" ? "Place on Plan" : "Open Plan"}: ${item.title}`}>
                        {item.status === "missing" ? "Place on Plan" : "Open Plan"}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="hall-margin">
        <p className="hall-caption registrar-transfer-label">Your transfer</p>
        <p>
          {data.header.fromInstitution} → {data.header.toInstitution}
        </p>
        <p className="mt-1">
          {data.header.program} · {data.header.term}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/dashboard/deadlines" className="hall-ledger-link">
            Open Deadlines
          </Link>
          <Link href="/dashboard/checklist" className="hall-ledger-link">
            Open Checklist
          </Link>
        </div>
      </aside>
    </div>
  )
}

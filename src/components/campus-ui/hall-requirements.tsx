import Link from "next/link"
import { institutionColumnLabels } from "@/lib/institution-column-labels"
import type {
  RequirementsWorkspaceData,
  RequirementWorkspaceItem,
} from "@/types/requirements-workspace"

function standing(status: string) {
  if (status === "done") return "On plan"
  if (status === "active") return "In progress"
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
        { href: "/dashboard/deadlines", label: "Open Deadlines" },
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
        { href: "/dashboard/deadlines", label: "Open Deadlines" },
      ],
    }
  }

  const requirement = missing ?? active
  if (requirement) {
    return {
      caption: "Do this next",
      title: requirement.title,
      requirement,
      primary: { href: "/dashboard/plan", label: "Place on Plan" },
      secondaries: [
        { href: "/dashboard/deadlines", label: "Open Deadlines" },
        { href: "/dashboard/checklist", label: "Open Checklist" },
      ],
    }
  }

  return {
    caption: "Do this next",
    title: "Requirements look covered",
    primary: { href: "/dashboard/deadlines", label: "Open Deadlines" },
    secondaries: [
      { href: "/dashboard/checklist", label: "Open Checklist" },
      { href: "/dashboard/plan", label: "Review Plan" },
    ],
  }
}

function RequirementsNextBlock({ next, currentLabel, targetLabel }: {
  next: NextAction
  currentLabel: string
  targetLabel: string
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
          <p className="registrar-course-detail">
            <span>{item.title}</span>
            <span>{item.credits} cr · {standing(item.status)}</span>
          </p>
          {item.provenanceBasis ? (
            <p className="registrar-provenance">{item.provenanceBasis}</p>
          ) : null}
        </>
      ) : <h2 className="hall-hero-title">{next.title}</h2>}
      <div className="union-step-actions mt-6">
        <Link href={next.primary.href} className="union-primary-cta">
          {next.primary.label}
        </Link>
        {next.secondaries.slice(0, 2).map((action) => (
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
  const { currentLabel, targetLabel } = institutionColumnLabels(
    data.header.fromInstitution,
    data.header.toInstitution,
  )
  const next = pickNext(data)

  return (
    <div className="hall-split hall-registrar">
      <div>
        <RequirementsNextBlock next={next} currentLabel={currentLabel} targetLabel={targetLabel} />

        <p className="hall-caption mt-6">
          Course equivalence · {done}/{items.length} on plan
        </p>

        <div className="hall-matrix-wrap mt-4">
          <table className="hall-matrix">
            <colgroup>
              <col style={{ width: "36%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "26%" }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Requirement</th>
                <th scope="col">{currentLabel}</th>
                <th scope="col">{targetLabel}</th>
                <th scope="col">Standing</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4}>
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
                    </td>
                    <td>{item.code || "—"}</td>
                    <td>{item.equiv || "—"}</td>
                    <td className={item.status === "missing" ? "hall-urgent" : undefined}>
                      {item.status === "done" ? (
                        <>
                          {standing(item.status)}
                          {item.credits ? ` · ${item.credits} cr` : ""}
                        </>
                      ) : (
                        <Link href="/dashboard/plan" className="hall-ledger-link">
                          {standing(item.status)}
                          {item.credits ? ` · ${item.credits} cr` : ""}
                          {" · Place on Plan"}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="hall-margin">
        <p>
          {data.header.fromInstitution} → {data.header.toInstitution}
        </p>
        <p className="mt-1">
          {data.header.program} · {data.header.term}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/dashboard/plan" className="hall-ledger-link">
            Open Plan
          </Link>
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

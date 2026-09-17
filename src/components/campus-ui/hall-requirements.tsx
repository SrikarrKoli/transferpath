import Link from "next/link"
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
  prompt?: string
  meta?: string
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
      prompt:
        "Requirements only make sense once we know where you are transferring. That unlocks this list.",
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
      prompt: "Confirm your target school, then place courses on Plan so this page can track them.",
      primary: { href: "/dashboard/settings?tab=transfer", label: "Edit schools" },
      secondaries: [
        { href: "/dashboard/plan", label: "Open Plan" },
        { href: "/dashboard/deadlines", label: "Open Deadlines" },
      ],
    }
  }

  if (missing) {
    return {
      caption: "Do this next",
      title: missing.title,
      meta: [missing.code || null, missing.equiv ? `→ ${missing.equiv}` : null, "Still open"]
        .filter(Boolean)
        .join(" · "),
      prompt: "Place a matching course on Plan to mark this requirement on plan.",
      primary: { href: "/dashboard/plan", label: "Place on Plan" },
      secondaries: [
        { href: "/dashboard/deadlines", label: "Open Deadlines" },
        { href: "/dashboard/checklist", label: "Open Checklist" },
      ],
    }
  }

  if (active) {
    return {
      caption: "Do this next",
      title: active.title,
      meta: [active.code || null, "In progress"].filter(Boolean).join(" · "),
      prompt: "Keep this course moving on Plan until it lands as on plan here.",
      primary: { href: "/dashboard/plan", label: "Open Plan" },
      secondaries: [
        { href: "/dashboard/deadlines", label: "Open Deadlines" },
        { href: "/dashboard/checklist", label: "Open Checklist" },
      ],
    }
  }

  return {
    caption: "Do this next",
    title: "Requirements look covered",
    prompt: "Good time to confirm upcoming dates or tick checklist items still left.",
    primary: { href: "/dashboard/deadlines", label: "Open Deadlines" },
    secondaries: [
      { href: "/dashboard/checklist", label: "Open Checklist" },
      { href: "/dashboard/plan", label: "Review Plan" },
    ],
  }
}

function RequirementsNextBlock({ next }: { next: NextAction }) {
  return (
    <section className="union-next-block" aria-labelledby="requirements-next-heading">
      <p className="hall-caption" id="requirements-next-heading">
        {next.caption}
      </p>
      <h2 className="hall-hero-title">{next.title}</h2>
      {next.prompt ? <p className="hall-prompt mt-4">{next.prompt}</p> : null}
      {next.meta ? (
        <p className="mt-3 text-sm text-[color:var(--hall-stone)]">{next.meta}</p>
      ) : null}
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
  const missing = items.filter((i) => i.status === "missing").length
  const active = items.filter((i) => i.status === "active").length
  const total = items.length || 1
  const headline =
    missing === 0 && active === 0
      ? "All logged"
      : missing > 0
        ? `${missing} still open`
        : `${active} in progress`

  const currentLabel = data.header.fromInstitution?.split(" ")[0] ?? "Current"
  const targetLabel = data.header.toInstitution?.split(" ").slice(-1)[0] ?? "Target"
  const next = pickNext(data)

  return (
    <div className="hall-split">
      <div>
        <RequirementsNextBlock next={next} />

        <p className="hall-mid mt-8">{headline}</p>
        <p className="hall-date-meta mt-2">
          {done} of {total} on this path
        </p>

        <div className="hall-matrix-wrap mt-8">
          <div className="hall-matrix-columns" aria-hidden>
            <span>Requirement</span>
            <span>{currentLabel}</span>
            <span>{targetLabel}</span>
            <span>Standing</span>
          </div>
          <table className="hall-matrix">
            <thead className="sr-only">
              <tr>
                <th>Requirement</th>
                <th>{currentLabel}</th>
                <th>{targetLabel}</th>
                <th>Standing</th>
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
        <p className="mt-6">
          On plan means you already placed a matching course. Open means it is still required. Dates
          live under Deadlines.
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

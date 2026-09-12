import type { RequirementsWorkspaceData } from "@/types/requirements-workspace"

function standing(status: string) {
  if (status === "done") return "Logged"
  if (status === "active") return "In progress"
  return "Open"
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

  return (
    <div className="hall-split">
      <div>
        <p className="hall-mid">{headline}</p>
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
              {items.map((item, index) => (
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
                    {standing(item.status)}
                    {item.credits ? ` · ${item.credits} cr` : ""}
                  </td>
                </tr>
              ))}
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
          Logged means a course is on your record. Open means the catalog still expects it. Dates
          live in the Clock Tower.
        </p>
      </aside>
    </div>
  )
}

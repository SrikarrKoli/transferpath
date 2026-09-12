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

  return (
    <div>
      <p className="hall-mid">
        {headline}
      </p>
      <p className="hall-date-meta mt-2">
        {done} of {total} on this path
      </p>

      <table className="hall-matrix mt-10">
        <thead>
          <tr>
            <th>Course</th>
            <th>At ACC</th>
            <th>At UT</th>
            <th>Standing</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.code}</td>
              <td>{item.equiv || "—"}</td>
              <td className={item.status === "missing" ? "hall-urgent" : undefined}>
                {standing(item.status)}
                {item.credits ? ` · ${item.credits} cr` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="hall-margin mt-10 max-w-sm">
        Logged means a course is on your record. Open means the catalog still expects it. Dates
        live in the Clock Tower.
      </p>
    </div>
  )
}

"use client"

const routes = [
  ["Dallas College", "UT Austin"],
  ["Collin", "Texas A&M"],
  ["ACC", "Houston"],
  ["HCC", "Baylor"],
  ["TCC", "SMU"],
] as const

export function SchoolLogos() {
  return (
    <section className="border-b border-border py-6">
      <p className="text-xs text-muted-foreground">Common routes</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {routes.map(([from, to]) => (
          <li
            key={from}
            className="border border-border px-2.5 py-1 text-sm text-foreground"
          >
            <span className="text-muted-foreground">{from}</span>
            <span className="mx-1.5 text-muted-foreground/50">→</span>
            <span className="font-medium">{to}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

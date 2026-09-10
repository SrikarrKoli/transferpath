"use client"

type Row =
  | {
      kind: "course"
      term: string
      code: string
      name: string
      credits: string
      status: "Done" | "Now" | "Next"
    }
  | { kind: "subtotal"; label: string; credits: string }

const rows: Row[] = [
  { kind: "course", term: "Fall 2025", code: "ENGL 1301", name: "Composition I", credits: "3", status: "Done" },
  { kind: "course", term: "", code: "MATH 2413", name: "Calculus I", credits: "4", status: "Done" },
  { kind: "course", term: "", code: "CS 1337", name: "Programming Fundamentals", credits: "3", status: "Done" },
  { kind: "subtotal", label: "Fall subtotal", credits: "10" },
  { kind: "course", term: "Spring 2026", code: "CS 2305", name: "Discrete Math", credits: "3", status: "Now" },
  { kind: "course", term: "", code: "MATH 2414", name: "Calculus II", credits: "4", status: "Now" },
  { kind: "course", term: "", code: "GOVT 2305", name: "Federal Government", credits: "3", status: "Now" },
  { kind: "subtotal", label: "Spring subtotal", credits: "10" },
  { kind: "course", term: "Fall 2026", code: "—", name: "Apply to UT Austin", credits: "—", status: "Next" },
]

function StatusMark({ status }: { status: "Done" | "Now" | "Next" }) {
  if (status === "Done") {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span className="inline-block size-1.5 rounded-[1px] bg-muted-foreground/40" aria-hidden />
        Done
      </span>
    )
  }
  if (status === "Now") {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        <span className="inline-block size-1.5 rounded-[1px] bg-foreground" aria-hidden />
        Now
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
      <span className="inline-block size-1.5 rounded-[1px] bg-accent" aria-hidden />
      Next
    </span>
  )
}

export function Hero() {
  return (
    <section id="plan" className="pt-12 md:pt-16">
      <div className="grid items-start gap-8 border-b-2 border-foreground pb-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:pb-10">
        <div>
          <h1 className="font-heading text-4xl font-semibold leading-[0.95] tracking-[-0.035em] text-foreground sm:text-5xl md:text-[3.75rem]">
            The degree plan that gets you out of here.
          </h1>
          <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
            Credits, deadlines, and essays on one page — community college to your target university.
          </p>
        </div>

        <aside className="border border-foreground p-5 lg:mt-1">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Active path</p>
          <p className="mt-2 text-lg font-medium leading-snug text-foreground">
            Dallas College
            <span className="mx-2 text-muted-foreground">→</span>
            UT Austin
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <dt className="text-xs text-muted-foreground">Transferable</dt>
              <dd className="mt-1 font-mono text-xl tabular-nums tracking-tight text-foreground">20 / 30</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Planning score</dt>
              <dd className="mt-1 font-mono text-xl tabular-nums tracking-tight text-foreground">68 / 100</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="mt-0">
        <div className="hidden grid-cols-[6.25rem_6.75rem_minmax(0,1fr)_4.5rem_2.75rem] gap-x-3 border-b border-border py-2.5 text-xs text-muted-foreground md:grid">
          <span>Term</span>
          <span>Code</span>
          <span>Course</span>
          <span>Status</span>
          <span className="pr-1 text-right">Cr</span>
        </div>

        {rows.map((row, i) => {
          if (row.kind === "subtotal") {
            return (
              <div
                key={i}
                className="grid grid-cols-[minmax(0,1fr)_2.75rem] gap-x-3 border-b border-border py-2 text-xs text-muted-foreground md:grid-cols-[6.25rem_6.75rem_minmax(0,1fr)_4.5rem_2.75rem]"
              >
                <span className="md:col-span-4 md:text-right">{row.label}</span>
                <span className="pr-1 text-right font-mono tabular-nums tracking-tight text-foreground">
                  {row.credits}
                </span>
              </div>
            )
          }

          const done = row.status === "Done"
          const next = row.status === "Next"

          return (
            <div
              key={i}
              className={[
                "grid grid-cols-[5.25rem_minmax(0,1fr)_2.5rem] items-baseline gap-x-2 border-b border-border py-2.5 text-sm md:grid-cols-[6.25rem_6.75rem_minmax(0,1fr)_4.5rem_2.75rem] md:gap-x-3",
                done ? "text-muted-foreground" : "text-foreground",
                next ? "border-b-2 border-b-foreground" : "",
              ].join(" ")}
            >
              <span className="text-muted-foreground">{row.term || "\u00A0"}</span>
              <span className="hidden font-mono text-[12px] tracking-tight text-muted-foreground md:block">
                {row.code}
              </span>
              <span
                className={[
                  "min-w-0 truncate",
                  row.status === "Now" || next ? "font-medium text-foreground" : "",
                ].join(" ")}
              >
                <span className="mr-1.5 font-mono text-[11px] md:hidden">{row.code}</span>
                {row.name}
              </span>
              <span className="hidden text-xs md:block">
                <StatusMark status={row.status} />
              </span>
              <span className="pr-1 text-right font-mono text-[12px] tabular-nums tracking-tight text-muted-foreground">
                {row.credits}
              </span>
            </div>
          )
        })}

        <div className="flex flex-wrap items-baseline justify-between gap-2 border-t-2 border-foreground py-3.5">
          <span className="text-sm text-muted-foreground">Running total</span>
          <span className="text-sm text-foreground">
            <span className="font-mono tabular-nums tracking-tight">20 of 30</span>
            <span className="mx-2 text-muted-foreground">·</span>
            next: apply
          </span>
        </div>
      </div>
    </section>
  )
}

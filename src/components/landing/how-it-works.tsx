"use client"

const deadlines = [
  { when: "Mar 1", what: "Priority application — UT Austin", state: "Soon" as const },
  { when: "May 1", what: "Official transcripts due", state: "Open" as const },
  { when: "Jun 15", what: "Essay draft complete", state: "Open" as const },
]

export function HowItWorks() {
  return (
    <section id="deadlines" className="py-12">
      <div className="border-b border-foreground pb-3">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Deadlines on the same sheet
        </h2>
        <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
          Tell us your school, target, major, and GPA. We map semesters against the real
          requirements, then keep transcripts, essays, and application windows on one checklist.
        </p>
      </div>

      <div className="mt-1">
        <div className="hidden grid-cols-[5rem_minmax(0,1fr)_4.5rem] gap-x-3 border-b border-border py-2 text-xs text-muted-foreground md:grid">
          <span>Date</span>
          <span>Item</span>
          <span>Status</span>
        </div>
        {deadlines.map((d) => (
          <div
            key={d.what}
            className="grid grid-cols-[5rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-border py-3 text-sm md:grid-cols-[5rem_minmax(0,1fr)_4.5rem]"
          >
            <span className="font-mono text-[13px] tabular-nums tracking-tight text-muted-foreground">
              {d.when}
            </span>
            <span className="min-w-0 truncate font-medium text-foreground">{d.what}</span>
            <span
              className={
                d.state === "Soon"
                  ? "inline-flex items-center gap-1.5 text-xs font-semibold text-accent"
                  : "inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              }
            >
              <span
                className={
                  d.state === "Soon"
                    ? "inline-block size-1.5 rounded-[1px] bg-accent"
                    : "inline-block size-1.5 rounded-[1px] bg-muted-foreground/40"
                }
                aria-hidden
              />
              {d.state}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

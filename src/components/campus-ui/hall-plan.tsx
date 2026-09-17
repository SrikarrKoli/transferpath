"use client"

import Link from "next/link"

export type HallPlanCourse = {
  code?: string
  title: string
  status: string
}

export type HallPlanBlock = {
  term: string
  range?: string
  courses: HallPlanCourse[]
}

export type HallPlanPrimaryAction =
  | { kind: "button"; label: string; onClick: () => void }
  | { kind: "link"; label: string; href: string }

export type HallPlanSecondaryAction =
  | { kind: "button"; label: string; onClick: () => void }
  | { kind: "link"; label: string; href: string }

export type HallPlanNext = {
  caption: "Do this next" | "Start here"
  title: string
  prompt?: string
  meta?: string
  primary: HallPlanPrimaryAction
  secondaries?: HallPlanSecondaryAction[]
}

export type HallPlanMargin = {
  fromInstitution?: string | null
  toInstitution?: string | null
  program?: string | null
  term?: string | null
}

function PrimaryCta({ action }: { action: HallPlanPrimaryAction }) {
  if (action.kind === "link") {
    return (
      <Link href={action.href} className="union-primary-cta">
        {action.label}
      </Link>
    )
  }
  return (
    <button type="button" className="union-primary-cta" onClick={action.onClick}>
      {action.label}
    </button>
  )
}

function SecondaryAction({ action }: { action: HallPlanSecondaryAction }) {
  if (action.kind === "link") {
    return (
      <Link href={action.href} className="hall-ledger-link">
        {action.label}
      </Link>
    )
  }
  return (
    <button type="button" className="hall-ledger-link" onClick={action.onClick}>
      {action.label}
    </button>
  )
}

function PlanNextBlock({ next }: { next: HallPlanNext }) {
  return (
    <section className="union-next-block" aria-labelledby="plan-next-heading">
      <p className="hall-caption" id="plan-next-heading">
        {next.caption}
      </p>
      <h2 className="hall-hero-title">{next.title}</h2>
      {next.meta ? (
        <p className="mt-3 text-sm text-[color:var(--hall-stone)]">{next.meta}</p>
      ) : null}
      <div className="union-step-actions mt-6">
        <PrimaryCta action={next.primary} />
        {(next.secondaries ?? []).slice(0, 2).map((action) => (
          <SecondaryAction key={action.label} action={action} />
        ))}
      </div>
    </section>
  )
}

function PlanRegister({ blocks }: { blocks: HallPlanBlock[] }) {
  if (blocks.length === 0) {
    return (
      <p className="hall-prompt mt-6">No courses on your plan yet. Add one to start tracking terms.</p>
    )
  }

  return (
    <div className="hall-plan-register mt-6">
      <div className="hall-plan-columns" aria-hidden>
        <span>Term</span>
        <span>Course</span>
        <span>Status</span>
      </div>
      <div className="hall-terms">
        {blocks.map((block) => (
          <section key={block.term} className="hall-term-band">
            <header className="hall-term-band-head">
              <h2 className="hall-term-name">{block.term}</h2>
              {block.range ? <p className="hall-caption">{block.range}</p> : null}
            </header>
            {block.courses.length === 0 ? (
              <div className="hall-course hall-course-empty">
                <p className="hall-course-title">No courses on this term yet.</p>
              </div>
            ) : (
              block.courses.map((course) => (
                <div
                  key={`${block.term}-${course.code ?? course.title}`}
                  className="hall-course"
                >
                  <div className="hall-course-main">
                    {course.code ? <p className="hall-course-code">{course.code}</p> : null}
                    <p className="hall-course-title">{course.title}</p>
                  </div>
                  {course.status ? (
                    <p className="hall-date-meta hall-course-status">{course.status}</p>
                  ) : (
                    <span className="hall-course-status" />
                  )}
                </div>
              ))
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

export function HallPlan({
  blocks,
  note,
  next,
  margin,
  onAddCourse,
}: {
  blocks: HallPlanBlock[]
  note?: string
  next?: HallPlanNext
  margin?: HallPlanMargin
  onAddCourse?: () => void
}) {
  const showSplit = Boolean(next || margin)

  const register = (
    <>
      {next ? <PlanNextBlock next={next} /> : null}
      {onAddCourse ? (
        <div className="hall-plan-toolbar">
          <p className="hall-caption">
            Place courses on terms for your transfer entry. Course requirements stay under Requirements.
          </p>
          <button type="button" className="hall-ledger-link hall-plan-add" onClick={onAddCourse}>
            + Add a course
          </button>
        </div>
      ) : null}
      <PlanRegister blocks={blocks} />
      {note ? <p className="hall-margin mt-8 max-w-xl">{note}</p> : null}
      {onAddCourse ? (
        <div className="hall-plan-foot">
          <button type="button" className="hall-ledger-link" onClick={onAddCourse}>
            Add another course
          </button>
        </div>
      ) : null}
    </>
  )

  if (!showSplit) {
    return <div className="hall-plan-register">{register}</div>
  }

  return (
    <div className="hall-split">
      <div>{register}</div>
      <aside className="hall-margin">
        {margin ? (
          <>
            <p className="hall-caption">Your transfer</p>
            <p className="mt-2">
              <span className="text-[color:var(--hall-stone)]">
                {margin.fromInstitution ?? "Current school not set"}
              </span>
              <span aria-hidden> → </span>
              <strong>{margin.toInstitution ?? "Target school not set"}</strong>
            </p>
            <p className="mt-1 text-[0.9rem] text-[color:var(--hall-stone)]">
              {margin.program ?? "Program not set"} · {margin.term ?? "Term not set"}
            </p>
          </>
        ) : null}
        <div className="mt-3 flex flex-col items-start gap-2">
          <Link href="/dashboard/requirements" className="hall-ledger-link">
            Open Requirements
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

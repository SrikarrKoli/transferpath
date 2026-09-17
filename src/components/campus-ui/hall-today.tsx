"use client"

import Link from "next/link"
import { splitHallDate } from "@/lib/hall-date"
import type { OverviewData } from "@/types/overview"
import { MarkTaskDoneButton } from "@/components/dashboard/overview/mark-task-done-button"
import { UnionFirstRunCoach } from "@/components/dashboard/overview/union-first-run-coach"

const APPLY_TEXAS_URL = "https://www.goapplytexas.org/"
const COLLEGE_BOARD_URL = "https://www.commonapp.org/apply"

function ApplyPortals() {
  return (
    <section className="union-apply-portals" aria-labelledby="union-apply-heading">
      <p id="union-apply-heading" className="hall-caption">
        Ready to apply?
      </p>
      <p className="union-apply-lede">
        Use the portal your target schools require. Most Texas publics use ApplyTexas; many
        private and out-of-state schools use Common App (College Board).
      </p>
      <div className="union-apply-grid">
        <a
          href={APPLY_TEXAS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="union-apply-card"
        >
          <span className="union-apply-card-label">ApplyTexas</span>
          <span className="union-apply-card-hint">Texas public universities</span>
          <span className="union-apply-card-cta">
            Open ApplyTexas
            <span className="sr-only"> (opens in a new tab)</span>
          </span>
        </a>
        <a
          href={COLLEGE_BOARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="union-apply-card"
        >
          <span className="union-apply-card-label">College Board · Common App</span>
          <span className="union-apply-card-hint">Many private & out-of-state schools</span>
          <span className="union-apply-card-cta">
            Open Common App
            <span className="sr-only"> (opens in a new tab)</span>
          </span>
        </a>
      </div>
    </section>
  )
}

function PrimaryAction({
  href,
  label,
  external,
}: {
  href: string
  label: string
  external?: boolean
}) {
  if (external || href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="union-primary-cta">
        {label}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  }
  return (
    <Link href={href} className="union-primary-cta">
      {label}
    </Link>
  )
}

export function HallToday({ data, userId }: { data: OverviewData; userId: string }) {
  if (data.pathwayPrompt) {
    return (
      <div className="hall-split union-today">
        <div className="union-today-main">
          <section className="union-next-block">
            <p className="hall-caption">Start here</p>
            <p className="hall-hero-title">{data.pathwayPrompt.title}</p>
            <p className="hall-prompt mt-5">{data.pathwayPrompt.body}</p>
            <div className="union-step-actions mt-6">
              <PrimaryAction
                href={data.pathwayPrompt.settingsHref}
                label="1. Set school and term"
              />
            </div>
          </section>
          <ApplyPortals />
        </div>
        <aside className="hall-margin">
          <p className="hall-caption">Why this first</p>
          <p className="mt-2">
            Target school and entry term unlock deadlines, requirements, and the rest of campus.
          </p>
        </aside>
      </div>
    )
  }

  const next = data.nextAction
  const dateParts = next?.dateLabel ? splitHallDate(next.dateLabel) : null

  return (
    <div className="hall-split union-today">
      <div className="union-today-main">
        <section className="union-next-block" aria-labelledby="union-next-heading">
          <p className="hall-caption" id="union-next-heading">
            Do this next
          </p>

          {next ? (
            <>
              {dateParts ? (
                <p className="hall-hero-date">
                  {dateParts.primary}
                  {dateParts.year ? (
                    <span className="mt-2 block text-[0.28em] font-normal tracking-normal text-[color:var(--hall-stone)]">
                      {dateParts.year}
                    </span>
                  ) : null}
                </p>
              ) : (
                <p className="hall-hero-date">
                  Now
                  <span className="mt-2 block text-[0.28em] font-normal tracking-normal text-[color:var(--hall-stone)]">
                    Next on your route
                  </span>
                </p>
              )}
              <h2 className="hall-hero-title">{next.title}</h2>
              {next.dueDetail ? (
                <p className="hall-urgent mt-3 text-[0.95rem]">{next.dueDetail}</p>
              ) : null}
              {next.scopeChips.length > 0 ? (
                <p className="mt-3 text-sm text-[color:var(--hall-stone)]">
                  {next.scopeChips.join(" · ")}
                </p>
              ) : null}
              <div className="union-step-actions mt-6">
                <PrimaryAction
                  href={next.primaryHref}
                  label={next.primaryLabel}
                  external={next.primaryExternal}
                />
                {next.taskKey ? (
                  <MarkTaskDoneButton userId={userId} taskKey={next.taskKey} variant="text" />
                ) : null}
                {next.secondaryHref && next.secondaryLabel ? (
                  <Link href={next.secondaryHref} className="hall-ledger-link">
                    {next.secondaryLabel}
                  </Link>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p className="hall-hero-date">
                Clear
                <span className="mt-2 block text-[0.28em] font-normal tracking-normal text-[color:var(--hall-stone)]">
                  Today
                </span>
              </p>
              <p className="hall-hero-title">Nothing due on your route today.</p>
              <p className="hall-prompt mt-4">
                Use the time to push applications, check requirements, or knock out a checklist task.
              </p>
              <div className="union-step-actions mt-6">
                <PrimaryAction href="/dashboard/checklist" label="Open checklist" />
                <Link href="/dashboard/plan" className="hall-ledger-link">
                  Review plan
                </Link>
                <Link href="/dashboard/deadlines" className="hall-ledger-link">
                  Check deadlines
                </Link>
              </div>
            </>
          )}
        </section>

        <UnionFirstRunCoach />

        <ApplyPortals />

        {data.comingUp.length > 0 ? (
          <section className="hall-strip" aria-labelledby="union-upcoming-heading">
            <p className="hall-caption mb-2" id="union-upcoming-heading">
              Then coming up
            </p>
            {data.comingUp.map((item) => (
              <div key={`${item.dateLabel}-${item.title}`} className="hall-strip-row">
                <span>{item.dateLabel}</span>
                <span className="min-w-0 flex-1">
                  {item.title}
                  {item.meta ? (
                    <span className="mt-0.5 block text-[0.85em] text-[color:var(--hall-stone)]">
                      {item.meta}
                    </span>
                  ) : null}
                </span>
                <Link href={item.href} className="hall-ledger-link shrink-0">
                  {item.actionLabel}
                </Link>
              </div>
            ))}
          </section>
        ) : null}
      </div>

      <aside className="hall-margin">
        <p className="hall-caption">Your route</p>
        <p className="mt-2">
          <span className="text-[color:var(--hall-stone)]">{data.pathway.fromInstitution}</span>
          <span aria-hidden> → </span>
          <strong>{data.pathway.toInstitution}</strong>
        </p>
        <p className="mt-1 text-[0.9rem] text-[color:var(--hall-stone)]">
          {data.pathway.program} · {data.pathway.term}
        </p>

        {data.thisTerm ? (
          <p className="mt-5">
            <span className="hall-caption mb-1 block">This term</span>
            {data.thisTerm.termLabel} · {data.thisTerm.dateRange}. {data.thisTerm.summary}.
          </p>
        ) : null}

        {data.readiness ? (
          <p className="mt-5">
            <span className="hall-caption mb-1 block">Readiness</span>
            {data.readiness.focusSentence}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col items-start gap-2">
          <Link href="/dashboard/settings?tab=transfer" className="hall-ledger-link">
            Edit schools & term
          </Link>
          <Link href="/dashboard/requirements" className="hall-ledger-link">
            Open Requirements
          </Link>
          <Link href="/dashboard/deadlines" className="hall-ledger-link">
            Open Clock Tower
          </Link>
        </div>
      </aside>
    </div>
  )
}

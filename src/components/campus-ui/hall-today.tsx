"use client"

import Link from "next/link"
import { splitHallDate } from "@/lib/hall-date"
import type { OverviewData } from "@/types/overview"
import { MarkTaskDoneButton } from "@/components/dashboard/overview/mark-task-done-button"

export function HallToday({ data, userId }: { data: OverviewData; userId: string }) {
  if (data.pathwayPrompt) {
    return (
      <div className="hall-split">
        <div>
          <p className="hall-hero-title">{data.pathwayPrompt.title}</p>
          <p className="hall-prompt mt-5">{data.pathwayPrompt.body}</p>
          <Link href={data.pathwayPrompt.settingsHref} className="hall-ledger-link mt-6 inline-block">
            Set school and term
          </Link>
        </div>
        <aside className="hall-margin">
          <p>Target school and entry term unlock the rest of campus.</p>
        </aside>
      </div>
    )
  }

  const next = data.nextAction
  const dateParts = next?.dateLabel ? splitHallDate(next.dateLabel) : null

  return (
    <div className="hall-split">
      <div>
        {next ? (
          <div>
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
                  Next on the register
                </span>
              </p>
            )}
            <h2 className="hall-hero-title">{next.title}</h2>
            {next.dueDetail ? <p className="hall-urgent mt-3 text-[0.95rem]">{next.dueDetail}</p> : null}
            <div className="mt-6 flex flex-wrap items-baseline gap-4">
              <Link href={next.primaryHref} className="hall-ledger-link">
                {next.primaryLabel}
              </Link>
              {next.taskKey ? (
                <MarkTaskDoneButton userId={userId} taskKey={next.taskKey} variant="text" />
              ) : null}
            </div>
          </div>
        ) : (
          <div>
            <p className="hall-hero-date">
              Clear
              <span className="mt-2 block text-[0.28em] font-normal tracking-normal text-[color:var(--hall-stone)]">
                Today
              </span>
            </p>
            <p className="hall-hero-title">Nothing due on the register today.</p>
          </div>
        )}

        {data.comingUp.length > 0 ? (
          <div className="hall-strip">
            <p className="hall-caption mb-2">Coming up</p>
            {data.comingUp.map((item) => (
              <div key={`${item.dateLabel}-${item.title}`} className="hall-strip-row">
                <span>{item.dateLabel}</span>
                <span className="min-w-0 flex-1">{item.title}</span>
                <Link href={item.href} className="hall-ledger-link shrink-0">
                  {item.actionLabel}
                </Link>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <aside className="hall-margin">
        {data.thisTerm ? (
          <p>
            {data.thisTerm.termLabel} · {data.thisTerm.dateRange}. {data.thisTerm.summary}.
          </p>
        ) : null}
        {data.readiness ? <p className="mt-5">{data.readiness.focusSentence}</p> : null}
      </aside>
    </div>
  )
}

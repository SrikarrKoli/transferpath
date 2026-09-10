"use client"

import Link from "next/link"
import { ArrowUpRight, ExternalLink } from "lucide-react"
import { Provenance } from "@/components/ui/provenance"
import type { OverviewData } from "@/types/overview"

export function TodayReadinessPanel({
  readiness,
}: {
  readiness: NonNullable<OverviewData["readiness"]>
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <p className="tp-eyebrow text-muted-foreground">Planner readiness</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="font-heading text-3xl leading-none text-foreground">{readiness.score}</span>
        <span className="pb-0.5 text-sm text-muted-foreground">out of 100</span>
      </div>
      <p className="mt-3 text-caption leading-snug text-muted-foreground">{readiness.oneLiner}</p>

      <ul className="mt-5 space-y-3 border-t border-border pt-5">
        {readiness.inputs.map((input) => (
          <li key={input.label}>
            <Link
              href={input.href}
              className="group flex items-start justify-between gap-3 text-sm transition-colors hover:text-foreground"
            >
              <span className="min-w-0 text-muted-foreground group-hover:text-foreground">
                {input.label}
              </span>
              <span className="shrink-0 text-right">
                <span className="tp-eyebrow text-muted-foreground/70">{input.weightLabel}</span>
                <span className="ml-2 font-medium tabular-nums text-foreground">
                  {input.valueLabel}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {readiness.showGpaNullNote ? (
        <p className="mt-4 text-caption leading-snug text-muted-foreground">
          GPA is 15% of this number. A GPA you have not entered counts as zero rather than being
          excluded — a healthy plan can read low until you add it in Settings.
        </p>
      ) : null}

      <Provenance
        level="estimated"
        basis={readiness.focusSentence}
        className="mt-4"
      />
    </div>
  )
}

export function TodaySourcesLink() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <Link
        href="/sources"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-accent"
      >
        Where this information comes from
        <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      </Link>
      <p className="mt-2 text-caption leading-snug text-muted-foreground">
        Per-claim attribution lives on the rows above; this link opens our sources catalog.
      </p>
    </div>
  )
}

export function ScopeChip({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {label}
    </span>
  )
}

export function ExternalActionLink({
  href,
  label,
}: {
  href: string
  label: string
}) {
  const external = href.startsWith("http")
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-accent"
      >
        {label}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    )
  }
  return (
    <Link href={href} className="text-sm font-medium text-primary hover:text-accent">
      {label}
    </Link>
  )
}

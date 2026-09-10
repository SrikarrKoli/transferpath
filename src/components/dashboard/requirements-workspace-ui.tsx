"use client"

import NextLink from "next/link"
import { Meter } from "@/components/ui/progress"
import { StatusBadge, type PlanStatus } from "@/components/ui/status"
import { Provenance } from "@/components/ui/provenance"
import { DeadlineOfficialLink } from "@/components/dashboard/deadline-official-link"
import { cn } from "@/lib/utils"
import type {
  RequirementWorkspaceItem,
  RequirementsPlanningNote,
  RequirementsTimelineRow,
  RequirementsWorkspaceData,
} from "@/types/requirements-workspace"

export type RequirementsWorkspaceUiProps = {
  data: RequirementsWorkspaceData
  LinkComponent?: React.ComponentType<{
    href: string
    className?: string
    children: React.ReactNode
  }>
}

const ROW_CTA_CLASS =
  "rounded-md border border-border-strong px-3 py-1.5 text-caption font-medium transition-colors hover:bg-muted"

function FallbackLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

function requirementStatusToPlan(status: RequirementWorkspaceItem["status"]): PlanStatus {
  if (status === "done") return "done"
  if (status === "active") return "in_progress"
  return "not_started"
}

function RequirementRow({
  item,
  last,
  RowLink,
}: {
  item: RequirementWorkspaceItem
  last: boolean
  RowLink: NonNullable<RequirementsWorkspaceUiProps["LinkComponent"]>
}) {
  const cta =
    item.href && item.external ? (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={ROW_CTA_CLASS}
      >
        {item.ctaLabel ?? "View"}
      </a>
    ) : item.href ? (
      <RowLink href={item.href} className={ROW_CTA_CLASS}>
        {item.ctaLabel ?? "View"}
      </RowLink>
    ) : item.ctaLabel ? (
      <span className="rounded-md border border-border px-3 py-1.5 text-caption font-medium text-muted-foreground">
        {item.ctaLabel}
      </span>
    ) : null

  const subline = [item.code !== "—" ? item.code : null, item.equiv, item.credits ? `${item.credits} cr` : null]
    .filter(Boolean)
    .join(" · ")

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5",
        !last && "border-b border-border/70"
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <StatusBadge status={requirementStatusToPlan(item.status)} labelFrom="sm" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          {subline ? (
            <p className="mt-0.5 text-caption leading-snug text-muted-foreground">{subline}</p>
          ) : null}
          {item.provenanceBasis ? (
            <Provenance level="estimated" basis={item.provenanceBasis} className="mt-1.5" />
          ) : null}
        </div>
      </div>
      {cta ? <div className="shrink-0 pt-0.5">{cta}</div> : null}
    </div>
  )
}

function WorkspaceSectionHeader({
  title,
  meta,
  intro,
}: {
  title: string
  meta: string
  intro?: string
}) {
  return (
    <div className="mb-3 space-y-1">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-heading text-lg text-foreground">{title}</h2>
        <p className="shrink-0 tp-eyebrow text-muted-foreground">{meta}</p>
      </div>
      {intro ? <p className="max-w-2xl text-sm text-muted-foreground">{intro}</p> : null}
    </div>
  )
}

function deadlineSubline(row: RequirementsTimelineRow): string {
  const scopeLabel = row.scope === "statewide" ? "Texas-wide" : "Your target school"
  const parts = [row.dateLabel, scopeLabel]
  if (row.recommended) parts.push("Recommended")
  if (row.current) parts.push("Next up")
  return parts.join(" · ")
}

function PlanningNoteRow({
  note,
  last,
}: {
  note: RequirementsPlanningNote
  last: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5",
        !last && "border-b border-border/70"
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{note.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{note.body}</p>
      </div>
      {note.optionalUrl ? (
        <DeadlineOfficialLink href={note.optionalUrl} className={cn("shrink-0", ROW_CTA_CLASS)}>
          Learn more
        </DeadlineOfficialLink>
      ) : null}
    </div>
  )
}

function DeadlineRow({ row, last }: { row: RequirementsTimelineRow; last: boolean }) {
  return (
    <div
      className={cn(
        "relative flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5",
        !last && "border-b border-border/70",
        row.current && "bg-accent/5"
      )}
    >
      {row.current ? (
        <span
          className="absolute inset-y-2.5 left-0 w-[3px] rounded-r-full bg-accent"
          aria-hidden
        />
      ) : null}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{row.label}</p>
        <p className="mt-0.5 text-caption leading-snug text-muted-foreground">
          {deadlineSubline(row)}
        </p>
        {row.description ? (
          <Provenance level="estimated" basis={row.description} className="mt-1" />
        ) : null}
      </div>
      {row.officialUrl ? (
        <DeadlineOfficialLink href={row.officialUrl} className={cn("shrink-0", ROW_CTA_CLASS)}>
          Official page
        </DeadlineOfficialLink>
      ) : null}
    </div>
  )
}

export function RequirementsWorkspaceUi({
  data,
  LinkComponent,
}: RequirementsWorkspaceUiProps) {
  const RowLink = LinkComponent ?? FallbackLink

  const all = data.categories.flatMap((c) => c.items)
  const total = all.length || 1
  const done = all.filter((i) => i.status === "done").length
  const pct = Math.round((done / total) * 100)
  const h = data.header

  return (
    <div className="mx-auto max-w-6xl space-y-8 tp-stagger-children">
      <header className="space-y-3">
        <p className="tp-eyebrow text-accent">{h.eyebrow ?? "Requirements"}</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          {h.title}
          {h.titleItalic ? <> {h.titleItalic}</> : null}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{h.subtitle}</p>
        <div className="flex max-w-md flex-col gap-2 pt-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {done} of {total} complete
            </span>
            <span className="tabular-nums text-foreground">{pct}%</span>
          </div>
          <Meter
            value={pct}
            label={`Requirements completion: ${pct} percent`}
            size="sm"
            className="w-full"
          />
        </div>
      </header>

      <div className="space-y-8">
        {data.categories.map((cat) => {
          const catDone = cat.items.filter((i) => i.status === "done").length
          return (
            <section key={cat.id}>
              <WorkspaceSectionHeader
                title={cat.name}
                meta={`${catDone} of ${cat.items.length} complete`}
              />
              <div
                className="overflow-hidden rounded-lg border border-border bg-card"
                data-req-category={cat.id}
              >
                {cat.items.map((item, i) => (
                  <div key={item.id} data-req-status={item.status}>
                    <RequirementRow
                      item={item}
                      last={i === cat.items.length - 1}
                      RowLink={RowLink}
                    />
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <section>
        <WorkspaceSectionHeader
          title="Planning notes"
          meta={`${data.planningNotes.length} ${data.planningNotes.length === 1 ? "note" : "notes"}`}
          intro={data.planningNotesIntro}
        />
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {data.planningNotes.length === 0 ? (
            <p className="px-4 py-3.5 text-sm text-muted-foreground sm:px-5">
              No planning notes for this view.
            </p>
          ) : (
            data.planningNotes.map((note, i) => (
              <PlanningNoteRow
                key={note.id}
                note={note}
                last={i === data.planningNotes.length - 1}
              />
            ))
          )}
        </div>
      </section>

      <section>
        <WorkspaceSectionHeader
          title="Related deadlines"
          meta={`${data.timelineRows.length} ${data.timelineRows.length === 1 ? "date" : "dates"}`}
          intro="Dates that sit next to these requirements. Manage tasks and missing dates on Tasks & deadlines."
        />
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {data.timelineRows.length === 0 ? (
            <p className="px-4 py-3.5 text-sm text-muted-foreground sm:px-5">
              No upcoming deadlines in the next 24 months for this view.
            </p>
          ) : (
            data.timelineRows.map((row, i) => (
              <DeadlineRow
                key={row.id}
                row={row}
                last={i === data.timelineRows.length - 1}
              />
            ))
          )}
        </div>
        <p className="mt-3 text-sm">
          <NextLink
            href="/dashboard/deadlines"
            className="font-medium text-primary hover:text-accent"
          >
            Open Tasks & deadlines
          </NextLink>
        </p>
      </section>
    </div>
  )
}

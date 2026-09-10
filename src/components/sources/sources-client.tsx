"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ExternalLink, Search } from "lucide-react"
import { Provenance } from "@/components/ui/provenance"
import { cn } from "@/lib/utils"
import { PRODUCT_NAME } from "@/lib/brand"
import type { SourcesData, SourcesInstitutionRow } from "@/types/sources"

type SourcesClientProps = {
  data: SourcesData
}

function formatCheckedAt(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d)
}

function lastCheckedLabel(iso: string | null): string {
  if (!iso) return "Not yet checked"
  return formatCheckedAt(iso) ?? "Not yet checked"
}

function dateCountLabel(count: number): string {
  if (count === 0) return "No dates held"
  return `${count} date${count === 1 ? "" : "s"}`
}

function OfficialPageLink({
  url,
  label,
  className,
}: {
  url: string | null
  label: string | null
  className?: string
}) {
  if (!url || !label) {
    return <span className={cn("text-caption text-muted-foreground", className)}>—</span>
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-caption text-primary underline decoration-border-strong underline-offset-2 hover:text-foreground",
        className
      )}
    >
      {label}
      <ExternalLink aria-hidden className="size-3 shrink-0" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

function InstitutionRow({
  row,
  first,
}: {
  row: SourcesInstitutionRow
  first?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between",
        !first && "border-t border-border"
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{row.name}</p>
        <p className="mt-0.5 text-caption text-muted-foreground">
          {dateCountLabel(row.dateCount)} · last checked:{" "}
          {lastCheckedLabel(row.lastCheckedAt).toLowerCase()}
        </p>
      </div>
      <OfficialPageLink
        url={row.officialPageUrl}
        label={row.officialPageLabel}
        className="shrink-0 sm:text-right"
      />
    </div>
  )
}

export function SourcesClient({ data }: SourcesClientProps) {
  const [query, setQuery] = useState("")
  const [onlyWithDates, setOnlyWithDates] = useState(false)

  const sortedInstitutions = useMemo(() => {
    const covered = data.institutions
      .filter((row) => row.hasDates)
      .sort((a, b) => a.name.localeCompare(b.name))
    const uncovered = data.institutions
      .filter((row) => !row.hasDates)
      .sort((a, b) => a.name.localeCompare(b.name))
    return [...covered, ...uncovered]
  }, [data.institutions])

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return sortedInstitutions.filter((row) => {
      if (onlyWithDates && !row.hasDates) return false
      if (!normalized) return true
      return row.name.toLowerCase().includes(normalized)
    })
  }, [onlyWithDates, query, sortedInstitutions])

  if (data.loadError) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-foreground">{data.loadError}</p>
        <Link
          href="/sources"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Try again
        </Link>
      </div>
    )
  }

  const openingSecondSentence = data.anyDatesConfirmed
    ? `${data.confirmedDateCount} of the ${data.totalHeldDates} dates we hold ${data.confirmedDateCount === 1 ? "has" : "have"} been confirmed against an official page. The rest are listed below with their current status.`
    : "None of the dates we hold has been confirmed against an official page yet, so every \"last checked\" below is empty. We check these by hand, one institution at a time, and this page changes as that work happens."

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <p className="font-heading text-lg font-semibold leading-snug text-foreground sm:text-xl">
          We have transfer deadline data for {data.coveredSchools} of the{" "}
          {data.totalSchools} four-year schools in {PRODUCT_NAME}. For the other{" "}
          {data.uncoveredSchools}, we do not.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {openingSecondSentence}
        </p>
        {data.statewide ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We also hold {data.statewide.dateCount} statewide date
            {data.statewide.dateCount === 1 ? "" : "s"} (ApplyTexas and FAFSA / TASFA) that apply
            across Texas — listed separately below.
          </p>
        ) : null}
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-8">
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="tp-eyebrow text-muted-foreground">Coverage by institution</p>
                <p className="mt-1 text-caption text-muted-foreground">
                  {data.coveredSchools} with dates · {data.uncoveredSchools} without
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <label className="relative min-w-[12rem] flex-1">
                <span className="sr-only">Search schools</span>
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search schools"
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </label>
              <button
                type="button"
                onClick={() => setOnlyWithDates((current) => !current)}
                aria-pressed={onlyWithDates}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3 text-xs font-medium transition-colors",
                  onlyWithDates
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                Show only schools with dates
              </button>
            </div>

            <div className="mt-2">
              {filteredRows.map((row, index) => (
                <InstitutionRow key={row.id} row={row} first={index === 0} />
              ))}

              {data.statewide &&
              !onlyWithDates &&
              (!query.trim() ||
                data.statewide.label.toLowerCase().includes(query.trim().toLowerCase())) ? (
                <div className="border-t border-border py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{data.statewide.label}</p>
                      <p className="mt-0.5 text-caption text-muted-foreground">
                        {dateCountLabel(data.statewide.dateCount)} · last checked:{" "}
                        {lastCheckedLabel(data.statewide.lastCheckedAt).toLowerCase()}
                      </p>
                    </div>
                    <OfficialPageLink
                      url={data.statewide.officialPageUrl}
                      label={data.statewide.officialPageLabel}
                      className="shrink-0 sm:text-right"
                    />
                  </div>
                </div>
              ) : null}

              {filteredRows.length === 0 &&
              !(data.statewide && !onlyWithDates && query.trim()) ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No schools match your search.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <p className="tp-eyebrow text-muted-foreground">Three kinds of date</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Confirmed against an official page
                </p>
                <p className="mt-0.5 text-caption text-muted-foreground">
                  We visited the institution&apos;s own page and recorded when. In the database,
                  these rows carry <span className="font-mono text-[11px]">source_kind = official</span>{" "}
                  and appear in the app as verified.
                </p>
                <Provenance
                  level="verified"
                  source="Official source"
                  checkedAt={null}
                  className="mt-2"
                />
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground">
                  Entered by hand, not yet confirmed
                </p>
                <p className="mt-0.5 text-caption text-muted-foreground">
                  Recorded from a plausible source without a check against the institution. These
                  rows carry <span className="font-mono text-[11px]">source_kind = manual</span>.
                </p>
                <Provenance
                  level="estimated"
                  basis="Manual entry — not yet confirmed on the institution's site."
                  className="mt-2"
                />
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground">Illustrative planning data</p>
                <p className="mt-0.5 text-caption text-muted-foreground">
                  Seeded so the planner has something to show. These rows carry{" "}
                  <span className="font-mono text-[11px]">source_kind = illustrative</span> and are
                  treated as missing until checked.
                </p>
                <Provenance
                  level="missing"
                  what="Illustrative date — not confirmed yet."
                  className="mt-2"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <p className="tp-eyebrow text-muted-foreground">Statewide versus school-specific</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              ApplyTexas opening dates and the FAFSA / TASFA priority date apply across Texas. A
              priority or regular transfer deadline belongs to one institution and one intake term.
            </p>
            <p className="mt-3 text-caption leading-snug text-muted-foreground">
              Every deadline row in the application carries a chip saying which it is.
            </p>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <p className="tp-eyebrow text-muted-foreground">Coverage at a glance</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="font-heading text-3xl leading-none text-foreground">
                  {data.coveredSchools}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  of {data.totalSchools} four-year schools have any dates
                </p>
              </div>
              <div>
                <p className="font-heading text-3xl leading-none text-foreground">
                  {data.confirmedDateCount}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  date{data.confirmedDateCount === 1 ? "" : "s"} confirmed against an official page
                </p>
              </div>
            </div>
            <Provenance
              level="estimated"
              basis="Counted from the deadlines and universities tables when this page loads, never from a constant."
              className="mt-4"
            />
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <p className="tp-eyebrow text-muted-foreground">Corrections</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Found a date that is wrong or out of range? Tell us which school and where you saw the
              correct one.
            </p>
            <p className="mt-3 text-caption leading-snug text-muted-foreground">
              {PRODUCT_NAME} is independent, open source, and solo-built. The data and the code live
              in the repository.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <p className="tp-eyebrow text-muted-foreground">Before you act on a date</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              Confirm every date with the institution before you act on it. {PRODUCT_NAME} provides
              planning information — your destination institution makes the final decision.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}

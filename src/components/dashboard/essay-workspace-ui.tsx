"use client"

import { useMemo, type ReactNode } from "react"
import { Meter } from "@/components/ui/progress"
import { Provenance } from "@/components/ui/provenance"
import { cn } from "@/lib/utils"

export interface EssayMeta {
  title: string
  subtitle?: string
  tagline?: string
  prompt: string
  wordLimit: number
  /** True when the limit is our 650-word default rather than one the student entered. */
  wordLimitIsDefault?: boolean
  autosaveLabel?: string
  eyebrow?: string
}

export interface ReferenceCard {
  eyebrow: string
  body: string
  ctaLabel: string
  onCtaClick?: () => void
}

export interface EssayWorkspaceUiProps {
  essay: EssayMeta
  value: string
  onChange: (next: string) => void
  coachNotes?: string[]
  coachTitle?: string
  strengthSignals?: string[]
  strengthsTitle?: string
  reference?: ReferenceCard
  onPreview?: () => void
  onSave?: () => void
  previewLabel?: string
  saveLabel?: string
  saving?: boolean
  settingsSlot?: ReactNode
  previewIcon?: ReactNode
  saveIcon?: ReactNode
  sparklesIcon?: ReactNode
  wandIcon?: ReactNode
  className?: string
}

export function EssayWorkspaceUi({
  essay,
  value,
  onChange,
  coachNotes = [],
  coachTitle = "Three notes on this draft",
  strengthSignals = [],
  strengthsTitle = "What this draft currently does",
  reference,
  onPreview,
  onSave,
  previewLabel = "Preview",
  saveLabel = "Save draft",
  saving = false,
  settingsSlot,
  previewIcon,
  saveIcon,
  sparklesIcon,
  wandIcon,
  className,
}: EssayWorkspaceUiProps) {
  const wordCount = useMemo(
    () => value.trim().split(/\s+/).filter(Boolean).length,
    [value]
  )
  const pct = Math.min(100, Math.round((wordCount / Math.max(1, essay.wordLimit)) * 100))
  const overLimit = wordCount > essay.wordLimit

  return (
    <div className={cn("mx-auto max-w-7xl space-y-8 animate-fade-in tp-stagger-children", className)}>
      <header className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="tp-eyebrow text-accent">
            {essay.eyebrow ?? "Essay workspace"}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {essay.title}
            {essay.subtitle ? (
              <span className="font-normal text-muted-foreground"> — {essay.subtitle}</span>
            ) : null}
          </h1>
          {essay.tagline ? (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-body">
              {essay.tagline}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex items-center gap-2 rounded-sm border border-border-strong bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            {previewIcon}
            {previewLabel}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
          >
            {saveIcon}
            {saving ? "Saving…" : saveLabel}
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 lg:col-span-8">
          <div className="absolute left-0 right-0 top-0 h-1 bg-accent" aria-hidden />

          <div className="border-b border-border px-6 pt-8 pb-6 sm:px-10 sm:pt-10">
            <p className="tp-eyebrow text-muted-foreground">
              Prompt
            </p>
            <p className="mt-2 text-base leading-relaxed text-foreground/85">
              {essay.prompt}
            </p>
            {settingsSlot ? <div className="mt-5">{settingsSlot}</div> : null}
          </div>

          <div className="px-6 py-6 sm:px-10 sm:py-8">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-[440px] w-full resize-y border-0 bg-transparent font-heading text-xl leading-[1.7] text-foreground outline-none placeholder:text-muted-foreground/40 focus:ring-0"
              placeholder="Start writing your draft here…"
              aria-label="Essay draft"
            />
          </div>

          <div className="flex flex-col gap-4 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <div className="flex items-center gap-6">
              <div>
                <p className="tp-eyebrow text-muted-foreground">
                  Word count
                </p>
                <p
                  className={cn(
                    "font-mono text-sm font-medium",
                    overLimit && "text-destructive"
                  )}
                >
                  {wordCount}{" "}
                  <span className="text-muted-foreground">/ {essay.wordLimit}</span>
                </p>
                {essay.wordLimitIsDefault ? (
                  <Provenance
                    level="estimated"
                    basis="Typical limit — confirm your school's prompt"
                    className="mt-1"
                  />
                ) : null}
              </div>
              <div className="h-8 w-32">
                <Meter
                  value={pct}
                  label={`Word count: ${wordCount} of ${essay.wordLimit}`}
                  tone={overLimit || pct > 95 ? "accent" : "success"}
                  className="mt-3"
                />
              </div>
            </div>
            {essay.autosaveLabel ? (
              <p className="tp-eyebrow text-muted-foreground">
                {essay.autosaveLabel}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4 lg:col-span-4">
          {coachNotes.length > 0 ? (
            <CoachPanel
              icon={sparklesIcon}
              label="Coach"
              title={coachTitle}
              items={coachNotes}
            />
          ) : null}
          {strengthSignals.length > 0 ? (
            <CoachPanel
              icon={wandIcon}
              label="Strength signals"
              title={strengthsTitle}
              items={strengthSignals}
            />
          ) : null}
          {reference ? (
            <div className="rounded-xl border border-border border-l-4 border-l-accent bg-card p-6">
              <p className="tp-eyebrow text-muted-foreground">
                {reference.eyebrow}
              </p>
              <p className="mt-3 text-base leading-relaxed text-foreground/90">
                {reference.body}
              </p>
              <button
                type="button"
                onClick={reference.onCtaClick}
                className="mt-5 w-full rounded-md border border-border-strong py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                {reference.ctaLabel}
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function CoachPanel({
  icon,
  label,
  title,
  items,
}: {
  icon?: ReactNode
  label: string
  title: string
  items: string[]
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 tp-interactive-panel">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-accent">
        {icon}
        <span className="tp-eyebrow">{label}</span>
      </div>
      <p className="mb-3 font-heading text-lg leading-snug text-foreground">{title}</p>
      <ul className="space-y-2.5">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

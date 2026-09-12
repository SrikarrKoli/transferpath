"use client"

import { useMemo, type ReactNode } from "react"
import { Meter } from "@/components/ui/progress"
import { Provenance } from "@/components/ui/provenance"
import { cn } from "@/lib/utils"
import { useHall } from "@/components/campus-ui/hall-context"

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
  const hall = useHall()

  if (hall) {
    return (
      <div className={className}>
        <p className="hall-prompt">{essay.prompt}</p>
        {settingsSlot ? <div className="mt-4">{settingsSlot}</div> : null}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="hall-draft"
          placeholder="Draft here."
          aria-label="Essay draft"
        />
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <p>
            <span className={cn("hall-count", overLimit && "hall-urgent")}>{wordCount}</span>
            <span className="ml-2 text-[color:var(--hall-stone)]">/ {essay.wordLimit}</span>
          </p>
          <div className="flex gap-4">
            {onPreview ? (
              <button type="button" onClick={onPreview} className="hall-ledger-link">
                {previewLabel}
              </button>
            ) : null}
            {onSave ? (
              <button type="button" onClick={onSave} disabled={saving} className="hall-ledger-link">
                {saving ? "Saving…" : saveLabel}
              </button>
            ) : null}
          </div>
        </div>
        {coachNotes.length > 0 || strengthSignals.length > 0 ? (
          <div className="mt-10 grid gap-10 sm:grid-cols-2">
            {coachNotes.length > 0 ? (
              <ul className="hall-margin space-y-2">
                {coachNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
            {strengthSignals.length > 0 ? (
              <ul className="hall-margin space-y-2">
                {strengthSignals.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className={cn("essay-workspace mx-auto max-w-7xl animate-fade-in tp-stagger-children", className)}>
      <header className="essay-workspace-header">
        <div>
          <p className="tp-eyebrow text-accent">
            {essay.eyebrow ?? "Essay workspace"}
          </p>
          <h1 className="essay-workspace-title">
            {essay.title}
            {essay.subtitle ? (
              <span className="font-normal text-muted-foreground"> — {essay.subtitle}</span>
            ) : null}
          </h1>
          {essay.tagline ? (
            <p className="essay-workspace-deck">
              {essay.tagline}
            </p>
          ) : null}
        </div>
        <div className="essay-workspace-actions">
          <button
            type="button"
            onClick={onPreview}
            className="essay-action essay-action-secondary"
          >
            {previewIcon}
            {previewLabel}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="essay-action essay-action-primary"
          >
            {saveIcon}
            {saving ? "Saving…" : saveLabel}
          </button>
        </div>
      </header>

      <div className="essay-desk-layout">
        <div className="essay-paper">
          <div className="essay-prompt-block">
            <p className="tp-eyebrow text-muted-foreground">
              Prompt
            </p>
            <p className="mt-2 text-base leading-relaxed text-foreground/85">
              {essay.prompt}
            </p>
            {settingsSlot ? <div className="essay-prompt-settings">{settingsSlot}</div> : null}
          </div>

          <div className="essay-writing-spread">
            <div className="essay-writing-field">
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="essay-textarea"
                placeholder="Start writing your draft here…"
                aria-label="Essay draft"
              />
            </div>

            <aside className="essay-margin-notes" aria-label="Manuscript marginalia">
              {coachNotes.length > 0 ? (
                <CoachPanel
                  icon={sparklesIcon}
                  label="Coach marginalia"
                  title={coachTitle}
                  items={coachNotes}
                />
              ) : null}
              {strengthSignals.length > 0 ? (
                <CoachPanel
                  icon={wandIcon}
                  label="Strength marks"
                  title={strengthsTitle}
                  items={strengthSignals}
                />
              ) : null}
              {reference ? (
                <div className="essay-reference-note">
                  <p className="tp-eyebrow text-muted-foreground">
                    {reference.eyebrow}
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-foreground/90">
                    {reference.body}
                  </p>
                  <button
                    type="button"
                    onClick={reference.onCtaClick}
                    className="essay-reference-link"
                  >
                    {reference.ctaLabel}
                  </button>
                </div>
              ) : null}
            </aside>
          </div>

          <div className="essay-paper-footer">
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
    <div className="essay-coach-note tp-interactive-panel">
      <div className="essay-note-label">
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

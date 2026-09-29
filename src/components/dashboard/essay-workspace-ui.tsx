"use client"

import { useMemo, useRef, type ReactNode } from "react"
import Link from "next/link"
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
  coachCaption?: string
  coachPassages?: string[]
  coachTitle?: string
  strengthSignals?: string[]
  strengthsTitle?: string
  reference?: ReferenceCard
  onPreview?: () => void
  onSave?: () => void
  checklistHref?: string
  previewLabel?: string
  saveLabel?: string
  dirty?: boolean
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
  coachPassages = [],
  strengthSignals = [],
  strengthsTitle = "What this draft currently does",
  reference,
  onPreview,
  onSave,
  checklistHref = "/dashboard/checklist",
  previewLabel = "Preview",
  saveLabel = "Save draft",
  dirty = false,
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
  const draftRef = useRef<HTMLTextAreaElement>(null)
  function focusDraft() {
    draftRef.current?.scrollIntoView({ block: "center" })
    draftRef.current?.focus({ preventScroll: true })
  }

  if (hall) {
    const empty = wordCount === 0
    const savePrimary = dirty && !!onSave
    const wordStatus = `${wordCount} / ${essay.wordLimit} words`
    function reviseDraft() {
      focusDraft()
      const passage = coachPassages[0]
      const start = passage ? value.indexOf(passage) : -1
      if (start >= 0) draftRef.current?.setSelectionRange(start, start + passage.length)
    }

    return (
      <div className={className}>
        <section className="union-next-block" aria-labelledby="essay-next-heading">
          <h2 id="essay-next-heading" className="hall-hero-title">{essay.title}</h2>
          {!empty && coachNotes.length > 0 ? (
            <div className="library-hero-deck">
              <span className="library-coach-priority">Revise first</span>
              <p>{coachNotes[0]}</p>
            </div>
          ) : null}
          <div className="union-step-actions mt-6">
            <button
              type="button"
              onClick={savePrimary ? onSave : empty ? focusDraft : reviseDraft}
              disabled={savePrimary && saving}
              className="union-primary-cta"
            >
              {savePrimary ? saving ? "Saving…" : saveLabel : empty ? "Start drafting" : `Revise ${essay.title}`}
            </button>
            <span role="status" className="library-save-status">{saving ? "Saving…" : dirty ? "Unsaved" : wordStatus}</span>
            {onPreview ? (
              <button type="button" onClick={onPreview} className="hall-ledger-link">
                {previewLabel}
              </button>
            ) : null}

          </div>
        </section>

        <p className="hall-prompt mt-8">{essay.prompt}</p>
        {settingsSlot ? <div className="mt-4">{settingsSlot}</div> : null}
        <div className="library-working-band mt-5">
          <div className="library-writing-field">
            <label className="hall-caption" htmlFor="library-essay-draft">Your draft · write here</label>
            <textarea
              id="library-essay-draft"
              ref={draftRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="hall-draft"
              placeholder="Start with one concrete sentence…"
              aria-label="Essay draft"
            />
            <div className="library-draft-closure">
              <p className={cn("library-word-count", overLimit && "hall-urgent")}>
                {wordStatus}{overLimit ? " · Over limit" : ""}
              </p>
              <Link href={checklistHref} className="hall-ledger-link">Open Checklist</Link>
            </div>
          </div>
          {coachNotes.length > 0 || strengthSignals.length > 0 ? (
            <aside className="hall-margin library-coach" aria-label="Draft coaching">
              {coachNotes.length > 0 ? (
                <section>
                  <h3 className="hall-caption">Coach notes</h3>
                  <ul>{coachNotes.map((note, index) => {
                    const passage = coachPassages[index]
                    const start = passage ? value.indexOf(passage) : -1
                    return <li key={note} className={index === 0 ? "library-coach-lead" : "library-coach-secondary"}>
                      {index === 0 ? <span className="library-coach-priority">Revise first</span> : null}
                      {note}
                      {start >= 0 ? <button type="button" className="library-passage-link" onClick={() => {
                        focusDraft()
                        draftRef.current?.setSelectionRange(start, start + passage.length)
                      }} aria-label={`Select passage: ${passage}`}>“{passage}”</button> : null}
                    </li>
                  })}</ul>
                </section>
              ) : null}
              {strengthSignals.length > 0 ? (
                <section>
                  <h3 className="hall-caption">Strengths</h3>
                  <ul>{strengthSignals.map((note) => <li key={note}>{note}</li>)}</ul>
                </section>
              ) : null}
            </aside>
          ) : null}
        </div>
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

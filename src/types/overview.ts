import type { CompletenessLadderState } from "@/lib/completeness-ladder"
import type { ProvenanceProps } from "@/components/ui/provenance"

export type TodayComingUpItem = {
  dateLabel: string
  title: string
  meta: string
  scopeChip?: string
  href: string
  actionLabel: string
  provenance?: ProvenanceProps
  /** When set, Today can mark this checklist task complete in place. */
  taskKey?: string
}

export type TodayNextAction = {
  title: string
  dateLabel: string | null
  scopeChips: string[]
  dueDetail: string | null
  primaryHref: string
  primaryLabel: string
  /** True when primaryHref is an absolute http(s) URL. */
  primaryExternal?: boolean
  secondaryHref?: string
  secondaryLabel?: string
  provenance: ProvenanceProps
  /** When set, Today shows Mark as done for this checklist task. */
  taskKey?: string
}

export type TodayReadinessInput = {
  label: string
  weightLabel: string
  valueLabel: string
  href: string
}

export type TodayThisTerm = {
  termLabel: string
  dateRange: string
  summary: string
  previewTitle: string | null
  previewMeta: string | null
}

export type TodayNeedsDate = {
  headline: string
  provenance: { what: string; instead?: string }
  officialUrl: string | null
  recordHref: string
}

export interface OverviewData {
  completenessLadderState: CompletenessLadderState
  dateLine: string
  pathway: {
    fromInstitution: string
    toInstitution: string
    program: string
    term: string
  }
  pathwayPrompt: {
    title: string
    body: string
    settingsHref: string
  } | null
  nextAction: TodayNextAction | null
  comingUp: TodayComingUpItem[]
  thisTerm: TodayThisTerm | null
  needsDate: TodayNeedsDate | null
  readiness: {
    score: number
    oneLiner: string
    inputs: TodayReadinessInput[]
    focusSentence: string
    showGpaNullNote: boolean
  } | null
}

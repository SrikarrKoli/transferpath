export type RequirementRowStatus = "done" | "active" | "missing"

export type RequirementWorkspaceItem = {
  id: string
  code: string
  title: string
  credits: number
  equiv: string
  status: RequirementRowStatus
  ctaLabel?: string
  href?: string
  external?: boolean
  /** Per-claim evidence line; shown under the row meta when present. */
  provenanceBasis?: string
}

export type RequirementWorkspaceCategory = {
  id: string
  name: string
  items: RequirementWorkspaceItem[]
}

export type RequirementsWorkspaceHeader = {
  eyebrow?: string
  title: string
  titleItalic: string
  subtitle: string
  fromInstitution: string
  toInstitution: string
  program: string
  term: string
}

export type RequirementsPlanningNote = {
  id: string
  title: string
  body: string
  optionalUrl: string | null
}

export type RequirementsTimelineRow = {
  id: string
  dateLabel: string
  label: string
  scope: string
  /** Per-row planning provenance from `deadlines.description`; null when absent. */
  description: string | null
  officialUrl: string | null
  passed: boolean
  current: boolean
  recommended: boolean
}

export type RequirementsWorkspaceData = {
  header: RequirementsWorkspaceHeader
  categories: RequirementWorkspaceCategory[]
  planningNotes: RequirementsPlanningNote[]
  planningNotesIntro: string
  timelineRows: RequirementsTimelineRow[]
}

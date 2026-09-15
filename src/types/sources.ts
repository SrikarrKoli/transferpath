export type SourcesInstitutionRow = {
  id: string
  name: string
  dateCount: number
  lastCheckedAt: string | null
  officialPageUrl: string | null
  officialPageLabel: string | null
  hasDates: boolean
}

export type SourcesStatewideRow = {
  label: string
  dateCount: number
  lastCheckedAt: string | null
  officialPageUrl: string | null
  officialPageLabel: string | null
}

export type SourcesData = {
  totalSchools: number
  coveredSchools: number
  uncoveredSchools: number
  confirmedDateCount: number
  totalHeldDates: number
  anyDatesConfirmed: boolean
  institutions: SourcesInstitutionRow[]
  statewide: SourcesStatewideRow | null
  loadError: string | null
}

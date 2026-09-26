import type { ReactNode } from "react"

export type ChecklistWorkspaceTask = {
  id: string
  title: string
  dueLabel?: string
  dueContext?: string
  countdownLabel?: string
  meta?: string
  hint?: string
  done?: boolean
  urgent?: boolean
  link?: { label: string; href: string }
}

export type ChecklistWorkspaceCategory = {
  id: string
  label: string
  icon?: ReactNode
  tasks: ChecklistWorkspaceTask[]
}

export type ChecklistWorkspaceHeader = {
  eyebrow?: string
  title: string
  fromInstitution: string
  toInstitution: string
  program: string
  term: string
  lastUpdatedLabel?: string
  readinessMessage?: string
}

export type ChecklistWorkspaceData = {
  header: ChecklistWorkspaceHeader
  categories: ChecklistWorkspaceCategory[]
}

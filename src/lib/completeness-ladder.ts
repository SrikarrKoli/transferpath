/** Phase 2 / Phase 5 completeness ladder — gates readiness and empty states. */

export type CompletenessLadderState = "A" | "B" | "C" | "D"

export type CompletenessLadderInput = {
  hasTargetSchool: boolean
  hasExpectedTransferTerm: boolean
  courseCount: number
  /** Nearest relevant deadline in days; omit when unknown or not applicable. */
  nearestDeadlineDaysUntil?: number | null
  /** Days before a deadline counts as its action window (Phase 2 state D). */
  deadlineActionWindowDays?: number
}

const DEFAULT_DEADLINE_ACTION_WINDOW_DAYS = 90

export function getCompletenessLadderState(
  input: CompletenessLadderInput
): CompletenessLadderState {
  if (!input.hasTargetSchool || !input.hasExpectedTransferTerm) return "A"
  if (input.courseCount < 1) return "B"

  const windowDays = input.deadlineActionWindowDays ?? DEFAULT_DEADLINE_ACTION_WINDOW_DAYS
  const daysUntil = input.nearestDeadlineDaysUntil
  if (daysUntil != null && daysUntil >= 0 && daysUntil <= windowDays) {
    return "D"
  }

  return "C"
}

/** Readiness score may render only from ladder state C upward. */
export function shouldShowReadinessScore(state: CompletenessLadderState): boolean {
  return state === "C" || state === "D"
}

export function hasPathwayComplete(input: Pick<CompletenessLadderInput, "hasTargetSchool" | "hasExpectedTransferTerm">): boolean {
  return input.hasTargetSchool && input.hasExpectedTransferTerm
}

export function ladderStateLabel(state: CompletenessLadderState): string {
  switch (state) {
    case "A":
      return "No pathway"
    case "B":
      return "Pathway set, no courses"
    case "C":
      return "Courses entered"
    case "D":
      return "Deadline pressure"
  }
}

function institutionColumnLabel(name: string, role: "Current" | "Target") {
  const full = name.trim().replace(/\s+/g, " ")
  const known: [RegExp, string][] = [
    [/^(?:Austin Community College(?: District)?|ACC)$/i, "ACC"],
    [/^(?:(?:The )?University of Texas at Austin|UT Austin)$/i, "UT Austin"],
    [/^Texas A&M(?: University)?(?:[ ,–—-]+College Station)?$/i, "Texas A&M"],
    [/^(?:(?:The )?University of Houston|UH)$/i, "UH"],
    [/^Texas State(?: University)?$/i, "Texas State"],
    [/^(?:Texas Tech(?: University)?|TTU)$/i, "Texas Tech"],
    [/^(?:University of North Texas|UNT)$/i, "UNT"],
  ]
  return known.find(([pattern]) => pattern.test(full))?.[1]
    ?? (full.replace(/\bCommunity College\b/gi, "CC") || role)
}

export function institutionColumnLabels(from: string, to: string) {
  const currentLabel = institutionColumnLabel(from, "Current")
  const targetLabel = institutionColumnLabel(to, "Target")
  if (currentLabel.toLowerCase() === targetLabel.toLowerCase()) {
    return { currentLabel: `${currentLabel} · Current`, targetLabel: `${targetLabel} · Target` }
  }
  return { currentLabel, targetLabel }
}

/** Path line for a hall masthead — school to school, not marketing copy. */
export function hallKicker(input: {
  from?: string | null
  to?: string | null
  program?: string | null
  term?: string | null
}): string | undefined {
  const route = [input.from?.trim(), input.to?.trim()].filter(Boolean).join(" → ")
  const line = [route || null, input.program?.trim() || null, input.term?.trim() || null]
    .filter(Boolean)
    .join(" · ")
  return line || undefined
}

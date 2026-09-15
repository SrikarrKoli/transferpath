/** Split a ledger date like "1 Nov 2026" into the mid-scale day/month and the year. */
export function splitHallDate(label: string): { primary: string; year: string } {
  const parts = label.trim().split(/\s+/)
  if (parts.length >= 3 && /^\d{4}$/.test(parts[parts.length - 1] ?? "")) {
    return {
      primary: parts.slice(0, -1).join(" "),
      year: parts[parts.length - 1] ?? "",
    }
  }
  return { primary: label, year: "" }
}

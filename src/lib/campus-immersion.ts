import { CAMPUS_BUILDINGS, type BuildingId } from "@/components/landing/campus/campus-data"

/** Canonical hall for a dashboard/onboarding pathname. */
export function buildingIdForPath(pathname: string): BuildingId | null {
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) return "counselor"
  if (pathname === "/dashboard") return "union"
  if (pathname.startsWith("/dashboard/deadlines")) return "quad"
  if (pathname.startsWith("/dashboard/checklist")) return "dorm"
  if (pathname.startsWith("/dashboard/essay")) return "library"
  if (pathname.startsWith("/dashboard/plan") || pathname.startsWith("/dashboard/timeline")) {
    return "classroom"
  }
  if (pathname.startsWith("/dashboard/requirements")) return "registrar"
  if (pathname.startsWith("/dashboard/competitiveness")) return "gym"
  if (pathname.startsWith("/dashboard/settings")) return "counselor"
  return null
}

export function campusBuilding(id: BuildingId) {
  const row = CAMPUS_BUILDINGS.find((b) => b.id === id)
  if (!row) throw new Error(`Unknown campus building: ${id}`)
  return row
}

/** Safe post-login return path so entering a hall survives the auth gate. */
export function safeCampusReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  const path = raw.trim()
  if (!path.startsWith("/")) return null
  if (path.startsWith("//") || path.includes("://")) return null
  const bare = path.split("?")[0]?.split("#")[0] ?? ""
  if (bare === "/onboarding" || bare.startsWith("/onboarding/")) return bare
  if (bare === "/dashboard" || bare.startsWith("/dashboard/")) return bare
  return null
}

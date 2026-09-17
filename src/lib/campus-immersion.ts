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
  if (bare === "/dashboard" || bare.startsWith("/dashboard/")) {
    // Keep a simple ?tab= deep link (e.g. password recovery → Account & security).
    const qIdx = path.indexOf("?")
    if (qIdx >= 0) {
      const query = path.slice(qIdx + 1).split("#")[0] ?? ""
      const tab = new URLSearchParams(query).get("tab")
      if (tab && /^[a-z_]+$/.test(tab)) return `${bare}?tab=${tab}`
    }
    return bare
  }
  return null
}

/** Guest-safe enter URL: locked halls go through Counselor setup, not a cold login wall. */
export function campusEnterHref(
  building: { id: BuildingId; href: string },
  session: "guest" | "member" | "loading"
): string {
  if (session === "member") return building.href
  if (building.href.startsWith("/onboarding")) return building.href
  if (building.href.startsWith("/dashboard")) {
    const params = new URLSearchParams()
    params.set("intent", building.id)
    params.set("next", building.href)
    return `/onboarding?${params.toString()}`
  }
  return building.href
}

/** Plain hall name for login / onboarding copy when ?next= or ?intent= is present. */
export function hallNameForPath(pathname: string | null | undefined): string | null {
  if (!pathname) return null
  const id = buildingIdForPath(pathname)
  if (!id) return null
  try {
    return campusBuilding(id).name
  } catch {
    return null
  }
}

export function hallNameForIntent(intent: string | null | undefined): string | null {
  if (!intent) return null
  try {
    return campusBuilding(intent as BuildingId).name
  } catch {
    return null
  }
}

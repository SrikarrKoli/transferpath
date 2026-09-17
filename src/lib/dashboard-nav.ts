/** Dashboard route labels for chrome / breadcrumbs (no demo copy). */

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Student Union · Today",
  "/dashboard/plan": "Classroom · Plan",
  "/dashboard/deadlines": "Clock Tower · Deadlines",
  "/dashboard/requirements": "Registrar · Requirements",
  "/dashboard/essay": "Library · Essays",
  "/dashboard/settings": "Counselor · Settings",
  // Legacy routes — redirects exist; labels kept for any stale links during transition.
  "/dashboard/timeline": "Plan",
  "/dashboard/checklist": "Dorms · Checklist",
  "/dashboard/competitiveness": "Rec Center · Readiness",
}

export function getDashboardNavLabel(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
  const match = Object.entries(ROUTE_LABELS)
    .filter(([path]) => path !== "/dashboard" && pathname.startsWith(path))
    .sort((a, b) => b[0].length - a[0].length)[0]
  return match?.[1] ?? "Workspace"
}

/** Primary plan destinations — order matches Phase 2 / Phase 5 sidebar. */
export const DASHBOARD_PLAN_NAV = [
  { href: "/dashboard", label: "Student Union · Today" },
  { href: "/dashboard/deadlines", label: "Clock Tower · Deadlines" },
  { href: "/dashboard/plan", label: "Classroom · Plan" },
  { href: "/dashboard/requirements", label: "Registrar · Requirements" },
  { href: "/dashboard/checklist", label: "Dorms · Checklist" },
] as const

export const DASHBOARD_TOOL_NAV = [
  { href: "/dashboard/essay", label: "Library · Essays" },
  { href: "/dashboard/competitiveness", label: "Rec Center · Readiness" },
] as const

export const DASHBOARD_ACCOUNT_NAV = [
  { href: "/sources", label: "Sources" },
  { href: "/dashboard/settings", label: "Counselor · Settings" },
] as const

/** Labeled in-hall directory — every student job, always visible in immersive mode. */
export const DASHBOARD_HALL_DIRECTORY = [
  { href: "/dashboard", short: "Today", label: "Student Union · Today" },
  { href: "/dashboard/deadlines", short: "Deadlines", label: "Clock Tower · Deadlines" },
  { href: "/dashboard/plan", short: "Plan", label: "Classroom · Plan" },
  { href: "/dashboard/requirements", short: "Requirements", label: "Registrar · Requirements" },
  { href: "/dashboard/checklist", short: "Checklist", label: "Dorms · Checklist" },
  { href: "/dashboard/essay", short: "Essays", label: "Library · Essays" },
  { href: "/dashboard/competitiveness", short: "Readiness", label: "Rec Center · Readiness" },
  { href: "/dashboard/settings", short: "Settings", label: "Counselor · Settings" },
] as const

export function isDashboardNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname === href || pathname.startsWith(`${href}/`)
}

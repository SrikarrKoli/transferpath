/** Dashboard route labels for chrome / breadcrumbs (no demo copy). */

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Today",
  "/dashboard/plan": "Plan",
  "/dashboard/deadlines": "Tasks & deadlines",
  "/dashboard/requirements": "Requirements",
  "/dashboard/essay": "Essays",
  "/dashboard/settings": "Settings",
  // Legacy routes — redirects exist; labels kept for any stale links during transition.
  "/dashboard/timeline": "Plan",
  "/dashboard/checklist": "Tasks & deadlines",
  "/dashboard/competitiveness": "Requirements",
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
  { href: "/dashboard", label: "Today" },
  { href: "/dashboard/requirements", label: "Requirements" },
  { href: "/dashboard/plan", label: "Plan" },
  { href: "/dashboard/deadlines", label: "Tasks & deadlines" },
] as const

export const DASHBOARD_TOOL_NAV = [{ href: "/dashboard/essay", label: "Essays" }] as const

export const DASHBOARD_ACCOUNT_NAV = [
  { href: "/sources", label: "Sources" },
  { href: "/dashboard/settings", label: "Settings" },
] as const

export function isDashboardNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname === href || pathname.startsWith(`${href}/`)
}

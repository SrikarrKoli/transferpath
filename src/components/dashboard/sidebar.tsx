"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Calendar,
  ClipboardList,
  CheckSquare,
  PenLine,
  Settings,
  LogOut,
  BookOpen,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { NextDeadline } from "@/lib/next-deadline"
import { DeadlineOfficialLink } from "@/components/dashboard/deadline-official-link"
import { cn } from "@/lib/utils"
import { PRODUCT_NAME } from "@/lib/brand"
import {
  DASHBOARD_ACCOUNT_NAV,
  DASHBOARD_PLAN_NAV,
  DASHBOARD_TOOL_NAV,
  isDashboardNavActive,
} from "@/lib/dashboard-nav"
import { shouldShowReadinessScore, type CompletenessLadderState } from "@/lib/completeness-ladder"
import { Meter } from "@/components/ui/progress"

const planNavIcons = {
  "/dashboard": Home,
  "/dashboard/requirements": ClipboardList,
  "/dashboard/plan": Calendar,
  "/dashboard/deadlines": CheckSquare,
} as const

const toolNavIcons = {
  "/dashboard/essay": PenLine,
} as const

const accountNavIcons = {
  "/sources": BookOpen,
  "/dashboard/settings": Settings,
} as const

function BrandOrb({ className }: { className?: string }) {
  return <span className={cn("shrink-0 rounded-full bg-sidebar-primary", className)} aria-hidden />
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  onNavigate,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  pathname: string
  onNavigate?: () => void
}) {
  const isActive = isDashboardNavActive(pathname, href)
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
          isActive
            ? "bg-sidebar-accent font-medium text-sidebar-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        {label}
      </Link>
    </li>
  )
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="px-3 pb-2 tp-eyebrow text-sidebar-foreground/40">Your plan</p>
        <ul className="space-y-1">
          {DASHBOARD_PLAN_NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={planNavIcons[item.href]}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </div>
      <div>
        <p className="px-3 pb-2 tp-eyebrow text-sidebar-foreground/40">Tools</p>
        <ul className="space-y-1">
          {DASHBOARD_TOOL_NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={toolNavIcons[item.href]}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

interface SidebarProps {
  displayName: string
  initials: string
  routeLabel: string | null
  nextDeadline: NextDeadline
  hasTargetUniversity: boolean
  pathwayReadinessScore: number
  completenessLadderState: CompletenessLadderState
  currentSchoolName: string | null
  targetSchoolName: string | null
  targetMajor: string | null
  expectedTransferTerm: string | null
}

function PathwayPanel({
  targetSchoolName,
  targetMajor,
  currentSchoolName,
  expectedTransferTerm,
  pathwayReadinessScore,
  completenessLadderState,
}: Pick<
  SidebarProps,
  | "targetSchoolName"
  | "targetMajor"
  | "currentSchoolName"
  | "expectedTransferTerm"
  | "pathwayReadinessScore"
  | "completenessLadderState"
>) {
  const showReadiness = shouldShowReadinessScore(completenessLadderState)
  const readinessPct = Math.round(Math.min(100, Math.max(0, pathwayReadinessScore)))
  const pathwayHeadline =
    targetSchoolName && targetMajor
      ? `${targetSchoolName} · ${targetMajor}`
      : targetSchoolName
        ? targetSchoolName
        : targetMajor
          ? targetMajor
          : "Set your target path"

  return (
    <div className="border-b border-sidebar-border px-4 py-4">
      <p className="tp-eyebrow text-sidebar-foreground/45">Current pathway</p>
      <p className="mt-2 font-heading text-base leading-snug text-sidebar-foreground">{pathwayHeadline}</p>
      {currentSchoolName ? (
        <p className="mt-1 text-xs text-sidebar-foreground/60">From {currentSchoolName}</p>
      ) : (
        <p className="mt-1 text-xs text-sidebar-foreground/60">Add your current school in settings</p>
      )}
      {expectedTransferTerm ? (
        <p className="mt-0.5 text-xs text-sidebar-primary/90">Planning for {expectedTransferTerm}</p>
      ) : null}
      {showReadiness ? (
        <div className="mt-4 flex items-center gap-2">
          <Meter
            value={readinessPct}
            label={`Planner readiness: ${readinessPct} percent`}
            className="flex-1"
            trackClassName="bg-sidebar-foreground/15"
            indicatorClassName="bg-sidebar-primary"
          />
          <span className="font-mono text-micro font-medium text-sidebar-primary">{readinessPct}%</span>
        </div>
      ) : null}
      {showReadiness ? (
        <p className="mt-1.5 text-micro leading-snug text-sidebar-foreground/50">Planner readiness</p>
      ) : null}
    </div>
  )
}

export function DashboardSidebar({
  initials,
  nextDeadline,
  hasTargetUniversity,
  pathwayReadinessScore,
  completenessLadderState,
  currentSchoolName,
  targetSchoolName,
  targetMajor,
  expectedTransferTerm,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const deadlineCard = (
    <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/70 p-3">
      {!hasTargetUniversity ? (
        <p className="text-xs leading-relaxed text-sidebar-foreground/75">
          Set a target school in{" "}
          <Link
            href="/dashboard/settings"
            className="font-medium text-sidebar-primary underline-offset-2 hover:underline"
          >
            Settings
          </Link>{" "}
          to see deadlines.
        </p>
      ) : !nextDeadline ? (
        <p className="text-xs text-sidebar-foreground/70">No upcoming deadlines in our database yet.</p>
      ) : (
        <>
          <p className="line-clamp-2 text-xs font-medium text-sidebar-primary">{nextDeadline.title}</p>
          {nextDeadline.sourceCheckedAt ? (
            <p className="mt-1 text-lg font-semibold tracking-tight text-sidebar-foreground">
              {nextDeadline.daysUntil} {nextDeadline.daysUntil === 1 ? "day" : "days"} away
            </p>
          ) : (
            <p className="mt-1 text-sm font-medium text-sidebar-foreground/85">
              Date not yet checked
            </p>
          )}
          <p className="text-xs text-sidebar-foreground/70">{nextDeadline.dueDate}</p>
          {nextDeadline.officialUrl ? (
            <DeadlineOfficialLink
              href={nextDeadline.officialUrl}
              className="mt-1.5 block text-xs font-medium text-sidebar-primary underline-offset-2 hover:underline"
            />
          ) : null}
        </>
      )}
    </div>
  )

  const accountLinks = (
    <>
      {DASHBOARD_ACCOUNT_NAV.map((item) => {
        const Icon = accountNavIcons[item.href]
        const isActive = isDashboardNavActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
              isActive
                ? "bg-sidebar-accent font-medium text-sidebar-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {item.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-3 md:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 font-sans text-sm font-semibold tracking-tight text-sidebar-foreground transition-opacity duration-150 hover:opacity-90"
        >
          <BrandOrb className="h-5 w-5" />
          {PRODUCT_NAME}
        </Link>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-accent text-xs font-medium text-sidebar-foreground">
          {initials}
        </div>
      </header>

      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <BrandOrb className="h-5 w-5" />
          <Link
            href="/"
            className="font-mono text-sm font-bold uppercase tracking-tight text-sidebar-foreground transition-opacity duration-150 hover:opacity-90"
          >
            {PRODUCT_NAME}
          </Link>
        </div>

        <PathwayPanel
          targetSchoolName={targetSchoolName}
          targetMajor={targetMajor}
          currentSchoolName={currentSchoolName}
          expectedTransferTerm={expectedTransferTerm}
          pathwayReadinessScore={pathwayReadinessScore}
          completenessLadderState={completenessLadderState}
        />

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <NavList pathname={pathname} />
        </nav>

        <div className="px-3 py-4">{deadlineCard}</div>

        <div className="border-t border-sidebar-border p-2">
          {accountLinks}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

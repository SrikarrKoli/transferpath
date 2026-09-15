"use client"

import type { ComponentType } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  Calendar,
  CheckSquare,
  ClipboardList,
  Home,
  LogOut,
  MoreHorizontal,
  PenLine,
  BookOpen,
  Settings,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import {
  DASHBOARD_ACCOUNT_NAV,
  DASHBOARD_PLAN_NAV,
  DASHBOARD_TOOL_NAV,
  isDashboardNavActive,
} from "@/lib/dashboard-nav"
import { buildingIdForPath } from "@/lib/campus-immersion"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const BOTTOM_ICONS = {
  "/dashboard": Home,
  "/dashboard/plan": Calendar,
  "/dashboard/deadlines": CheckSquare,
  "/dashboard/requirements": ClipboardList,
} as const

const BOTTOM_SHORT_LABEL: Record<string, string> = {
  "/dashboard": "Today",
  "/dashboard/plan": "Plan",
  "/dashboard/deadlines": "Tasks",
  "/dashboard/requirements": "Reqs",
}

/** Phase 5 mobile order: Today, Plan, Tasks, Requirements — then More. */
const MOBILE_PLAN_ORDER = [
  "/dashboard",
  "/dashboard/plan",
  "/dashboard/deadlines",
  "/dashboard/requirements",
] as const

const moreIcons: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "/dashboard/essay": PenLine,
  "/sources": BookOpen,
  "/dashboard/settings": Settings,
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)
  if (buildingIdForPath(pathname)) return null

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const planItems = MOBILE_PLAN_ORDER.map((href) => {
    const item = DASHBOARD_PLAN_NAV.find((n) => n.href === href)!
    return {
      href: item.href,
      label: BOTTOM_SHORT_LABEL[item.href] ?? item.label,
      Icon: BOTTOM_ICONS[item.href as keyof typeof BOTTOM_ICONS],
    }
  })

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid h-14 grid-cols-5">
        {planItems.map(({ href, label, Icon }) => {
          const active = isDashboardNavActive(pathname, href)
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 px-1 text-micro font-medium",
                  active ? "text-accent" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} aria-hidden />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          )
        })}
        <li className="min-w-0">
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-0.5 px-1 text-micro font-medium",
                moreOpen ? "text-accent" : "text-muted-foreground"
              )}
              aria-label="More"
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              <span>More</span>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-[env(safe-area-inset-bottom)]">
              <SheetHeader className="border-b border-border px-4 pb-3 text-left">
                <SheetTitle className="font-heading text-lg">More</SheetTitle>
              </SheetHeader>
              <ul className="space-y-1 px-2 py-3">
                {[...DASHBOARD_TOOL_NAV, ...DASHBOARD_ACCOUNT_NAV].map((item) => {
                  const Icon = moreIcons[item.href] ?? Settings
                  const active = isDashboardNavActive(pathname, item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-3 text-sm",
                          active
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false)
                      void handleSignOut()
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    Sign out
                  </button>
                </li>
              </ul>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  )
}

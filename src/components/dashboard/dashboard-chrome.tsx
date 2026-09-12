"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Bell } from "lucide-react"
import { getDashboardNavLabel } from "@/lib/dashboard-nav"
import { PRODUCT_NAME } from "@/lib/brand"
import { settingsPath } from "@/lib/settings-tab"
import { buildingIdForPath } from "@/lib/campus-immersion"

interface DashboardChromeProps {
  initials: string
  children: React.ReactNode
}

export function DashboardChrome({ initials, children }: DashboardChromeProps) {
  const pathname = usePathname()
  const sectionLabel = getDashboardNavLabel(pathname)
  const inHall = buildingIdForPath(pathname) != null

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {inHall ? null : (
        <header className="sticky top-0 z-30 hidden border-b border-border bg-background/85 backdrop-blur-md md:flex">
          <div className="flex h-14 w-full items-center justify-between gap-6 px-4 lg:px-10">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="text-sm text-muted-foreground">{PRODUCT_NAME}</span>
              <span className="text-muted-foreground/50" aria-hidden>
                /
              </span>
              <span className="truncate font-medium text-foreground">{sectionLabel}</span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Link
                href={settingsPath("notifications")}
                className="rounded-full border border-transparent p-2 text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/45"
                aria-label="Notification settings"
              >
                <Bell className="h-5 w-5" strokeWidth={1.5} />
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-xs font-medium text-primary transition-colors hover:bg-muted"
                aria-label="Account settings"
              >
                {initials}
              </Link>
            </div>
          </div>
        </header>
      )}

      <div
        className={
          inHall
            ? "flex-1 px-6 py-7 sm:px-10 lg:px-16 lg:py-8"
            : "flex-1 px-4 py-6 sm:px-6 md:px-6 lg:px-10 lg:py-8"
        }
      >
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </div>
    </div>
  )
}

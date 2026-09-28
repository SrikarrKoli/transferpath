"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { DASHBOARD_HALL_DIRECTORY, isDashboardNavActive } from "@/lib/dashboard-nav"
import { useHall } from "@/components/campus-ui/hall-context"
import { cn } from "@/lib/utils"

/** Labeled job directory for immersive halls — replaces unlabeled minimap hops. */
export function HallDirectory() {
  const hall = useHall()
  const pathname = usePathname() ?? "/dashboard"

  return (
    <nav className="hall-directory" aria-label="Campus halls">
      <ul className="hall-directory-list">
        {DASHBOARD_HALL_DIRECTORY.map((item) => {
          const active = isDashboardNavActive(pathname, item.href) ||
            (hall === "counselor" && item.href === "/dashboard/settings")
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn("hall-directory-link", active && "is-active")}
                aria-current={active ? "page" : undefined}
                title={item.label}
              >
                {item.short}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

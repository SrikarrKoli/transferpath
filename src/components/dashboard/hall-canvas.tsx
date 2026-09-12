"use client"

import { usePathname } from "next/navigation"
import { buildingIdForPath } from "@/lib/campus-immersion"
import { cn } from "@/lib/utils"

export function HallCanvas({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hall = buildingIdForPath(pathname)

  return (
    <div
      className={cn(
        "flex min-h-screen",
        hall ? "hall-app" : "bg-background tp-dashboard-bg"
      )}
      data-hall={hall ?? undefined}
    >
      {children}
    </div>
  )
}

export function HallMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hall = buildingIdForPath(pathname)

  return (
    <main
      className={cn(
        "flex min-w-0 flex-1 flex-col",
        hall
          ? "ml-0 pt-0 pb-0"
          : "ml-0 pt-14 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:ml-64 md:pt-0 md:pb-0"
      )}
    >
      {children}
    </main>
  )
}

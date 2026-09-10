import Link from "next/link"
import type { BuildingId } from "@/components/landing/campus/campus-data"
import { campusBuilding } from "@/lib/campus-immersion"
import { CampusMiniMap } from "@/components/campus-ui/campus-minimap"

export function ImmersiveBuildingShell({
  buildingId,
  children,
}: {
  buildingId: BuildingId
  children: React.ReactNode
}) {
  const building = campusBuilding(buildingId)

  return (
    <div className="campus-entered campus-enter" data-building={buildingId}>
      <header className="campus-building-hero">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-caption font-medium text-[color:var(--campus-terracotta)] transition-colors hover:text-[color:var(--campus-navy)]"
            >
              <span aria-hidden>←</span>
              Back to campus
            </Link>
            <p className="tp-eyebrow mt-4 text-[color:var(--campus-terracotta)]">{building.name}</p>
            <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-[color:var(--campus-navy)] md:text-4xl">
              {building.feature}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--campus-navy)]/62">
              {building.blurb}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <CampusMiniMap here={buildingId} />
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--campus-navy)]/42">
              You are here
            </p>
          </div>
        </div>
      </header>
      <div className="campus-building-interior">{children}</div>
    </div>
  )
}

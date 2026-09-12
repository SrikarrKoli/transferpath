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
        <div className="campus-hall-rail">
          <span>Campus directory / interior</span>
          <span>Current hall · {building.name}</span>
        </div>
        <div className="campus-hall-heading">
          <div className="min-w-0 campus-hall-title-block">
            <Link
              href="/"
              className="campus-exit-link"
            >
              <span aria-hidden>←</span>
              Back to campus
            </Link>
            <p className="campus-room-label">Hall record / {building.short}</p>
            <h1 className="campus-hall-name">
              {building.name}
            </h1>
            <p className="campus-hall-blurb">
              {building.blurb}
            </p>
          </div>
          <div className="campus-location-mark">
            <p className="campus-arrival-label">Now entering</p>
            <CampusMiniMap here={buildingId} />
            <p>You are here · {building.name}</p>
          </div>
        </div>
      </header>
      <div className="campus-building-interior">{children}</div>
    </div>
  )
}

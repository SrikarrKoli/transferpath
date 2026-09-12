import Link from "next/link"
import type { BuildingId } from "@/components/landing/campus/campus-data"
import { campusBuilding } from "@/lib/campus-immersion"
import { CampusMiniMap } from "@/components/campus-ui/campus-minimap"
import { HallProvider } from "@/components/campus-ui/hall-context"

export function ImmersiveBuildingShell({
  buildingId,
  kicker: _kicker,
  children,
}: {
  buildingId: BuildingId
  /** Kept for callers; path lives on the artifact, not the masthead. */
  kicker?: string
  children: React.ReactNode
}) {
  const building = campusBuilding(buildingId)

  return (
    <HallProvider buildingId={buildingId}>
      <article className="campus-entered campus-enter" data-building={buildingId}>
        <header className="hall-masthead">
          <div className="hall-masthead-meta">
            <Link href="/" className="hall-back">
              ← Campus
            </Link>
            <CampusMiniMap here={buildingId} />
          </div>
          <h1 className="hall-name">{building.name}</h1>
        </header>
        <div className="hall-body">{children}</div>
        <footer className="hall-folio">{building.name}</footer>
      </article>
    </HallProvider>
  )
}

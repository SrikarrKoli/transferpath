import Link from "next/link"
import type { BuildingId } from "@/components/landing/campus/campus-data"
import { campusBuilding } from "@/lib/campus-immersion"
import { CampusMiniMap } from "@/components/campus-ui/campus-minimap"
import { HallProvider } from "@/components/campus-ui/hall-context"

export function ImmersiveBuildingShell({
  buildingId,
  kicker: _kicker,
  purpose,
  children,
}: {
  buildingId: BuildingId
  /** Kept for callers; path lives on the artifact, not the masthead. */
  kicker?: string
  /** Extra framing under the hall name for onboarding / settings. */
  purpose?: "onboarding" | "settings"
  children: React.ReactNode
}) {
  const building = campusBuilding(buildingId)
  const purposeCopy =
    purpose === "onboarding"
      ? "Start here to set up your transfer path — current school, target universities, courses, and timeline. Built for transfer students planning a move to a four-year."
      : purpose === "settings"
        ? "Change the schools, major, term, and reminders that drive your transfer campus. Saves update your halls immediately."
        : null

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
          <p className="hall-feature mt-1 text-sm font-medium tracking-wide text-[color:var(--campus-ink)]/55">
            {building.feature}
          </p>
          {purposeCopy ? (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--campus-ink)]/65">
              {purposeCopy}
            </p>
          ) : null}
        </header>
        <div className="hall-body">{children}</div>
        <footer className="hall-folio">
          {building.name} · {building.feature}
        </footer>
      </article>
    </HallProvider>
  )
}

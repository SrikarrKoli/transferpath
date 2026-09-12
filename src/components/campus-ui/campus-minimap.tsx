import { CAMPUS_BUILDINGS, type BuildingId } from "@/components/landing/campus/campus-data"
import { cn } from "@/lib/utils"

export function CampusMiniMap({
  here,
  className,
}: {
  here: BuildingId
  className?: string
}) {
  const xs = CAMPUS_BUILDINGS.map((b) => b.x)
  const zs = CAMPUS_BUILDINGS.map((b) => b.z)
  const minX = Math.min(...xs) - 0.8
  const maxX = Math.max(...xs) + 0.8
  const minZ = Math.min(...zs) - 0.8
  const maxZ = Math.max(...zs) + 0.8
  const w = 132
  const h = 108

  const pt = (x: number, z: number) => {
    const px = ((x - minX) / (maxX - minX)) * w
    const py = ((z - minZ) / (maxZ - minZ)) * h
    return { cx: px, cy: py }
  }

  const points = CAMPUS_BUILDINGS.map((b) => ({ ...pt(b.x, b.z), id: b.id }))
  const active = points.find((p) => p.id === here)
  const activeBuilding = CAMPUS_BUILDINGS.find((building) => building.id === here)

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("campus-mini-map h-[5.5rem] w-[6.75rem] shrink-0", className)}
      role="img"
      aria-label={`Campus mini-map. You are in ${activeBuilding?.name ?? "the current hall"}.`}
    >
      <title>{`Campus map — ${activeBuilding?.name ?? "current hall"}`}</title>
      <rect x="0.75" y="0.75" width={w - 1.5} height={h - 1.5} fill="#F4F0E6" stroke="#1A2332" strokeOpacity="0.24" strokeWidth="1.5" />
      <path d="M8 68 C34 62 46 72 67 54 S104 28 124 36" fill="none" stroke="#1A2332" strokeOpacity="0.12" strokeWidth="9" />
      <path d="M8 68 C34 62 46 72 67 54 S104 28 124 36" fill="none" stroke="#F4F0E6" strokeWidth="5" />
      <path d="M66 8 L67 100 M10 54 L122 54" fill="none" stroke="#1A2332" strokeOpacity="0.12" strokeDasharray="2 3" />
      {active ? (
        <circle cx={active.cx} cy={active.cy} r="11" fill="none" stroke="#B85C38" strokeOpacity="0.3" />
      ) : null}
      {CAMPUS_BUILDINGS.map((b) => {
        const { cx, cy } = pt(b.x, b.z)
        const on = b.id === here
        return (
          <circle
            key={b.id}
            cx={cx}
            cy={cy}
            r={on ? 5.5 : 3.25}
            fill={on ? "#B85C38" : "#1A2332"}
            opacity={on ? 1 : 0.34}
          />
        )
      })}
    </svg>
  )
}

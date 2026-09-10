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

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-[4.75rem] w-[5.75rem] shrink-0", className)}
      role="img"
      aria-label="Campus mini-map"
    >
      <rect width={w} height={h} rx={10} fill="#e6d3b4" />
      <rect x={8} y={8} width={w - 16} height={h - 16} rx={8} fill="#d7e4dc" opacity={0.55} />
      {CAMPUS_BUILDINGS.map((b) => {
        const { cx, cy } = pt(b.x, b.z)
        const on = b.id === here
        return (
          <circle
            key={b.id}
            cx={cx}
            cy={cy}
            r={on ? 6.5 : 4}
            fill={on ? "#c45c3a" : "#1a2332"}
            opacity={on ? 1 : 0.38}
          />
        )
      })}
    </svg>
  )
}

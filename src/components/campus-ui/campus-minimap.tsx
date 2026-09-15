import Link from "next/link"
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
  const w = 120
  const h = 98

  const pt = (x: number, z: number) => {
    const px = ((x - minX) / (maxX - minX)) * w
    const py = ((z - minZ) / (maxZ - minZ)) * h
    return { cx: px, cy: py }
  }

  const hereName = CAMPUS_BUILDINGS.find((b) => b.id === here)?.name ?? "Campus"

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-[2.6rem] w-[3.2rem] shrink-0", className)}
      role="img"
      aria-label={`${hereName} on the campus map`}
    >
      {CAMPUS_BUILDINGS.map((b) => {
        const { cx, cy } = pt(b.x, b.z)
        const on = b.id === here
        return (
          <Link key={b.id} href={b.href} aria-label={b.name}>
            {on ? (
              <rect
                x={cx - 2.4}
                y={cy - 2.4}
                width={4.8}
                height={4.8}
                fill="none"
                stroke="#1A2332"
                strokeWidth={1.2}
              />
            ) : (
              <rect
                x={cx - 1}
                y={cy - 1}
                width={2}
                height={2}
                fill="#1A2332"
                opacity={0.22}
              />
            )}
          </Link>
        )
      })}
    </svg>
  )
}

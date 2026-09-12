import { notFound } from "next/navigation"
import type { BuildingId } from "@/components/landing/campus/campus-data"
import { HallPreviewBody } from "./hall-preview-body"

const HALLS: BuildingId[] = [
  "quad",
  "union",
  "library",
  "classroom",
  "registrar",
  "gym",
  "dorm",
  "counselor",
]

function isBuilding(id: string): id is BuildingId {
  return HALLS.includes(id as BuildingId)
}

export default async function HallPreviewPage({
  params,
}: {
  params: Promise<{ building: string }>
}) {
  if (process.env.NODE_ENV === "production") notFound()

  const { building } = await params
  if (!isBuilding(building)) notFound()

  return (
    <div className="hall-app min-h-screen px-6 py-8 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        <HallPreviewBody buildingId={building} />
      </div>
    </div>
  )
}

"use client"

import { createContext, useContext } from "react"
import type { BuildingId } from "@/components/landing/campus/campus-data"

const HallContext = createContext<BuildingId | null>(null)

export function HallProvider({
  buildingId,
  children,
}: {
  buildingId: BuildingId
  children: React.ReactNode
}) {
  return <HallContext.Provider value={buildingId}>{children}</HallContext.Provider>
}

export function useHall(): BuildingId | null {
  return useContext(HallContext)
}

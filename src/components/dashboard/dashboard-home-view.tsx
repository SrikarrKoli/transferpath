"use client"

import { OverviewMain } from "@/components/dashboard/overview/overview-main"
import type { OverviewData } from "@/types/overview"

interface DashboardHomeViewProps {
  overviewData: OverviewData
  userId: string
}

export function DashboardHomeView({ overviewData, userId }: DashboardHomeViewProps) {
  return <OverviewMain data={overviewData} userId={userId} />
}

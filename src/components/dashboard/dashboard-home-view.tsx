"use client"

import { Suspense } from "react"
import { OverviewMain } from "@/components/dashboard/overview/overview-main"
import { OnboardingWelcomeBanner } from "@/components/dashboard/onboarding-welcome-banner"
import type { OverviewData } from "@/types/overview"

interface DashboardHomeViewProps {
  overviewData: OverviewData
  userId: string
}

export function DashboardHomeView({ overviewData, userId }: DashboardHomeViewProps) {
  return (
    <div className="flex flex-col gap-0">
      <Suspense fallback={null}>
        <OnboardingWelcomeBanner />
      </Suspense>
      <OverviewMain data={overviewData} userId={userId} />
    </div>
  )
}

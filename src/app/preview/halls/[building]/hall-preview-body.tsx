"use client"

import type { BuildingId } from "@/components/landing/campus/campus-data"
import { ImmersiveBuildingShell } from "@/components/campus-ui/immersive-building-shell"
import { HallDeadlines } from "@/components/campus-ui/hall-deadlines"
import { HallToday } from "@/components/campus-ui/hall-today"
import { HallPlan } from "@/components/campus-ui/hall-plan"
import { HallRequirements } from "@/components/campus-ui/hall-requirements"
import { ReadinessScoreSheet } from "@/components/dashboard/readiness-score-sheet"
import { HallChecklist } from "@/components/campus-ui/hall-checklist"
import { SettingsClient } from "@/components/dashboard/settings-client"
import { LibraryPreviewDesk } from "@/components/dashboard/library-preview-desk"
import {
  previewChecklist,
  previewSettingsProfile,
  previewDeadlines,
  previewPlan,
  previewReadiness,
  previewRequirements,
  previewToday,
} from "@/lib/hall-preview-fixtures"

export function HallPreviewBody({ buildingId }: { buildingId: BuildingId }) {
  return (
    <ImmersiveBuildingShell buildingId={buildingId} purpose={buildingId === "counselor" ? "settings" : undefined}>
      {buildingId === "quad" ? (
        <HallDeadlines
          data={previewDeadlines}
          filter="upcoming"
          onFilter={() => undefined}
          onToggleTask={() => undefined}
        />
      ) : buildingId === "union" ? (
        <HallToday data={previewToday} userId="preview" />
      ) : buildingId === "library" ? (
        <LibraryPreviewDesk />
      ) : buildingId === "classroom" ? (
        <HallPlan
          blocks={previewPlan}
          next={{
            caption: "Do this next",
            title: "COSC 1436",
            prompt: "Mark it in progress when you start the class — or keep placing courses on terms.",
            meta: "Planned · Fall 2026",
            primary: { kind: "button", label: "Mark in progress", onClick: () => undefined },
            secondaries: [
              { kind: "link", label: "+ Add a course", href: "/dashboard/plan" },
              { kind: "link", label: "Open Requirements", href: "/dashboard/requirements" },
            ],
          }}
          margin={{
            fromInstitution: "Austin Community College",
            toInstitution: "UT Austin",
            program: "Computer Science",
            term: "Fall 2027",
          }}
        />
      ) : buildingId === "registrar" ? (
        <HallRequirements data={previewRequirements} />
      ) : buildingId === "gym" ? (
        <ReadinessScoreSheet
          readiness={previewReadiness}
          currentSchoolName={previewRequirements.header.fromInstitution}
          targetSchoolName={previewRequirements.header.toInstitution}
          targetMajor={previewRequirements.header.program}
          expectedTransferTerm={previewRequirements.header.term}
        />
      ) : buildingId === "dorm" ? (
        <HallChecklist
          data={previewChecklist}
          tasks={Object.fromEntries(
            previewChecklist.categories.flatMap((c) => c.tasks.map((t) => [t.id, !!t.done]))
          )}
          onToggle={() => undefined}
        />
      ) : (
        <SettingsClient preview profile={previewSettingsProfile} authEmail={previewSettingsProfile.email} authInfo={{ hasEmailPassword: true, oauthProviderIds: [] }} />
      )}
    </ImmersiveBuildingShell>
  )
}

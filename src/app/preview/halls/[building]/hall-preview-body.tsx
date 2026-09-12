"use client"

import type { BuildingId } from "@/components/landing/campus/campus-data"
import { ImmersiveBuildingShell } from "@/components/campus-ui/immersive-building-shell"
import { HallDeadlines } from "@/components/campus-ui/hall-deadlines"
import { HallToday } from "@/components/campus-ui/hall-today"
import { HallPlan } from "@/components/campus-ui/hall-plan"
import { HallRequirements } from "@/components/campus-ui/hall-requirements"
import { HallReadiness } from "@/components/campus-ui/hall-readiness"
import { HallChecklist } from "@/components/campus-ui/hall-checklist"
import { HallCounselor } from "@/components/campus-ui/hall-counselor"
import { EssayWorkspaceUi } from "@/components/dashboard/essay-workspace-ui"
import {
  previewChecklist,
  previewCounselor,
  previewDeadlines,
  previewEssay,
  previewPlan,
  previewReadiness,
  previewRequirements,
  previewToday,
} from "@/lib/hall-preview-fixtures"

export function HallPreviewBody({ buildingId }: { buildingId: BuildingId }) {
  return (
    <ImmersiveBuildingShell buildingId={buildingId}>
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
        <EssayWorkspaceUi
          essay={{
            title: previewEssay.title,
            prompt: previewEssay.prompt,
            wordLimit: previewEssay.wordLimit,
            wordLimitIsDefault: previewEssay.wordLimitIsDefault,
          }}
          value={previewEssay.draft}
          onChange={() => undefined}
          coachNotes={previewEssay.coach}
          strengthSignals={previewEssay.strengths}
        />
      ) : buildingId === "classroom" ? (
        <HallPlan
          blocks={previewPlan}
          note="Terms are ordered to the entry date. Requirements stay on the Registrar; this page only places courses on a calendar."
        />
      ) : buildingId === "registrar" ? (
        <HallRequirements data={previewRequirements} />
      ) : buildingId === "gym" ? (
        <HallReadiness data={previewReadiness} />
      ) : buildingId === "dorm" ? (
        <HallChecklist
          data={previewChecklist}
          tasks={Object.fromEntries(
            previewChecklist.categories.flatMap((c) => c.tasks.map((t) => [t.id, !!t.done]))
          )}
          onToggle={() => undefined}
        />
      ) : (
        <HallCounselor fields={previewCounselor} />
      )}
    </ImmersiveBuildingShell>
  )
}

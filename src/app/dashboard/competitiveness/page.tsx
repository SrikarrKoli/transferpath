import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ImmersiveBuildingShell } from "@/components/campus-ui/immersive-building-shell"
import { ReadinessScoreSheet } from "@/components/dashboard/readiness-score-sheet"
import { getCachedDashboardReadiness } from "@/lib/dashboard-readiness-loader"

function universityName(raw: unknown): string | null {
  const row = Array.isArray(raw) ? raw[0] : raw
  if (!row || typeof row !== "object" || !("name" in row)) return null
  return String((row as { name: unknown }).name)
}

export default async function CompetitivenessPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(
      `
    target_major,
    expected_transfer_term,
    current_university:current_university_id(name),
    target_university:target_university_id(name)
  `
    )
    .eq("id", user.id)
    .single()

  const readiness = await getCachedDashboardReadiness(user.id)

  return (
    <ImmersiveBuildingShell buildingId="gym">
      <ReadinessScoreSheet
        readiness={readiness}
        currentSchoolName={universityName(profile?.current_university)}
        targetSchoolName={universityName(profile?.target_university)}
        targetMajor={profile?.target_major ?? null}
        expectedTransferTerm={profile?.expected_transfer_term ?? null}
      />
    </ImmersiveBuildingShell>
  )
}

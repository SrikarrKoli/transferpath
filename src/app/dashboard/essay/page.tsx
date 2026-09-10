import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ImmersiveBuildingShell } from "@/components/campus-ui/immersive-building-shell"
import { EssayClient } from "@/components/dashboard/essay-client"
import type { ChecklistProfileSummary } from "@/lib/checklist-task-definitions"

type EssayRow = {
  title: string | null
  content: string | null
  word_count: number
  word_limit: number | null
  updated_at: string
}

export default async function EssayPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: essays }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select(
        `
    target_major,
    expected_transfer_term,
    field_of_study,
    target_university:target_university_id(name),
    current_university:current_university_id(name)
  `
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_essays")
      .select("prompt_type, title, content, word_count, word_limit, updated_at")
      .eq("user_id", user.id),
  ])

  const essayMap: Record<string, EssayRow> = Object.fromEntries(
    (essays ?? []).map((e) => [e.prompt_type, e])
  )

  const currentUni = profile?.current_university as { name: string } | { name: string }[] | null
  const targetUni = profile?.target_university as { name: string } | { name: string }[] | null
  const currentName = Array.isArray(currentUni) ? currentUni[0]?.name : currentUni?.name
  const targetName = Array.isArray(targetUni) ? targetUni[0]?.name : targetUni?.name

  const checklistProfile: ChecklistProfileSummary = {
    currentUniversityName: currentName ?? null,
    targetUniversityName: targetName ?? null,
    targetMajor: profile?.target_major ?? null,
    fieldOfStudy: profile?.field_of_study ?? null,
    expectedTransferTerm: profile?.expected_transfer_term ?? null,
  }

  return (
    <ImmersiveBuildingShell buildingId="library">
      <EssayClient
        userId={user.id}
        initialEssayMap={essayMap}
        profile={checklistProfile}
      />
    </ImmersiveBuildingShell>
  )
}

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ImmersiveBuildingShell } from "@/components/campus-ui/immersive-building-shell"
import { ChecklistClient, type ChecklistProfileSummary } from "@/components/dashboard/checklist-client"
import { getCachedNextDeadline } from "@/lib/dashboard-data"

function universityJoinName(raw: unknown): string | null {
  if (raw == null) return null
  if (Array.isArray(raw)) {
    const first = raw[0] as { name?: string } | undefined
    return first?.name ?? null
  }
  if (typeof raw === "object" && raw !== null && "name" in raw) {
    return String((raw as { name: string }).name)
  }
  return null
}

export default async function ChecklistPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: userCourses }, { data: essayRows }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select(
        `
      target_university_id,
      target_major,
      field_of_study,
      expected_transfer_term,
      gpa,
      credits_completed,
      current_university:current_university_id(name),
      target_university:target_university_id(name)
    `
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_courses").select("course_name, status").eq("user_id", user.id),
    supabase.from("user_essays").select("content").eq("user_id", user.id),
  ])

  const checklistProfile: ChecklistProfileSummary = {
    currentUniversityName: universityJoinName(profile?.current_university),
    targetUniversityName: universityJoinName(profile?.target_university),
    targetMajor: profile?.target_major ?? null,
    fieldOfStudy: profile?.field_of_study ?? null,
    expectedTransferTerm: profile?.expected_transfer_term ?? null,
  }

  const nextDeadline = await getCachedNextDeadline(
    profile?.target_university_id ?? null,
    profile?.expected_transfer_term ?? null
  )

  const { data: items } = await supabase
    .from("user_checklist_items")
    .select("task_key, is_complete, completed_at")
    .eq("user_id", user.id)

  const completionMap: Record<string, { is_complete: boolean; completed_at: string | null }> =
    Object.fromEntries(
      (items ?? []).map((item) => [
        item.task_key,
        { is_complete: item.is_complete, completed_at: item.completed_at },
      ])
    )

  const essayHasContent = essayRows?.some((e) => (e.content ?? "").trim().length > 0) ?? false

  return (
    <ImmersiveBuildingShell buildingId="dorm">
      <ChecklistClient
        userId={user.id}
        initialCompletionMap={completionMap}
        checklistProfile={checklistProfile}
        nextDeadlineDaysUntil={nextDeadline?.daysUntil ?? null}
        userCourses={(userCourses ?? []).map((r) => ({
          course_name: r.course_name,
          status: r.status,
        }))}
        creditsCompleted={profile?.credits_completed ?? null}
        gpa={profile?.gpa ?? null}
        essayHasContent={essayHasContent}
      />
    </ImmersiveBuildingShell>
  )
}

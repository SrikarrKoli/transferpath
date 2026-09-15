import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ImmersiveBuildingShell } from "@/components/campus-ui/immersive-building-shell"
import { RequirementsClient } from "@/components/dashboard/requirements-client"
import {
  getCachedNextDeadline,
  getCachedRequirementDeadlines,
  getCachedRequirementNotes,
} from "@/lib/dashboard-data"
import { serverTodayYmdUtc } from "@/lib/next-deadline"
import { effectiveChecklistCompleteByTaskKey } from "@/lib/checklist-derived-status"

export default async function RequirementsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(
      `
    *,
    current_university:current_university_id(name),
    target_university:target_university_id(name)
  `
    )
    .eq("id", user.id)
    .single()

  const { data: userCourses } = await supabase
    .from("user_courses")
    .select("course_name, status")
    .eq("user_id", user.id)

  const [{ data: essays }, { data: checklistItems }] = await Promise.all([
    supabase.from("user_essays").select("id, content").eq("user_id", user.id),
    supabase
      .from("user_checklist_items")
      .select("task_key, is_complete")
      .eq("user_id", user.id),
  ])

  const essayHasContent =
    essays?.some((e) => (e.content ?? "").trim().length > 0) ?? false

  const manualChecklist: Record<string, boolean | undefined> = Object.fromEntries(
    (checklistItems ?? []).map((item) => [item.task_key, item.is_complete === true])
  )

  const checklistCompleteByTaskKey = effectiveChecklistCompleteByTaskKey(
    manualChecklist,
    {
      userCourses: (userCourses ?? []).map((r) => ({
        course_name: r.course_name,
        status: r.status,
      })),
      fieldOfStudy: profile?.field_of_study ?? null,
      creditsCompleted: profile?.credits_completed ?? null,
      gpa: profile?.gpa ?? null,
      essayHasContent,
    }
  ) as Record<string, boolean>

  const targetId = profile?.target_university_id ?? null
  const hasTargetUniversity = targetId != null
  const expectedTerm = profile?.expected_transfer_term ?? null
  const [nextDeadline, deadlines, requirementNotes] = await Promise.all([
    getCachedNextDeadline(targetId, expectedTerm),
    getCachedRequirementDeadlines(targetId, expectedTerm),
    getCachedRequirementNotes(targetId),
  ])
  const timelineTodayYmd = serverTodayYmdUtc()

  return (
    <ImmersiveBuildingShell buildingId="registrar">
      <RequirementsClient
        profile={profile}
        userCourses={userCourses ?? []}
        essays={essays ?? []}
        deadlines={deadlines}
        requirementNotes={requirementNotes}
        nextDeadline={nextDeadline}
        hasTargetUniversity={hasTargetUniversity}
        timelineTodayYmd={timelineTodayYmd}
        checklistCompleteByTaskKey={checklistCompleteByTaskKey}
      />
    </ImmersiveBuildingShell>
  )
}

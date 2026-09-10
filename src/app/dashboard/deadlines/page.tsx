import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ImmersiveBuildingShell } from "@/components/campus-ui/immersive-building-shell"
import { TasksDeadlinesClient } from "@/components/dashboard/tasks-deadlines-client"
import { buildTasksDeadlinesData } from "@/lib/build-tasks-deadlines-data"
import type { ChecklistProfileSummary } from "@/lib/checklist-task-definitions"
import type { UserCourseRow } from "@/lib/get-course-requirement-status"
import { getCachedRequirementDeadlines } from "@/lib/dashboard-data"

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

function targetUniversityMeta(raw: unknown): {
  name: string | null
  website: string | null
  deadlineSourceUrl: string | null
} {
  if (raw == null) {
    return { name: null, website: null, deadlineSourceUrl: null }
  }
  const row = Array.isArray(raw) ? raw[0] : raw
  if (!row || typeof row !== "object") {
    return { name: null, website: null, deadlineSourceUrl: null }
  }
  const o = row as {
    name?: string
    website?: string | null
    deadline_source_url?: string | null
  }
  return {
    name: o.name ?? null,
    website: o.website ?? null,
    deadlineSourceUrl: o.deadline_source_url ?? null,
  }
}

export default async function DeadlinesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: userCourses }, { data: essayRows }, { data: items }] =
    await Promise.all([
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
      target_university:target_university_id(name, website, deadline_source_url)
    `
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("user_courses").select("course_name, status").eq("user_id", user.id),
      supabase.from("user_essays").select("content").eq("user_id", user.id),
      supabase
        .from("user_checklist_items")
        .select("task_key, is_complete, completed_at")
        .eq("user_id", user.id),
    ])

  const targetMeta = targetUniversityMeta(profile?.target_university)
  const targetId = profile?.target_university_id ?? null
  const expectedTerm = profile?.expected_transfer_term ?? null

  const deadlineRows = await getCachedRequirementDeadlines(targetId, expectedTerm)

  const checklistProfile: ChecklistProfileSummary = {
    currentUniversityName: universityJoinName(profile?.current_university),
    targetUniversityName: targetMeta.name,
    targetMajor: profile?.target_major ?? null,
    fieldOfStudy: profile?.field_of_study ?? null,
    expectedTransferTerm: expectedTerm,
  }

  const completionMap: Record<string, { is_complete: boolean; completed_at: string | null }> =
    Object.fromEntries(
      (items ?? []).map((item) => [
        item.task_key,
        { is_complete: item.is_complete, completed_at: item.completed_at },
      ])
    )

  const userCourseRows: UserCourseRow[] = (userCourses ?? []).map((r) => ({
    course_name: r.course_name,
    status: r.status,
  }))

  const essayHasContent =
    essayRows?.some((e) => (e.content ?? "").trim().length > 0) ?? false

  const pageData = buildTasksDeadlinesData({
    profile: checklistProfile,
    completionMap,
    deadlineRows,
    targetUniversityId: targetId,
    targetSchoolName: targetMeta.name,
    targetWebsite: targetMeta.website,
    deadlineSourceUrl: targetMeta.deadlineSourceUrl,
    derived: {
      userCourses: userCourseRows,
      fieldOfStudy: checklistProfile.fieldOfStudy,
      creditsCompleted: profile?.credits_completed ?? null,
      gpa: profile?.gpa ?? null,
      essayHasContent,
    },
  })

  return (
    <ImmersiveBuildingShell buildingId="quad">
      <TasksDeadlinesClient
        userId={user.id}
        initialData={pageData}
        initialCompletionMap={completionMap}
        derivedInput={{
          userCourses: userCourseRows,
          fieldOfStudy: checklistProfile.fieldOfStudy,
          creditsCompleted: profile?.credits_completed ?? null,
          gpa: profile?.gpa ?? null,
          essayHasContent,
        }}
        hidePageHeader
      />
    </ImmersiveBuildingShell>
  )
}

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ImmersiveBuildingShell } from "@/components/campus-ui/immersive-building-shell"
import { hallKicker } from "@/lib/hall-kicker"
import { PlanClient, type PlanCourseRow } from "@/components/dashboard/plan-client"
import type { ChecklistProfileSummary } from "@/lib/checklist-task-definitions"
import { universityJoinName } from "@/lib/university-join"

export default async function PlanPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile, error: profileError } = await supabase
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

  if (profileError) {
    console.error("[dashboard/plan] failed to fetch profile:", profileError.message)
  }

  const { data: rawCourses, error: rawCoursesError } = await supabase
    .from("user_courses")
    .select("id, course_name, status, semester_taken, canonical_course_id")
    .eq("user_id", user.id)
    .order("course_name", { ascending: true })

  if (rawCoursesError) {
    console.error("[dashboard/plan] failed to fetch user_courses:", rawCoursesError.message)
  }

  const coursesRaw = rawCourses ?? []

  const courses: PlanCourseRow[] = coursesRaw.map((r) => ({
    id: r.id,
    course_name: r.course_name,
    status: (r.status as PlanCourseRow["status"]) ?? "planned",
    semester_taken: r.semester_taken,
    canonical_course_id: r.canonical_course_id,
  }))

  const checklistProfile: ChecklistProfileSummary = {
    currentUniversityName: universityJoinName(profile?.current_university),
    targetUniversityName: universityJoinName(profile?.target_university),
    targetMajor: profile?.target_major ?? null,
    fieldOfStudy: profile?.field_of_study ?? null,
    expectedTransferTerm: profile?.expected_transfer_term ?? null,
  }

  return (
    <ImmersiveBuildingShell
      buildingId="classroom"
      kicker={hallKicker({
        from: checklistProfile.currentUniversityName,
        to: checklistProfile.targetUniversityName,
        program: checklistProfile.targetMajor,
        term: checklistProfile.expectedTransferTerm,
      })}
    >
      <PlanClient
        userId={user.id}
        initialCourses={courses}
        checklistProfile={checklistProfile}
      />
    </ImmersiveBuildingShell>
  )
}

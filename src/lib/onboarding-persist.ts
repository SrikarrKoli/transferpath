import type { SupabaseClient } from "@supabase/supabase-js"
import type { OnboardingData } from "@/types/onboarding"

export async function persistOnboardingForUser(
  supabase: SupabaseClient,
  userId: string,
  profileEmail: string,
  data: OnboardingData
): Promise<{ error: string | null }> {
  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      id: userId,
      email: profileEmail,
      current_university_id: data.currentSchoolId || null,
      target_university_id: data.targetUniversityIds[0] || null,
      target_major: data.major,
      field_of_study: data.fieldOfStudy !== "" ? data.fieldOfStudy : "other",
      expected_transfer_term: data.targetSemester,
      gpa: data.gpa ? parseFloat(data.gpa) : null,
      credits_completed: data.creditsCompleted ? parseInt(data.creditsCompleted, 10) : null,
      notify_deadline_reminders: data.sendReminders,
    },
    { onConflict: "id" }
  )

  if (profileError) {
    return { error: profileError.message }
  }

  if (data.completedCourses.length > 0) {
    const { data: canonicalMatches, error: canonicalError } = await supabase
      .from("canonical_courses")
      .select("id, course_name")
      .in("course_name", data.completedCourses)

    if (canonicalError) {
      return { error: canonicalError.message }
    }

    const canonicalIdByName = new Map<string, string>()
    for (const c of canonicalMatches ?? []) {
      if (!canonicalIdByName.has(c.course_name)) canonicalIdByName.set(c.course_name, c.id)
    }

    const { error: coursesError } = await supabase.from("user_courses").insert(
      data.completedCourses.map((name) => ({
        user_id: userId,
        canonical_course_id: canonicalIdByName.get(name) ?? null,
        course_name: name,
        status: "completed" as const,
      }))
    )
    if (coursesError) {
      return { error: coursesError.message }
    }
  }

  return { error: null }
}

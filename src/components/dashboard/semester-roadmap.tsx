import Link from "next/link"
import { Target } from "lucide-react"

const MAX_VISIBLE_COURSES = 10

export interface SemesterRoadmapProps {
  courses: { course_name: string; status: string; semester_taken?: string | null }[]
  targetSchoolName: string | null
  transferTerm: string | null
}

const milestoneLinks = [
  { href: "/dashboard/deadlines", label: "Tasks & deadlines" },
  { href: "/dashboard/essay", label: "Essays" },
  { href: "/dashboard/requirements", label: "Requirements" },
] as const

export function SemesterRoadmap({
  courses,
  targetSchoolName,
  transferTerm,
}: SemesterRoadmapProps) {
  const visible = courses.slice(0, MAX_VISIBLE_COURSES)
  const remainder = Math.max(0, courses.length - MAX_VISIBLE_COURSES)

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors duration-150 sm:p-6 tp-interactive-panel">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Semester roadmap</h3>
        <Link
          href="/dashboard/plan"
          className="text-sm font-medium text-primary underline-offset-4 transition-colors duration-150 hover:underline"
        >
          View full plan →
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Courses you&apos;ve logged
          </p>
          {courses.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              No courses logged yet. Complete onboarding or add courses from your timeline when
              available.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {visible.map((c, i) => (
                  <span
                    key={`${c.course_name}-${i}`}
                    className="inline-flex flex-col rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground"
                    title={c.status}
                  >
                    <span>{c.course_name}</span>
                    {c.semester_taken?.trim() ? (
                      <span className="mt-0.5 text-micro font-normal text-muted-foreground">
                        {c.semester_taken.trim()}
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
              {remainder > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">+{remainder} more</p>
              )}
            </>
          )}
        </div>

        <div className="flex items-start gap-4 border-t border-border pt-4">
          <Target className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">
              Transfer to {targetSchoolName ?? "your target school"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Target term: {transferTerm ?? "not set yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Key milestones
        </p>
        <div className="flex flex-wrap gap-2">
          {milestoneLinks.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors duration-150 hover:bg-primary/15"
            >
              {m.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

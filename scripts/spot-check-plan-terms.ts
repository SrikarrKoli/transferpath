/**
 * Spot-check for buildPlanTerms with Maria-like multi-term data (Phase 5 wireframe).
 * Run: npx tsx scripts/spot-check-plan-terms.ts
 */
import { buildPlanTerms } from "../src/lib/build-plan-terms"
import { getCompletenessLadderState, shouldShowReadinessScore } from "../src/lib/completeness-ladder"

const mariaCourses = [
  { id: "1", course_name: "ENGL 1301", status: "completed" as const, semester_taken: "Fall 2025" },
  { id: "2", course_name: "HIST 1301", status: "completed" as const, semester_taken: "Fall 2025" },
  { id: "3", course_name: "MATH 2413", status: "completed" as const, semester_taken: "Fall 2025" },
  { id: "4", course_name: "ENGL 1302", status: "completed" as const, semester_taken: "Spring 2026" },
  { id: "5", course_name: "MATH 2414", status: "completed" as const, semester_taken: "Spring 2026" },
  { id: "6", course_name: "COSC 1336", status: "completed" as const, semester_taken: "Spring 2026" },
  { id: "7", course_name: "GOVT 2305", status: "in_progress" as const, semester_taken: "Summer 2026" },
  { id: "8", course_name: "COSC 1337", status: "planned" as const, semester_taken: "Fall 2026" },
  { id: "9", course_name: "MATH 2305", status: "planned" as const, semester_taken: "Fall 2026" },
  { id: "10", course_name: "PHYS 1401", status: "planned" as const, semester_taken: "Fall 2026" },
  { id: "11", course_name: "COSC 2436", status: "planned" as const, semester_taken: "Spring 2027" },
  { id: "12", course_name: "MATH 2318", status: "planned" as const, semester_taken: "Spring 2027" },
  { id: "13", course_name: "Core elective A", status: "planned" as const, semester_taken: null },
  { id: "14", course_name: "Core elective B", status: "planned" as const, semester_taken: "Foundation & core" },
]

const result = buildPlanTerms({
  courses: mariaCourses,
  expectedTransferTerm: "Fall 2027",
  targetSchoolName: "The University of Texas at Austin",
  todayYmd: "2026-08-04",
})

console.log("Rail labels:", result.railLabels.join(" → "))
for (const section of result.sections) {
  console.log(
    `[${section.kind}] ${section.termLabel} (${section.temporalState}) — ${section.courses.length} course(s)`
  )
}

const ladder = getCompletenessLadderState({
  hasTargetSchool: true,
  hasExpectedTransferTerm: true,
  courseCount: mariaCourses.length,
  nearestDeadlineDaysUntil: 42,
})
console.log("Ladder:", ladder, "show readiness:", shouldShowReadinessScore(ladder))

const expectedCalendar = 5
const calendarSections = result.sections.filter((s) => s.kind === "calendar")
if (calendarSections.length !== expectedCalendar) {
  console.error(`Expected ${expectedCalendar} calendar terms, got ${calendarSections.length}`)
  process.exit(1)
}
if (!result.railLabels.includes("Fall 2027")) {
  console.error("Missing entry term on rail")
  process.exit(1)
}
const unscheduled = result.sections.find((s) => s.kind === "unscheduled")
if (!unscheduled || unscheduled.courses.length !== 2) {
  console.error("Expected 2 unscheduled courses")
  process.exit(1)
}
const current = calendarSections.find((s) => s.temporalState === "current")
if (current?.termLabel !== "Summer 2026") {
  console.error(`Expected Summer 2026 as current, got ${current?.termLabel}`)
  process.exit(1)
}
console.log("Spot-check passed.")

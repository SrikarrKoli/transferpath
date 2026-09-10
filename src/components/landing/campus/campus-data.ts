export type BuildingId =
  | "counselor"
  | "classroom"
  | "registrar"
  | "library"
  | "quad"
  | "gym"
  | "dorm"
  | "union"

export type CampusTask = {
  label: string
  href: string
}

export type CampusProof = {
  label: string
  value: string
  note: string
}

export type CampusBuilding = {
  id: BuildingId
  name: string
  short: string
  feature: string
  blurb: string
  href: string
  cta: string
  tasks: CampusTask[]
  proof: CampusProof
  /** World-space footprint center for the 3D city */
  x: number
  z: number
}

export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  {
    id: "quad",
    name: "Clock Tower",
    short: "Deadlines",
    feature: "Deadlines",
    blurb: "The heart of campus for application windows and priority dates from official sources.",
    href: "/dashboard/deadlines",
    cta: "Enter Clock Tower",
    x: 0,
    z: -0.35,
    proof: {
      label: "Priority window",
      value: "Nov 1",
      note: "Fall transfer dates pull from official calendars once you set a target.",
    },
    tasks: [
      { label: "Tasks & deadlines", href: "/dashboard/deadlines" },
      { label: "Checklist", href: "/dashboard/checklist" },
    ],
  },
  {
    id: "counselor",
    name: "Counselor Hall",
    short: "Start here",
    feature: "Your situation",
    blurb: "Grand admin hall. Set school, target, major, and GPA to unlock the rest of campus.",
    href: "/onboarding",
    cta: "Enter Counselor Hall",
    x: 4.15,
    z: -0.55,
    proof: {
      label: "To unlock campus",
      value: "4 fields",
      note: "School, target, major, and GPA unlock the rest of campus.",
    },
    tasks: [
      { label: "Start onboarding", href: "/onboarding" },
      { label: "Today overview", href: "/dashboard" },
    ],
  },
  {
    id: "library",
    name: "Library",
    short: "Essays",
    feature: "Essays & materials",
    blurb: "Columned reading hall for drafting transfer essays and keeping writing in one place.",
    href: "/dashboard/essay",
    cta: "Enter Library",
    x: -0.15,
    z: 3.25,
    proof: {
      label: "Writing desk",
      value: "Essays",
      note: "Transfer prompts stay next to the rest of your plan.",
    },
    tasks: [{ label: "Work on essays", href: "/dashboard/essay" }],
  },
  {
    id: "classroom",
    name: "Classroom Building",
    short: "Courses",
    feature: "Semester roadmap",
    blurb: "Academic wings for planning courses term by term against real requirements.",
    href: "/dashboard/plan",
    cta: "Enter Classrooms",
    x: -1.85,
    z: -1.75,
    proof: {
      label: "This term",
      value: "3 courses",
      note: "Planned against requirements, not a blank calendar.",
    },
    tasks: [
      { label: "Semester roadmap", href: "/dashboard/plan" },
      { label: "Timeline", href: "/dashboard/timeline" },
    ],
  },
  {
    id: "registrar",
    name: "Registrar",
    short: "Credits",
    feature: "Requirements",
    blurb: "Records hall for credits, GPA floors, and what’s still open.",
    href: "/dashboard/requirements",
    cta: "Enter Registrar",
    x: 4.55,
    z: 2.55,
    proof: {
      label: "Requirements",
      value: "Open gaps",
      note: "Credits and GPA floors from your path.",
    },
    tasks: [
      { label: "Requirements", href: "/dashboard/requirements" },
      { label: "Path readiness", href: "/dashboard/competitiveness" },
    ],
  },
  {
    id: "dorm",
    name: "Dorms",
    short: "Checklist",
    feature: "Personal checklist",
    blurb: "Residence halls for transcripts, rec letters, and personal tasks that don’t live in a syllabus.",
    href: "/dashboard/checklist",
    cta: "Enter Dorms",
    x: -4.15,
    z: -2.15,
    proof: {
      label: "Personal tasks",
      value: "Checklist",
      note: "Transcripts, letters, and tasks that don’t live in any syllabus.",
    },
    tasks: [
      { label: "Open checklist", href: "/dashboard/checklist" },
      { label: "Tasks & deadlines", href: "/dashboard/deadlines" },
    ],
  },
  {
    id: "gym",
    name: "Rec Center",
    short: "Readiness",
    feature: "Honest readiness",
    blurb: "Rec complex and courts to train your planning score — not an admission prediction.",
    href: "/dashboard/competitiveness",
    cta: "Enter Rec Center",
    x: 3.15,
    z: 3.85,
    proof: {
      label: "Readiness",
      value: "Honest",
      note: "A planning signal, not an admission prediction.",
    },
    tasks: [{ label: "Path readiness", href: "/dashboard/competitiveness" }],
  },
  {
    id: "union",
    name: "Student Union",
    short: "Today",
    feature: "Today overview",
    blurb: "Cafe patio and union. Today’s hub for progress and next actions.",
    href: "/dashboard",
    cta: "Enter Student Union",
    x: -4.05,
    z: 1.05,
    proof: {
      label: "Today",
      value: "Next up",
      note: "Progress and next actions in one place.",
    },
    tasks: [
      { label: "Today overview", href: "/dashboard" },
      { label: "Settings", href: "/dashboard/settings" },
    ],
  },
]

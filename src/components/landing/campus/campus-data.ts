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

export type CampusBuilding = {
  id: BuildingId
  name: string
  short: string
  x: number
  z: number
  feature: string
  blurb: string
  stat: string
  href: string
  cta: string
  tasks: CampusTask[]
  /** Architecture kit used by the 3D builder */
  style: "neoclassical" | "brick" | "limestone" | "modern" | "tower" | "cafe"
}

/** Layout inspired by radial-quad campus concept art — not a copy. */
export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  {
    id: "quad",
    name: "Clock Tower",
    short: "Deadlines",
    x: 0,
    z: -2.2,
    feature: "Deadlines",
    blurb: "The heart of campus for application windows and priority dates from official sources.",
    stat: "DEADLINES",
    href: "/dashboard/deadlines",
    cta: "Enter Clock Tower",
    style: "tower",
    tasks: [
      { label: "Tasks & deadlines", href: "/dashboard/deadlines" },
      { label: "Checklist", href: "/dashboard/checklist" },
    ],
  },
  {
    id: "counselor",
    name: "Counselor Hall",
    short: "Start here",
    x: -11,
    z: 4.5,
    feature: "Your situation",
    blurb: "Grand admin hall. Set school, target, major, and GPA to unlock the rest of campus.",
    stat: "INTAKE",
    href: "/onboarding",
    cta: "Enter Counselor Hall",
    style: "neoclassical",
    tasks: [
      { label: "Start onboarding", href: "/onboarding" },
      { label: "Today overview", href: "/dashboard" },
    ],
  },
  {
    id: "library",
    name: "Library",
    short: "Essays",
    x: -9.5,
    z: -7.5,
    feature: "Essays & materials",
    blurb: "Columned reading hall for drafting transfer essays and keeping writing in one place.",
    stat: "ESSAYS",
    href: "/dashboard/essay",
    cta: "Enter Library",
    style: "neoclassical",
    tasks: [{ label: "Work on essays", href: "/dashboard/essay" }],
  },
  {
    id: "classroom",
    name: "Classroom Building",
    short: "Courses",
    x: 9,
    z: -6,
    feature: "Semester roadmap",
    blurb: "Academic wings for planning courses term by term against real requirements.",
    stat: "PLAN",
    href: "/dashboard/plan",
    cta: "Enter Classrooms",
    style: "limestone",
    tasks: [
      { label: "Semester roadmap", href: "/dashboard/plan" },
      { label: "Timeline", href: "/dashboard/timeline" },
    ],
  },
  {
    id: "registrar",
    name: "Registrar",
    short: "Credits",
    x: 10,
    z: 4.5,
    feature: "Requirements",
    blurb: "Records hall for credits, GPA floors, and what's still open.",
    stat: "REQUIREMENTS",
    href: "/dashboard/requirements",
    cta: "Enter Registrar",
    style: "limestone",
    tasks: [
      { label: "Requirements", href: "/dashboard/requirements" },
      { label: "Path readiness", href: "/dashboard/competitiveness" },
    ],
  },
  {
    id: "dorm",
    name: "Dorms",
    short: "Checklist",
    x: -2.5,
    z: 11,
    feature: "Personal checklist",
    blurb: "Brick residence halls for transcripts, rec letters, and personal tasks.",
    stat: "CHECKLIST",
    href: "/dashboard/checklist",
    cta: "Enter Dorms",
    style: "brick",
    tasks: [
      { label: "Open checklist", href: "/dashboard/checklist" },
      { label: "Tasks & deadlines", href: "/dashboard/deadlines" },
    ],
  },
  {
    id: "gym",
    name: "Rec Center",
    short: "Readiness",
    x: 12,
    z: -11,
    feature: "Honest readiness",
    blurb: "Modern rec complex and courts to train your planning score, not a prediction.",
    stat: "READINESS",
    href: "/dashboard/competitiveness",
    cta: "Enter Rec Center",
    style: "modern",
    tasks: [{ label: "Path readiness", href: "/dashboard/competitiveness" }],
  },
  {
    id: "union",
    name: "Student Union",
    short: "Hub",
    x: 1.5,
    z: -11,
    feature: "Today overview",
    blurb: "Cafe patio and union. Today's hub for progress and next actions.",
    stat: "TODAY",
    href: "/dashboard",
    cta: "Enter Student Union",
    style: "cafe",
    tasks: [
      { label: "Today overview", href: "/dashboard" },
      { label: "Settings", href: "/dashboard/settings" },
    ],
  },
]

export const TOUR_STEPS = [
  { id: "arrival", label: "Arrival", building: null },
  { id: "counselor", label: "Counselor", building: "counselor" as BuildingId },
  { id: "classroom", label: "Classes", building: "classroom" as BuildingId },
  { id: "registrar", label: "Credits", building: "registrar" as BuildingId },
  { id: "library", label: "Essays", building: "library" as BuildingId },
  { id: "quad", label: "Deadlines", building: "quad" as BuildingId },
  { id: "ready", label: "Ready", building: "gym" as BuildingId },
] as const

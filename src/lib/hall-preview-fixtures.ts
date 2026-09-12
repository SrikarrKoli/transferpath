import type { TasksDeadlinesData } from "@/types/tasks-deadlines"
import type { OverviewData } from "@/types/overview"
import type { RequirementsWorkspaceData } from "@/types/requirements-workspace"
import type { ChecklistWorkspaceData } from "@/types/checklist-workspace"

export const PREVIEW_KICKER = "Austin Community College → UT Austin · Computer Science · Fall 2027"

export const previewDeadlines: TasksDeadlinesData = {
  header: {
    fromInstitution: "Austin Community College",
    toInstitution: "The University of Texas at Austin",
    program: "Computer Science",
    term: "Fall 2027",
  },
  filterCounts: {
    upcoming: 6,
    tasks: 3,
    deadlines: 3,
    completed: 2,
    missing_dates: 0,
  },
  upcomingDeadlines: [
    {
      id: "pri",
      dateLabel: "1 Nov 2026",
      dueDateIso: "2026-11-01",
      countdownLabel: "51 days",
      title: "Priority application",
      scopeChip: "UT Austin",
      categoryMeta: "ApplyTexas",
      officialUrl: "https://www.utexas.edu/apply",
      provenance: { level: "verified", source: "UT Austin admissions", checkedAt: "2026-09-01" },
    },
    {
      id: "fafsa",
      dateLabel: "15 Jan 2027",
      dueDateIso: "2027-01-15",
      countdownLabel: "126 days",
      title: "FAFSA / TASFA",
      scopeChip: "Statewide",
      categoryMeta: "Aid",
      officialUrl: "https://studentaid.gov",
      provenance: { level: "verified", source: "Federal Student Aid", checkedAt: "2026-08-12" },
    },
    {
      id: "final",
      dateLabel: "1 Mar 2027",
      dueDateIso: "2027-03-01",
      countdownLabel: "171 days",
      title: "Final application",
      scopeChip: "UT Austin",
      categoryMeta: "ApplyTexas",
      officialUrl: "https://www.utexas.edu/apply",
      provenance: { level: "verified", source: "UT Austin admissions", checkedAt: "2026-09-01" },
    },
  ],
  openTasks: [
    {
      id: "transcript",
      title: "Order official ACC transcript",
      categoryLabel: "Application",
      status: "in_progress",
      done: false,
      meta: "Registrar holds the request",
      action: { label: "Checklist", href: "/dashboard/checklist" },
    },
    {
      id: "essay",
      title: "Finish Why transfer draft",
      categoryLabel: "Application",
      status: "in_progress",
      done: false,
      action: { label: "Library", href: "/dashboard/essay" },
    },
    {
      id: "eval",
      title: "Request one faculty evaluation",
      categoryLabel: "Preparation",
      status: "not_started",
      done: false,
    },
  ],
  completedTasks: [
    {
      id: "applytexas",
      title: "Create ApplyTexas account",
      categoryLabel: "Application",
      status: "done",
      done: true,
      meta: "Done 2 Sep 2026",
    },
    {
      id: "gpa",
      title: "Confirm calculated GPA",
      categoryLabel: "Preparation",
      status: "done",
      done: true,
    },
  ],
  missingDate: null,
}

export const previewToday: OverviewData = {
  completenessLadderState: "D",
  dateLine: "Thursday, 10 September",
  pathway: {
    fromInstitution: "Austin Community College",
    toInstitution: "The University of Texas at Austin",
    program: "Computer Science",
    term: "Fall 2027",
  },
  pathwayPrompt: null,
  nextAction: {
    title: "Priority application — UT Austin",
    dateLabel: "1 Nov 2026",
    scopeChips: ["UT Austin"],
    dueDetail: "51 days · ApplyTexas",
    primaryHref: "/dashboard/deadlines",
    primaryLabel: "Open Clock Tower",
    provenance: { level: "verified", source: "UT Austin admissions", checkedAt: "2026-09-01" },
  },
  comingUp: [
    {
      dateLabel: "15 Jan",
      title: "FAFSA / TASFA",
      meta: "Statewide aid window",
      href: "/dashboard/deadlines",
      actionLabel: "Register",
    },
    {
      dateLabel: "This week",
      title: "Order official ACC transcript",
      meta: "Application task",
      href: "/dashboard/checklist",
      actionLabel: "Dorms",
    },
  ],
  thisTerm: {
    termLabel: "Fall 2026",
    dateRange: "Aug – Dec",
    summary: "3 courses planned against COSC requirements",
    previewTitle: "COSC 1436 — Programming Fundamentals I",
    previewMeta: "in progress",
  },
  needsDate: null,
  readiness: {
    score: 62,
    oneLiner: "Courses and dates are on file; the essay is still open.",
    inputs: [],
    focusSentence: "A complete Why transfer draft moves this more than another elective.",
    showGpaNullNote: false,
  },
}

export const previewEssay = {
  title: "Why transfer",
  prompt:
    "Describe why you want to transfer to UT Austin’s Computer Science program. Be specific about faculty, labs, or a course of study you cannot finish at ACC.",
  wordLimit: 650,
  wordLimitIsDefault: true,
  draft:
    "I started at Austin Community College because I needed a schedule that could sit next to a night shift. Two years later the work is no longer enough: COSC 1436 made it clear I want systems, not just syntax, and ACC does not offer the architecture sequence I need.\n\nUT Austin’s Turing Scholars community and the undergraduate research track in the Department of Computer Science are the reason I am applying for Fall 2027. I want to finish the lower-division core cleanly this year — Calculus II, Physics I, and the second programming course — so I arrive ready for data structures, not catching up.",
  coach: [
    "Name the lab or faculty, not the rank of the school.",
    "The night-shift line is specific; keep it and cut the rest of the biography.",
  ],
  strengths: ["A concrete course gap, not a vibe.", "A term and a campus already chosen."],
}

export const previewRequirements: RequirementsWorkspaceData = {
  header: {
    title: "Requirements",
    titleItalic: "",
    subtitle: "What UT Austin still needs on this path.",
    fromInstitution: "Austin Community College",
    toInstitution: "The University of Texas at Austin",
    program: "Computer Science",
    term: "Fall 2027",
  },
  categories: [
    {
      id: "core",
      name: "Lower-division core",
      items: [
        {
          id: "calc2",
          code: "MATH 2414",
          title: "Calculus II",
          credits: 4,
          equiv: "M 408D",
          status: "missing",
          provenanceBasis: "UT Austin COSC transfer guide",
        },
        {
          id: "phys",
          code: "PHYS 2425",
          title: "Physics I",
          credits: 4,
          equiv: "PHY 303K",
          status: "missing",
        },
        {
          id: "cs1",
          code: "COSC 1436",
          title: "Programming Fundamentals I",
          credits: 4,
          equiv: "C S 312",
          status: "active",
        },
      ],
    },
  ],
  planningNotes: [],
  planningNotesIntro: "",
  timelineRows: [],
}

export const previewChecklist: ChecklistWorkspaceData = {
  header: {
    title: "Personal checklist",
    fromInstitution: "Austin Community College",
    toInstitution: "UT Austin",
    program: "Computer Science",
    term: "Fall 2027",
  },
  categories: [
    {
      id: "app",
      label: "Application",
      tasks: [
        { id: "atx", title: "ApplyTexas account", done: true },
        { id: "tr", title: "Official ACC transcript", done: false, urgent: true },
        { id: "rec", title: "Faculty evaluation", done: false },
      ],
    },
    {
      id: "prep",
      label: "Preparation",
      tasks: [
        { id: "gpa", title: "Confirm calculated GPA", done: true },
        { id: "resume", title: "One-page activities list", done: false },
      ],
    },
  ],
}

export const previewPlan = [
  {
    term: "Fall 2026",
    range: "Aug – Dec",
    courses: [
      { code: "COSC 1436", title: "Programming I", status: "in progress" },
      { code: "MATH 2413", title: "Calculus I", status: "in progress" },
      { code: "ENGL 1301", title: "Composition I", status: "logged" },
    ],
  },
  {
    term: "Spring 2027",
    range: "Jan – May",
    courses: [
      { code: "COSC 1437", title: "Programming II", status: "planned" },
      { code: "MATH 2414", title: "Calculus II", status: "planned" },
      { code: "PHYS 2425", title: "Physics I", status: "planned" },
    ],
  },
  {
    term: "Fall 2027",
    range: "entry",
    courses: [
      { title: "Entry — UT Austin", status: "" },
      { title: "Data structures after COSC 1437", status: "expected" },
    ],
  },
]

export const previewReadiness = {
  score: 62,
  line: "Courses and dates are on file; the Why transfer draft is still open.",
  rows: [
    { label: "Essay", value: "105 of 650 · still open", warn: true },
    { label: "Priority date", value: "1 Nov 2026" },
    { label: "Core logged", value: "0 of 3 complete · 1 in progress" },
  ],
}

export const previewCounselor = {
  school: "Austin Community College",
  target: "The University of Texas at Austin",
  major: "Computer Science",
  gpa: "3.71",
  term: "Fall 2027",
}

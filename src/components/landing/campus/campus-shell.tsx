"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { CTA_GET_STARTED, PRODUCT_NAME, TRUST_BADGES } from "@/lib/brand"
import { CAMPUS_BUILDINGS, TOUR_STEPS, type BuildingId } from "./campus-data"

const CampusScene = dynamic(() => import("./campus-scene").then((m) => m.CampusScene), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#6a7f52]">
      <p className="text-sm text-[#f4f1ea]/85">Loading campus map…</p>
    </div>
  ),
})

const ROUTES = [
  ["Dallas College", "UT Austin"],
  ["Collin", "Texas A&M"],
  ["ACC", "UH"],
  ["HCC", "Baylor"],
  ["TCC", "SMU"],
] as const

const BUILDING_PROOF: Partial<Record<BuildingId, { label: string; value: string; note: string }>> = {
  quad: {
    label: "Priority window",
    value: "Nov 1",
    note: "Fall transfer dates pull from official calendars once you set a target.",
  },
  counselor: {
    label: "Intake",
    value: "4 fields",
    note: "School, target, major, and GPA unlock the rest of campus.",
  },
  classroom: {
    label: "This term",
    value: "3 courses",
    note: "Planned against requirements, not a blank calendar.",
  },
  registrar: {
    label: "Requirements",
    value: "Open gaps",
    note: "Credits and GPA floors from your path.",
  },
  library: {
    label: "Essays",
    value: "One desk",
    note: "Transfer prompts stay next to the rest of your plan.",
  },
  dorm: {
    label: "Checklist",
    value: "Personal",
    note: "Transcripts, letters, and tasks that don’t live in any syllabus.",
  },
  gym: {
    label: "Readiness",
    value: "Honest",
    note: "A planning signal, not an admission prediction.",
  },
  union: {
    label: "Today",
    value: "Next up",
    note: "Progress and next actions in one place.",
  },
}

export function CampusShell() {
  const router = useRouter()
  const [selected, setSelected] = useState<BuildingId | null>("quad")
  const [hovered, setHovered] = useState<BuildingId | null>(null)
  const [focusToken, setFocusToken] = useState(0)
  const [tour, setTour] = useState(0)

  const active = useMemo(
    () => CAMPUS_BUILDINGS.find((b) => b.id === (selected || hovered)) ?? CAMPUS_BUILDINGS[0],
    [selected, hovered]
  )
  const proof = active ? BUILDING_PROOF[active.id] : undefined

  const selectBuilding = (id: BuildingId) => {
    setSelected(id)
    setFocusToken((n) => n + 1)
    const idx = TOUR_STEPS.findIndex((s) => s.building === id)
    if (idx >= 0) setTour(idx)
  }

  const enterBuilding = (id: BuildingId) => {
    const b = CAMPUS_BUILDINGS.find((x) => x.id === id)
    if (b) router.push(b.href)
  }

  return (
    <div className="campus-root relative min-h-[100dvh] bg-[#f4f1ea] text-[#1a2332]">
      {/* Hero = one L composition: copy rail + full-height map */}
      <section className="relative min-h-[100dvh] lg:grid lg:min-h-[100dvh] lg:grid-cols-[minmax(340px,400px)_minmax(0,1fr)]">
        <div className="relative z-20 flex flex-col border-[#1a2332]/10 bg-[#f4f1ea] lg:border-r">
          <header className="flex h-16 items-center justify-between px-5 sm:px-6">
            <Link href="/" className="font-heading text-[1.65rem] font-semibold tracking-tight sm:text-[1.85rem]">
              <span className="mr-2.5 inline-block size-3.5 rounded-[2px] bg-[#b85c38]" aria-hidden />
              {PRODUCT_NAME}
            </Link>
            <div className="flex items-center gap-4 lg:hidden">
              <Link href="/login" className="text-[15px] font-medium text-[#1a2332]">
                Log in
              </Link>
            </div>
          </header>

          <div className="flex flex-1 flex-col px-5 pb-6 pt-2 sm:px-6">
            <h1 className="text-balance font-heading text-[clamp(1.7rem,3.4vw,2.55rem)] font-semibold leading-[1.08] tracking-tight">
              Deadlines, courses, and essays for Texas transfer on one map.
            </h1>
            <p className="mt-3 text-[16px] leading-relaxed text-[#1a2332]/70">
              Pick a building. Open the real work behind it.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center rounded-sm bg-[#b85c38] px-7 py-3.5 text-[15px] font-semibold text-[#f4f1ea] hover:bg-[#a34f2f]"
              >
                {CTA_GET_STARTED}
              </Link>
              <Link href="/login" className="hidden text-[15px] font-medium text-[#1a2332]/70 hover:text-[#1a2332] lg:inline">
                Log in
              </Link>
            </div>

            <div className="mt-8 hidden min-h-0 flex-1 flex-col lg:flex">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1a2332]/45">
                Campus directory
              </p>
              <ul className="mt-2 overflow-y-auto">
                {CAMPUS_BUILDINGS.map((b, i) => {
                  const on = selected === b.id || hovered === b.id
                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => selectBuilding(b.id)}
                        className={`flex w-full items-baseline gap-3 px-2.5 py-2 text-left transition-colors ${
                          on ? "bg-[#1a2332] text-[#f4f1ea]" : "hover:bg-[#1a2332]/06"
                        }`}
                      >
                        <span
                          className={`font-mono text-sm font-semibold ${on ? "text-[#c9d0da]" : "text-[#1a2332]/40"}`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[15px] font-semibold leading-tight tracking-tight">
                            {b.name}
                          </span>
                          <span className={`mt-0.5 block text-[13px] ${on ? "text-[#f4f1ea]/70" : "text-[#1a2332]/55"}`}>
                            {b.feature}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            {active && (
              <div className="mt-auto border-t border-[#1a2332]/12 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1a2332]/45">
                      {active.feature}
                    </p>
                    <p className="mt-1 font-heading text-xl font-semibold tracking-tight">{active.name}</p>
                    {proof && (
                      <p className="mt-2 text-[15px] text-[#1a2332]/70">
                        <span className="font-heading text-lg font-semibold text-[#1a2332]">{proof.value}</span>
                        <span className="mx-2 text-[#1a2332]/30">·</span>
                        {proof.label}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => enterBuilding(active.id)}
                    className="shrink-0 border border-[#1a2332]/35 px-4 py-2.5 text-sm font-semibold text-[#1a2332] hover:bg-[#1a2332]/06"
                  >
                    {active.cta}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative flex min-h-[52vh] flex-col bg-[#6a7f52] lg:min-h-0">
          <div className="absolute right-5 top-5 z-20 hidden items-center gap-4 lg:flex">
            <a href="#how" className="text-[15px] font-medium text-[#f4f1ea]/90 hover:text-[#f4f1ea]">
              How it works
            </a>
          </div>
          <div className="relative min-h-[48vh] flex-1 overflow-hidden lg:min-h-0">
            <CampusScene
              selected={selected}
              hovered={hovered}
              focusToken={focusToken}
              onHover={setHovered}
              onSelect={selectBuilding}
              onEnter={enterBuilding}
            />
            <div className="absolute inset-x-0 top-0 flex gap-1 overflow-x-auto bg-[#ebe4d6]/92 p-2 lg:hidden">
              {CAMPUS_BUILDINGS.map((b, i) => {
                const on = selected === b.id
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => selectBuilding(b.id)}
                    className={`shrink-0 px-2.5 py-1.5 text-left text-xs ${
                      on ? "bg-[#1a2332] text-[#f4f1ea]" : "bg-[#f4f1ea]/80"
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-60">{String(i + 1).padStart(2, "0")}</span>{" "}
                    {b.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <main className="pb-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <section id="how" className="scroll-mt-16 border-t border-[#1a2332]/12 pt-14 sm:pt-16">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  Three stops from confused to clear.
                </h2>
                <ol className="mt-10 space-y-9">
                  {[
                    {
                      n: "01",
                      building: "Counselor Hall",
                      t: "Tell us your path",
                      d: "School, target, major, and GPA unlock the rest of the map.",
                    },
                    {
                      n: "02",
                      building: "Classrooms & Registrar",
                      t: "Plan against real requirements",
                      d: "Courses, credits, and what’s still open. Not a blank calendar.",
                    },
                    {
                      n: "03",
                      building: "Clock Tower",
                      t: "Hit every deadline",
                      d: "Application windows and personal tasks, kept visible.",
                    },
                  ].map((step) => (
                    <li key={step.t} className="flex gap-4">
                      <span
                        className="mt-1 flex size-9 shrink-0 items-center justify-center border border-[#1a2332]/20 bg-[#ebe4d6] font-mono text-xs font-semibold"
                        aria-hidden
                      >
                        {step.n}
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1a2332]/45">
                          {step.building}
                        </p>
                        <h3 className="mt-1.5 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                          {step.t}
                        </h3>
                        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[#1a2332]/68">{step.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  Common Texas routes
                </h2>
                <ul className="mt-10 space-y-4">
                  {ROUTES.map(([from, to]) => (
                    <li
                      key={from}
                      className="flex items-baseline gap-3 border-b border-[#1a2332]/10 pb-3 text-lg"
                    >
                      <span className="text-[#1a2332]/55">{from}</span>
                      <span className="text-[#1a2332]/30" aria-hidden>
                        →
                      </span>
                      <span className="font-heading font-semibold">{to}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="mt-20 mb-8 bg-[#b85c38] px-6 py-14 text-[#f4f1ea] sm:mt-24 sm:px-10 sm:py-16 lg:grid lg:grid-cols-[1.2fr_auto] lg:items-end lg:gap-10">
            <div>
              <h2 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Ready to walk your campus?
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#f4f1ea]/90">
                Free to start. Open the map, pick a building, and get to work.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 lg:mt-0 lg:justify-end">
              <Link
                href="/onboarding"
                className="rounded-sm bg-[#1a2332] px-7 py-3.5 text-sm font-semibold text-[#f4f1ea] hover:bg-[#243044]"
              >
                {CTA_GET_STARTED}
              </Link>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#f4f1ea]/85">
                {TRUST_BADGES.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#1a2332]/10 bg-[#f4f1ea]/94 px-3 py-2 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto">
          {TOUR_STEPS.map((step, i) => (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                setTour(i)
                if (step.building) selectBuilding(step.building)
              }}
              className={`shrink-0 px-3 py-1.5 text-[11px] font-medium ${
                i === tour ? "bg-[#1a2332] text-[#f4f1ea]" : "text-[#1a2332]/55 hover:bg-[#1a2332]/06"
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CTA_GET_STARTED, PRODUCT_NAME, REGION_TAGLINE } from "@/lib/brand"
import { createClient } from "@/lib/supabase/client"
import { campusEnterHref } from "@/lib/campus-immersion"
import { CAMPUS_BUILDINGS, type BuildingId } from "./campus-data"

const CampusScene = dynamic(() => import("./campus-scene").then((m) => m.CampusScene), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#c5d4c0]">
      <p className="font-heading text-lg font-semibold text-[#1a2332]">{PRODUCT_NAME}</p>
    </div>
  ),
})

const DIRECTORY_GROUPS: Partial<Record<BuildingId, string>> = {
  quad: "Start here", library: "Academics", dorm: "Campus life",
}

const LANDING_JOBS: Record<BuildingId, string> = {
  quad: "Track application dates.",
  counselor: "Set your transfer starting point.",
  library: "Draft your transfer essays.",
  classroom: "Plan courses term by term.",
  registrar: "Review credits and GPA requirements.",
  dorm: "Keep personal tasks in order.",
  gym: "Review your path readiness.",
  union: "See progress and next actions.",
}

function CampusWaymark() {
  return <svg className="campus-action-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 16h21m-7-7 7 7-7 7M5 11v10" /></svg>
}
function CampusSeal() {
  return <svg className="campus-brand-mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#f7f0df" /><path d="M8 9h16v5h-2l-1-3h-3v12h3v2H11v-2h3V11h-3l-1 3H8z" fill="currentColor" stroke="none" /><path d="M19 16h9m-3-3 3 3-3 3" fill="none" /></svg>
}
function directoryGroup(id: BuildingId) {
  return id === "quad" || id === "counselor" ? "Start here" : ["library", "classroom", "registrar"].includes(id) ? "Academics" : "Campus life"
}

export function CampusShell() {
  const router = useRouter()
  const [selected, setSelected] = useState<BuildingId | null>(null)
  const [hovered, setHovered] = useState<BuildingId | null>(null)
  const [focusToken, setFocusToken] = useState(0)
  const [sessionState, setSessionState] = useState<"loading" | "guest" | "member">("loading")

  const liveId = selected ?? hovered
  const live = CAMPUS_BUILDINGS.find((b) => b.id === liveId)
  const dock = CAMPUS_BUILDINGS.find((b) => b.id === selected)

  const selectBuilding = (id: BuildingId) => {
    setSelected((current) => current === id ? null : id)
    setFocusToken((n) => n + 1)
  }

  const enterBuilding = (id: BuildingId) => {
    const b = CAMPUS_BUILDINGS.find((x) => x.id === id)
    if (!b) return
    const session = sessionState === "member" ? "member" : "guest"
    router.push(campusEnterHref(b, session))
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        setSessionState(data.session?.user ? "member" : "guest")
      } catch {
        if (!cancelled) setSessionState("guest")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A" || tag === "SELECT") {
          return
        }
      }
      if (!selected) return
      const b = CAMPUS_BUILDINGS.find((x) => x.id === selected)
      if (!b) return
      const session = sessionState === "member" ? "member" : "guest"
      router.push(campusEnterHref(b, session))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selected, router, sessionState])

  return (
    <div className="campus-root flex h-[100dvh] overflow-hidden bg-[#c5d4c0] text-[#1a2332]">
      <aside className="campus-directory relative z-20 hidden w-[14.5rem] shrink-0 flex-col border-r border-[#1a2332]/10 bg-[#f4efe6] px-5 py-5 lg:flex">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <CampusSeal />
          <span className="campus-wordmark">Transfer<span>Path</span></span>
        </Link>

        <h1 className="mt-5 font-[family-name:var(--font-fraunces)] text-[1.35rem] font-semibold leading-[1.18] tracking-[-0.01em] text-[#1a2332]">
          Your transfer, mapped clearly.
        </h1>
        <p className="campus-intro mt-2 max-w-[14.5rem]">
          {REGION_TAGLINE}
        </p>

        <p className="campus-legend-heading">
          Directory
        </p>

        <ul className="campus-directory-list mt-2 -mx-1 min-h-0 flex-1 overflow-auto">
          {["quad", "counselor", "library", "classroom", "registrar", "dorm", "gym", "union"].map((id) => CAMPUS_BUILDINGS.find((b) => b.id === id)!).map((b) => {
            const on = selected === b.id
            return (
              <li key={b.id}>
                {DIRECTORY_GROUPS[b.id] && <p className="campus-directory-section">{DIRECTORY_GROUPS[b.id]}</p>}
                <button
                  type="button"
                  onClick={() => selectBuilding(b.id)}
                  onDoubleClick={() => enterBuilding(b.id)}
                  aria-pressed={selected === b.id}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); enterBuilding(b.id) } }}
                  onMouseEnter={() => setHovered(b.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`flex w-full items-baseline gap-2 py-2 pl-2.5 pr-1 text-left transition-colors ${
                    on
                      ? "bg-[rgba(26,35,50,0.03)] pl-2 font-semibold text-[#1a2332]"
                      : "text-[#1a2332]/72 hover:bg-[rgba(26,35,50,0.025)]"
                  }`}
                >
                  <span className="campus-legend-number" aria-hidden="true">{String(CAMPUS_BUILDINGS.findIndex((item) => item.id === b.id) + 1).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className={`block text-[13.5px] leading-tight ${on ? "font-semibold" : "font-medium"}`}>
                      {b.name}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <footer className="campus-directory-footer"><p><span className="campus-roundel is-selected" aria-hidden="true" /> Selected <span className="campus-roundel" aria-hidden="true" /> Destination</p></footer>
      </aside>

      <div className="campus-map-stage relative min-w-0 flex-1">
        <CampusScene
          selected={selected}
          hovered={hovered}
          focusToken={focusToken}
          onHover={setHovered}
          onSelect={selectBuilding}
          onEnter={enterBuilding}
        />

        <div className="campus-map-topbar hidden lg:flex">

          {sessionState === "member" ? (
            <Link
              href="/dashboard"
              className="pointer-events-auto border border-[#1a2332]/55 bg-[#f4efe6]/88 px-3 py-1.5 text-[12px] font-medium text-[#1a2332] backdrop-blur-sm hover:border-[#1a2332]/85"
            >
              <CampusWaymark /> Open campus
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="pointer-events-auto px-3 py-1.5 text-[12px] font-medium text-[#1a2332]/65 hover:text-[#1a2332]"
              >
                <CampusWaymark /> Log in
              </Link>
              <Link
                href="/onboarding"
                className="campus-start-link"
              >
                <CampusWaymark /> {CTA_GET_STARTED}
              </Link>
            </>
          )}
        </div>

        <div className="campus-mobile-nav absolute inset-x-0 top-4 z-20 px-3 lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 bg-[#f4efe6]/92 px-3 py-1.5">
              <CampusSeal />
              <span className="campus-wordmark">Transfer<span>Path</span></span>
            </Link>
            <Link
              href={sessionState === "member" ? "/dashboard" : "/onboarding"}
              className="bg-[#1a2332] px-3 py-1.5 text-xs font-medium text-[#f4efe6]"
            >
              <CampusWaymark /> {sessionState === "member" ? "Open campus" : CTA_GET_STARTED}
            </Link>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {CAMPUS_BUILDINGS.map((b) => {
              const on = selected === b.id
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => selectBuilding(b.id)}
                  onDoubleClick={() => enterBuilding(b.id)}
                  aria-pressed={selected === b.id}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); enterBuilding(b.id) } }}
                  className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-medium ${
                    on ? "bg-[#1a2332] text-[#f4efe6]" : "bg-[#f4efe6]/90 text-[#1a2332]/80"
                  }`}
                >
                  {b.name}
                </button>
              )
            })}
          </div>
        </div>


        <section data-building={dock?.id} className="campus-arrival-dock" aria-labelledby="campus-plaque-title">
          <div className="campus-cartouche-seal">{dock ? <span className="campus-roundel is-selected">{String(CAMPUS_BUILDINGS.findIndex(b => b.id === dock.id) + 1).padStart(2, "0")}</span> : <CampusSeal />}</div>
          <div className="campus-dock-copy">
            <small>{dock ? directoryGroup(dock.id) : "The campus · 8 destinations"}</small>
            <h2 id="campus-plaque-title">{dock ? dock.name : "Choose a building."}</h2>
            <p>{dock ? LANDING_JOBS[dock.id] : "Find your next step on campus."}</p>

          </div>
          {dock ? <Link className="campus-dock-enter" href={campusEnterHref(dock, sessionState === "member" ? "member" : "guest")}>{dock.cta} <CampusWaymark /></Link> : <div className="campus-interaction-hint">Click to preview · Double-click or Enter to go in</div>}
        </section>

      </div>

      <p className="sr-only" aria-live="polite">
        {live ? `${live.name}. ${live.feature}.` : "Explore the campus."}
      </p>
    </div>
  )
}

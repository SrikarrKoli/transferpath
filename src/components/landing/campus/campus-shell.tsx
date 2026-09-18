"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
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

export function CampusShell() {
  const router = useRouter()
  const plaqueRef = useRef<HTMLDivElement>(null)
  const leaderRef = useRef<SVGPathElement>(null)
  const markerRef = useRef<SVGCircleElement>(null)
  const tetherBuilding = useCallback((x: number, y: number) => {
    const plaque = plaqueRef.current
    if (!plaque || !leaderRef.current || !markerRef.current) return
    const endX = plaque.offsetLeft
    const endY = plaque.offsetTop + 28
    leaderRef.current.setAttribute("d", `M ${x} ${y} L ${endX - 22} ${endY} L ${endX} ${endY}`)
    markerRef.current.setAttribute("cx", String(x))
    markerRef.current.setAttribute("cy", String(y))
  }, [])
  const [selected, setSelected] = useState<BuildingId | null>(null)
  const [hovered, setHovered] = useState<BuildingId | null>(null)
  const [focusToken, setFocusToken] = useState(0)
  const [sessionState, setSessionState] = useState<"loading" | "guest" | "member">("loading")

  const liveId = selected ?? hovered
  const live = CAMPUS_BUILDINGS.find((b) => b.id === liveId)
  const dock = CAMPUS_BUILDINGS.find((b) => b.id === selected)

  const selectBuilding = (id: BuildingId) => {
    setSelected(id)
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
          <span
            className="flex size-6 items-center justify-center border border-[#1a2332]/55 font-[family-name:var(--font-fraunces)] text-[13px] font-semibold leading-none text-[#1a2332]/80"
            aria-hidden
          >
            T
          </span>
          <span className="font-[family-name:var(--font-fraunces)] text-[1.02rem] font-semibold tracking-tight text-[#1a2332]">
            {PRODUCT_NAME}
          </span>
        </Link>

        <h1 className="mt-5 font-[family-name:var(--font-fraunces)] text-[1.35rem] font-semibold leading-[1.18] tracking-[-0.01em] text-[#1a2332]">
          Your transfer, mapped clearly.
        </h1>
        <p className="mt-2 max-w-[14.5rem] text-[12.5px] leading-relaxed text-[#1a2332]/52">
          {REGION_TAGLINE}
        </p>

        <p className="mt-7 text-[10px] font-medium uppercase tracking-[0.14em] text-[#1a2332]/36">
          Directory
        </p>
        <p className="mt-1 text-[11px] text-[#1a2332]/55">New here? Start with Counselor Hall.</p>
        <ul className="campus-directory-list mt-2 -mx-1 min-h-0 flex-1 overflow-auto">
          {CAMPUS_BUILDINGS.map((b) => {
            const on = selected === b.id
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => selectBuilding(b.id)}
                  onDoubleClick={() => enterBuilding(b.id)}
                  aria-pressed={selected === b.id}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); enterBuilding(b.id) } }}
                  onMouseEnter={() => setHovered(b.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`flex w-full items-baseline gap-2 border-b border-[#1a2332]/08 py-2 pl-2.5 pr-1 text-left transition-colors ${
                    on
                      ? "border-l-2 border-l-[#1a2332] bg-[rgba(26,35,50,0.03)] pl-2 font-semibold text-[#1a2332]"
                      : "border-l-2 border-l-transparent text-[#1a2332]/72 hover:bg-[rgba(26,35,50,0.025)]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className={`block text-[13.5px] leading-tight ${on ? "font-semibold" : "font-medium"}`}>
                      {b.name}
                    </span>
                    <span className="block text-[11.5px] font-normal text-[#1a2332]/42">{b.feature}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

      </aside>

      <div className="campus-map-stage relative min-w-0 flex-1">
        <CampusScene
          selected={selected}
          hovered={hovered}
          focusToken={focusToken}
          onHover={setHovered}
          onSelect={selectBuilding}
          onEnter={enterBuilding}
          onAnchor={tetherBuilding}
        />

        <div className="campus-map-topbar hidden lg:flex">
          <span className="mr-auto text-[11px] uppercase tracking-[0.13em]">TransferPath campus</span>
          {sessionState === "member" ? (
            <Link
              href="/dashboard"
              className="pointer-events-auto border border-[#1a2332]/55 bg-[#f4efe6]/88 px-3 py-1.5 text-[12px] font-medium text-[#1a2332] backdrop-blur-sm hover:border-[#1a2332]/85"
            >
              Open campus
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="pointer-events-auto px-3 py-1.5 text-[12px] font-medium text-[#1a2332]/65 hover:text-[#1a2332]"
              >
                Log in
              </Link>
              <Link
                href="/onboarding"
                className="pointer-events-auto bg-[#1a2332] px-3.5 py-1.5 text-[12px] font-medium text-[#f4efe6] shadow-[0_1px_0_rgba(26,35,50,0.25)] hover:bg-[#1a2332]/92"
              >
                {CTA_GET_STARTED}
              </Link>
            </>
          )}
        </div>

        <div className="absolute inset-x-0 top-4 z-20 px-3 lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 bg-[#f4efe6]/92 px-3 py-1.5">
              <span
                className="flex size-5 items-center justify-center border border-[#1a2332]/55 font-[family-name:var(--font-fraunces)] text-[11px] font-semibold text-[#1a2332]/80"
                aria-hidden
              >
                T
              </span>
              <span className="font-[family-name:var(--font-fraunces)] text-sm font-semibold">{PRODUCT_NAME}</span>
            </Link>
            <Link
              href={sessionState === "member" ? "/dashboard" : "/onboarding"}
              className="bg-[#1a2332] px-3 py-1.5 text-xs font-medium text-[#f4efe6]"
            >
              {sessionState === "member" ? "Open campus" : CTA_GET_STARTED}
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
                  {b.short}
                </button>
              )
            })}
          </div>
        </div>


        {dock ? (
          <>
            <svg className="campus-tether" aria-hidden="true">
              <path ref={leaderRef} fill="none" stroke="#5c645e" strokeWidth="1" />
              <circle ref={markerRef} r="4" fill="#f4efe6" stroke="#5c645e" strokeWidth="1" />
            </svg>
            <div ref={plaqueRef} className="campus-plaque" aria-labelledby="campus-plaque-title">
            <div>
              <div className="flex flex-col gap-3 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <h2 id="campus-plaque-title" className="mt-1 font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-[-0.01em] text-[#1a2332] sm:text-[1.35rem]">
                    {dock.name}
                  </h2>
                  <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-[#1a2332]/70">{LANDING_JOBS[dock.id]}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={campusEnterHref(dock, sessionState === "member" ? "member" : "guest")}
                    className="bg-[#1a2332] px-4 py-2.5 text-center text-[13px] font-medium text-[#f4efe6] hover:bg-[#1a2332]/90"
                  >
                    Enter →
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setSelected(null); setFocusToken((n) => n + 1) }}
                    className="px-3 py-2.5 text-[13px] font-medium text-[#1a2332]/65 hover:text-[#1a2332]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          </>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {live ? `${live.name}. ${live.feature}.` : "Explore the campus."}
      </p>
    </div>
  )
}

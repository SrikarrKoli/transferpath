"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CTA_GET_STARTED, PRODUCT_NAME, REGION_TAGLINE, TAGLINE } from "@/lib/brand"
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

export function CampusShell() {
  const router = useRouter()
  const [selected, setSelected] = useState<BuildingId | null>(null)
  const [hovered, setHovered] = useState<BuildingId | null>(null)
  const [focusToken, setFocusToken] = useState(0)
  const [sessionState, setSessionState] = useState<"loading" | "guest" | "member">("loading")

  const liveId = hovered ?? selected
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
      <aside className="relative z-20 hidden w-[17.5rem] shrink-0 flex-col border-r border-[#1a2332]/10 bg-[#f4efe6] px-6 py-7 lg:flex">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="size-2 rounded-[1px] bg-[#1a2332]" aria-hidden />
          <span className="font-heading text-[1.05rem] font-semibold tracking-tight">{PRODUCT_NAME}</span>
        </Link>

        <h1 className="mt-8 font-heading text-[1.55rem] font-semibold leading-[1.12] tracking-tight text-[#1a2332]">
          {TAGLINE.replace(/\.$/, "")}.
        </h1>
        <p className="mt-3 max-w-[16rem] text-[13px] leading-relaxed text-[#1a2332]/55">
          {REGION_TAGLINE}
        </p>

        <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1a2332]/35">
          Directory
        </p>
        <ul className="mt-3 -mx-1 min-h-0 flex-1 overflow-auto">
          {CAMPUS_BUILDINGS.map((b) => {
            const on = selected === b.id || hovered === b.id
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => enterBuilding(b.id)}
                  onMouseEnter={() => setHovered(b.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`flex w-full items-baseline gap-3 border-b border-[#1a2332]/10 px-1 py-2.5 text-left transition-colors ${
                    on ? "text-[#1a2332] shadow-[inset_0_-1.5px_0_#1a2332]" : "text-[#1a2332]/78 hover:bg-[#1a2332]/03"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold leading-tight">{b.name}</span>
                    <span className="block text-[12px] text-[#1a2332]/45">{b.feature}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {/* Single onboarding cue for the whole landing */}
        {sessionState !== "member" ? (
          <p className="pt-5 text-[12px] leading-snug text-[#1a2332]/50">
            New?{" "}
            <Link href="/onboarding" className="font-semibold text-[#1a2332] underline-offset-2 hover:underline">
              Start in Counselor Hall
            </Link>
          </p>
        ) : (
          <p className="pt-5 text-[12px] text-[#1a2332]/45">Signed in</p>
        )}
      </aside>

      <div className="relative min-w-0 flex-1">
        <CampusScene
          selected={selected}
          hovered={hovered}
          focusToken={focusToken}
          onHover={setHovered}
          onSelect={selectBuilding}
          onEnter={enterBuilding}
        />

        <div className="pointer-events-none absolute right-4 top-4 z-30 flex gap-2">
          {sessionState === "member" ? (
            <Link
              href="/dashboard"
              className="pointer-events-auto border border-[#1a2332]/85 bg-[#1a2332] px-3.5 py-1.5 text-[13px] font-medium text-[#f4efe6] hover:bg-[#1a2332]/90"
            >
              Open campus
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="pointer-events-auto border border-[#1a2332]/25 bg-[#f4efe6]/90 px-3.5 py-1.5 text-[13px] font-medium text-[#1a2332] backdrop-blur-sm hover:border-[#1a2332]/45"
              >
                Log in
              </Link>
              <Link
                href="/onboarding"
                className="pointer-events-auto border border-[#1a2332] bg-[#1a2332] px-3.5 py-1.5 text-[13px] font-medium text-[#f4efe6] hover:bg-[#1a2332]/90"
              >
                {CTA_GET_STARTED}
              </Link>
            </>
          )}
        </div>

        <div className="absolute inset-x-0 top-4 z-20 px-3 lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 bg-[#f4efe6]/92 px-3 py-1.5">
              <span className="size-1.5 bg-[#1a2332]" aria-hidden />
              <span className="font-heading text-sm font-semibold">{PRODUCT_NAME}</span>
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
                  onClick={() => enterBuilding(b.id)}
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

        {/* Name only — no how-to chrome */}
        {hovered && !selected && live ? (
          <div className="pointer-events-none absolute left-1/2 top-[16%] z-20 -translate-x-1/2">
            <div className="bg-[#1a2332]/88 px-3.5 py-1.5 text-[13px] font-medium tracking-tight text-[#f4efe6]">
              {live.name}
            </div>
          </div>
        ) : null}

        {dock ? (
          <div className="absolute inset-x-0 bottom-0 z-30 p-3 sm:p-5">
            <div className="mx-auto flex max-w-2xl flex-col gap-3 border border-[#1a2332]/85 bg-[#f4efe6]/97 p-4 sm:flex-row sm:items-end sm:gap-5">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1a2332]/45">
                  {dock.feature}
                </p>
                <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight sm:text-[1.35rem]">
                  {dock.name}
                </h2>
                <p className="mt-1 max-w-md text-[13px] leading-relaxed text-[#1a2332]/62">{dock.blurb}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={campusEnterHref(dock, sessionState === "member" ? "member" : "guest")}
                  className="border border-[#1a2332] bg-[#1a2332] px-4 py-2.5 text-center text-[13px] font-medium text-[#f4efe6] hover:bg-[#1a2332]/90"
                >
                  {sessionState === "member" || dock.href.startsWith("/onboarding")
                    ? dock.cta
                    : `Enter ${dock.short}`}
                </Link>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="px-3 py-2.5 text-[13px] font-medium text-[#1a2332]/50 hover:text-[#1a2332]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {live ? `${live.name}. ${live.feature}.` : "Explore the campus."}
      </p>
    </div>
  )
}

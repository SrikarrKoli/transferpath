"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CTA_GET_STARTED, PRODUCT_NAME } from "@/lib/brand"
import { CAMPUS_BUILDINGS, type BuildingId } from "./campus-data"

const CampusScene = dynamic(() => import("./campus-scene").then((m) => m.CampusScene), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#a8d8e6]">
      <p className="font-heading text-lg font-semibold text-[#1a2332]">{PRODUCT_NAME}</p>
    </div>
  ),
})

export function CampusShell() {
  const router = useRouter()
  const [selected, setSelected] = useState<BuildingId | null>(null)
  const [hovered, setHovered] = useState<BuildingId | null>(null)
  const [focusToken, setFocusToken] = useState(0)

  const liveId = hovered ?? selected
  const live = CAMPUS_BUILDINGS.find((b) => b.id === liveId)
  const dock = CAMPUS_BUILDINGS.find((b) => b.id === selected)

  const selectBuilding = (id: BuildingId) => {
    setSelected(id)
    setFocusToken((n) => n + 1)
  }
  const enterBuilding = (id: BuildingId) => {
    const b = CAMPUS_BUILDINGS.find((x) => x.id === id)
    if (b) router.push(b.href)
  }

  return (
    <div className="campus-root flex h-[100dvh] overflow-hidden bg-[#a8d8e6] text-[#1a2332]">
      <aside className="relative z-20 hidden w-[18.5rem] shrink-0 flex-col border-r border-[#1a2332]/08 bg-[#f7f2e8] px-6 py-6 lg:flex">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="size-2.5 rounded-[2px] bg-[#b85c38]" aria-hidden />
          <span className="font-heading text-xl font-semibold tracking-tight">{PRODUCT_NAME}</span>
        </Link>
        <h1 className="mt-6 font-heading text-[1.65rem] font-semibold leading-[1.15] tracking-tight">
          A campus you can actually walk.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#1a2332]/58">
          Deadlines, courses, and essays — click a building on the map.
        </p>
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1a2332]/38">Campus directory</p>
        <ul className="mt-2 -mx-2 min-h-0 flex-1 overflow-auto">
          {CAMPUS_BUILDINGS.map((b, i) => {
            const on = selected === b.id || hovered === b.id
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => selectBuilding(b.id)}
                  onMouseEnter={() => setHovered(b.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`flex w-full items-baseline gap-3 rounded-md px-2 py-2 text-left ${
                    on ? "bg-[#1a2332] text-[#f7f2e8]" : "hover:bg-[#1a2332]/06"
                  }`}
                >
                  <span className={`font-mono text-[13px] font-semibold ${on ? "text-[#e8b09a]" : "text-[#b85c38]"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold leading-tight">{b.name}</span>
                    <span className={`block text-[12px] ${on ? "text-[#f7f2e8]/70" : "text-[#1a2332]/52"}`}>{b.feature}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <p className="pt-4 text-xs text-[#1a2332]/42">Drag to look around · Scroll to zoom</p>
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
          <Link href="/login" className="pointer-events-auto rounded-full bg-[#f7f2e8]/92 px-4 py-2 text-sm font-medium shadow-sm hover:bg-white">
            Log in
          </Link>
          <Link href="/onboarding" className="pointer-events-auto rounded-full bg-[#b85c38] px-4 py-2 text-sm font-semibold text-[#f7f2e8] hover:bg-[#a34f2f]">
            {CTA_GET_STARTED}
          </Link>
        </div>

        <div className="absolute inset-x-0 top-4 z-20 px-3 lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-[#f7f2e8]/92 px-3 py-1.5">
              <span className="size-2 rounded-[2px] bg-[#b85c38]" aria-hidden />
              <span className="font-heading text-base font-semibold">{PRODUCT_NAME}</span>
            </Link>
            <Link href="/onboarding" className="rounded-full bg-[#b85c38] px-3 py-1.5 text-xs font-semibold text-[#f7f2e8]">
              {CTA_GET_STARTED}
            </Link>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {CAMPUS_BUILDINGS.map((b, i) => {
              const on = selected === b.id
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => selectBuilding(b.id)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                    on ? "bg-[#1a2332] text-[#f7f2e8]" : "bg-[#f7f2e8]/90 text-[#1a2332]/80"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")} {b.short}
                </button>
              )
            })}
          </div>
        </div>

        {hovered && !selected && live ? (
          <div className="pointer-events-none absolute left-1/2 top-[18%] z-20 -translate-x-1/2">
            <div className="rounded-full bg-[#1a2332]/90 px-4 py-2 text-sm font-medium text-[#f7f2e8]">
              {live.name}
              <span className="mx-2 opacity-40">·</span>
              <span className="opacity-80">{live.feature}</span>
            </div>
          </div>
        ) : null}

        {dock ? (
          <div className="absolute inset-x-0 bottom-0 z-30 p-3 sm:p-5">
            <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-[#1a2332]/08 bg-[#f7f2e8]/94 p-4 shadow-[0_22px_50px_-28px_rgba(26,35,50,0.5)] sm:flex-row sm:items-end sm:gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b85c38]">{dock.feature}</p>
                  <p className="rounded-full bg-[#1a2332]/06 px-2.5 py-0.5 text-xs font-medium text-[#1a2332]/70">
                    {dock.proof.value}
                    <span className="mx-1 opacity-40">·</span>
                    {dock.proof.label}
                  </p>
                </div>
                <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight sm:text-2xl">{dock.name}</h2>
                <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[#1a2332]/68">{dock.blurb}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => enterBuilding(dock.id)}
                  className="rounded-full bg-[#b85c38] px-5 py-3 text-sm font-semibold text-[#f7f2e8] hover:bg-[#a34f2f]"
                >
                  {dock.cta}
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full px-4 py-3 text-sm font-medium text-[#1a2332]/55 hover:bg-[#1a2332]/06"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {live ? `${live.name}. ${live.feature}.` : "Explore the campus city."}
      </p>
    </div>
  )
}

"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { CTA_GET_STARTED, PRODUCT_NAME } from "@/lib/brand"
import { CAMPUS_BUILDINGS, type BuildingId } from "./campus-data"

const CampusScene = dynamic(() => import("./campus-scene").then((m) => m.CampusScene), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#f4f1ea]">
      <div className="text-center">
        <p className="font-heading text-lg font-semibold text-[#1a2332]">{PRODUCT_NAME}</p>
        <p className="mt-2 text-sm text-[#1a2332]/55">Opening campus…</p>
      </div>
    </div>
  ),
})

const PROOF: Partial<Record<BuildingId, { label: string; value: string }>> = {
  quad: { label: "Priority window", value: "Nov 1" },
  counselor: { label: "To unlock campus", value: "4 fields" },
  classroom: { label: "This term", value: "3 courses" },
  registrar: { label: "Requirements", value: "Open gaps" },
  library: { label: "Writing desk", value: "Essays" },
  dorm: { label: "Personal tasks", value: "Checklist" },
  gym: { label: "Readiness", value: "Honest" },
  union: { label: "Today", value: "Next up" },
}

export function CampusShell() {
  const router = useRouter()
  const [selected, setSelected] = useState<BuildingId | null>(null)
  const [hovered, setHovered] = useState<BuildingId | null>(null)
  const [focusToken, setFocusToken] = useState(0)

  const activeId = selected || hovered
  const active = useMemo(
    () => (activeId ? CAMPUS_BUILDINGS.find((b) => b.id === activeId) : undefined),
    [activeId]
  )
  const proof = active ? PROOF[active.id] : undefined
  const showCard = Boolean(selected && active)

  const selectBuilding = (id: BuildingId) => {
    setSelected(id)
    setFocusToken((n) => n + 1)
  }

  const enterBuilding = (id: BuildingId) => {
    const b = CAMPUS_BUILDINGS.find((x) => x.id === id)
    if (b) router.push(b.href)
  }

  return (
    <div className="campus-root relative h-[100dvh] overflow-hidden bg-[#f4f1ea] text-[#1a2332]">
      {/* Full-page campus — the whole product hook */}
      <div className="absolute inset-0">
        <CampusScene
          selected={selected}
          hovered={hovered}
          focusToken={focusToken}
          onHover={setHovered}
          onSelect={selectBuilding}
          onEnter={enterBuilding}
        />
      </div>

      {/* Soft edge vignette so UI stays readable */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(244,241,234,0.92) 0%, rgba(244,241,234,0.2) 14%, transparent 28%, transparent 72%, rgba(244,241,234,0.55) 100%), linear-gradient(90deg, rgba(244,241,234,0.55) 0%, transparent 18%, transparent 82%, rgba(244,241,234,0.35) 100%)",
        }}
        aria-hidden
      />

      {/* Top chrome */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4 sm:p-5">
        <div className="pointer-events-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-full bg-[#f4f1ea]/92 px-3.5 py-2 shadow-[0_8px_28px_-16px_rgba(26,35,50,0.45)] backdrop-blur-md"
          >
            <span className="size-2.5 rounded-[2px] bg-[#b85c38]" aria-hidden />
            <span className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
              {PRODUCT_NAME}
            </span>
          </Link>
          <p className="mt-2 max-w-[16rem] pl-1 text-sm text-[#1a2332]/65 sm:max-w-xs">
            Texas transfer — click a building to get to work.
          </p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full bg-[#f4f1ea]/88 px-4 py-2 text-sm font-medium text-[#1a2332] shadow-[0_8px_28px_-16px_rgba(26,35,50,0.4)] backdrop-blur-md hover:bg-[#f4f1ea]"
          >
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-[#b85c38] px-4 py-2 text-sm font-semibold text-[#f4f1ea] shadow-[0_10px_28px_-12px_rgba(184,92,56,0.65)] hover:bg-[#a34f2f]"
          >
            {CTA_GET_STARTED}
          </Link>
        </div>
      </header>

      {/* Hover toast — light, friendly */}
      {hovered && !selected && active && (
        <div className="pointer-events-none absolute left-1/2 top-[18%] z-20 -translate-x-1/2 px-4">
          <div className="rounded-full bg-[#1a2332]/90 px-4 py-2 text-sm font-medium text-[#f4f1ea] shadow-lg backdrop-blur-md">
            {active.name}
            <span className="mx-2 opacity-40">·</span>
            <span className="opacity-80">{active.feature}</span>
          </div>
        </div>
      )}

      {/* Empty-state hint */}
      {!selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center px-4 sm:bottom-10">
          <p className="rounded-full bg-[#f4f1ea]/90 px-5 py-2.5 text-sm text-[#1a2332]/70 shadow-[0_10px_30px_-18px_rgba(26,35,50,0.5)] backdrop-blur-md">
            Click a building · Drag to look around · Scroll to zoom
          </p>
        </div>
      )}

      {/* Selected building — friendly action card */}
      {showCard && active && (
        <div className="absolute inset-x-0 bottom-0 z-30 p-3 sm:p-5">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-[#1a2332]/08 bg-[#f4f1ea]/95 p-4 shadow-[0_20px_50px_-24px_rgba(26,35,50,0.45)] backdrop-blur-xl sm:flex-row sm:items-end sm:gap-6 sm:p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b85c38]">
                  {active.feature}
                </p>
                {proof && (
                  <p className="rounded-full bg-[#1a2332]/06 px-2.5 py-0.5 text-xs font-medium text-[#1a2332]/70">
                    {proof.value}
                    <span className="mx-1 opacity-40">·</span>
                    {proof.label}
                  </p>
                )}
              </div>
              <h2 className="mt-1.5 font-heading text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {active.name}
              </h2>
              <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-[#1a2332]/68">
                {active.blurb}
              </p>
              {active.tasks.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {active.tasks.map((t) => (
                    <li key={t.href}>
                      <Link
                        href={t.href}
                        className="inline-flex rounded-full border border-[#1a2332]/12 bg-white/50 px-3 py-1.5 text-xs font-medium text-[#1a2332]/80 hover:border-[#1a2332]/25 hover:bg-white"
                      >
                        {t.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
              <button
                type="button"
                onClick={() => enterBuilding(active.id)}
                className="flex-1 rounded-full bg-[#b85c38] px-6 py-3 text-sm font-semibold text-[#f4f1ea] hover:bg-[#a34f2f] sm:flex-none"
              >
                {active.cta.replace(/^Enter /, "Go to ")}
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full px-4 py-3 text-sm font-medium text-[#1a2332]/55 hover:bg-[#1a2332]/06 hover:text-[#1a2332]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile quick picks */}
      <div className="absolute inset-x-0 top-[4.75rem] z-20 px-3 sm:hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CAMPUS_BUILDINGS.map((b, i) => {
            const on = selected === b.id
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => selectBuilding(b.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md ${
                  on
                    ? "bg-[#1a2332] text-[#f4f1ea]"
                    : "bg-[#f4f1ea]/88 text-[#1a2332]/80 shadow-sm"
                }`}
              >
                <span className="font-mono opacity-60">{String(i + 1).padStart(2, "0")}</span>{" "}
                {b.short}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

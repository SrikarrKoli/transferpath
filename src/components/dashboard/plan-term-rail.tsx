"use client"

import { cn } from "@/lib/utils"
import type { PlanTermSection } from "@/types/plan-terms"

interface PlanTermRailProps {
  sections: PlanTermSection[]
  activeLabel: string | null
  onSelect: (termLabel: string) => void
}

export function PlanTermRail({ sections, activeLabel, onSelect }: PlanTermRailProps) {
  return (
    <nav aria-label="Plan terms" className="space-y-1">
      <p className="tp-eyebrow mb-3 text-muted-foreground">Terms</p>
      <ul className="space-y-1">
        {sections.map((section) => {
          const isActive = activeLabel === section.termLabel
          const isCurrent = section.temporalState === "current"
          const isEntry = section.kind === "entry_marker"

          return (
            <li key={`${section.kind}-${section.termLabel}`}>
              <button
                type="button"
                onClick={() => onSelect(section.termLabel)}
                className={cn(
                  "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  isActive
                    ? "bg-accent/10 font-medium text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="line-clamp-2">{section.termLabel}</span>
                {isCurrent ? (
                  <span className="mt-0.5 block text-micro text-accent">· now</span>
                ) : null}
                {isEntry ? (
                  <span className="mt-0.5 block text-micro text-muted-foreground">· entry</span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

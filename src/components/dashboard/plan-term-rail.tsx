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
    <nav aria-label="Plan terms" className="plan-term-index">
      <p className="tp-eyebrow text-muted-foreground">Term spine</p>
      <ul>
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
                  "plan-term-index-button",
                  isActive
                    ? "is-active"
                    : undefined
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

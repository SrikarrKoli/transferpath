"use client"

import type { Ref } from "react"
import type { EssayPromptId } from "@/lib/build-essay-workspace-feedback"

export const LIBRARY_PROMPTS: { id: EssayPromptId; label: string }[] = [
  { id: "why_transfer", label: "Why transfer" },
  { id: "leadership", label: "Leadership" },
  { id: "diversity", label: "Diversity" },
  { id: "extracurricular", label: "Extracurricular" },
  { id: "other", label: "Other" },
]

export function LibraryPromptIndex({ indexRef, activeType, essayMap, onSwitch }: {
  indexRef: Ref<HTMLElement>
  activeType: EssayPromptId
  essayMap: Record<string, { content: string | null; word_limit?: number | null }>
  onSwitch: (id: EssayPromptId) => void
}) {
  return (
    <nav ref={indexRef} className="library-prompt-index" aria-label="Essay prompts">
      <div className="library-index-heading">
        <p className="library-index-label hall-caption">Manuscript index</p>

      </div>
      <div className="library-prompt-tabs">
        {LIBRARY_PROMPTS.map((prompt, index) => {
          const words = (essayMap[prompt.id]?.content ?? "").trim().split(/\s+/).filter(Boolean).length
          return (
            <button key={prompt.id} type="button" onClick={() => onSwitch(prompt.id)}
              className={`library-prompt-tab${activeType === prompt.id ? " is-active" : ""}`}
              aria-current={activeType === prompt.id ? "page" : undefined}>
              <span className="library-folio-number">{String(index + 1).padStart(2, "0")}</span>
              <span>
                <span className="block">{prompt.label}</span>
                <span className="library-folio-state">{words ? `${words} / ${essayMap[prompt.id]?.word_limit ?? 650} words` : "Not started"}</span>
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

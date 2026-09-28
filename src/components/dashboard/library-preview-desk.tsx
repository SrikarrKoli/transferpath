"use client"

import { useRef, useState } from "react"
import { EssayWorkspaceUi } from "@/components/dashboard/essay-workspace-ui"
import { LIBRARY_PROMPTS, LibraryPromptIndex } from "@/components/dashboard/library-prompt-index"
import { previewEssay, previewEssayMap } from "@/lib/hall-preview-fixtures"
import type { EssayPromptId } from "@/lib/build-essay-workspace-feedback"

export function LibraryPreviewDesk() {
  const [activeType, setActiveType] = useState<EssayPromptId>("why_transfer")
  const [drafts, setDrafts] = useState(previewEssayMap)
  const [saved, setSaved] = useState<Partial<Record<EssayPromptId, boolean>>>({})
  const indexRef = useRef<HTMLElement>(null)
  const draft = drafts[activeType]
  const original = activeType === "why_transfer" && draft.content === previewEssay.draft
  const title = LIBRARY_PROMPTS.find((prompt) => prompt.id === activeType)!.label

  return (
    <div className="library-workspace">
      <section className="library-manuscript" aria-label="Transfer essay manuscript desk">
        <LibraryPromptIndex indexRef={indexRef} activeType={activeType} essayMap={drafts} onSwitch={setActiveType} />
        <EssayWorkspaceUi
          essay={{ title, prompt: draft.prompt, wordLimit: 650, wordLimitIsDefault: true,
            autosaveLabel: saved[activeType] ? "Saved · this preview session" : "Unsaved · this preview session" }}
          value={draft.content}
          onChange={(content) => {
            setDrafts((previous) => ({ ...previous, [activeType]: { ...previous[activeType], content } }))
            setSaved((previous) => ({ ...previous, [activeType]: false }))
          }}
          onSave={() => setSaved((previous) => ({ ...previous, [activeType]: true }))}
          onSwitchPrompt={() => {
            indexRef.current?.scrollIntoView({ block: "center" })
            indexRef.current?.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus({ preventScroll: true })
          }}
          coachCaption={original ? "Coach notes · sample feedback for this draft" : "Coach notes · sample feedback available on the original draft"}
          coachPassages={original ? ["UT Austin’s Turing Scholars community", "next to a night shift"] : []}
          coachNotes={original ? previewEssay.coach : []}
          strengthSignals={original ? previewEssay.strengths : []}
        />
      </section>
    </div>
  )
}

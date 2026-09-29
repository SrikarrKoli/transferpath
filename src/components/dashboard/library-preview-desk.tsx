"use client"

import { useRef, useState } from "react"
import { EssayWorkspaceUi } from "@/components/dashboard/essay-workspace-ui"
import { LIBRARY_PROMPTS, LibraryPromptIndex } from "@/components/dashboard/library-prompt-index"
import { previewEssay, previewEssayMap } from "@/lib/hall-preview-fixtures"
import type { EssayPromptId } from "@/lib/build-essay-workspace-feedback"

export function LibraryPreviewDesk() {
  const [activeType, setActiveType] = useState<EssayPromptId>("why_transfer")
  const [drafts, setDrafts] = useState(previewEssayMap)
  const [savedDrafts, setSavedDrafts] = useState(previewEssayMap)
  const indexRef = useRef<HTMLElement>(null)
  const draft = drafts[activeType]
  const dirty = draft.content !== savedDrafts[activeType].content
  const original = activeType === "why_transfer" && draft.content === previewEssay.draft
  const title = LIBRARY_PROMPTS.find((prompt) => prompt.id === activeType)!.label

  const nextPrompt = LIBRARY_PROMPTS.find((prompt) => prompt.id !== activeType && !drafts[prompt.id].content.trim())

  return (
    <div className="library-workspace">
      <section className="library-manuscript" aria-label="Transfer essay manuscript desk">
        <LibraryPromptIndex indexRef={indexRef} activeType={activeType} essayMap={drafts} upNextId={nextPrompt?.id} onSwitch={setActiveType} />
        <EssayWorkspaceUi
          essay={{ title, prompt: draft.prompt, wordLimit: 650, wordLimitIsDefault: true,
            autosaveLabel: dirty ? "Unsaved" : draft.content ? "Draft on file" : "No draft yet" }}
          checklistHref="/preview/halls/dorm"
          dirty={dirty}
          value={draft.content}
          onChange={(content) => {
            setDrafts((previous) => ({ ...previous, [activeType]: { ...previous[activeType], content } }))
          }}
          onSave={() => {
            setSavedDrafts((previous) => ({ ...previous, [activeType]: draft }))
          }}
          coachPassages={original ? ["UT Austin’s Turing Scholars community", "next to a night shift"] : []}
          coachNotes={original ? previewEssay.coach : []}
          strengthSignals={original ? previewEssay.strengths : []}
        />
      </section>
    </div>
  )
}

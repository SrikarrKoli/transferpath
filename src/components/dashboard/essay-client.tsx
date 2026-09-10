"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, Save, Sparkles, Wand2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { EssayWorkspaceUi } from "@/components/dashboard/essay-workspace-ui"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { ChecklistProfileSummary } from "@/lib/checklist-task-definitions"
import {
  buildCoachNotes,
  buildDefaultPromptText,
  buildReferenceCard,
  buildStrengthSignals,
  essayDisplayTitle,
  formatEssayAutosaveLabel,
  type EssayPromptId,
} from "@/lib/build-essay-workspace-feedback"

const PROMPT_TYPES: {
  id: EssayPromptId
  label: string
  tips: string[]
}[] = [
  {
    id: "why_transfer",
    label: "Why transfer",
    tips: [
      "Be specific about programs, faculty, or opportunities at your target school",
      "Connect your past experiences to your future goals",
      "Show genuine enthusiasm — avoid generic statements",
    ],
  },
  {
    id: "leadership",
    label: "Leadership",
    tips: [
      "Focus on a specific story or moment, not a list of accomplishments",
      "Show growth and what you learned from the experience",
      "Connect to how this prepares you for university life",
    ],
  },
  {
    id: "diversity",
    label: "Diversity",
    tips: [
      "Be authentic — share what makes your perspective unique",
      "Connect your background to your academic or career goals",
      "Focus on what you bring, not just what you've overcome",
    ],
  },
  {
    id: "extracurricular",
    label: "Extracurricular",
    tips: [
      "Choose something that reveals your character, not just your resume",
      "Explain why this activity matters to you personally",
      "Show what skills or values you developed",
    ],
  },
  {
    id: "other",
    label: "Other",
    tips: [
      "Paste your school's exact prompt in the field below",
      "Re-read the prompt carefully before writing",
      "Stay within the word limit if one is specified",
    ],
  },
]

type EssayRow = {
  title: string | null
  content: string | null
  word_count: number
  word_limit: number | null
  updated_at: string
}

interface EssayClientProps {
  userId: string
  initialEssayMap: Record<string, EssayRow>
  profile: ChecklistProfileSummary
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function EssayClient({ userId, initialEssayMap, profile }: EssayClientProps) {
  const router = useRouter()
  const [essayMap, setEssayMap] = useState(initialEssayMap)
  const [activeType, setActiveType] = useState<EssayPromptId>("why_transfer")
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(
    initialEssayMap.why_transfer?.updated_at ?? null
  )
  const [saveError, setSaveError] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)

  const currentDef = PROMPT_TYPES.find((p) => p.id === activeType)!
  const currentEssay = essayMap[activeType]
  const content = currentEssay?.content ?? ""
  const customTitle = currentEssay?.title ?? ""
  const wordLimit = currentEssay?.word_limit ?? 650

  const displayPrompt =
    customTitle.trim() || buildDefaultPromptText(activeType, profile)

  const { title, subtitle } = essayDisplayTitle(activeType, customTitle)

  const coachNotes = useMemo(
    () => buildCoachNotes(content, activeType, profile, currentDef.tips),
    [content, activeType, profile, currentDef.tips]
  )

  const strengthSignals = useMemo(
    () => buildStrengthSignals(content, profile),
    [content, profile]
  )

  const reference = useMemo(() => buildReferenceCard(profile), [profile])

  function updateField(patch: Partial<EssayRow>) {
    setEssayMap((prev) => ({
      ...prev,
      [activeType]: {
        title: prev[activeType]?.title ?? null,
        content: prev[activeType]?.content ?? null,
        word_count: prev[activeType]?.word_count ?? 0,
        word_limit: prev[activeType]?.word_limit ?? 650,
        updated_at: prev[activeType]?.updated_at ?? "",
        ...patch,
      },
    }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError("")
    const supabase = createClient()
    const now = new Date().toISOString()
    const wc = countWords(content)

    const { error } = await supabase.from("user_essays").upsert(
      {
        user_id: userId,
        prompt_type: activeType,
        title: essayMap[activeType]?.title ?? null,
        content: essayMap[activeType]?.content ?? null,
        word_count: wc,
        word_limit: essayMap[activeType]?.word_limit ?? 650,
        updated_at: now,
      },
      { onConflict: "user_id,prompt_type" }
    )

    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    setSavedAt(now)
    updateField({ updated_at: now, word_count: wc })
  }

  function handleTypeSwitch(typeId: EssayPromptId) {
    setActiveType(typeId)
    setSavedAt(essayMap[typeId]?.updated_at ?? null)
    setSaveError("")
  }

  const tgt = profile.targetUniversityName?.trim()

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PROMPT_TYPES.map((prompt) => {
          const essay = essayMap[prompt.id]
          const wc = essay ? countWords(essay.content ?? "") : 0
          const isActive = activeType === prompt.id
          return (
            <button
              key={prompt.id}
              type="button"
              onClick={() => handleTypeSwitch(prompt.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-left text-sm font-medium transition-colors",
                isActive
                  ? "border-accent/40 bg-accent-soft text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
              )}
            >
              <span className="block">{prompt.label}</span>
              <span className="mt-0.5 block tp-eyebrow text-muted-foreground">
                {wc >= 50 ? `${wc} words` : "Not started"}
              </span>
            </button>
          )
        })}
      </div>

      {saveError ? (
        <p className="text-sm text-destructive" role="alert">
          {saveError}
        </p>
      ) : null}

      <EssayWorkspaceUi
        essay={{
          eyebrow: "Essay workspace",
          title,
          subtitle,
          tagline: "Draft, revise, and save your transfer essay in one place.",
          prompt: displayPrompt,
          wordLimit,
          wordLimitIsDefault: currentEssay?.word_limit == null,
          autosaveLabel: formatEssayAutosaveLabel(savedAt, saving),
        }}
        value={content}
        onChange={(v) => updateField({ content: v, word_count: countWords(v) })}
        coachNotes={coachNotes}
        strengthSignals={strengthSignals}
        reference={{
          ...reference,
          onCtaClick: () => router.push("/dashboard/requirements"),
        }}
        onPreview={() => setPreviewOpen(true)}
        onSave={() => void handleSave()}
        saving={saving}
        previewIcon={<Eye className="h-4 w-4" strokeWidth={1.5} />}
        saveIcon={<Save className="h-4 w-4" strokeWidth={1.5} />}
        sparklesIcon={<Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />}
        wandIcon={<Wand2 className="h-3.5 w-3.5" strokeWidth={1.5} />}
        settingsSlot={
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="essay-school-prompt"
                className="tp-eyebrow text-muted-foreground"
              >
                Your school&apos;s exact prompt (optional)
              </label>
              <Input
                id="essay-school-prompt"
                placeholder={
                  tgt
                    ? `Paste ${tgt}'s essay question here…`
                    : "Paste your school's essay question here…"
                }
                value={customTitle}
                onChange={(e) => updateField({ title: e.target.value || null })}
                className="h-10 bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="essay-word-limit"
                className="tp-eyebrow text-muted-foreground"
              >
                Word limit
              </label>
              <Input
                id="essay-word-limit"
                type="number"
                min={50}
                max={5000}
                placeholder="650"
                value={wordLimit}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10)
                  updateField({ word_limit: Number.isNaN(parsed) ? 650 : parsed })
                }}
                className="h-10 w-full max-w-[140px] bg-background"
              />
            </div>
          </div>
        }
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {title}
              {subtitle ? <span className="font-normal text-muted-foreground"> — {subtitle}</span> : null}
            </DialogTitle>
          </DialogHeader>
          <p className="tp-eyebrow text-muted-foreground">
            Prompt
          </p>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            {displayPrompt}
          </p>
          <div className="mt-6 whitespace-pre-wrap font-heading text-lg leading-[1.7] text-foreground">
            {content.trim() || (
              <span className="text-muted-foreground">No draft content yet.</span>
            )}
          </div>
          <p className="mt-6 font-mono text-xs text-muted-foreground">
            {countWords(content)} / {wordLimit} words
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}

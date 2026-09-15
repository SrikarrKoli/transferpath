"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SchoolSearch } from "@/components/onboarding/school-search"
import type { OnboardingData } from "@/types/onboarding"
import { X } from "lucide-react"

interface Props {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function OnboardingStep2({ data, updateData, onNext, onBack }: Props) {
  const primaryName = data.targetUniversities[0] ?? ""
  const primaryId = data.targetUniversityIds[0] ?? ""
  const secondaryName = data.targetUniversities[1] ?? ""
  const secondaryId = data.targetUniversityIds[1] ?? ""

  function setPrimary(id: string, name: string) {
    const names = [name, ...data.targetUniversities.slice(1)]
    const ids = [id, ...data.targetUniversityIds.slice(1)]
    updateData({ targetUniversities: names, targetUniversityIds: ids })
  }

  function clearPrimary() {
    updateData({ targetUniversities: [], targetUniversityIds: [] })
  }

  function setSecondary(id: string, name: string) {
    const names = [data.targetUniversities[0] ?? "", name]
    const ids = [data.targetUniversityIds[0] ?? "", id]
    updateData({ targetUniversities: names, targetUniversityIds: ids })
  }

  function clearSecondary() {
    updateData({
      targetUniversities: data.targetUniversities.slice(0, 1),
      targetUniversityIds: data.targetUniversityIds.slice(0, 1),
    })
  }

  const canProceed = primaryId !== ""

  return (
    <div className="border border-[color:var(--hall-rule)] bg-transparent p-6 sm:p-8">
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Transfer setup · Step 2 of 5
          </p>
          <h1 className="text-2xl font-medium text-foreground mb-2">Which four-year schools are you aiming for?</h1>
          <p className="text-muted-foreground">
            Pick up to two targets. We&apos;ll map deadlines and requirements to those campuses.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Primary target school</Label>
            <SchoolSearch
              value={primaryName}
              selectedId={primaryId || null}
              onSelect={setPrimary}
              onClear={clearPrimary}
              placeholder="Search for a school..."
            />
          </div>

          <div className="space-y-2">
            <Label>
              Second choice{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <SchoolSearch
              value={secondaryName}
              selectedId={secondaryId || null}
              onSelect={setSecondary}
              onClear={clearSecondary}
              placeholder="Search for another school..."
            />
          </div>

          {(primaryId || secondaryId) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {primaryId && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
                  {primaryName}
                  <button type="button" onClick={clearPrimary} className="hover:text-primary/90">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {secondaryId && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
                  {secondaryName}
                  <button type="button" onClick={clearSecondary} className="hover:text-primary/90">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

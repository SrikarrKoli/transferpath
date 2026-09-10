"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SchoolSearch } from "@/components/onboarding/school-search"
import type { OnboardingData } from "@/types/onboarding"
import { Info } from "lucide-react"

interface Props {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
}

export function OnboardingStep1({ data, updateData, onNext }: Props) {
  const canProceed = data.currentSchoolId !== ""

  return (
    <div className="bg-card border border-border rounded-xl p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-foreground mb-2">Where are you now?</h1>
          <p className="text-muted-foreground">We&apos;ll use this to match your coursework.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current school</Label>
            <SchoolSearch
              value={data.currentSchool}
              selectedId={data.currentSchoolId || null}
              onSelect={(id, name) => updateData({ currentSchoolId: id, currentSchool: name })}
              onClear={() => updateData({ currentSchoolId: "", currentSchool: "" })}
              placeholder="Search for your school..."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>Are you a CAP student?</Label>
              <div className="group relative">
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-foreground text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  CAP is UT Austin&apos;s Coordinated Admission Program. If you complete its terms at a partner school, admission is guaranteed for some majors — check whether yours is included.
                </div>
              </div>
            </div>
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                type="button"
                onClick={() => updateData({ isCapStudent: true })}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  data.isCapStudent
                    ? "bg-popover text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => updateData({ isCapStudent: false })}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  !data.isCapStudent
                    ? "bg-popover text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={onNext}
            disabled={!canProceed}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

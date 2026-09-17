"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SchoolSearch } from "@/components/onboarding/school-search"
import type { OnboardingData } from "@/types/onboarding"

interface Props {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
}

const EXPLORING_LABEL = "Still deciding"

export function OnboardingStep1({ data, updateData, onNext }: Props) {
  const exploring = data.currentSchool === EXPLORING_LABEL && !data.currentSchoolId
  const canProceed = data.currentSchoolId !== "" || exploring

  return (
    <div className="border border-[color:var(--hall-rule)] bg-transparent p-6 sm:p-8">
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Counselor Hall · Step 1 of 5
          </p>
          <h1 className="mb-2 text-2xl font-medium text-foreground">Where are you transferring from?</h1>
          <p className="text-muted-foreground">
            TransferPath maps deadlines, courses, requirements, and essays for your move to a four-year.
            Start with your current college when you know it — or keep going while you explore.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            You&apos;ll create a free account at the last step so this setup is saved.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current school</Label>
            <SchoolSearch
              value={exploring ? "" : data.currentSchool}
              selectedId={data.currentSchoolId || null}
              onSelect={(id, name) => updateData({ currentSchoolId: id, currentSchool: name })}
              onClear={() => updateData({ currentSchoolId: "", currentSchool: "" })}
              placeholder="Search for your school..."
              onContinueWithoutSchool={() =>
                updateData({ currentSchoolId: "", currentSchool: EXPLORING_LABEL })
              }
            />
            {exploring ? (
              <p className="text-xs text-muted-foreground">
                Continuing as <span className="font-medium text-foreground">still deciding</span>. You can
                set a school later in Counselor · Settings.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => updateData({ currentSchoolId: "", currentSchool: EXPLORING_LABEL })}
                className="text-left text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Still deciding, or school isn&apos;t listed — continue anyway
              </button>
            )}
          </div>

          <div className="space-y-3">
            <Label>Are you a CAP student?</Label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              CAP is UT Austin&apos;s Coordinated Admission Program. Some students start at a partner
              campus with a path toward UT Austin for eligible majors. If that isn&apos;t you, choose No.
            </p>
            <div className="flex rounded-none border border-[color:var(--hall-rule)] bg-[color:var(--hall-ink)]/[0.03] p-1">
              <button
                type="button"
                onClick={() => updateData({ isCapStudent: true })}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  data.isCapStudent
                    ? "bg-[color:var(--hall-paper)] text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => updateData({ isCapStudent: false })}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  !data.isCapStudent
                    ? "bg-[color:var(--hall-paper)] text-foreground"
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

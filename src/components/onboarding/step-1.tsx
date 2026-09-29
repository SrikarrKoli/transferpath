"use client"

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

  return (
    <div className="border border-[color:var(--hall-rule)] bg-transparent p-6 sm:p-8">
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Counselor Hall · Step 1 of 5
          </p>
          <h1 className="mb-2 text-2xl font-medium text-foreground">Where are you transferring from?</h1>
          <p className="text-muted-foreground">
            Search your current college, or leave it blank if you are still deciding.
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
              tone="ink"
            />
            {(data.currentSchoolId || exploring) && (
              <p className="text-xs text-muted-foreground">
                {data.currentSchoolId
                  ? `Continuing from ${data.currentSchool}.`
                  : "Still deciding. You can set a school later in Counselor · Settings."}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Are you a CAP student?</Label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              CAP is UT Austin’s Coordinated Admission Program. Choose No if that is not you.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={data.isCapStudent}
                onClick={() => updateData({ isCapStudent: true })}
                className={`h-10 rounded-none border px-4 text-sm font-medium transition-colors ${
                  data.isCapStudent
                    ? "border-[color:var(--hall-ink)] bg-[color:var(--hall-ink)] text-[color:var(--hall-paper)]"
                    : "border-[color:var(--hall-ink)] bg-[color:var(--hall-paper)] text-[color:var(--hall-ink)]"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                aria-pressed={!data.isCapStudent}
                onClick={() => updateData({ isCapStudent: false })}
                className={`h-10 rounded-none border px-4 text-sm font-medium transition-colors ${
                  !data.isCapStudent
                    ? "border-[color:var(--hall-ink)] bg-[color:var(--hall-ink)] text-[color:var(--hall-paper)]"
                    : "border-[color:var(--hall-ink)] bg-[color:var(--hall-paper)] text-[color:var(--hall-ink)]"
                }`}
              >
                No
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.isCapStudent ? "Yes" : "No"} is selected. Choose Yes only if you are in UT Austin’s CAP.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <p className="text-xs text-muted-foreground">
            Timeline, the last step, is where you create a free account so this setup is saved.
          </p>
          <button
            type="button"
            className="union-primary-cta w-full"
            onClick={() => {
              if (!data.currentSchoolId) {
                updateData({ currentSchoolId: "", currentSchool: EXPLORING_LABEL })
              }
              onNext()
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

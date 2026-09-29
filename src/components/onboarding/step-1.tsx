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
            Search your current college, or leave it blank if you are still deciding.{" "}
            Nothing is saved until you create a free account on Timeline, the last step.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Current school</Label>
              <span className="text-sm font-medium leading-none text-[color:var(--hall-stone)]">Optional</span>
            </div>
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
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[color:var(--hall-ink)]">
              <span className="relative inline-flex h-[18px] w-[18px] shrink-0">
                <input
                  type="checkbox"
                  checked={data.isCapStudent}
                  onChange={(event) => updateData({ isCapStudent: event.target.checked })}
                  aria-describedby="cap-description"
                  className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-none border border-[color:var(--hall-ink)] bg-[color:var(--hall-paper)] checked:bg-[color:var(--hall-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--hall-ink)]"
                />
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 hidden h-[18px] w-[18px] text-[color:var(--hall-paper)] peer-checked:block"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path d="m4 9 3 3 7-7" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              I am a CAP student
            </label>
            <p id="cap-description" className="text-xs leading-relaxed text-muted-foreground">
              UT Austin’s Coordinated Admission Program. Leave this unchecked if you are not.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-4">
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

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
            <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Are you a CAP student?</span>
              <button
                type="button"
                aria-pressed={data.isCapStudent}
                onClick={() => updateData({ isCapStudent: true })}
                className="rounded-none bg-transparent px-[0.7rem] py-[0.35rem] text-sm font-medium text-[color:var(--hall-ink)]"
                style={{ boxShadow: data.isCapStudent ? "inset 0 -2px 0 var(--hall-ink)" : "none" }}
              >
                Yes
              </button>
              <button
                type="button"
                aria-pressed={!data.isCapStudent}
                onClick={() => updateData({ isCapStudent: false })}
                className="rounded-none bg-transparent px-[0.7rem] py-[0.35rem] text-sm font-medium text-[color:var(--hall-ink)]"
                style={{ boxShadow: !data.isCapStudent ? "inset 0 -2px 0 var(--hall-ink)" : "none" }}
              >
                No
              </button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              UT Austin’s Coordinated Admission Program. Most students leave this as No.
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
          <p className="text-xs text-muted-foreground">
            A free account on Timeline saves this.
          </p>
        </div>
      </div>
    </div>
  )
}

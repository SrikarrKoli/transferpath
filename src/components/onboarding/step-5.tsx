"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { OnboardingData } from "@/types/onboarding"
import { getTransferTermSelectOptions, normalizeTransferTermForSelect } from "@/lib/transfer-term-options"
import { ArrowRight, Eye, EyeOff } from "lucide-react"

interface Props {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
  loading?: boolean
  error?: string
  /** Already signed in — hide account fields; only semester + reminders required. */
  hasExistingAuth?: boolean
}

export function OnboardingStep5({
  data,
  updateData,
  onNext,
  onBack,
  loading,
  error,
  hasExistingAuth = false,
}: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const termOptions = getTransferTermSelectOptions(data.targetSemester, 3)
  const termValue = normalizeTransferTermForSelect(data.targetSemester)
  const canProceed = hasExistingAuth
    ? data.targetSemester !== ""
    : data.targetSemester !== "" && data.email !== "" && data.password.length >= 6

  return (
    <div className="border border-[color:var(--hall-rule)] bg-transparent p-6 sm:p-8">
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Transfer setup · Step 5 of 5
          </p>
          <h1 className="text-2xl font-medium text-foreground mb-2">When do you want to transfer?</h1>
          <p className="text-muted-foreground">
            Choose your target entry term. Create your account (or confirm you&apos;re signed in) so we can save
            deadlines and reminders to your campus.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="semester">Target transfer semester</Label>
            <Select
              value={termValue || undefined}
              onValueChange={(value) => updateData({ targetSemester: value })}
            >
              <SelectTrigger id="semester" className="w-full">
                <SelectValue placeholder="Select target semester" />
              </SelectTrigger>
              <SelectContent>
                {termOptions.map((semester) => (
                  <SelectItem key={semester} value={semester}>
                    {semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasExistingAuth ? (
            <div className="space-y-2">
              <Label htmlFor="email">Signed in as</Label>
              <Input id="email" type="email" value={data.email} readOnly className="bg-muted/40 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                You&apos;re completing your profile with this account — no new signup.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Your email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jamie@example.com"
                  value={data.email}
                  onChange={(e) => updateData({ email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Create a password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={data.password}
                    onChange={(e) => updateData({ password: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">At least 6 characters</p>
              </div>
            </>
          )}

          <div className="flex items-center justify-between border border-[color:var(--hall-rule)] bg-[color:var(--hall-ink)]/[0.03] px-4 py-3">
            <span className="text-sm text-foreground">Send me deadline reminders</span>
            <button
              type="button"
              onClick={() => updateData({ sendReminders: !data.sendReminders })}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                data.sendReminders ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                  data.sendReminders ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-none border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} disabled={loading} className="flex-1">
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={!canProceed || loading}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? (
              hasExistingAuth ? (
                "Saving your profile..."
              ) : (
                "Creating your account..."
              )
            ) : (
              <>
                {hasExistingAuth ? "Save and continue" : "Build my roadmap"}{" "}
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Takes about 2 minutes. No credit card needed.
        </p>
      </div>
    </div>
  )
}

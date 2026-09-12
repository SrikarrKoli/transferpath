"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardingStep1 } from "@/components/onboarding/step-1"
import { OnboardingStep2 } from "@/components/onboarding/step-2"
import { OnboardingStep3 } from "@/components/onboarding/step-3"
import { OnboardingStep4 } from "@/components/onboarding/step-4"
import { OnboardingStep5 } from "@/components/onboarding/step-5"
import { OnboardingLoading } from "@/components/onboarding/loading"
import { createClient } from "@/lib/supabase/client"
import { persistOnboardingForUser } from "@/lib/onboarding-persist"
import type { OnboardingData } from "@/types/onboarding"
import { PRODUCT_NAME } from "@/lib/brand"

const steps = [
  { id: 1, label: "School" },
  { id: 2, label: "Target" },
  { id: 3, label: "Major & field" },
  { id: 4, label: "Courses" },
  { id: 5, label: "Timeline" },
]

export type ExistingSession = { id: string; email: string }

export interface OnboardingClientProps {
  /** When set, wizard skips sign-up and upserts `user_profiles` for this user. */
  existingSession: ExistingSession | null
  /** When nested in ImmersiveBuildingShell, skip the duplicate product masthead. */
  embedded?: boolean
}

function isSessionMissingError(message: string): boolean {
  return /session missing/i.test(message)
}

export function OnboardingClient({ existingSession, embedded = false }: OnboardingClientProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [data, setData] = useState<OnboardingData>(() => ({
    currentSchool: "",
    currentSchoolId: "",
    isCapStudent: false,
    targetUniversities: [],
    targetUniversityIds: [],
    fieldOfStudy: "",
    major: "",
    gpa: "",
    creditsCompleted: "",
    completedCourses: [],
    targetSemester: "",
    email: existingSession?.email ?? "",
    password: "",
    sendReminders: true,
  }))

  const hasExistingAuth = existingSession != null

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  async function finishAndGoToDashboard() {
    setSubmitting(false)
    setIsLoading(true)
    router.refresh()
    window.location.assign("/dashboard")
  }

  async function handleSubmit() {
    setSubmitError("")
    setSubmitting(true)

    let supabase
    try {
      supabase = createClient()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not connect to Supabase.")
      setSubmitting(false)
      return
    }

    const origin = window.location.origin

    if (hasExistingAuth) {
      const {
        data: { user: sessionUser },
        error: sessionErr,
      } = await supabase.auth.getUser()

      if (sessionErr || !sessionUser) {
        const msg = sessionErr?.message ?? "Your session expired."
        setSubmitError(
          isSessionMissingError(msg)
            ? "Your session expired. Please log in again, then finish onboarding."
            : msg
        )
        setSubmitting(false)
        return
      }

      const profileEmail = sessionUser.email?.trim() || data.email.trim()
      if (!profileEmail) {
        setSubmitError("Your account has no email on file.")
        setSubmitting(false)
        return
      }

      const { error: persistErr } = await persistOnboardingForUser(
        supabase,
        sessionUser.id,
        profileEmail,
        data
      )
      if (persistErr) {
        setSubmitError(persistErr)
        setSubmitting(false)
        return
      }

      await finishAndGoToDashboard()
      return
    }

    // New account: sign up first — do NOT call getUser() before a session exists.
    const email = data.email.trim()
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setSubmitError(signUpError.message)
      setSubmitting(false)
      return
    }

    const newUser = signUpData.user
    if (!newUser?.id) {
      setSubmitError("Could not create your account. Try again or use Log in if you already signed up.")
      setSubmitting(false)
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session ?? signUpData.session

    if (!session) {
      setSubmitting(false)
      setSubmitError(
        "Account created. Check your email for a confirmation link, then log in to finish setting up your path."
      )
      router.push(`/login?signup=confirm-email&email=${encodeURIComponent(email)}`)
      return
    }

    const { error: persistErr } = await persistOnboardingForUser(
      supabase,
      newUser.id,
      email,
      data
    )
    if (persistErr) {
      setSubmitError(persistErr)
      setSubmitting(false)
      return
    }

    await finishAndGoToDashboard()
  }

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    } else {
      void handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (isLoading) {
    return (
      <OnboardingLoading
        targetUniversity={data.targetUniversities[0]?.trim() ?? ""}
        major={data.major?.trim() ?? ""}
      />
    )
  }

  return (
    <div className={embedded ? "flex flex-col" : "flex min-h-screen flex-col bg-background"}>
      <header className={embedded ? "px-1 pb-4 pt-1" : "px-6 py-6"}>
        <div className="mx-auto max-w-3xl">
          {embedded ? null : (
            <div className="mb-8 flex items-center justify-center gap-2 text-lg font-medium text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L20 7V17L12 22L4 17V7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 11L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 11L16 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 11L8 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {PRODUCT_NAME}
            </div>
          )}

          {embedded ? (
            <div className="hall-steps" aria-label="Onboarding steps">
              {steps.map((step) => (
                <span key={step.id} data-on={step.id === currentStep ? "true" : "false"}>
                  {step.label}
                </span>
              ))}
            </div>
          ) : (
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      step.id < currentStep
                        ? "bg-primary text-primary-foreground"
                        : step.id === currentStep
                          ? "border-2 border-primary text-primary"
                          : "border-2 border-border text-muted-foreground"
                    }`}
                  >
                    {step.id < currentStep ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={`mt-1 text-xs ${
                      step.id === currentStep ? "font-medium text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 mb-5 h-0.5 w-12 ${
                      step.id < currentStep ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      </header>

      <main className={`flex flex-1 items-start justify-center ${embedded ? "px-1 py-2" : "px-6 py-8"}`}>
        <div className="w-full max-w-lg">
          {currentStep === 1 && (
            <OnboardingStep1 data={data} updateData={updateData} onNext={handleNext} />
          )}
          {currentStep === 2 && (
            <OnboardingStep2 data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 3 && (
            <OnboardingStep3 data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 4 && (
            <OnboardingStep4 data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 5 && (
            <OnboardingStep5
              data={data}
              updateData={updateData}
              onNext={handleNext}
              onBack={handleBack}
              loading={submitting}
              error={submitError}
              hasExistingAuth={hasExistingAuth}
            />
          )}
        </div>
      </main>
    </div>
  )
}

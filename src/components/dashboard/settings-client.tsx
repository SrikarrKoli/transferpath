"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, GraduationCap, Bell, Lock, Palette, HelpCircle, LogOut } from "lucide-react"
import { SchoolSearch } from "@/components/onboarding/school-search"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { getTransferTermSelectOptions } from "@/lib/transfer-term-options"
import {
  saveNotificationSettingsAction,
  savePreferenceSettingsAction,
  saveProfileAndTransferAction,
} from "@/app/dashboard/settings/actions"
import type { FieldOfStudy } from "@/lib/field-of-study"
import { FIELD_OF_STUDY_OPTIONS, fieldOfStudyOrDefault } from "@/lib/field-of-study"
import { PRODUCT_NAME } from "@/lib/brand"
import { type SettingsTab } from "@/lib/settings-tab"

/** If set, Help tab shows a mailto link; otherwise we show a short configuration note. */
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()

export type SettingsProfileRow = {
  id: string
  email: string
  full_name: string | null
  current_university_id: string | null
  target_university_id: string | null
  target_major: string | null
  field_of_study: string | null
  expected_transfer_term: string | null
  gpa: number | null
  credits_completed: number | null
  notify_deadline_reminders: boolean
  notify_product_updates: boolean
  prefer_compact_dashboard: boolean
  current_university: { id: string; name: string } | null
  target_university: { id: string; name: string } | null
}

export type SettingsAuthInfo = {
  hasEmailPassword: boolean
  oauthProviderIds: string[]
}

interface SettingsClientProps {
  authEmail: string | null
  profile: SettingsProfileRow | null
  authInfo: SettingsAuthInfo
  initialTab?: SettingsTab
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-body font-medium text-foreground">{title}</h3>
      {subtitle && <p className="mt-0.5 text-caption text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

function Divider() {
  return <div className="my-6 h-px bg-border" />
}

function oauthLabel(provider: string): string {
  const map: Record<string, string> = {
    google: "Google",
    github: "GitHub",
    apple: "Apple",
    azure: "Microsoft",
    facebook: "Facebook",
    twitter: "Twitter",
    slack: "Slack",
    linkedin: "LinkedIn",
    bitbucket: "Bitbucket",
    gitlab: "GitLab",
  }
  return map[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1)
}

export function SettingsClient({
  authEmail,
  profile,
  authInfo,
  initialTab = "profile",
}: SettingsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)

  useEffect(() => {
    if (activeTab !== "help" || typeof window === "undefined") return
    const id = window.location.hash.replace(/^#/, "")
    if (!id) return
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [activeTab])
  const [saving, setSaving] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [fullName, setFullName] = useState(profile?.full_name ?? "")
  const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(
    profile?.current_university_id ?? null
  )
  const [currentSchoolName, setCurrentSchoolName] = useState(
    profile?.current_university?.name ?? ""
  )
  const [targetSchoolId, setTargetSchoolId] = useState<string | null>(
    profile?.target_university_id ?? null
  )
  const [targetSchoolName, setTargetSchoolName] = useState(
    profile?.target_university?.name ?? ""
  )
  const [targetMajor, setTargetMajor] = useState(profile?.target_major ?? "")
  const [fieldOfStudy, setFieldOfStudy] = useState<FieldOfStudy>(
    fieldOfStudyOrDefault(profile?.field_of_study)
  )
  const [expectedTerm, setExpectedTerm] = useState(profile?.expected_transfer_term ?? "")
  const [gpaInput, setGpaInput] = useState(
    profile?.gpa != null ? String(profile.gpa) : ""
  )
  const [creditsInput, setCreditsInput] = useState(
    profile?.credits_completed != null ? String(profile.credits_completed) : ""
  )

  /** DB NULL means opted in; only explicit false opts out (matches `coalesce` in SQL + cron recipients). */
  const [notifyDeadline, setNotifyDeadline] = useState(
    profile?.notify_deadline_reminders ?? true
  )
  const [notifyProduct, setNotifyProduct] = useState(profile?.notify_product_updates ?? false)
  const [preferCompact, setPreferCompact] = useState(profile?.prefer_compact_dashboard ?? false)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const profileEmail = profile?.email ?? ""
  const auth = authEmail ?? ""

  const transferTermOptions = getTransferTermSelectOptions(expectedTerm, 3)
  const transferTermSelectValue =
    transferTermOptions.find((o) => o.toLowerCase() === expectedTerm.trim().toLowerCase()) ??
    undefined

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  async function handleSave() {
    if (!profile) {
      setMessage({
        type: "error",
        text: "No profile row found. Complete onboarding first, or sign in with the correct account.",
      })
      return
    }

    setSaving(true)
    setMessage(null)

    const result = await saveProfileAndTransferAction({
      fullName: fullName,
      currentUniversityId: currentSchoolId,
      targetUniversityId: targetSchoolId,
      targetMajor,
      fieldOfStudy,
      expectedTransferTerm: expectedTerm,
      gpaInput,
      creditsInput,
    })

    setSaving(false)

    if (!result.ok) {
      setMessage({ type: "error", text: result.message })
      return
    }

    setMessage({
      type: "success",
      text: "Settings saved. Your dashboard and sidebar will update automatically.",
    })
    router.refresh()
  }

  async function handleSaveNotifications() {
    if (!profile) {
      setMessage({
        type: "error",
        text: "No profile row found. Complete onboarding first, or sign in with the correct account.",
      })
      return
    }

    setSavingNotifications(true)
    setMessage(null)

    const result = await saveNotificationSettingsAction({
      notifyDeadlineReminders: notifyDeadline,
      notifyProductUpdates: notifyProduct,
    })

    setSavingNotifications(false)

    if (!result.ok) {
      setMessage({ type: "error", text: result.message })
      return
    }

    setMessage({
      type: "success",
      text: "Notification preferences saved. Weekly deadline emails use your sign-in address when this option is on.",
    })
    router.refresh()
  }

  async function handleSavePreferences() {
    if (!profile) {
      setMessage({
        type: "error",
        text: "No profile row found. Complete onboarding first, or sign in with the correct account.",
      })
      return
    }

    setSavingPreferences(true)
    setMessage(null)

    const result = await savePreferenceSettingsAction({
      preferCompactDashboard: preferCompact,
    })

    setSavingPreferences(false)

    if (!result.ok) {
      setMessage({ type: "error", text: result.message })
      return
    }

    setMessage({
      type: "success",
      text: "Preferences saved. The main dashboard uses compact spacing when this is on.",
    })
    router.refresh()
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 8 characters.",
      })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New password and confirmation must match." })
      return
    }

    setPasswordSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)

    if (error) {
      setPasswordMessage({ type: "error", text: error.message })
    } else {
      setPasswordMessage({
        type: "success",
        text: "Password updated. Use it the next time you sign in with email and password.",
      })
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    { id: "transfer", label: "Transfer planning", icon: <GraduationCap className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    { id: "security", label: "Account & security", icon: <Lock className="h-4 w-4" /> },
    { id: "preferences", label: "Preferences", icon: <Palette className="h-4 w-4" /> },
    { id: "help", label: "Help & feedback", icon: <HelpCircle className="h-4 w-4" /> },
  ]

  const oauthDescription =
    authInfo.oauthProviderIds.length > 0
      ? authInfo.oauthProviderIds.map(oauthLabel).join(", ")
      : null

  return (
    <div className="min-h-screen bg-background">
      <div className="px-8 pt-8 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and transfer planning
        </p>
      </div>

      <div className="px-8 pb-12 flex flex-col gap-6 lg:flex-row lg:gap-8">
        <nav className="w-full lg:w-[180px] lg:shrink-0">
          <ul className="flex flex-row flex-wrap gap-1 lg:flex-col lg:flex-nowrap">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id)
                      setMessage(null)
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                      isActive
                        ? "border-l-2 border-primary bg-primary/5 text-primary font-medium pl-[10px]"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-border bg-card p-6">
            {!profile && (
              <p className="text-sm text-destructive mb-4">
                Profile missing — your account has no saved profile yet, so settings can&apos;t be
                stored.{" "}
                <Link href="/onboarding" className="font-medium text-primary underline-offset-2 hover:underline">
                  Complete onboarding
                </Link>{" "}
                to create one (requires sign-in). Saving stays disabled below until a profile exists.
              </p>
            )}

            {activeTab === "profile" && (
              <div>
                <SectionHeader
                  title="Your profile"
                  subtitle="This information personalizes your transfer roadmap."
                />
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="full-name" className="block text-sm font-medium text-foreground">
                      Full name
                    </label>
                    <input
                      id="full-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      className="w-full h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-sm font-medium text-foreground">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={auth}
                      readOnly
                      className="w-full h-9 rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Sign-in email (read-only in v1).
                      {profileEmail && profileEmail !== auth && (
                        <span className="block mt-1">
                          Profile also stores: {profileEmail}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !profile}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "transfer" && (
              <div>
                <SectionHeader
                  title="Transfer planning"
                  subtitle="Schools and academics are saved to your profile."
                />

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Current school</label>
                    <SchoolSearch
                      value={currentSchoolName}
                      selectedId={currentSchoolId}
                      onSelect={(id, name) => {
                        setCurrentSchoolId(id)
                        setCurrentSchoolName(name)
                      }}
                      onClear={() => {
                        setCurrentSchoolId(null)
                        setCurrentSchoolName("")
                      }}
                      placeholder="Search for your school…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Target school</label>
                    <SchoolSearch
                      universityType="four_year"
                      value={targetSchoolName}
                      selectedId={targetSchoolId}
                      onSelect={(id, name) => {
                        setTargetSchoolId(id)
                        setTargetSchoolName(name)
                      }}
                      onClear={() => {
                        setTargetSchoolId(null)
                        setTargetSchoolName("")
                      }}
                      placeholder="Search four-year universities…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="major" className="block text-sm font-medium text-foreground">
                      Target major
                    </label>
                    <input
                      id="major"
                      type="text"
                      value={targetMajor}
                      onChange={(e) => setTargetMajor(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="field-of-study" className="block text-sm font-medium text-foreground">
                      Intended field of study
                    </label>
                    <Select
                      value={fieldOfStudy}
                      onValueChange={(v) => setFieldOfStudy(v as FieldOfStudy)}
                    >
                      <SelectTrigger id="field-of-study" className="w-full h-9">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_OF_STUDY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {FIELD_OF_STUDY_OPTIONS.find((x) => x.value === fieldOfStudy)?.helper}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="term" className="block text-sm font-medium text-foreground">
                      Expected transfer term
                    </label>
                    <Select
                      value={transferTermSelectValue}
                      onValueChange={(v) => setExpectedTerm(v)}
                    >
                      <SelectTrigger id="term-select" className="w-full h-9">
                        <SelectValue placeholder="Choose upcoming intake" />
                      </SelectTrigger>
                      <SelectContent>
                        {transferTermOptions.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      id="term"
                      type="text"
                      value={expectedTerm}
                      onChange={(e) => setExpectedTerm(e.target.value)}
                      placeholder="Custom term if yours isn’t listed (saved as typed)"
                      className="w-full h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-muted-foreground">
                      Quick picks roll forward with the calendar. Use the text field for a label that
                      doesn’t match the list. Deadlines use Season + Year only when the value parses
                      (e.g. Fall 2026).
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="gpa" className="block text-sm font-medium text-foreground">
                      GPA
                    </label>
                    <input
                      id="gpa"
                      type="number"
                      min={0}
                      max={4}
                      step={0.01}
                      value={gpaInput}
                      onChange={(e) => setGpaInput(e.target.value)}
                      placeholder="0.00 – 4.00"
                      className="w-full h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="credits" className="block text-sm font-medium text-foreground">
                      Credits completed
                    </label>
                    <input
                      id="credits"
                      type="number"
                      min={0}
                      step={1}
                      value={creditsInput}
                      onChange={(e) => setCreditsInput(e.target.value)}
                      placeholder="Total transferable credits"
                      className="w-full h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <Divider />

                <div className="rounded-xl border border-border bg-muted/60 p-4">
                  <p className="text-sm font-medium text-foreground mb-1">Courses</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Courses are managed from onboarding and your plan.
                  </p>
                  <Link
                    href="/dashboard/plan"
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    Open plan →
                  </Link>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !profile}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div>
                <SectionHeader
                  title="Notifications"
                  subtitle="Reminders here are planning aids only. They are not a substitute for official calendars, registrar emails, or your target school’s published deadlines."
                />
                <p className="text-sm text-muted-foreground mb-4">
                  Weekly planning email: when this is on, we email your sign-in address with the next
                  upcoming deadline from our planner (same rules as the dashboard). To unsubscribe,
                  turn this off here — no separate link required in v1.
                </p>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyDeadline}
                      onChange={(e) => setNotifyDeadline(e.target.checked)}
                      className="mt-1 rounded border-border"
                    />
                    <span>
                      <span className="text-sm font-medium text-foreground">
                        Weekly deadline email
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        One email per week when your planner has a next deadline. Planning-only — always
                        verify dates with your school.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyProduct}
                      onChange={(e) => setNotifyProduct(e.target.checked)}
                      className="mt-1 rounded border-border"
                    />
                    <span>
                      <span className="text-sm font-medium text-foreground">Product updates</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        Product announcements by email are not sent yet; we may use this preference in
                        a future release.
                      </span>
                    </span>
                  </label>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSaveNotifications}
                    disabled={savingNotifications || !profile}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {savingNotifications ? "Saving…" : "Save notification settings"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div>
                <SectionHeader
                  title="Account & security"
                  subtitle="Manage how you access your account."
                />

                <div className="mb-6 rounded-xl border border-border bg-muted/60 p-4">
                  <p className="text-sm font-medium text-foreground mb-1">Signed in as</p>
                  <p className="text-sm text-muted-foreground break-all">{auth || "—"}</p>
                </div>

                {authInfo.hasEmailPassword ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Set a new password for your email login. Use at least 8 characters; longer
                      passphrases are stronger.
                    </p>
                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="new-password"
                          className="block text-sm font-medium text-foreground"
                        >
                          New password
                        </label>
                        <input
                          id="new-password"
                          type="password"
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full h-9 rounded-xl border border-border bg-card px-3 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="confirm-password"
                          className="block text-sm font-medium text-foreground"
                        >
                          Confirm new password
                        </label>
                        <input
                          id="confirm-password"
                          type="password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full h-9 rounded-xl border border-border bg-card px-3 text-sm"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="submit"
                          disabled={passwordSaving}
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          {passwordSaving ? "Updating…" : "Update password"}
                        </Button>
                        <Link
                          href="/forgot-password"
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </form>
                    {passwordMessage && (
                      <p
                        className={`mt-4 text-sm ${passwordMessage.type === "success" ? "text-chart-2" : "text-destructive"}`}
                      >
                        {passwordMessage.text}
                      </p>
                    )}
                  </>
                ) : oauthDescription ? (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-foreground">
                      You signed in with {oauthDescription}. Password changes don’t apply to that
                      login — manage your account through your provider’s security settings.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    We couldn’t detect a password login. If you use social sign-in, manage your
                    account there. If you use email magic links, request a reset from{" "}
                    <Link href="/forgot-password" className="text-primary hover:underline">
                      Forgot password
                    </Link>{" "}
                    when available.
                  </p>
                )}

                <Divider />

                <p className="text-sm text-muted-foreground mb-3">
                  End your session on this device. You can also sign out from the sidebar.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            )}

            {activeTab === "preferences" && (
              <div>
                <SectionHeader
                  title="Preferences"
                  subtitle="Tune how dense the main dashboard feels."
                />
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferCompact}
                    onChange={(e) => setPreferCompact(e.target.checked)}
                    className="mt-1 rounded border-border"
                  />
                  <span>
                    <span className="text-sm font-medium text-foreground">Compact dashboard</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      Tighter padding and spacing on the Overview page (headline, readiness cards,
                      roadmap, and deadline sections).
                    </span>
                  </span>
                </label>
                <div className="mt-6 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSavePreferences}
                    disabled={savingPreferences || !profile}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {savingPreferences ? "Saving…" : "Save preferences"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "help" && (
              <div>
                <SectionHeader
                  title="Help & feedback"
                  subtitle={`${PRODUCT_NAME} is a planning tool — see Sources for what we hold and how we hold it.`}
                />
                <div className="space-y-4 text-sm text-foreground">
                  <p className="text-muted-foreground">
                    Deadlines, insights, and checklist items in this app are for organization only.
                    They don’t replace your target institution’s admissions office, registrar, or
                    financial aid communications.{" "}
                    <Link href="/sources" className="text-primary hover:underline">
                      Sources
                    </Link>{" "}
                    lists what deadline data we hold and how we hold it.
                  </p>
                  <div>
                    <p className="font-medium mb-2">Official resources</p>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>
                        <a
                          href="https://www.goapplytexas.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          ApplyTexas
                        </a>{" "}
                        — many Texas public institutions use this application hub.
                      </li>
                    </ul>
                  </div>

                  <div
                    id="request-transcript"
                    className="scroll-mt-24 rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <p className="font-medium text-foreground">Requesting your official transcript</p>
                    <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted-foreground">
                      <li>
                        Log in to your current college&apos;s student portal or registrar site and
                        order an <strong className="text-foreground">official</strong> transcript
                        sent to your target university (or to yourself to upload later).
                      </li>
                      <li>
                        Confirm whether the school sends electronically, by mail, or through a
                        third-party service (e.g. National Student Clearinghouse).
                      </li>
                      <li>
                        Allow 1–2 weeks for processing; request early so it arrives before your
                        application deadline.
                      </li>
                      <li>
                        Update your transfer checklist when the request is submitted, and again when
                        the receiving school confirms receipt.
                      </li>
                    </ol>
                  </div>

                  <div
                    id="rec-letters"
                    className="scroll-mt-24 rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <p className="font-medium text-foreground">Who to ask for recommendation letters</p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
                      <li>
                        <strong className="text-foreground">Professor or instructor</strong> who knows
                        your academic work (STEM or major courses work well).
                      </li>
                      <li>
                        <strong className="text-foreground">Advisor or counselor</strong> at your
                        community college who can speak to your transfer goals.
                      </li>
                      <li>
                        <strong className="text-foreground">Supervisor</strong> only if the program
                        allows non-academic letters — check your target school&apos;s requirements.
                      </li>
                    </ul>
                    <p className="mt-3 text-muted-foreground">
                      Ask at least 2–3 weeks before the deadline, provide your resume and draft
                      personal statement, and waive FERPA rights on the application if required.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Contact</p>
                    {SUPPORT_EMAIL ? (
                      <p className="text-muted-foreground">
                        <a
                          href={`mailto:${SUPPORT_EMAIL}`}
                          className="text-primary hover:underline"
                        >
                          Email support
                        </a>{" "}
                        ({SUPPORT_EMAIL})
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        Set{" "}
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          NEXT_PUBLIC_SUPPORT_EMAIL
                        </code>{" "}
                        in your environment to show a support address here. No ticket system in v1.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {message && (
              <p
                className={`mt-4 text-sm ${message.type === "success" ? "text-chart-2" : "text-destructive"}`}
              >
                {message.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

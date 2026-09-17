"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const origin = window.location.origin
      const next = encodeURIComponent("/dashboard/settings?tab=security")
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/callback?next=${next}`,
      })
      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hall-app flex min-h-screen items-center justify-center bg-[color:var(--hall-paper)] px-6">
      <div className="w-full max-w-[420px]">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--hall-ink)]/65 transition-colors hover:text-[color:var(--hall-ink)]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to login
        </Link>

        <div className="border border-[color:var(--hall-rule)] bg-[color:var(--hall-paper)] p-8 shadow-none">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-none border border-[color:var(--hall-rule)] bg-[color:var(--hall-clay)]/15">
                <Check className="h-6 w-6 text-chart-2" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Check your email</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  If an account exists for{" "}
                  <span className="font-medium text-foreground">{email}</span>, we sent a reset
                  link. It opens Account &amp; security so you can set a new password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setError("")
                }}
                className="mt-1 flex h-10 w-full items-center justify-center rounded-none border border-[color:var(--hall-rule)] text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Didn&apos;t get it? Try again
              </button>
              <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <p className="tp-eyebrow text-accent">Account recovery</p>
              <h2 className="font-heading mt-3 text-xl font-semibold tracking-tight text-foreground">
                Reset your password
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Enter the email on your account. We&apos;ll send a link to choose a new password.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="h-10 w-full rounded-none border border-[color:var(--hall-rule)] bg-background px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                </div>
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-none bg-[color:var(--hall-ink)] text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />}
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

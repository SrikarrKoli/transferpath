"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Loader2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-[420px]">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-accent transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to login
        </Link>

        <div className="rounded-xl border border-border bg-card p-8">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-2/15">
                <Check className="h-6 w-6 text-chart-2" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Check your email</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  We sent a reset link to <span className="text-foreground font-medium">{email}</span>. It expires in 15 minutes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSubmitted(false); setEmail("") }}
                className="mt-1 flex h-10 w-full items-center justify-center rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Didn&apos;t get it? Resend email
              </button>
              <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <p className="tp-eyebrow text-accent">
                Account recovery
              </p>
              <h2 className="font-heading mt-3 text-xl font-semibold tracking-tight text-foreground">
                Reset your password
              </h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Enter the email address on your account and we&apos;ll send you a reset link.
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
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />}
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

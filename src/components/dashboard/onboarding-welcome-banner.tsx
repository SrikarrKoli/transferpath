"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

/** Shown once when a signed-in user hits dashboard via Get started → /onboarding redirect. */
export function OnboardingWelcomeBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (searchParams.get("from") === "onboarding") setVisible(true)
  }, [searchParams])

  if (!visible) return null

  function dismiss() {
    setVisible(false)
    const next = new URLSearchParams(searchParams.toString())
    next.delete("from")
    const q = next.toString()
    router.replace(q ? `${pathname}?${q}` : pathname)
  }

  return (
    <div className="mb-4 border border-[#1a2332]/15 bg-[#f7f2e8] px-4 py-3 text-sm text-[#1a2332]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">You&apos;re already set up on TransferPath.</p>
          <p className="mt-1 text-[#1a2332]/70">
            Get started opens your campus when you have a profile. Explore halls for deadlines, courses,
            and essays — or update schools anytime in Settings.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/settings"
            className="border border-[#1a2332]/25 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-[#1a2332]/04"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="border border-[#b85c38] bg-[#b85c38] px-3 py-1.5 text-xs font-semibold text-[#f7f2e8] hover:bg-[#a34f2f]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const STORAGE_KEY = "tp-union-coach-v1"

const STEPS = [
  {
    n: "1",
    title: "Log a course",
    body: "Put one class on your Classroom plan so requirements can track against real work.",
    href: "/dashboard/plan",
    cta: "Open Plan",
  },
  {
    n: "2",
    title: "Confirm a deadline",
    body: "Check Clock Tower for official dates — or mark what’s missing so nothing sneaks up.",
    href: "/dashboard/deadlines",
    cta: "Open Deadlines",
  },
  {
    n: "3",
    title: "Start an essay",
    body: "Open the Library and begin a draft. Saving early beats writing everything the night before.",
    href: "/dashboard/essay",
    cta: "Open Essays",
  },
] as const

/** First-run coaching strip on Student Union — dismissible, local-only. */
export function UnionFirstRunCoach() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== "1") setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      /* ignore */
    }
    setVisible(false)
  }

  return (
    <section className="union-coach" aria-labelledby="union-coach-heading">
      <div className="union-coach-head">
        <div>
          <p className="hall-caption" id="union-coach-heading">
            First three moves
          </p>
          <p className="union-coach-lede">
            Tracking gets easier once these are started — course, deadline, essay.
          </p>
        </div>
        <button type="button" onClick={dismiss} className="union-coach-dismiss">
          Dismiss
        </button>
      </div>
      <ol className="union-coach-steps">
        {STEPS.map((step) => (
          <li key={step.n} className="union-coach-step">
            <span className="union-coach-num" aria-hidden>
              {step.n}
            </span>
            <div className="union-coach-copy">
              <p className="union-coach-title">{step.title}</p>
              <p className="union-coach-body">{step.body}</p>
              <Link href={step.href} className="hall-ledger-link">
                {step.cta}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

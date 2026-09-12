import { ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"

/*
  Where a claim came from.

  The product previously qualified itself with 58 variations on "always verify
  on official sources", repeated up to ~34 times on a single page. Blanket
  hedging tells a student that everything is uncertain, which is both untrue
  and useless — it never identifies which part they should actually check.

  This replaces that with per-claim attribution. Every factual statement in the
  product is one of four things, and whichever it is travels with the claim
  rather than sitting in a page footer.

  Pairs with, and does not duplicate, `PlanStatus` in ui/status.tsx: status
  says how far the student has got, provenance says where the information came
  from. A single row legitimately carries one of each.
*/
export type EvidenceLevel = "verified" | "estimated" | "conditional" | "missing"

export type ProvenanceProps =
  | {
      /** A named source and a date we checked it. The only level allowed to state a fact. */
      level: "verified"
      source: string
      /** ISO timestamp. Null renders as "not yet checked" rather than being hidden. */
      checkedAt: string | null
      href?: string | null
      className?: string
    }
  | {
      /** Computed by TransferPath, or a planning default the product chose. */
      level: "estimated"
      basis: string
      className?: string
    }
  | {
      /** True only under a stated condition. The condition is the sentence. */
      level: "conditional"
      condition: string
      className?: string
    }
  | {
      /** We have no data. A fact about the product, never about the student. */
      level: "missing"
      what: string
      instead?: string
      className?: string
    }

/**
 * Pinned to UTC so a check date renders identically on the server and the
 * client. The rest of the app already formats dates this way.
 */
function formatCheckedAt(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d)
}

const baseClass = "text-caption leading-snug text-muted-foreground"

export function Provenance(props: ProvenanceProps) {
  if (props.level === "verified") {
    const checked = props.checkedAt ? formatCheckedAt(props.checkedAt) : null

    return (
      <p className={cn(baseClass, props.className)}>
        {props.href ? (
          <a
            href={props.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline decoration-border-strong underline-offset-2 hover:text-foreground"
          >
            {props.source}
            <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          props.source
        )}
        {checked ? ` · checked ${checked}` : " · not yet checked"}
      </p>
    )
  }

  if (props.level === "estimated") {
    return <p className={cn(baseClass, props.className)}>{props.basis}</p>
  }

  if (props.level === "conditional") {
    return <p className={cn(baseClass, props.className)}>{props.condition}</p>
  }

  return (
    <p className={cn(baseClass, props.className)}>
      {props.what}
      {props.instead ? ` ${props.instead}` : null}
    </p>
  )
}

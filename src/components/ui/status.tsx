import { CheckCircle2, Circle, CircleDashed, CircleHelp } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/*
  The single status vocabulary for the whole product.

  `unknown` is deliberately part of the set. TransferPath does not have deadline
  or requirement data for every school, and an item we cannot verify must read
  differently from one the student has genuinely not started — otherwise the
  product states a fact it does not have.
*/
export type PlanStatus = "done" | "in_progress" | "not_started" | "unknown"

interface StatusMeta {
  /** Always rendered for assistive tech, even when visually hidden. */
  label: string
  /** Plain-language expansion, for tooltips and detail views. */
  description: string
  Icon: LucideIcon
  iconClass: string
  badgeClass: string
}

export const PLAN_STATUS_META: Record<PlanStatus, StatusMeta> = {
  done: {
    label: "Complete",
    description: "You have marked this as finished.",
    Icon: CheckCircle2,
    iconClass: "text-success",
    badgeClass: "border-success/30 bg-success/10 text-success",
  },
  in_progress: {
    label: "In progress",
    description: "Underway — on your plan but not finished yet.",
    Icon: CircleDashed,
    iconClass: "text-accent",
    badgeClass: "border-accent/30 bg-accent/10 text-accent",
  },
  not_started: {
    label: "Not started",
    description: "Nothing recorded yet. This is not a problem on its own.",
    Icon: Circle,
    iconClass: "text-muted-foreground/40",
    badgeClass: "border-border-strong bg-muted text-muted-foreground",
  },
  unknown: {
    label: "Not confirmed",
    description:
      "We do not have verified information for this. Check your school's official transfer guide.",
    Icon: CircleHelp,
    iconClass: "text-muted-foreground/60",
    badgeClass: "border-border-strong bg-transparent text-muted-foreground",
  },
}

export function StatusIcon({
  status,
  className,
}: {
  status: PlanStatus
  className?: string
}) {
  const { Icon, iconClass, label } = PLAN_STATUS_META[status]
  return (
    <>
      <Icon
        aria-hidden="true"
        strokeWidth={1.5}
        className={cn("size-5 shrink-0", iconClass, className)}
      />
      <span className="sr-only">{label}</span>
    </>
  )
}

/**
 * Status as a labelled badge.
 *
 * `labelFrom` controls the breakpoint at which the label becomes visible. It
 * never removes the label from the DOM — below the breakpoint it is `sr-only`
 * rather than `hidden`, so status is never conveyed by colour and shape alone.
 */
export function StatusBadge({
  status,
  labelFrom = "always",
  className,
}: {
  status: PlanStatus
  labelFrom?: "always" | "sm" | "md"
  className?: string
}) {
  const { Icon, label, badgeClass } = PLAN_STATUS_META[status]

  const labelVisibility =
    labelFrom === "always"
      ? undefined
      : labelFrom === "sm"
        ? "sr-only sm:not-sr-only"
        : "sr-only md:not-sr-only"

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-sm border px-2.5 py-1 text-caption font-medium",
        badgeClass,
        className
      )}
    >
      <Icon aria-hidden="true" className="size-3 shrink-0" />
      <span className={labelVisibility}>{label}</span>
    </span>
  )
}

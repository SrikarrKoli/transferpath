"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  children,
  value,
  ...props
}: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn("h-full bg-primary transition-all", className)}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn(
        "ml-auto text-sm text-muted-foreground tabular-nums",
        className
      )}
      data-slot="progress-value"
      {...props}
    />
  )
}

/*
  Bar-only progress for the planning surfaces.

  The app had six separate hand-rolled versions of this — five divs with an
  inline width and one SVG — none of which exposed a role or a value, so
  progress was invisible to assistive tech everywhere it appeared. This builds
  on the same Base UI root as `Progress`, so role="progressbar" and the
  aria-value* attributes come for free, but it renders only the bar: callers
  keep their own label and value markup, which differs a lot per surface.

  `label` is required. A progress bar with no accessible name announces a bare
  percentage with no indication of what is being measured.
*/
function Meter({
  value,
  label,
  tone = "accent",
  size = "sm",
  className,
  trackClassName,
  indicatorClassName,
  indicatorStyle,
}: {
  value: number
  label: string
  tone?: "accent" | "success" | "primary"
  size?: "sm" | "md" | "lg"
  className?: string
  /** For surfaces with their own palette, e.g. the sidebar. */
  trackClassName?: string
  /** For surfaces with their own palette, e.g. the sidebar. Overrides `tone`. */
  indicatorClassName?: string
  /** For a fill colour computed from data, e.g. the GPA gauge. Prefer `tone`. */
  indicatorStyle?: React.CSSProperties
}) {
  const hasCustomFill = Boolean(indicatorClassName || indicatorStyle?.backgroundColor)

  return (
    <ProgressPrimitive.Root value={value} aria-label={label} className={cn("block", className)}>
      <ProgressPrimitive.Track
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          size === "sm" && "h-1",
          size === "md" && "h-1.5",
          size === "lg" && "h-2",
          trackClassName
        )}
      >
        <ProgressPrimitive.Indicator
          style={indicatorStyle}
          className={cn(
            "rounded-full transition-[width] duration-700 ease-out",
            !hasCustomFill && tone === "accent" && "bg-accent",
            !hasCustomFill && tone === "success" && "bg-success",
            !hasCustomFill && tone === "primary" && "bg-primary",
            indicatorClassName
          )}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export {
  Meter,
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { checklistCategoryForTaskKey } from "@/lib/build-tasks-deadlines-data"
import { cn } from "@/lib/utils"

export function MarkTaskDoneButton({
  userId,
  taskKey,
  className,
  variant = "secondary",
}: {
  userId: string
  taskKey: string
  className?: string
  variant?: "primary" | "secondary" | "text"
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function markDone() {
    if (pending) return
    setPending(true)
    const now = new Date().toISOString()
    const supabase = createClient()
    const { error } = await supabase.from("user_checklist_items").upsert(
      {
        user_id: userId,
        task_key: taskKey,
        category: checklistCategoryForTaskKey(taskKey),
        is_complete: true,
        completed_at: now,
      },
      { onConflict: "user_id,task_key" }
    )
    if (!error) {
      router.refresh()
    } else {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void markDone()}
      disabled={pending}
      className={cn(
        "text-sm font-medium transition disabled:opacity-60",
        variant === "primary" &&
          "rounded-md bg-primary px-5 py-2.5 text-primary-foreground hover:bg-primary/90",
        variant === "secondary" &&
          "rounded-md border border-border-strong px-5 py-2.5 text-foreground hover:bg-muted",
        variant === "text" && "text-primary hover:text-accent",
        className
      )}
    >
      {pending ? "Saving…" : "Mark as done"}
    </button>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { OnboardingData } from "@/types/onboarding"
import { ChevronsUpDown, X, Plus, Loader2, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { CANONICAL_COURSE_CATEGORIES as courseCategories } from "@/data/canonical-course-catalog"

interface Props {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function OnboardingStep4({ data, updateData, onNext, onBack }: Props) {
  const [comboOpen, setComboOpen] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<string[]>(data.completedCourses)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customCategory, setCustomCategory] = useState("")
  const [customSubmitting, setCustomSubmitting] = useState(false)
  const [customError, setCustomError] = useState("")
  const [customSuccess, setCustomSuccess] = useState(false)

  function toggleCourse(course: string) {
    const updated = selectedCourses.includes(course)
      ? selectedCourses.filter((c) => c !== course)
      : [...selectedCourses, course]
    setSelectedCourses(updated)
    updateData({ completedCourses: updated })
  }

  function removeCourse(course: string) {
    const updated = selectedCourses.filter((c) => c !== course)
    setSelectedCourses(updated)
    updateData({ completedCourses: updated })
  }

  async function handleCustomSubmit() {
    if (customName.trim().length < 3) {
      setCustomError("Course name must be at least 3 characters.")
      return
    }

    setCustomError("")
    setCustomSubmitting(true)

    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      setCustomError("You must be signed in to submit a course.")
      setCustomSubmitting(false)
      return
    }

    const { error } = await supabase.from("custom_courses").insert({
      user_id: userData.user.id,
      course_name: customName.trim(),
      category: customCategory.trim() || null,
    })

    if (error) {
      setCustomError(error.message)
      setCustomSubmitting(false)
      return
    }

    setCustomSubmitting(false)
    setCustomSuccess(true)
    setTimeout(() => {
      setDialogOpen(false)
      setCustomName("")
      setCustomCategory("")
      setCustomSuccess(false)
    }, 1500)
  }

  return (
    <div className="bg-card border border-border rounded-xl p-8">
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Transfer setup · Step 4 of 5
          </p>
          <h1 className="text-2xl font-medium text-foreground mb-2">What have you already completed?</h1>
          <p className="text-muted-foreground">
            Select core courses you&apos;ve finished so we can map what&apos;s left for your transfer path.
          </p>
        </div>

        <div className="space-y-4">
          <Popover open={comboOpen} onOpenChange={setComboOpen}>
            <PopoverTrigger
              className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-card px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary"
            >
              <span className="text-muted-foreground">Search courses...</span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--anchor-width)] p-0"
              align="start"
              sideOffset={4}
            >
              <Command>
                <CommandInput placeholder="Search courses..." />
                <CommandList className="max-h-64">
                  <CommandEmpty>No results found.</CommandEmpty>
                  {courseCategories.map((cat) => (
                    <CommandGroup key={cat.category} heading={cat.category}>
                      {cat.courses.map((course) => {
                        const isSelected = selectedCourses.includes(course)
                        return (
                          <CommandItem
                            key={`${cat.category}-${course}`}
                            value={`${course} ${cat.category}`}
                            data-checked={isSelected ? true : undefined}
                            onSelect={() => {
                              toggleCourse(course)
                              setComboOpen(false)
                            }}
                          >
                            {course}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedCourses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedCourses.map((course) => (
                <span
                  key={course}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary font-medium"
                >
                  {course}
                  <button
                    type="button"
                    onClick={() => removeCourse(course)}
                    className="hover:text-primary/90"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              No courses selected yet — that&apos;s okay.
            </p>
          )}

          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Can&apos;t find your course? Add it manually
          </button>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button
            onClick={onNext}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit a course</DialogTitle>
            <DialogDescription>
              Can&apos;t find your course? Submit it and we&apos;ll review it.
            </DialogDescription>
          </DialogHeader>

          {customSuccess ? (
            <div className="flex items-center gap-2 py-4 text-sm text-chart-2 font-medium">
              <Check className="h-4 w-4" />
              Submitted! We&apos;ll review it.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-course-name">Course name</Label>
                <Input
                  id="custom-course-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Advanced Data Analytics"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-course-category">
                  Category <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="custom-course-category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </div>

              {customError && (
                <p className="text-sm text-red-600">{customError}</p>
              )}

              <Button
                onClick={handleCustomSubmit}
                disabled={customSubmitting || customName.trim().length < 3}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {customSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Course"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

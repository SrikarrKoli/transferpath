"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Meter } from "@/components/ui/progress"
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
import type { OnboardingData } from "@/types/onboarding"
import { FIELD_OF_STUDY_OPTIONS } from "@/lib/field-of-study"
import { ChevronsUpDown } from "lucide-react"

interface Props {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const majorCategories: { category: string; majors: string[] }[] = [
  {
    category: "Business",
    majors: ["Accounting", "Finance", "Marketing", "Management", "Business Administration", "Management Information Systems", "Information Systems", "Business Analytics", "Supply Chain Management", "Operations Management", "Entrepreneurship", "International Business", "Human Resource Management", "Real Estate", "Risk Management and Insurance", "Sports Management", "Hospitality Management", "Retail Management", "Economics", "Agribusiness", "Healthcare Administration"],
  },
  {
    category: "Computer Science / Technology",
    majors: ["Computer Science", "Software Engineering", "Computer Engineering", "Information Technology", "Information Systems", "Data Science", "Cybersecurity", "Artificial Intelligence", "Machine Learning", "Game Development", "Web Development", "Cloud Computing", "Network Administration", "Applied Computing", "Human-Computer Interaction", "Informatics", "Digital Media", "Technology Management"],
  },
  {
    category: "Engineering",
    majors: ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Chemical Engineering", "Biomedical Engineering", "Aerospace Engineering", "Petroleum Engineering", "Industrial Engineering", "Environmental Engineering", "Computer Engineering", "Software Engineering", "Materials Science and Engineering", "Construction Engineering", "Architectural Engineering", "Nuclear Engineering", "Manufacturing Engineering", "Engineering Technology", "Robotics Engineering", "Mechatronics"],
  },
  {
    category: "Natural Sciences",
    majors: ["Biology", "Chemistry", "Biochemistry", "Physics", "Mathematics", "Statistics", "Environmental Science", "Neuroscience", "Microbiology", "Genetics", "Ecology", "Marine Biology", "Geology", "Earth Science", "Astronomy", "Astrophysics", "Data Science", "Actuarial Science", "Applied Mathematics", "Forensic Science"],
  },
  {
    category: "Health / Pre-Health",
    majors: ["Nursing", "Public Health", "Health Sciences", "Kinesiology", "Exercise Science", "Nutrition", "Biomedical Sciences", "Medical Laboratory Science", "Pre-Med", "Pre-Dental", "Pre-Pharmacy", "Pre-Physical Therapy", "Pre-Occupational Therapy", "Pre-Veterinary", "Respiratory Care", "Radiologic Sciences", "Healthcare Administration", "Speech-Language Pathology", "Rehabilitation Studies", "Human Development and Family Sciences"],
  },
  {
    category: "Liberal Arts / Social Sciences",
    majors: ["Psychology", "Sociology", "Political Science", "History", "English", "Philosophy", "Anthropology", "Geography", "International Relations", "Global Studies", "Women's and Gender Studies", "African American Studies", "Mexican American Studies", "Asian American Studies", "Religious Studies", "Linguistics", "American Studies", "Humanities", "Classical Studies"],
  },
  {
    category: "Communication / Media",
    majors: ["Communication Studies", "Journalism", "Public Relations", "Advertising", "Radio-Television-Film", "Media Studies", "Digital Communication", "Sports Media", "Strategic Communication", "Corporate Communication", "Communication Design", "Technical Communication", "Speech Communication"],
  },
  {
    category: "Education",
    majors: ["Elementary Education", "Early Childhood Education", "Special Education", "Bilingual Education", "Secondary Education", "Mathematics Education", "Science Education", "English Language Arts Education", "Social Studies Education", "Physical Education", "Music Education", "Art Education", "Educational Studies", "Human Development and Family Studies"],
  },
  {
    category: "Arts / Design",
    majors: ["Studio Art", "Art History", "Graphic Design", "Communication Design", "UX Design", "Interior Design", "Architecture", "Landscape Architecture", "Music", "Music Performance", "Music Education", "Theatre", "Dance", "Film", "Photography", "Animation", "Game Design", "Fashion Design", "Fine Arts", "Visual Arts"],
  },
  {
    category: "Public Service / Policy / Law",
    majors: ["Criminal Justice", "Public Policy", "Public Administration", "Social Work", "Legal Studies", "Pre-Law", "Urban Studies", "Emergency Management", "Nonprofit Management", "Homeland Security", "Political Science", "Government", "International Affairs"],
  },
  {
    category: "Agriculture / Environment",
    majors: ["Agricultural Economics", "Animal Science", "Plant and Soil Science", "Environmental Science", "Wildlife and Fisheries Sciences", "Forestry", "Horticulture", "Food Science", "Agricultural Communications", "Agricultural Leadership", "Agricultural Engineering", "Natural Resource Management", "Range Science", "Ecology"],
  },
  {
    category: "Architecture / Construction",
    majors: ["Architecture", "Architectural Engineering", "Interior Design", "Construction Science", "Construction Management", "Urban Planning", "Landscape Architecture", "Sustainable Design", "Real Estate Development"],
  },
  {
    category: "Interdisciplinary / Other",
    majors: ["General Studies", "University Studies", "Interdisciplinary Studies", "Applied Arts and Sciences", "Liberal Studies", "Multidisciplinary Studies", "Individualized Studies", "Honors Studies"],
  },
]

export function OnboardingStep3({ data, updateData, onNext, onBack }: Props) {
  const [majorOpen, setMajorOpen] = useState(false)
  const gpaValue = parseFloat(data.gpa) || 0
  const canProceed =
    data.major !== "" &&
    data.fieldOfStudy !== "" &&
    data.gpa !== "" &&
    data.creditsCompleted !== ""

  const getGpaColor = (gpa: number) => {
    if (gpa < 2.5) return "var(--chart-4)"
    if (gpa < 3.0) return "var(--chart-3)"
    if (gpa < 3.5) return "var(--chart-2)"
    return "var(--primary)"
  }

  /*
    These bands used to read "Below average" through "Highly competitive",
    which judged the student's chances against no stated basis and contradicted
    the product's own promise not to predict admission. The 3.0 planner
    benchmark is the only reference point TransferPath actually has, so the
    label states that relationship and nothing more.
  */
  const getGpaLabel = (gpa: number) =>
    gpa >= 3.0
      ? "At or above the 3.0 planner benchmark"
      : "Below the 3.0 planner benchmark"

  return (
    <div className="bg-card border border-border rounded-xl p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-foreground mb-2">Your major, field, and grades</h1>
          <p className="text-muted-foreground">
            Major is free text; field of study drives STEM vs core-only planning (you can change it later in Settings).
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>What do you want to study?</Label>
            <Popover open={majorOpen} onOpenChange={setMajorOpen}>
              <PopoverTrigger
                className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <span className={data.major ? "text-foreground" : "text-muted-foreground"}>
                  {data.major || "Select your major"}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--anchor-width)] p-0"
                align="start"
                sideOffset={4}
              >
                <Command>
                  <CommandInput placeholder="Search majors..." />
                  <CommandList className="max-h-64">
                    <CommandEmpty>No results found.</CommandEmpty>
                    {majorCategories.map((cat) => (
                      <CommandGroup key={cat.category} heading={cat.category}>
                        {cat.majors.map((major) => (
                          <CommandItem
                            key={`${cat.category}-${major}`}
                            value={`${major} ${cat.category}`}
                            data-checked={data.major === major ? true : undefined}
                            onSelect={() => {
                              updateData({ major })
                              setMajorOpen(false)
                            }}
                          >
                            {major}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Which best describes your intended field?</Label>
            <p className="text-xs text-muted-foreground">
              Used for checklist and prep suggestions—not inferred from your major name.
            </p>
            <div className="space-y-2.5 mt-2">
              {FIELD_OF_STUDY_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className={`flex gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    data.fieldOfStudy === o.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="fieldOfStudy"
                    value={o.value}
                    checked={data.fieldOfStudy === o.value}
                    onChange={() => updateData({ fieldOfStudy: o.value })}
                    className="mt-1"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{o.label}</div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{o.helper}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpa">Current GPA</Label>
            <Input
              id="gpa"
              type="number"
              step="0.1"
              min="0"
              max="4"
              placeholder="3.4"
              value={data.gpa}
              onChange={(e) => updateData({ gpa: e.target.value })}
            />
            {data.gpa && (
              <div className="mt-3">
                <Meter
                  value={(gpaValue / 4) * 100}
                  label={`GPA ${gpaValue} out of 4.0 — ${getGpaLabel(gpaValue)}`}
                  size="lg"
                  indicatorStyle={{ backgroundColor: getGpaColor(gpaValue) }}
                />
                <p className="text-xs mt-1" style={{ color: getGpaColor(gpaValue) }}>
                  {getGpaLabel(gpaValue)}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="credits">Total credits completed</Label>
            <Input
              id="credits"
              type="number"
              min="0"
              max="200"
              placeholder="42"
              value={data.creditsCompleted}
              onChange={(e) => updateData({ creditsCompleted: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SchoolResult {
  id: string
  name: string
  abbreviation: string
  location: string
  type: string
}

export interface SchoolSearchProps {
  value: string
  selectedId: string | null
  onSelect: (id: string, name: string) => void
  onClear: () => void
  placeholder?: string
  /** When set, limits results to this institution type. */
  universityType?: "community_college" | "four_year"
}

/** Remounts when parent-driven selection/value changes so `query` re-syncs without setState-in-effect. */
function SchoolSearchInner({
  value,
  selectedId,
  onSelect,
  onClear,
  placeholder = "Search for a school...",
  universityType,
}: SchoolSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<SchoolResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [error, setError] = useState("")

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [])

  const search = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      setError("")

      const supabase = createClient()
      let q = supabase
        .from("universities")
        .select("id, name, abbreviation, location, type")
        .ilike("name", `%${searchQuery}%`)
        .order("name", { ascending: true })
        .limit(10)

      if (universityType) {
        q = q.eq("type", universityType)
      }

      const { data, error: queryError } = await q

      if (queryError) {
        setError("Could not load schools. Please try again.")
        setIsLoading(false)
        return
      }

      setResults(data ?? [])
      setIsOpen(true)
      setHighlightedIndex(-1)
      setIsLoading(false)
    },
    [universityType]
  )

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newQuery = e.target.value
    setQuery(newQuery)

    if (selectedId) {
      onClear()
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(newQuery), 300)
  }

  function handleSelect(school: SchoolResult) {
    setQuery(school.name)
    onSelect(school.id, school.name)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) {
      if (e.key === "Escape") setIsOpen(false)
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlightedIndex >= 0) {
        handleSelect(results[highlightedIndex])
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= 2 && results.length > 0 && !selectedId) setIsOpen(true)
          }}
          placeholder={placeholder}
          className="h-10 w-full rounded-none border border-[color:var(--hall-rule)] bg-[color:var(--hall-paper)] pl-9 pr-9 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-[color:var(--hall-ink)] focus:outline-none focus:ring-1 focus:ring-[color:var(--hall-ink)]/20"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-[280px] w-full overflow-auto rounded-none border border-[color:var(--hall-rule)] bg-[color:var(--hall-paper)] shadow-none">
          {results.map((school, index) => (
            <li key={school.id}>
              <button
                type="button"
                onClick={() => handleSelect(school)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full text-left px-3 py-2.5 transition-colors ${
                  index === highlightedIndex ? "bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <p className="text-sm text-foreground">{school.name}</p>
                <p className="text-xs text-muted-foreground">{school.location}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full rounded-none border border-[color:var(--hall-rule)] bg-[color:var(--hall-paper)] px-3 py-4 text-center shadow-none">
          <p className="text-sm text-muted-foreground">
            No schools found — yours may not be listed yet
          </p>
        </div>
      )}
    </div>
  )
}

export function SchoolSearch(props: SchoolSearchProps) {
  const resetKey = `${props.selectedId ?? ""}::${props.value}::${props.universityType ?? ""}`
  return <SchoolSearchInner key={resetKey} {...props} />
}

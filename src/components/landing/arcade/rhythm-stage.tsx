"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const LANES = [
  { key: "d", label: "D", course: "ENGL 1301", color: "bg-[#b8ff3c] text-black" },
  { key: "f", label: "F", course: "MATH 2413", color: "bg-[#00f0ff] text-black" },
  { key: "j", label: "J", course: "CS 1337", color: "bg-[#ff2d95] text-white" },
  { key: "k", label: "K", course: "Apply", color: "bg-[#ffc107] text-black" },
] as const

type Note = { id: number; lane: number; y: number; hit?: boolean; missed?: boolean }

type Props = {
  onCombo: (combo: number, score: number) => void
}

export function RhythmStage({ onCombo }: Props) {
  const [notes, setNotes] = useState<Note[]>([])
  const [combo, setCombo] = useState(0)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<string | null>(null)
  const [judgement, setJudgement] = useState<string | null>(null)
  const idRef = useRef(0)
  const comboRef = useRef(0)
  const scoreRef = useRef(0)
  const notesRef = useRef<Note[]>([])
  const hitZone = 78

  useEffect(() => {
    onCombo(combo, score)
  }, [combo, score, onCombo])

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) return

    let raf = 0
    let lastSpawn = 0
    let last = performance.now()

    const loop = (now: number) => {
      const dt = Math.min(32, now - last)
      last = now

      if (now - lastSpawn > 900) {
        lastSpawn = now
        const lane = Math.floor(Math.random() * 4)
        idRef.current += 1
        notesRef.current = [
          ...notesRef.current.filter((n) => !n.hit && !n.missed && n.y < 120),
          { id: idRef.current, lane, y: -10 },
        ]
      }

      let missed = false
      notesRef.current = notesRef.current.map((n) => {
        if (n.hit || n.missed) return n
        const y = n.y + dt * 0.045
        if (y > hitZone + 14) {
          missed = true
          return { ...n, y, missed: true }
        }
        return { ...n, y }
      })

      if (missed) {
        comboRef.current = 0
        setCombo(0)
        setJudgement("MISS")
      }

      setNotes([...notesRef.current])
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const tryHit = (lane: number) => {
    const candidates = notesRef.current.filter(
      (n) => n.lane === lane && !n.hit && !n.missed && Math.abs(n.y - hitZone) < 12
    )
    if (!candidates.length) {
      comboRef.current = 0
      setCombo(0)
      setFlash(LANES[lane].label)
      setJudgement("MISS")
      setTimeout(() => setFlash(null), 120)
      return
    }
    const best = candidates.sort(
      (a, b) => Math.abs(a.y - hitZone) - Math.abs(b.y - hitZone)
    )[0]
    const dist = Math.abs(best.y - hitZone)
    const grade = dist < 4 ? "PERFECT" : dist < 8 ? "GREAT" : "OK"
    const pts = grade === "PERFECT" ? 300 : grade === "GREAT" ? 200 : 100
    notesRef.current = notesRef.current.map((n) =>
      n.id === best.id ? { ...n, hit: true } : n
    )
    comboRef.current += 1
    scoreRef.current += pts * Math.max(1, Math.floor(comboRef.current / 2))
    setCombo(comboRef.current)
    setScore(scoreRef.current)
    setJudgement(grade)
    setFlash(LANES[lane].label)
    setTimeout(() => setFlash(null), 120)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, number> = { d: 0, f: 1, j: 2, k: 3 }
      const lane = map[e.key.toLowerCase()]
      if (lane === undefined) return
      e.preventDefault()
      tryHit(lane)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- game loop handlers use refs
  }, [])

  return (
    <div className="relative overflow-hidden rounded-sm border-2 border-[#ff2d95]/80 bg-black/70 p-3 shadow-[0_0_40px_rgba(255,45,149,0.35)]">
      <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-[#00f0ff]">
        <span>Stage 01 · Credit Clear</span>
        <span className="text-[#b8ff3c]">Combo x{combo}</span>
        <span className="text-white/80">{score.toString().padStart(6, "0")}</span>
      </div>

      <div className="relative grid h-56 grid-cols-4 gap-2 sm:h-64">
        {LANES.map((lane, i) => (
          <button
            key={lane.key}
            type="button"
            onClick={() => tryHit(i)}
            className={cn(
              "relative overflow-hidden rounded-sm border border-white/15 bg-white/5 transition",
              flash === lane.label && "brightness-150 ring-2 ring-white"
            )}
          >
            <div
              className="pointer-events-none absolute inset-x-1 h-1 rounded-full bg-white/80"
              style={{ top: `${hitZone}%` }}
            />
            {notes
              .filter((n) => n.lane === i && !n.hit && !n.missed)
              .map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "pointer-events-none absolute inset-x-2 rounded-sm py-2 text-center font-mono text-[10px] font-bold",
                    lane.color
                  )}
                  style={{ top: `${n.y}%`, transform: "translateY(-50%)" }}
                >
                  {lane.course}
                </div>
              ))}
            <div className="absolute inset-x-0 bottom-2 text-center">
              <span
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-black/40 font-mono text-sm font-bold shadow-lg",
                  lane.color
                )}
              >
                {lane.label}
              </span>
            </div>
          </button>
        ))}

        {judgement && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                "font-mono text-3xl font-black tracking-widest drop-shadow-[0_0_12px_currentColor] sm:text-4xl",
                judgement === "PERFECT" && "text-[#b8ff3c]",
                judgement === "GREAT" && "text-[#00f0ff]",
                judgement === "OK" && "text-[#ffc107]",
                judgement === "MISS" && "text-[#ff2d95]"
              )}
            >
              {judgement}
            </span>
          </div>
        )}
      </div>

      <p className="mt-2 text-center font-mono text-[10px] text-white/55">
        Tap pads or press <span className="text-white">D F J K</span> — clear courses, keep the combo
      </p>
    </div>
  )
}

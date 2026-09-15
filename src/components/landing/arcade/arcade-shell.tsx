"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useState } from "react"
import { CTA_GET_STARTED, PRODUCT_NAME, REGION_TAGLINE } from "@/lib/brand"
import { CrtShaderBg } from "./crt-shader-bg"
import { Cabinet3D } from "./cabinet-3d"
import { RhythmStage } from "./rhythm-stage"

const stages = [
  {
    id: "01",
    title: "SITUATION SELECT",
    blurb: "Pick your school, target, major, GPA. Character create — two minutes.",
    clear: "UNLOCKS: SEMESTER MAP",
  },
  {
    id: "02",
    title: "CREDIT HIGHWAY",
    blurb: "Courses line up term by term against real requirements. Draft your roster.",
    clear: "UNLOCKS: DEADLINE RAID",
  },
  {
    id: "03",
    title: "DEADLINE RAID",
    blurb: "Essays, transcripts, apps. Clear them before the timer hits zero.",
    clear: "UNLOCKS: STAGE CLEAR",
  },
] as const

export function ArcadeShell() {
  const [combo, setCombo] = useState(0)
  const [score, setScore] = useState(0)
  const onCombo = useCallback((c: number, s: number) => {
    setCombo(c)
    setScore(s)
  }, [])

  return (
    <div className="arcade-root relative min-h-screen overflow-x-clip text-white">
      <div className="fixed inset-0 -z-10">
        <CrtShaderBg />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_70%)]" />
      </div>

      {/* Nav */}
      <header className="relative z-20 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-arcade text-[11px] tracking-[0.18em] text-[#b8ff3c] sm:text-xs">
            {PRODUCT_NAME.toUpperCase()}
            <span className="text-[#ff2d95]">.EXE</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5">
            <a href="#play" className="hidden font-mono text-[10px] uppercase tracking-widest text-white/60 hover:text-[#00f0ff] sm:inline">
              Play
            </a>
            <a href="#stages" className="hidden font-mono text-[10px] uppercase tracking-widest text-white/60 hover:text-[#00f0ff] sm:inline">
              Stages
            </a>
            <Link href="/login" className="font-mono text-[10px] uppercase tracking-widest text-white/60 hover:text-white">
              Log in
            </Link>
            <Link
              href="/onboarding"
              className="arcade-btn border-2 border-[#b8ff3c] bg-[#b8ff3c] px-3 py-1.5 font-arcade text-[9px] tracking-widest text-black hover:bg-transparent hover:text-[#b8ff3c] sm:text-[10px]"
            >
              INSERT COIN
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero: cabinet + copy */}
        <section className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#00f0ff]">
              Attract mode · {REGION_TAGLINE}
            </p>
            <h1 className="mt-4 font-arcade text-2xl leading-tight tracking-wide text-white drop-shadow-[0_0_18px_rgba(255,45,149,0.55)] sm:text-3xl md:text-4xl">
              CLEAR THE
              <br />
              <span className="text-[#ff2d95]">TRANSFER</span>
              <br />
              <span className="text-[#b8ff3c]">STAGE</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
              Your degree plan is the high-score run. Hit the pads, keep the combo, knock out credits
              and deadlines before the timer owns you.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/onboarding"
                className="arcade-btn inline-flex items-center gap-2 border-2 border-[#ff2d95] bg-[#ff2d95] px-5 py-3 font-arcade text-[10px] tracking-widest text-white shadow-[0_0_24px_rgba(255,45,149,0.55)] hover:bg-transparent"
              >
                PRESS START
              </Link>
              <a
                href="#play"
                className="inline-flex border-2 border-white/25 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/80 hover:border-[#00f0ff] hover:text-[#00f0ff]"
              >
                Try a stage ↓
              </a>
            </div>
            <div className="mt-6 flex gap-4 font-mono text-[10px] uppercase tracking-widest text-white/45">
              <span>
                Combo <span className="text-[#b8ff3c]">x{combo}</span>
              </span>
              <span>
                Score <span className="text-[#00f0ff]">{score.toString().padStart(6, "0")}</span>
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 rounded-full bg-[#ff2d95]/20 blur-3xl" />
            <Cabinet3D combo={combo} score={score} />
            <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
              Drag to tilt · live cabinet screen
            </p>
          </div>
        </section>

        {/* Marquee strip */}
        <div className="relative border-y border-white/10 bg-black/50">
          <div className="arcade-marquee flex gap-12 whitespace-nowrap py-3 font-arcade text-[10px] tracking-[0.25em] text-[#b8ff3c]">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i}>
                HIGH SCORE · CREDITS · DEADLINES · ESSAYS · STAGE CLEAR · INSERT COIN ·
              </span>
            ))}
          </div>
        </div>

        {/* Rhythm playable stage */}
        <section id="play" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ffc107]">
                Interactive demo
              </p>
              <h2 className="mt-2 font-arcade text-lg tracking-wide text-white sm:text-xl">
                RHYTHM CLEAR
              </h2>
            </div>
            <p className="max-w-sm text-sm text-white/60">
              Each pad is a course on your path. Chain hits to build combo — miss and the run resets.
            </p>
          </div>
          <RhythmStage onCombo={onCombo} />
        </section>

        {/* Generated art banner */}
        <section className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="overflow-hidden border-2 border-[#00f0ff]/40 shadow-[0_0_40px_rgba(0,240,255,0.2)]">
            <Image
              src="/arcade/stage-clear-banner.png"
              alt="Stage clear neon results screen"
              width={1600}
              height={900}
              className="h-auto w-full object-cover"
              priority={false}
            />
          </div>
        </section>

        {/* Stages */}
        <section id="stages" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-arcade text-lg tracking-wide text-[#ff2d95] sm:text-xl">
            HOW TO BEAT THE RUN
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {stages.map((s) => (
              <article
                key={s.id}
                className="group relative overflow-hidden border-2 border-white/15 bg-black/55 p-5 transition hover:border-[#b8ff3c] hover:shadow-[0_0_30px_rgba(184,255,60,0.25)]"
              >
                <div className="font-arcade text-[10px] text-[#00f0ff]">STAGE {s.id}</div>
                <h3 className="mt-3 font-arcade text-sm leading-relaxed tracking-wide text-white">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/65">{s.blurb}</p>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-[#b8ff3c]">
                  {s.clear}
                </p>
                <div className="pointer-events-none absolute -right-4 -top-4 font-arcade text-6xl text-white/5 transition group-hover:text-[#ff2d95]/15">
                  {s.id}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Campus art + copy */}
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-2">
          <div className="overflow-hidden border-2 border-[#ff2d95]/35 shadow-[0_0_40px_rgba(255,45,149,0.2)]">
            <Image
              src="/arcade/neon-campus.png"
              alt="Neon campus arcade district"
              width={1024}
              height={1024}
              className="h-auto w-full object-cover"
            />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#00f0ff]">
              World map
            </p>
            <h2 className="mt-2 font-arcade text-lg leading-relaxed tracking-wide text-white sm:text-xl">
              ONE CABINET.
              <br />
              WHOLE PATH.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Roadmap, requirements, essays, and deadlines read from the same save file. Update one —
              the scoreboard updates with you. No fake admission predictions. Just the next clear.
            </p>
            <ul className="mt-6 space-y-2 font-mono text-xs uppercase tracking-widest text-white/55">
              <li className="flex gap-2">
                <span className="text-[#b8ff3c]">▶</span> Shared Texas deadline database
              </li>
              <li className="flex gap-2">
                <span className="text-[#ff2d95]">▶</span> Planning score, not fortune-telling
              </li>
              <li className="flex gap-2">
                <span className="text-[#00f0ff]">▶</span> Free · open source · teen-speed UI
              </li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="relative border-t-2 border-[#b8ff3c]/40 bg-black/70 py-16">
          <div className="absolute inset-0 opacity-40">
            <Image
              src="/arcade/arcade-marquee.png"
              alt=""
              fill
              className="object-cover opacity-30"
              aria-hidden
            />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ffc107]">
              Continue?
            </p>
            <h2 className="mt-4 font-arcade text-xl leading-relaxed tracking-wide text-white sm:text-2xl md:text-3xl">
              INSERT COIN
              <br />
              <span className="text-[#b8ff3c]">BUILD YOUR PATH</span>
            </h2>
            <Link
              href="/onboarding"
              className="arcade-btn mt-8 inline-flex border-2 border-white bg-white px-8 py-4 font-arcade text-[11px] tracking-[0.2em] text-black shadow-[0_0_30px_rgba(255,255,255,0.35)] hover:bg-[#b8ff3c] hover:border-[#b8ff3c]"
            >
              {CTA_GET_STARTED.toUpperCase()} →
            </Link>
            <p className="mt-4 font-mono text-[10px] text-white/45">About two minutes · no credit card</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/80 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 font-mono text-[10px] uppercase tracking-widest text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            {PRODUCT_NAME}.EXE · {REGION_TAGLINE}
          </p>
          <nav className="flex gap-4">
            <Link href="/sources" className="hover:text-[#00f0ff]">
              Sources
            </Link>
            <Link href="/privacy" className="hover:text-[#00f0ff]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#00f0ff]">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

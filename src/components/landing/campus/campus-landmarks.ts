"use client"

import * as THREE from "three"
import type { BuildingId } from "./campus-data"
import {
  C,
  arcade,
  balcony,
  barrelVault,
  blobShadow,
  clockFaces,
  column,
  facadePlaque,
  flat,
  gableRoof,
  hold,
  hipRoof,
  mesh,
  pediment,
  rbox,
  steps,
  umbrella,
  windowGrid,
} from "./campus-kit"

export const PIN_Y: Record<BuildingId, number> = {
  quad: 4.55,
  counselor: 2.48,
  library: 2.62,
  classroom: 2.28,
  registrar: 2.72,
  dorm: 2.72,
  gym: 2.18,
  union: 2.32,
}

function door(mat: THREE.Material, x: number, y: number, z: number, w = 0.28, h = 0.52) {
  return rbox(w, h, 0.06, mat, x, y, z, 0.02, false)
}

/** 01 — sandstone campanile with clocks, navy pyramid, gold orb. */
export function buildClockTower() {
  const g = new THREE.Group()
  const stone = hold(C.sand)
  const stoneDeep = hold(C.creamDeep)
  const navy = hold(C.navy)
  const gold = hold(C.gold)
  const glass = flat(0x243448)
  const trim = hold(C.trim)

  g.add(rbox(1.35, 0.22, 1.35, stoneDeep, 0, 0.11, 0, 0.008, false))
  g.add(rbox(1.02, 2.55, 1.02, stone, 0, 1.5, 0, 0.006))
  for (let i = 0; i < 4; i++) {
    const y = 0.55 + i * 0.58
    g.add(rbox(1.08, 0.07, 1.08, stoneDeep, 0, y, 0, 0.02, false))
  }
  windowGrid(g, {
    cols: 2,
    rows: 4,
    wallW: 0.72,
    wallH: 1.85,
    face: "south",
    y0: 0.45,
    glass,
    inset: 0.53,
  })
  windowGrid(g, {
    cols: 2,
    rows: 4,
    wallW: 0.72,
    wallH: 1.85,
    face: "east",
    y0: 0.45,
    glass,
    inset: 0.53,
  })

  g.add(rbox(1.18, 0.95, 1.18, stone, 0, 3.22, 0, 0.006))
  arcade(g, { bays: 3, span: 0.95, z: 0.6, y: 3.05, glass })
  arcade(g, { bays: 3, span: 0.95, z: -0.6, y: 3.05, glass })

  const faces = clockFaces(0.3, 0.61)
  faces.position.y = 3.28
  g.add(faces)

  const roof = mesh(new THREE.ConeGeometry(0.92, 1.05, 4), navy, 0, 4.18, 0)
  roof.rotation.y = Math.PI / 4
  g.add(roof)
  g.add(mesh(new THREE.SphereGeometry(0.09, 12, 10), gold, 0, 4.78, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.28, 8), trim, 0, 4.95, 0, false))

  g.add(steps(0.7, 0.42, stoneDeep, 0.82))
  g.add(door(flat(C.navySoft), 0, 0.42, 0.54, 0.26, 0.48))
  g.add(facadePlaque(1, 0.38, 0.72, 0.54))
  blobShadow(g, 1.05, 1.0, 0.45)
  return g
}

/** 02 — salmon L-villa with corner turret. Not a temple, not a cream box. */
export function buildCounselorHall() {
  const g = new THREE.Group()
  const body = hold(0xe07050)
  const wing = hold(0xc45a3c)
  const roof = hold(C.terracottaDeep)
  const trim = hold(C.trim)
  const glass = flat(0x243448)
  const navy = hold(C.navy)
  const hedgeMat = flat(C.hedge)

  g.add(rbox(2.55, 1.28, 1.48, body, -0.2, 0.64, 0, 0.008))
  g.add(hipRoof(2.72, 1.62, 0.58, roof, 1.28))
  g.add(rbox(2.62, 0.07, 1.55, trim, -0.2, 1.3, 0, 0.02, false))

  g.add(rbox(1.18, 1.08, 2.05, wing, 1.28, 0.54, 0.28, 0.008))
  g.add(hipRoof(1.32, 2.18, 0.48, roof, 1.08))

  const turret = mesh(new THREE.CylinderGeometry(0.42, 0.46, 1.62, 14), body, 1.05, 0.81, -0.55)
  g.add(turret)
  g.add(mesh(new THREE.ConeGeometry(0.52, 0.62, 14), navy, 1.05, 1.92, -0.55))
  g.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), flat(C.gold), 1.05, 2.28, -0.55, false))
  ;[0.55, 1.05].forEach((y) => {
    const pane = mesh(new THREE.BoxGeometry(0.16, 0.22, 0.06), glass, 1.05, y, -0.12, false)
    g.add(pane)
  })

  g.add(rbox(0.24, 0.62, 0.24, navy, -0.95, 1.72, -0.22, 0.02))
  g.add(rbox(0.3, 0.08, 0.3, trim, -0.95, 2.06, -0.22, 0.02, false))

  ;[-0.85, -0.28, 0.28].forEach((x) => {
    g.add(rbox(0.32, 0.48, 0.06, trim, x, 0.72, 0.76, 0.015, false))
    g.add(rbox(0.24, 0.38, 0.05, glass, x, 0.72, 0.79, 0.01, false))
  })

  g.add(rbox(1.05, 0.1, 0.62, trim, -0.2, 1.08, 0.82, 0.02, false))
  for (let i = 0; i < 5; i++) {
    g.add(rbox(0.2, 0.08, 0.58, i % 2 ? trim : navy, -0.6 + i * 0.2, 1.14, 0.84, 0.01, false))
  }
  g.add(door(navy, -0.2, 0.48, 0.78, 0.3, 0.55))
  g.add(steps(1.05, 0.48, flat(C.stone), 1.12))
  g.add(rbox(0.85, 0.22, 0.42, hedgeMat, 1.55, 0.12, 1.15, 0.06, false))
  g.add(rbox(0.55, 0.18, 0.55, hedgeMat, -1.15, 0.1, 0.85, 0.06, false))
  g.add(facadePlaque(2, 1.28, 0.72, 1.32))
  blobShadow(g, 2.05, 1.35, 0.42)
  return g
}

/** 03 — reading hall: tall window wall, copper roof, glass wing. */
export function buildLibrary() {
  const g = new THREE.Group()
  const body = hold(0xf0e4cc)
  const copper = hold(0xa34f2f)
  const trim = hold(C.trim)
  const glass = flat(0x243448)
  const navy = hold(C.navy)
  const reading = hold(0x4e8fa8)

  g.add(rbox(2.35, 1.72, 1.62, body, 0, 0.86, 0, 0.008))
  g.add(gableRoof(2.48, 1.72, 0.72, copper, 1.72))
  g.add(rbox(0.55, 0.55, 0.55, body, 0, 2.05, 0, 0.006))
  g.add(hipRoof(0.62, 0.62, 0.28, copper, 2.32))
  g.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), flat(C.gold), 0, 2.58, 0, false))
  g.add(rbox(1.28, 1.35, 1.35, reading, 1.62, 0.68, 0.08, 0.008))
  g.add(rbox(1.22, 0.95, 0.08, glass, 1.62, 0.72, 0.78, 0.02, false))
  g.add(hipRoof(1.38, 1.45, 0.36, copper, 1.36))

  for (let i = 0; i < 5; i++) {
    const x = -0.88 + i * 0.44
    g.add(rbox(0.2, 1.35, 0.07, glass, x, 0.92, 0.84, 0.02, false))
    g.add(rbox(0.26, 0.07, 0.08, trim, x, 1.62, 0.85, 0.01, false))
  }

  ;[-0.38, 0.38].forEach((x) => g.add(column(1.05, trim, x, 0.95, 0.12)))
  g.add(rbox(1.05, 0.1, 0.42, trim, 0, 1.22, 0.95, 0.02))
  g.add(door(navy, 0, 0.5, 0.84, 0.3, 0.55))
  g.add(steps(1.05, 0.5, flat(C.stone), 1.18))
  g.add(facadePlaque(3, 0.95, 0.7, 0.84))
  blobShadow(g, 1.55, 1.2, 0.42)
  return g
}

/** 04 — long academic bar, brick water table, terracotta gable, bell. */
export function buildClassrooms() {
  const g = new THREE.Group()
  const body = hold(0xf2e6ce)
  const brick = hold(C.brick)
  const roof = hold(C.terracotta)
  const glass = flat(0x243448)
  const frame = hold(C.trim)
  const navy = hold(C.navy)

  g.add(rbox(3.85, 1.18, 1.22, body, 0, 0.59, 0, 0.006))
  g.add(rbox(3.92, 0.22, 1.28, brick, 0, 0.12, 0, 0.03, false))
  g.add(gableRoof(3.95, 1.32, 0.55, roof, 1.18))
  for (let i = 0; i < 7; i++) {
    const x = -1.5 + i * 0.5
    g.add(rbox(0.22, 0.28, 0.06, frame, x, 0.52, 0.64, 0.015, false))
    g.add(rbox(0.16, 0.2, 0.05, glass, x, 0.52, 0.67, 0.01, false))
    g.add(rbox(0.22, 0.28, 0.06, frame, x, 0.92, 0.64, 0.015, false))
    g.add(rbox(0.16, 0.2, 0.05, glass, x, 0.92, 0.67, 0.01, false))
  }

  g.add(rbox(1.15, 1.15, 1.35, brick, 1.55, 0.58, 0.85, 0.006))
  g.add(gableRoof(1.22, 1.42, 0.42, navy, 1.15))
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.28, 12), brick, 1.55, 1.48, 0.85, false))
  g.add(mesh(new THREE.SphereGeometry(0.2, 12, 10), navy, 1.55, 1.72, 0.85))
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8), flat(C.gold), 1.55, 1.92, 0.85, false))
  g.add(door(navy, 1.55, 0.42, 1.54, 0.26, 0.48))
  g.add(steps(0.7, 0.35, flat(C.stone), 1.72))
  g.add(facadePlaque(4, -1.7, 0.72, 0.64))
  blobShadow(g, 2.35, 1.15, 0.4)
  return g
}

/** 05 — civic records hall: steel-blue body, temple front, copper dome. */
export function buildRegistrar() {
  const g = new THREE.Group()
  const body = hold(0x6e8fad)
  const trim = hold(C.trim)
  const glass = flat(0x243448)
  const navy = hold(C.navy)
  const dome = hold(0x3d7a5c)

  g.add(rbox(2.05, 1.58, 1.72, body, 0, 0.79, 0, 0.006))
  g.add(rbox(2.12, 0.1, 1.78, trim, 0, 1.6, 0, 0.02, false))
  ;[-0.72, 0, 0.72].forEach((x) => {
    g.add(rbox(0.18, 1.05, 0.06, glass, x, 0.82, 0.88, 0.015, false))
    g.add(rbox(0.24, 0.06, 0.07, trim, x, 1.38, 0.89, 0.01, false))
  })

  g.add(mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.32, 16), trim, 0, 1.82, 0, false))
  g.add(mesh(new THREE.SphereGeometry(0.48, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), dome, 0, 1.98, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8), navy, 0, 2.32, 0, false))
  g.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), flat(C.gold), 0, 2.46, 0, false))

  ;[-0.55, -0.18, 0.18, 0.55].forEach((x) => g.add(column(1.22, trim, x, 0.98, 0.12)))
  g.add(rbox(1.55, 0.12, 0.55, trim, 0, 1.42, 0.98, 0.02))
  g.add(pediment(1.62, 0.52, 0.16, navy, 1.48, 1.18))
  g.add(door(navy, 0, 0.5, 0.8, 0.3, 0.55))
  g.add(steps(1.2, 0.5, flat(C.stone), 1.18))
  g.add(facadePlaque(5, 0.78, 0.82, 0.8))
  blobShadow(g, 1.35, 1.15, 0.4)
  return g
}

/** 06 — three-story brick U-court residence halls, not tract houses. */
export function buildDorms() {
  const g = new THREE.Group()
  const brick = hold(C.brick)
  const brickDeep = hold(C.brickDeep)
  const roof = hold(C.navySoft)
  const glass = flat(0x243448)
  const trim = hold(C.trim)

  const wing = (x: number, z: number, rotY: number, cols: number) => {
    const w = new THREE.Group()
    w.add(rbox(1.55, 2.15, 1.05, brick, 0, 1.08, 0, 0.006))
    w.add(gableRoof(1.65, 1.15, 0.48, roof, 2.15))
    w.add(rbox(1.58, 0.08, 1.08, brickDeep, 0, 0.78, 0, 0.02, false))
    w.add(rbox(1.58, 0.08, 1.08, brickDeep, 0, 1.48, 0, 0.02, false))
    windowGrid(w, {
      cols,
      rows: 3,
      wallW: 1.35,
      wallH: 1.7,
      face: "south",
      y0: 0.28,
      glass,
      inset: 0.54,
    })
    windowGrid(w, {
      cols: 2,
      rows: 3,
      wallW: 0.8,
      wallH: 1.7,
      face: "east",
      y0: 0.28,
      glass,
      inset: 0.8,
    })
    w.add(balcony(1.35, 0.72, 0.58, trim))
    w.add(balcony(1.35, 1.42, 0.58, trim))
    w.position.set(x, 0, z)
    w.rotation.y = rotY
    g.add(w)
  }
  wing(-0.95, 0.15, 0, 4)
  wing(0.95, 0.15, 0, 4)
  g.add(rbox(1.15, 1.55, 0.85, brick, 0, 0.78, -0.55, 0.006))
  g.add(hipRoof(1.25, 0.95, 0.38, roof, 1.55))
  g.add(door(flat(C.navy), 0, 0.45, 0.0, 0.28, 0.5))
  g.add(rbox(1.35, 0.08, 1.15, flat(C.stone), 0, 0.04, 0.55, 0.03, false))
  g.add(rbox(0.85, 0.42, 0.18, flat(C.hedge), 0, 0.22, 0.85, 0.06, false))
  g.add(rbox(0.22, 0.12, 0.22, trim, 0, 1.62, -0.55, 0.02))
  g.add(facadePlaque(6, 0, 1.05, 0.02))
  blobShadow(g, 1.85, 1.25, 0.42)
  return g
}

/** 07 — gymnasium with barrel vault + marked court. */
export function buildRecCenter() {
  const g = new THREE.Group()
  // L4: rec reads masonry/ink, not saturated game court
  const body = hold(0xc9d2c6)
  const vault = hold(0x4a5d55)
  const glass = flat(0x243448)
  const line = hold(C.trim)
  const court = flat(0x6a7468)

  g.add(rbox(2.55, 1.05, 1.72, body, 0, 0.52, 0, 0.006))
  g.add(barrelVault(2.55, 0.88, vault, 1.05, true))
  for (let i = 0; i < 3; i++) {
    g.add(rbox(0.62, 0.72, 0.07, glass, -0.72 + i * 0.72, 0.58, 0.88, 0.02, false))
  }
  g.add(door(flat(C.navy), 0, 0.38, 0.9, 0.36, 0.52))

  g.add(rbox(3.15, 0.05, 2.05, court, 0, 0.03, 1.85, 0.02, false))
  g.add(rbox(2.75, 0.02, 0.05, line, 0, 0.07, 1.85, 0.01, false))
  g.add(rbox(0.05, 0.02, 1.75, line, 0, 0.07, 1.85, 0.01, false))
  const centerCourt = mesh(new THREE.TorusGeometry(0.38, 0.02, 8, 22), line, 0, 0.08, 1.85, false)
  centerCourt.rotation.x = -Math.PI / 2
  g.add(centerCourt)

  g.add(rbox(0.85, 0.35, 0.35, flat(C.creamDeep), -1.35, 0.22, 1.05, 0.04))
  g.add(rbox(0.85, 0.22, 0.35, flat(C.navySoft), -1.35, 0.48, 1.05, 0.04))
  g.add(facadePlaque(7, 1.05, 0.72, 0.88))
  blobShadow(g, 1.7, 1.7, 0.4)
  return g
}

/** 08 — terracotta union cafe with terrace, round windows, awning. */
export function buildUnion() {
  const g = new THREE.Group()
  const body = hold(C.terracotta)
  const cream = hold(C.cream)
  const roof = hold(C.navySoft)
  const stripeA = hold(C.trim)
  const stripeB = hold(C.navy)

  g.add(rbox(2.25, 1.28, 1.65, body, 0, 0.64, 0, 0.008))
  g.add(hipRoof(2.42, 1.8, 0.58, roof, 1.28))
  g.add(rbox(2.32, 0.08, 1.72, cream, 0, 1.3, 0, 0.02, false))

  const darkGlass = flat(0x1a2838)
  for (let i = 0; i < 4; i++) {
    const x = -0.72 + i * 0.48
    const round = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.07, 16), darkGlass, x, 0.78, 0.86, false)
    round.rotation.x = Math.PI / 2
    g.add(round)
  }
  g.add(door(flat(C.navy), 0, 0.45, 0.86, 0.32, 0.52))

  g.add(rbox(2.55, 0.1, 2.05, flat(C.stone), 0.15, 0.05, 1.62, 0.03, false))
  for (let i = 0; i < 6; i++) {
    g.add(rbox(0.3, 0.1, 0.68, i % 2 ? stripeA : stripeB, -0.75 + i * 0.3, 1.08, 0.92, 0.01, false))
  }

  g.add(rbox(0.28, 0.72, 0.28, flat(C.navy), -0.85, 1.72, -0.15, 0.02))
  g.add(rbox(0.36, 0.1, 0.36, cream, -0.85, 2.1, -0.15, 0.02, false))
  g.add(rbox(0.72, 0.28, 0.08, flat(C.navy), 0, 1.05, 0.9, 0.02, false))

  g.add(rbox(0.62, 0.78, 0.62, cream, 1.05, 0.39, 0.2, 0.008))
  g.add(hipRoof(0.7, 0.7, 0.3, flat(C.terracottaDeep), 0.78))
  g.add(umbrella(0.55, 1.55, 0xf7f2e8, 1.05))
  g.add(umbrella(-0.15, 1.75, 0x2c3d55, 1.0))
  g.add(umbrella(0.95, 1.85, 0xc45c3a, 0.95))
  g.add(facadePlaque(8, -0.88, 0.58, 0.86))
  blobShadow(g, 1.65, 1.55, 0.4)
  return g
}

export function buildLandmark(id: BuildingId): THREE.Group {
  switch (id) {
    case "quad":
      return buildClockTower()
    case "counselor":
      return buildCounselorHall()
    case "library":
      return buildLibrary()
    case "classroom":
      return buildClassrooms()
    case "registrar":
      return buildRegistrar()
    case "dorm":
      return buildDorms()
    case "gym":
      return buildRecCenter()
    case "union":
      return buildUnion()
  }
}

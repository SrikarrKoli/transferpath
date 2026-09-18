"use client"

import * as THREE from "three"
import type { BuildingId } from "./campus-data"
import {
  C,
  balcony,
  blobShadow,
  clockFaces,
  flat,
  masonry,
  gableRoof,
  hold,
  hipRoof,
  mesh,
  rbox,
  steps,
  umbrella,
  windowGrid,
} from "./campus-kit"

export const PIN_Y: Record<BuildingId, number> = {
  quad: 6.45,
  counselor: 2.48,
  library: 3.35,
  classroom: 2.28,
  registrar: 2.72,
  dorm: 3.35,
  gym: 2.18,
  union: 2.32,
}

function door(mat: THREE.Material, x: number, y: number, z: number, w = 0.28, h = 0.52) {
  return rbox(w, h, 0.06, mat, x, y, z, 0.02, false)
}

/** 01 — tall sandstone campanile; clock lantern must read from map distance. */
export function buildClockTower() {
  const g = new THREE.Group()
  const stone = masonry(0x99583f, true)
  const stoneDeep = hold(C.creamDeep)
  const navy = hold(C.navy)
  const gold = hold(0x9b7b43, { metalness: 0.75, roughness: 0.36 })
  const glass = hold(0x263e48, { metalness: 0.45, roughness: 0.2 })
  const trim = hold(C.trim)

  // A narrow brick campanile with continuous vertical reveals and an open bell loggia.
  g.add(rbox(1.12, 0.16, 1.12, stoneDeep, 0, 0.08, 0, 0))
  g.add(rbox(0.74, 3.85, 0.74, stone, 0, 2.04, 0, 0))
  for (const x of [-0.31, 0.31]) {
    g.add(rbox(0.065, 3.8, 0.055, stoneDeep, x, 2.05, 0.39, 0))
    g.add(rbox(0.055, 3.8, 0.065, stoneDeep, 0.39, 2.05, x, 0))
  }
  g.add(rbox(0.13, 2.25, 0.03, glass, 0, 2.1, 0.385, 0))
  g.add(rbox(0.03, 2.25, 0.13, glass, 0.385, 2.1, 0, 0))
  g.add(rbox(0.95, 0.94, 0.95, stoneDeep, 0, 4.2, 0, 0))
  const faces = clockFaces(0.39, 0.486)
  faces.position.y = 4.22
  g.add(faces)
  g.add(rbox(1.02, 0.075, 1.02, trim, 0, 4.7, 0, 0))
  for (const x of [-0.36, 0.36]) for (const z of [-0.36, 0.36]) {
    g.add(rbox(0.10, 0.66, 0.10, stone, x, 5.04, z, 0))
  }
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.29, 12), gold, 0, 4.99, 0))
  g.add(rbox(1.08, 0.10, 1.08, navy, 0, 5.4, 0, 0))
  g.add(rbox(0.95, 0.035, 0.95, gold, 0, 5.47, 0, 0))
  g.add(door(navy, 0, 0.44, 0.385, 0.25, 0.56))
  g.add(steps(0.72, 0.42, stoneDeep, 0.64))
  return g
}

/** 02 — brick L-plan hall with slate hipped roofs. */
export function buildCounselorHall() {
  const g = new THREE.Group()
  const body = masonry(0x96735f, true)
  const wing = masonry(0x96735f, true)
  const roof = hold(C.navySoft)
  const trim = hold(C.trim)
  const glass = hold(0x263e48, { metalness: 0.45, roughness: 0.2 })
  const navy = hold(C.navy)
  const hedgeMat = flat(C.hedge)

  g.add(rbox(2.55, 1.28, 1.48, body, -0.2, 0.64, 0, 0.008))
  g.add(hipRoof(2.72, 1.62, 0.58, roof, 1.28))
  g.add(rbox(2.62, 0.07, 1.55, trim, -0.2, 1.3, 0, 0.02, false))

  g.add(rbox(1.18, 1.08, 2.05, wing, 1.28, 0.54, 0.28, 0.008))
  const wingRoof = hipRoof(1.32, 2.18, 0.48, roof, 1.08)
  wingRoof.position.x = 1.28
  wingRoof.position.z = 0.28
  g.add(wingRoof)

  g.add(rbox(0.24, 0.62, 0.24, navy, -0.95, 1.72, -0.22, 0.02))
  g.add(rbox(0.3, 0.08, 0.3, trim, -0.95, 2.06, -0.22, 0.02, false))

  ;[-0.85, -0.28, 0.28].forEach((x) => {
    g.add(rbox(0.32, 0.48, 0.06, trim, x, 0.72, 0.76, 0.015, false))
    g.add(rbox(0.24, 0.38, 0.05, glass, x, 0.72, 0.79, 0.01, false))
  })

  g.add(rbox(1.05, 0.1, 0.62, trim, -0.2, 1.08, 0.82, 0.02, false))
  for (let i = 0; i < 5; i++) {
    g.add(rbox(0.2, 0.08, 0.58, navy, -0.6 + i * 0.2, 1.14, 0.84, 0.01, false))
  }
  g.add(door(navy, -0.2, 0.48, 0.78, 0.3, 0.55))
  g.add(steps(1.05, 0.48, flat(C.stone), 1.12))
  g.add(rbox(0.85, 0.22, 0.42, hedgeMat, 1.55, 0.12, 1.15, 0.06, false))
  g.add(rbox(0.55, 0.18, 0.55, hedgeMat, -1.15, 0.1, 0.85, 0.06, false))
  blobShadow(g, 2.05, 1.35, 0.58)
  return g
}

/** 03 — limestone reading hall, raised clerestory and offset archive wing. */
export function buildLibrary() {
  const g = new THREE.Group()
  const stone = masonry(0xded4bb)
  const trim = hold(C.trim)
  const roof = hold(0x41565a)
  const glass = hold(0x42616a, { metalness: 0.25, roughness: 0.4 })
  // Low horizontal reading room; glazing is inset, without a temple colonnade.
  g.add(rbox(3.8, 0.95, 1.55, stone, 0, 0.475, 0, 0))
  g.add(rbox(3.25, 0.53, 0.04, glass, 0.1, 0.60, 0.79, 0))
  for (let i = 0; i < 10; i++)
    g.add(rbox(0.025, 0.53, 0.045, trim, -1.48 + i * 0.35, 0.60, 0.815, 0))
  g.add(rbox(4.02, 0.10, 1.76, roof, 0, 1.01, 0, 0))
  // A single long clerestory floats above the broad slate eaves.
  g.add(rbox(2.95, 0.37, 0.72, glass, 0.2, 1.22, -0.15, 0))
  for (let i = 0; i < 9; i++)
    g.add(rbox(0.035, 0.37, 0.76, trim, -1.2 + i * 0.35, 1.22, -0.15, 0))
  g.add(rbox(3.18, 0.08, 0.96, roof, 0.2, 1.44, -0.15, 0))
  // Asymmetric solid archive wing projects into the rear court.
  g.add(rbox(0.98, 1.85, 2.2, stone, -1.48, 0.925, -0.63, 0))
  g.add(rbox(1.08, 0.08, 2.3, roof, -1.48, 1.89, -0.63, 0))
  g.add(rbox(0.48, 0.07, 1.55, trim, -1.48, 1.96, -0.63, 0))
  for (const x of [-1.72, -1.38])
    g.add(rbox(0.095, 1.06, 0.035, glass, x, 1.16, 0.49, 0))
  g.add(rbox(0.66, 0.72, 0.05, glass, 1.38, 0.40, 0.81, 0))
  g.add(rbox(1.05, 0.065, 0.52, roof, 1.38, 0.89, 1, 0))
  const entrySteps = steps(1.05, 0.46, stone, 1.1)
  entrySteps.position.x = 1.35
  g.add(entrySteps)
  return g
}

/** 04 — long academic bar, brick water table, terracotta gable, bell. */
export function buildClassrooms() {
  const g = new THREE.Group()
  const brick = masonry(0x9d6049, true)
  const stone = masonry(0xded4bb)
  const roof = hold(C.navySoft)
  const glass = hold(0x42656c, { metalness: 0.5, roughness: 0.2 })
  // Long teaching bar with a single sloped roof and a solid lecture end wall.
  g.add(rbox(3.75, 1.3, 1.35, brick, 0, 0.65, 0, 0))
  const canopy = rbox(4.04, 0.1, 1.65, roof, 0, 1.57, 0, 0)
  canopy.rotation.x = -0.2
  g.add(canopy)
  g.add(rbox(0.65, 1.95, 1.55, stone, -1.6, 0.975, 0, 0))
  for (let i = 0; i < 7; i++) {
    g.add(rbox(0.31, 0.8, 0.05, glass, -1.03 + i * 0.44, 0.81, 0.7, 0))
    g.add(rbox(0.065, 1.25, 0.25, stone, -1.25 + i * 0.44, 0.65, 0.76, 0))
  }
  g.add(rbox(1.2, 0.08, 0.6, roof, 0.9, 1.05, 1, 0))
  return g
}

/** 05 — civic records hall: brick records hall with limestone fins and a slate roof. */
export function buildRegistrar() {
  const g = new THREE.Group()
  const body = masonry(0x96735f, true)
  const trim = hold(C.trim)
  const glass = hold(0x263e48, { metalness: 0.45, roughness: 0.2 })
  const navy = hold(C.navy)

  g.add(rbox(2.05, 1.58, 1.72, body, 0, 0.79, 0, 0.006))
  g.add(rbox(2.12, 0.1, 1.78, trim, 0, 1.6, 0, 0.02, false))
  ;[
    [-0.78, 1.05],
    [0.02, 0.92],
    [0.68, 1.12],
  ].forEach(([x, h], i) => {
    g.add(rbox(i === 1 ? 0.22 : 0.16, h, 0.06, glass, x, 0.55 + h / 2, 0.88, 0.015, false))
    g.add(rbox(i === 1 ? 0.28 : 0.22, 0.06, 0.07, trim, x, 0.55 + h + 0.04, 0.89, 0.01, false))
  })

  g.add(hipRoof(2.25, 1.9, 0.48, navy, 1.65))

  // Civic canopy and stone fins instead of a second temple facade.
  g.add(rbox(1.65, 0.12, 0.65, navy, 0, 1.25, 1.02, 0.008))
  for (const x of [-0.72, 0.72]) g.add(rbox(0.16, 1.2, 0.32, trim, x, 0.6, 1.06, 0.006))
  g.add(rbox(0.62, 1.95, 1.2, trim, 1.22, 0.98, -0.22, 0.006))
  g.add(rbox(0.66, 0.09, 1.24, navy, 1.22, 2, -0.22, 0.006))
  g.add(door(navy, 0, 0.5, 0.8, 0.3, 0.55))
  g.add(steps(1.2, 0.5, flat(C.stone), 1.18))
  blobShadow(g, 1.35, 1.15, 0.4)
  return g
}

/** 06 — three-story brick U-court residence halls, not tract houses. */
export function buildDorms() {
  const g = new THREE.Group()
  const brick = masonry(0x96735f, true)
  const brickDeep = hold(C.brickDeep)
  const roof = hold(C.navySoft)
  const glass = hold(0x263e48, { metalness: 0.45, roughness: 0.2 })
  const trim = hold(C.trim)

  const wing = (x: number, z: number, rotY: number, cols: number, jitter: number, hBoost = 0) => {
    const w = new THREE.Group()
    const h = 2.15 + hBoost
    w.add(rbox(1.55, h, 1.05, brick, 0, h / 2, 0, 0.006))
    w.add(rbox(1.65, 0.13, 1.15, roof, 0, h + 0.06, 0, 0))
    w.add(rbox(0.4, 0.38, 0.65, brick, -0.5, h + 0.2, -0.15, 0))
    w.add(rbox(1.58, 0.08, 1.08, brickDeep, 0, 0.78, 0, 0.02, false))
    w.add(rbox(1.58, 0.08, 1.08, brickDeep, 0, 1.48, 0, 0.02, false))
    windowGrid(w, {
      cols,
      rows: 3,
      wallW: 1.35,
      wallH: 1.7 + hBoost * 0.4,
      face: "south",
      y0: 0.28,
      glass,
      inset: 0.54,
      jitter,
      skip: jitter % 2 === 0 ? [[1, 2]] : [[2, 0]],
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
      jitter: jitter + 3,
    })
    w.add(balcony(1.35, 0.72, 0.58, trim))
    if (hBoost >= 0) w.add(balcony(1.35, 1.42, 0.58, trim))
    w.position.set(x, 0, z)
    w.rotation.y = rotY
    g.add(w)
  }
  wing(-0.95, 0.4, 0, 4, 2, 0.65)
  wing(0.95, -0.15, 0, 3, 5, 0.1)
  g.add(rbox(1.15, 1.55, 0.85, brick, 0, 0.78, -0.55, 0.006))
  g.add(rbox(1.25, 0.12, 0.95, roof, 0, 1.6, -0.55, 0))
  g.add(door(flat(C.navy), 0, 0.45, 0.0, 0.28, 0.5))
  g.add(rbox(1.35, 0.08, 1.15, flat(C.stone), 0, 0.04, 0.55, 0.03, false))
  g.add(rbox(0.85, 0.42, 0.18, flat(C.hedge), 0, 0.22, 0.85, 0.06, false))
  g.add(rbox(0.22, 0.12, 0.22, trim, 0, 1.62, -0.55, 0.02))
  blobShadow(g, 1.85, 1.25, 0.58)
  return g
}

/** 07 — low masonry gymnasium with a slate gable. */
export function buildRecCenter() {
  const g = new THREE.Group()
  // L4: rec reads masonry/ink, not saturated game court
  const body = masonry(0x96735f, true)
  const vault = hold(C.navySoft)
  const glass = hold(0x263e48, { metalness: 0.45, roughness: 0.2 })

  g.add(rbox(2.55, 1.05, 1.72, body, 0, 0.52, 0, 0.006))
  g.add(gableRoof(2.75, 1.9, 0.55, vault, 1.05))
  for (let i = 0; i < 3; i++) {
    g.add(rbox(0.62, 0.72, 0.07, glass, -0.72 + i * 0.72, 0.58, 0.88, 0.02, false))
  }
  g.add(door(flat(C.navy), 0, 0.38, 0.9, 0.36, 0.52))

  // Quiet turf apron only — no court lines or rings.

  g.add(rbox(0.85, 0.35, 0.35, flat(C.creamDeep), -1.35, 0.22, 1.05, 0.04))
  g.add(rbox(0.85, 0.22, 0.35, flat(C.navySoft), -1.35, 0.48, 1.05, 0.04))
  blobShadow(g, 1.7, 1.7, 0.4)
  return g
}

/** 08 — terracotta union cafe with terrace, round windows, awning. */
export function buildUnion() {
  const g = new THREE.Group()
  const body = masonry(0x96735f, true)
  const cream = hold(C.cream)
  const roof = hold(C.navySoft)
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


  for (let i = 0; i < 6; i++) {
    g.add(rbox(0.3, 0.1, 0.68, stripeB, -0.75 + i * 0.3, 1.08, 0.92, 0.01, false))
  }

  g.add(rbox(0.28, 0.72, 0.28, flat(C.navy), -0.85, 1.72, -0.15, 0.02))
  g.add(rbox(0.36, 0.1, 0.36, cream, -0.85, 2.1, -0.15, 0.02, false))
  g.add(rbox(0.72, 0.28, 0.08, flat(C.navy), 0, 1.05, 0.9, 0.02, false))

  g.add(rbox(0.62, 0.78, 0.62, cream, 1.05, 0.39, 0.2, 0.008))
  g.add(hipRoof(0.7, 0.7, 0.3, flat(C.terracottaDeep), 0.78))
  g.add(umbrella(0.55, 1.55, 0xf7f2e8, 1.05))
  g.add(umbrella(-0.15, 1.75, 0x2c3d55, 1.0))
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

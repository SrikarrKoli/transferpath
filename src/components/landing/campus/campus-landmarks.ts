"use client"

import * as THREE from "three"
import type { BuildingId } from "./campus-data"
import {
  C,
  arcade,
  balcony,
  blobShadow,
  clockFaces,
  column,
  flat,
  masonry,
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

  // Broad plinth so the tower sits like a campus landmark, not a stick.
  g.add(rbox(1.55, 0.24, 1.55, stoneDeep, 0, 0.12, 0, 0.01, false))
  g.add(rbox(1.28, 0.14, 1.28, stone, 0, 0.28, 0, 0.008, false))

  // Slender shaft — landmark proportion (taller, tighter than a hall block).
  g.add(rbox(0.92, 3.15, 0.92, stone, 0, 1.9, 0, 0.006))
  for (let i = 0; i < 5; i++) {
    const y = 0.62 + i * 0.58
    g.add(rbox(0.98, 0.06, 0.98, stoneDeep, 0, y, 0, 0.02, false))
  }
  windowGrid(g, {
    cols: 1,
    rows: 5,
    wallW: 0.42,
    wallH: 2.55,
    face: "south",
    y0: 0.52,
    glass,
    inset: 0.48,
    jitter: 1,
  })
  windowGrid(g, {
    cols: 1,
    rows: 5,
    wallW: 0.42,
    wallH: 2.55,
    face: "east",
    y0: 0.52,
    glass,
    inset: 0.48,
    jitter: 4,
  })

  // Clock lantern — wider than the shaft so dials are the silhouette cue.
  g.add(rbox(1.42, 1.12, 1.42, stone, 0, 3.95, 0, 0.006))
  g.add(rbox(1.36, 0.08, 1.36, trim, 0, 3.42, 0, 0.02, false))
  g.add(rbox(1.36, 0.08, 1.36, trim, 0, 4.48, 0, 0.02, false))
  arcade(g, { bays: 3, span: 1.05, z: 0.66, y: 3.72, glass })
  arcade(g, { bays: 3, span: 1.05, z: -0.66, y: 3.72, glass })

  const faces = clockFaces(0.54, 0.75)
  faces.position.y = 3.98
  g.add(faces)

  // Open bronze belfry between the pale dial box and slate cap.
  g.add(rbox(1.16, 0.12, 1.16, navy, 0, 4.58, 0, 0.01))
  for (const x of [-0.48, 0.48]) for (const z of [-0.48, 0.48]) {
    g.add(rbox(0.09, 0.48, 0.09, gold, x, 4.83, z, 0))
  }
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.27, 12), gold, 0, 4.84, 0))
  // Off-center stair buttress breaks the perfectly extruded shaft.
  g.add(rbox(0.33, 2.65, 0.42, stoneDeep, -0.55, 1.65, -0.23, 0.008))
  const roof = mesh(new THREE.ConeGeometry(0.94, 0.8, 4), navy, 0, 5.47, 0)
  roof.rotation.y = Math.PI / 4
  g.add(roof)
  g.add(mesh(new THREE.SphereGeometry(0.11, 14, 12), gold, 0, 5.94, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 8), trim, 0, 6.14, 0, false))

  g.add(steps(0.85, 0.48, stoneDeep, 0.92))
  g.add(door(flat(C.navySoft), 0, 0.48, 0.58, 0.28, 0.52))
  blobShadow(g, 1.15, 1.1, 0.62)
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
    g.add(rbox(0.2, 0.08, 0.58, i % 2 ? trim : navy, -0.6 + i * 0.2, 1.14, 0.84, 0.01, false))
  }
  g.add(door(navy, -0.2, 0.48, 0.78, 0.3, 0.55))
  g.add(steps(1.05, 0.48, flat(C.stone), 1.12))
  g.add(rbox(0.85, 0.22, 0.42, hedgeMat, 1.55, 0.12, 1.15, 0.06, false))
  g.add(rbox(0.55, 0.18, 0.55, hedgeMat, -1.15, 0.1, 0.85, 0.06, false))
  blobShadow(g, 2.05, 1.35, 0.58)
  return g
}

/** 03 — colonnaded reading hall: the map silhouette must earn "Library". */
export function buildLibrary() {
  const g = new THREE.Group()
  const body = masonry(0xe4d8bb)
  const copper = hold(C.navySoft)
  const trim = hold(C.trim)
  const glass = hold(0x263e48, { metalness: 0.45, roughness: 0.2 })
  const navy = hold(C.navy)
  const stone = hold(C.stone)
  const reading = masonry(0xe4d8bb)

  // Deep reading hall mass
  g.add(rbox(2.85, 1.95, 1.85, body, 0, 0.98, -0.08, 0.008))
  g.add(gableRoof(3.05, 2.0, 0.82, copper, 1.95))
  g.add(rbox(2.95, 0.1, 1.95, trim, 0, 1.98, -0.08, 0.02, false))

  // Side reading wing with tall glass
  g.add(rbox(1.35, 1.55, 1.55, reading, 1.85, 0.78, 0.15, 0.008))
  g.add(rbox(1.22, 1.15, 0.08, glass, 1.85, 0.85, 0.95, 0.02, false))
  g.add(rbox(1.52, 0.1, 1.72, navy, 1.85, 1.61, 0.15, 0.008))
  // A long northlight breaks the copper roof plane; offset archive chimney.
  g.add(rbox(1.95, 0.32, 0.46, glass, -0.25, 2.65, -0.2, 0.006))
  g.add(rbox(2.05, 0.08, 0.56, trim, -0.25, 2.85, -0.2, 0.006))
  for (const x of [-1.05, -0.65, -0.25, 0.15, 0.55]) {
    g.add(rbox(0.04, 0.33, 0.48, trim, x, 2.65, -0.2, 0))
  }
  g.add(rbox(0.34, 1.1, 0.42, stone, -1.18, 2.53, -0.62, 0.006))
  g.add(rbox(0.44, 0.1, 0.52, trim, -1.18, 3.12, -0.62, 0.006))

  // Visible shelf rails and book spines in the glazed reading wing.
  for (const y of [0.48, 0.83, 1.18]) {
    g.add(rbox(1.16, 0.045, 0.07, trim, 1.85, y, 1.005, 0, false))
    for (let i = 0; i < 9; i++) {
      g.add(rbox(0.065, 0.21 + (i % 3) * 0.025, 0.035, i % 2 ? copper : body, 1.34 + i * 0.125, y + 0.14, 1.015, 0, false))
    }
  }

  // Tall arched window wall behind the colonnade
  for (let i = 0; i < 6; i++) {
    const x = -1.15 + i * 0.46
    g.add(rbox(0.28, 1.55, 0.07, glass, x, 1.05, 0.88, 0.02, false))
    g.add(rbox(0.34, 0.08, 0.08, trim, x, 1.85, 0.9, 0.01, false))
  }

  // Full south colonnade — six columns under a pediment (earns the name).
  const colXs = [-1.15, -0.69, -0.23, 0.23, 0.69, 1.15]
  colXs.forEach((x) => g.add(column(1.65, trim, x, 1.32, 0.08)))
  g.add(rbox(2.65, 0.14, 0.55, stone, 0, 1.78, 1.32, 0.02))
  g.add(pediment(2.95, 0.6, 0.22, body, 1.85, 1.32))
  g.add(rbox(2.55, 0.08, 0.72, stone, 0, 0.08, 1.05, 0.02, false))

  g.add(door(navy, 0, 0.55, 0.95, 0.34, 0.62))
  g.add(steps(1.35, 0.58, stone, 1.35))
  blobShadow(g, 1.95, 1.45, 0.62)
  return g
}

/** 04 — long academic bar, brick water table, terracotta gable, bell. */
export function buildClassrooms() {
  const g = new THREE.Group()
  const body = hold(0xf2e6ce)
  const brick = masonry(0x96735f, true)
  const roof = hold(C.navySoft)
  const glass = hold(0x263e48, { metalness: 0.45, roughness: 0.2 })
  const frame = hold(C.trim)
  const navy = hold(C.navy)

  g.add(rbox(3.85, 1.18, 1.22, body, 0, 0.59, 0, 0.006))
  g.add(rbox(3.92, 0.22, 1.28, brick, 0, 0.12, 0, 0.03, false))
  g.add(gableRoof(3.95, 1.32, 0.55, roof, 1.18))
  // Irregular bay rhythm — break the copy-paste window grid.
  const classBays = [-1.58, -1.12, -0.58, -0.12, 0.42, 0.88, 1.28]
  classBays.forEach((x, i) => {
    const tall = i === 2 || i === 5
    const pw = tall ? 0.2 : 0.16
    const ph = tall ? 0.26 : 0.2
    const fw = tall ? 0.26 : 0.22
    g.add(rbox(fw, 0.28, 0.06, frame, x, 0.52, 0.64, 0.015, false))
    g.add(rbox(pw, ph, 0.05, glass, x, 0.52, 0.67, 0.01, false))
    if (i !== 3) {
      // Skip one upper pane for facade irregularity.
      g.add(rbox(fw, 0.28, 0.06, frame, x, 0.92, 0.64, 0.015, false))
      g.add(rbox(pw, ph * 0.92, 0.05, glass, x, 0.92, 0.67, 0.01, false))
    }
  })
  // Slight roof dormer so the bar isn't a flat stamp.
  g.add(rbox(0.42, 0.28, 0.35, body, -0.85, 1.35, 0.15, 0.01))
  g.add(gableRoof(0.48, 0.4, 0.22, roof, 1.48))

  g.add(rbox(1.15, 1.15, 1.35, brick, 1.55, 0.58, 0.85, 0.006))
  g.add(gableRoof(1.22, 1.42, 0.42, navy, 1.15))
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.28, 12), brick, 1.55, 1.48, 0.85, false))
  g.add(mesh(new THREE.SphereGeometry(0.2, 12, 10), navy, 1.55, 1.72, 0.85))
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8), flat(C.gold), 1.55, 1.92, 0.85, false))
  g.add(door(navy, 1.55, 0.42, 1.54, 0.26, 0.48))
  g.add(steps(0.7, 0.35, flat(C.stone), 1.72))
  blobShadow(g, 2.35, 1.15, 0.4)
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
    w.add(gableRoof(1.65, 1.15, 0.48, roof, h))
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
  wing(-0.95, 0.4, 0, 4, 2, -0.35)
  wing(0.95, -0.15, 0, 3, 5, 0.1)
  g.add(rbox(1.15, 1.55, 0.85, brick, 0, 0.78, -0.55, 0.006))
  g.add(hipRoof(1.25, 0.95, 0.38, roof, 1.55))
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

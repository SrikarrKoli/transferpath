"use client"

/**
 * Authored campus primitives. Landmarks are custom meshes (not Kenney
 * suburban houses). Shared language: crisp masonry masses, pitched roofs,
 * punched window grids, and restrained contact shadows.
 */

import * as THREE from "three"
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"

export const C = {
  cream: 0xf4ead6,
  creamDeep: 0xe2d0b0,
  sand: 0xe8d4b0,
  plaza: 0xe6d3b4,
  stone: 0xd4c09a,
  terracotta: 0xc45c3a,
  terracottaDeep: 0xa34f2f,
  brick: 0xb86b52,
  brickDeep: 0x9a5844,
  navy: 0x2c3d55,
  navySoft: 0x3d516c,
  copper: 0x5a8f78,
  mintRoof: 0x6b9e7a,
  glass: 0x3d4f68,
  trim: 0xf7f2e8,
  gold: 0xe8c46a,
  hedge: 0x425744,
  grass: 0x77856b,
  canopyA: 0x465c47,
  canopyB: 0x52664c,
  canopyC: 0x394f3e,
  canopyD: 0x63715a,
  trunk: 0x6b4a2e,
  peach: 0xefd3c0,
  paleBlue: 0xd5e0ea,
  paleSage: 0xd7e4dc,
  rose: 0xe8b4a0,
}

export function lambert(color: number, extra?: THREE.MeshLambertMaterialParameters) {
  return new THREE.MeshLambertMaterial({
    color,
    emissive: new THREE.Color(0x1a140c),
    emissiveIntensity: 0.055,
    ...extra,
  })
}

/** Unlit color — plaza/path/canopy that must survive Playwright/WebGL washout. */
export function flat(color: number, extra?: THREE.MeshBasicMaterialParameters) {
  return new THREE.MeshBasicMaterial({ color, ...extra })
}

/** Color-stable masonry with enough light response to preserve architectural depth. */
export function hold(color: number, extra?: THREE.MeshLambertMaterialParameters) {
  const c = new THREE.Color(color)
  return new THREE.MeshLambertMaterial({
    color: c,
    emissive: c.clone(),
    emissiveIntensity: 0.16,
    ...extra,
  })
}

export function mesh(
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  cast = true
) {
  const m = new THREE.Mesh(geo, material)
  m.position.set(x, y, z)
  m.castShadow = cast
  m.receiveShadow = true
  return m
}

export function rbox(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  radius = 0.012,
  cast = true
) {
  if (radius <= 0) return mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, cast)
  const segments = radius > 0.02 ? 3 : 1
  return mesh(new RoundedBoxGeometry(w, h, d, segments, radius), material, x, y, z, cast)
}

export function blobShadow(parent: THREE.Object3D, rx: number, rz: number, opacity = 0.52) {
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(1, 32),
    new THREE.MeshBasicMaterial({
      color: 0x1a2814,
      transparent: true,
      opacity: opacity * 0.62,
      depthWrite: false,
    })
  )
  blob.rotation.x = -Math.PI / 2
  blob.scale.set(rx * 1.12, rz * 1.16, 1)
  // Sit flush so contact reads attached, not floating plates.
  blob.position.set(0.12, 0.006, -0.12)
  blob.receiveShadow = false
  blob.castShadow = false
  parent.add(blob)
}

export type Face = "south" | "north" | "east" | "west"

export function windowGrid(
  parent: THREE.Object3D,
  opts: {
    cols: number
    rows: number
    wallW: number
    wallH: number
    face: Face
    y0: number
    glass: THREE.Material
    inset?: number
    depth?: number
    /** Seed for irregular mullion spacing — breaks copy-paste grids. */
    jitter?: number
    skip?: Array<[number, number]>
  }
) {
  const { cols, rows, wallW, wallH, face, y0, glass } = opts
  const inset = opts.inset ?? 0.028
  const depth = opts.depth ?? 0.05
  const jitter = opts.jitter ?? 0
  const skip = new Set((opts.skip ?? []).map(([c, r]) => `${c},${r}`))
  // Authored column weights — slight irregularity instead of equal cells.
  const colW: number[] = []
  let colSum = 0
  for (let c = 0; c < cols; c++) {
    const w = 1 + ((c * 17 + jitter * 3) % 7) * 0.035 - 0.07
    colW.push(w)
    colSum += w
  }
  const rowH: number[] = []
  let rowSum = 0
  for (let r = 0; r < rows; r++) {
    const h = 1 + ((r * 11 + jitter * 5) % 5) * 0.04 - 0.06
    rowH.push(h)
    rowSum += h
  }
  let uCursor = -wallW / 2
  for (let c = 0; c < cols; c++) {
    const cellW = (colW[c] / colSum) * wallW
    let vCursor = y0
    for (let r = 0; r < rows; r++) {
      const cellH = (rowH[r] / rowSum) * wallH
      if (!skip.has(`${c},${r}`)) {
        const paneW = cellW * (0.48 + ((c + r + jitter) % 3) * 0.03)
        const paneH = cellH * (0.54 + ((c * 2 + r + jitter) % 3) * 0.03)
        const u = uCursor + cellW / 2
        const v = vCursor + cellH / 2
        const pane = new THREE.Mesh(new THREE.BoxGeometry(paneW, paneH, depth), glass)
        pane.castShadow = false
        pane.receiveShadow = true
        if (face === "south") pane.position.set(u, v, inset)
        if (face === "north") pane.position.set(u, v, -inset)
        if (face === "east") {
          pane.geometry = new THREE.BoxGeometry(depth, paneH, paneW)
          pane.position.set(inset, v, u)
        }
        if (face === "west") {
          pane.geometry = new THREE.BoxGeometry(depth, paneH, paneW)
          pane.position.set(-inset, v, u)
        }
        parent.add(pane)
      }
      vCursor += cellH
    }
    uCursor += cellW
  }
}

export function umbrella(x: number, z: number, color: number, scale = 1) {
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8), flat(0x6b4a2e), 0, 0.28, 0, false))
  g.add(mesh(new THREE.ConeGeometry(0.32, 0.16, 10), flat(color), 0, 0.62, 0, false))
  g.position.set(x, 0, z)
  g.scale.setScalar(scale)
  return g
}

export function balcony(w: number, y: number, z: number, mat: THREE.Material) {
  const g = new THREE.Group()
  g.add(rbox(w, 0.045, 0.22, mat, 0, y, z, 0.015, false))
  g.add(rbox(w, 0.11, 0.03, mat, 0, y + 0.07, z + 0.1, 0.01, false))
  g.add(rbox(0.03, 0.11, 0.2, mat, -w / 2 + 0.03, y + 0.07, z, 0.01, false))
  g.add(rbox(0.03, 0.11, 0.2, mat, w / 2 - 0.03, y + 0.07, z, 0.01, false))
  return g
}

export function arcade(
  parent: THREE.Object3D,
  opts: {
    bays: number
    span: number
    z: number
    y: number
    glass: THREE.Material
  }
) {
  const bay = opts.span / opts.bays
  for (let i = 0; i < opts.bays; i++) {
    const x = -opts.span / 2 + (i + 0.5) * bay
    const opening = mesh(new THREE.BoxGeometry(bay * 0.55, 0.52, 0.06), opts.glass, x, opts.y, opts.z, false)
    const arch = mesh(
      new THREE.CylinderGeometry(bay * 0.28, bay * 0.28, 0.06, 14, 1, false, 0, Math.PI),
      opts.glass,
      x,
      opts.y + 0.26,
      opts.z,
      false
    )
    arch.rotation.x = Math.PI / 2
    parent.add(opening, arch)
  }
}

export function gableRoof(w: number, d: number, h: number, mat: THREE.Material, y = 0) {
  const g = new THREE.Group()
  g.position.y = y
  const shape = new THREE.Shape()
  const hw = d / 2 + 0.04
  shape.moveTo(-hw, 0)
  shape.lineTo(hw, 0)
  shape.lineTo(0, h)
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, { depth: w + 0.1, bevelEnabled: false })
  geo.rotateY(Math.PI / 2)
  geo.translate(-(w + 0.1) / 2, 0, 0)
  const roof = new THREE.Mesh(geo, mat)
  roof.castShadow = true
  roof.receiveShadow = true
  const ridge = mesh(new THREE.BoxGeometry(w + 0.12, 0.045, 0.06), mat, 0, h, 0)
  g.add(roof, ridge)
  return g
}

export function hipRoof(w: number, d: number, h: number, mat: THREE.Material, y = 0) {
  const roof = mesh(new THREE.ConeGeometry(0.72, h, 4), mat, 0, y + h / 2, 0)
  roof.rotation.y = Math.PI / 4
  roof.scale.set(w / 1.42, 1, d / 1.42)
  return roof
}

export function barrelVault(length: number, radius: number, mat: THREE.Material, y: number, alongX = true) {
  const vault = mesh(
    new THREE.CylinderGeometry(radius, radius, length, 22, 1, false, 0, Math.PI),
    mat,
    0,
    y,
    0
  )
  if (alongX) vault.rotation.z = Math.PI / 2
  else vault.rotation.x = Math.PI / 2
  return vault
}

export function column(h: number, mat: THREE.Material, x: number, z: number, y = 0) {
  const g = new THREE.Group()
  g.add(
    mesh(new THREE.CylinderGeometry(0.07, 0.078, h, 10), mat, 0, y + h / 2, 0),
    rbox(0.2, 0.06, 0.2, mat, 0, y + h, 0, 0.02),
    rbox(0.21, 0.05, 0.21, mat, 0, y + 0.02, 0, 0.02)
  )
  g.position.set(x, 0, z)
  return g
}

export function pediment(w: number, h: number, thick: number, mat: THREE.Material, y: number, z: number) {
  const shape = new THREE.Shape()
  shape.moveTo(-w / 2, 0)
  shape.lineTo(w / 2, 0)
  shape.lineTo(0, h)
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false })
  const m = new THREE.Mesh(geo, mat)
  m.position.set(0, y, z - thick / 2)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

export function steps(w: number, d: number, mat: THREE.Material, z: number) {
  const g = new THREE.Group()
  g.add(
    rbox(w, 0.07, d, mat, 0, 0.04, z, 0.02, false),
    rbox(w * 0.88, 0.07, d * 0.55, mat, 0, 0.1, z + d * 0.12, 0.02, false)
  )
  return g
}

export function hedge(w: number, h: number, d: number, x: number, z: number, mat: THREE.Material) {
  return rbox(w, h, d, mat, x, h / 2, z, 0.06, false)
}

export function toyTree(x: number, z: number, seed: number) {
  // Three authored silhouettes with scale/rotation jitter — no identical conical rows.
  const g = new THREE.Group()
  const trunkMat = lambert(C.trunk)
  const greens = [C.canopyA, C.canopyB, C.canopyC, C.canopyD]
  const canopyMat = flat(greens[seed % greens.length])
  const accent = flat(greens[(seed + 2) % greens.length])
  const scale = 0.78 + (seed % 7) * 0.055
  const trunkH = 0.34 + (seed % 4) * 0.05
  g.add(mesh(new THREE.CylinderGeometry(0.034, 0.055, trunkH, 7), trunkMat, 0, trunkH / 2, 0, false))
  const kind = seed % 3
  if (kind === 0) {
    // Layered pine — two offset cones, not a perfect stamp.
    const pine = mesh(new THREE.ConeGeometry(0.24, 0.72, 6), canopyMat, 0, trunkH + 0.26, 0)
    pine.scale.set(1.02 + (seed % 3) * 0.04, 0.95 + (seed % 2) * 0.08, 0.88 + (seed % 4) * 0.03)
    pine.rotation.y = seed * 0.2
    g.add(pine)
    const tip = mesh(new THREE.ConeGeometry(0.15, 0.36, 5), accent, 0.03, trunkH + 0.52, -0.02)
    tip.scale.set(0.95, 1.05, 0.9)
    g.add(tip)
  } else if (kind === 1) {
    // Broad deciduous cluster.
    const y0 = trunkH + 0.1
    const lobes: [number, number, number, number, boolean][] = [
      [0.3, 0, y0, 0, false],
      [0.2, 0.16, y0 + 0.1, -0.05, true],
      [0.18, -0.14, y0 + 0.08, 0.1, false],
      [0.15, 0.04, y0 + 0.22, 0.06, seed % 2 === 0],
    ]
    for (const [r, ox, oy, oz, useAccent] of lobes) {
      const mat = useAccent ? accent : canopyMat
      const lobe = mesh(new THREE.SphereGeometry(r, 8, 6), mat, ox, oy, oz)
      lobe.scale.set(1.08 + (seed % 3) * 0.05, 0.68 + (seed % 2) * 0.1, 0.92 + (seed % 4) * 0.03)
      g.add(lobe)
    }
  } else {
    // Oval canopy — flatter, denser silhouette for variety.
    const crown = mesh(new THREE.SphereGeometry(0.32, 9, 7), canopyMat, 0, trunkH + 0.22, 0)
    crown.scale.set(1.15 + (seed % 3) * 0.06, 0.62 + (seed % 2) * 0.08, 1.0)
    g.add(crown)
    const bump = mesh(new THREE.SphereGeometry(0.16, 7, 6), accent, 0.1, trunkH + 0.32, -0.06)
    bump.scale.set(1.1, 0.7, 0.95)
    g.add(bump)
  }
  g.scale.setScalar(scale)
  g.position.set(x, 0, z)
  g.rotation.y = seed * 0.41 + 0.15
  g.rotation.z = ((seed % 5) - 2) * 0.015
  blobShadow(g, 0.34, 0.28, 0.22)
  return g
}

export function fountain() {
  const g = new THREE.Group()
  const stone = lambert(C.stone)
  const water = lambert(0x8eb8bd, { transparent: true, opacity: 0.68 })
  g.add(
    rbox(0.95, 0.12, 0.95, stone, 0, 0.08, 0, 0.08, false),
    mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.08, 20), water, 0, 0.16, 0, false),
    mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.28, 10), stone, 0, 0.3, 0),
    mesh(new THREE.SphereGeometry(0.08, 10, 8), water, 0, 0.48, 0, false)
  )
  return g
}

export function bench(mat: THREE.Material, x: number, z: number, rotY = 0) {
  const g = new THREE.Group()
  g.add(
    rbox(0.55, 0.06, 0.18, mat, 0, 0.22, 0, 0.02),
    rbox(0.06, 0.22, 0.16, mat, -0.22, 0.11, 0, 0.02),
    rbox(0.06, 0.22, 0.16, mat, 0.22, 0.11, 0, 0.02)
  )
  g.position.set(x, 0, z)
  g.rotation.y = rotY
  return g
}

export function kiosk(body: THREE.Material, roof: THREE.Material, x: number, z: number, rotY = 0) {
  const g = new THREE.Group()
  g.add(
    rbox(0.55, 0.55, 0.45, body, 0, 0.28, 0, 0.05),
    rbox(0.64, 0.08, 0.54, roof, 0, 0.6, 0, 0.03)
  )
  windowGrid(g, {
    cols: 2,
    rows: 1,
    wallW: 0.48,
    wallH: 0.28,
    face: "south",
    y0: 0.22,
    glass: lambert(C.glass),
    inset: 0.24,
  })
  g.position.set(x, 0, z)
  g.rotation.y = rotY
  blobShadow(g, 0.42, 0.34, 0.32)
  return g
}

export function annex(opts: {
  w: number
  h: number
  d: number
  body: number
  roof: number
  cols: number
  rows?: number
  roofKind?: "gable" | "hip" | "flat"
}) {
  const g = new THREE.Group()
  const body = flat(opts.body)
  const roof = flat(opts.roof)
  const glass = flat(C.glass)
  g.add(rbox(opts.w, opts.h, opts.d, body, 0, opts.h / 2, 0, 0.008))
  const kind = opts.roofKind ?? "gable"
  if (kind === "gable") g.add(gableRoof(opts.w, opts.d, 0.38 + opts.h * 0.12, roof, opts.h))
  else if (kind === "hip") g.add(hipRoof(opts.w, opts.d, 0.42, roof, opts.h))
  else g.add(rbox(opts.w + 0.08, 0.08, opts.d + 0.08, roof, 0, opts.h + 0.04, 0, 0.008))
  const rows = opts.rows ?? 1
  windowGrid(g, {
    cols: opts.cols,
    rows,
    wallW: opts.w * 0.86,
    wallH: opts.h * 0.55,
    face: "south",
    y0: opts.h * 0.28,
    glass,
    inset: opts.d / 2 + 0.01,
  })
  windowGrid(g, {
    cols: Math.max(2, Math.round(opts.cols * 0.6)),
    rows,
    wallW: opts.d * 0.7,
    wallH: opts.h * 0.5,
    face: "east",
    y0: opts.h * 0.3,
    glass,
    inset: opts.w / 2 + 0.01,
  })
  blobShadow(g, opts.w * 0.72, opts.d * 0.7, 0.36)
  return g
}

export function clockFaceTex() {
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#f7f2e8"
  ctx.beginPath()
  ctx.arc(128, 128, 118, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = "#2c3d55"
  ctx.lineWidth = 16
  ctx.stroke()
  ctx.fillStyle = "#2c3d55"
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2
    ctx.beginPath()
    ctx.arc(128 + Math.cos(a) * 90, 128 + Math.sin(a) * 90, i % 3 === 0 ? 6 : 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = "#c45c3a"
  ctx.lineWidth = 9
  ctx.lineCap = "round"
  ctx.beginPath()
  ctx.moveTo(128, 128)
  ctx.lineTo(128, 52)
  ctx.stroke()
  ctx.strokeStyle = "#1a2332"
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(128, 128)
  ctx.lineTo(186, 128)
  ctx.stroke()
  ctx.fillStyle = "#1a2332"
  ctx.beginPath()
  ctx.arc(128, 128, 7, 0, Math.PI * 2)
  ctx.fill()
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function clockFaces(radius = 0.44, stickOut = 0.7) {
  // Unlit dials — landmark clocks must stay readable under Reinhard washout.
  const mat = new THREE.MeshBasicMaterial({ map: clockFaceTex() })
  const rim = new THREE.MeshBasicMaterial({ color: 0x1a2332 })
  const g = new THREE.Group()
  const make = (rotY: number, x: number, z: number) => {
    const dial = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), mat)
    dial.rotation.y = rotY
    dial.position.set(x, 0, z)
    const bezel = new THREE.Mesh(new THREE.RingGeometry(radius * 0.98, radius * 1.14, 48), rim)
    bezel.rotation.y = rotY
    const n = 0.012
    bezel.position.set(x + Math.sin(rotY) * n, 0, z + Math.cos(rotY) * n)
    g.add(dial, bezel)
  }
  make(0, 0, stickOut)
  make(Math.PI, 0, -stickOut)
  make(Math.PI / 2, stickOut, 0)
  make(-Math.PI / 2, -stickOut, 0)
  return g
}

export function numberPin(_n: number, _id?: string) {
  return new THREE.Group()
}

export function facadePlaque(n: number, x: number, y: number, z: number) {
  const g = new THREE.Group()
  const plate = rbox(0.22, 0.16, 0.04, lambert(C.navy), x, y, z, 0.02, false)
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 96
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#2c3d55"
  ctx.fillRect(0, 0, 128, 96)
  ctx.fillStyle = "#f7f2e8"
  ctx.font = "700 52px ui-monospace, Menlo, monospace"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(String(n).padStart(2, "0"), 64, 50)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 0.13),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  )
  label.position.set(x, y, z + 0.025)
  g.add(plate, label)
  return g
}

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
export function hold(color: number, extra?: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.87, metalness: 0, ...extra })
}

/** Deterministic small masonry courses, kept subtle at the campus scale. */
export function masonry(color: number, brick = false) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = new THREE.Color(color).getStyle()
  ctx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 32) {
    for (let x = -64; x < 256; x += 64) {
      const offset = (y / 32 % 2) * 32
      ctx.fillStyle = `rgba(255,245,220,${0.025 + ((x + y + 256) % 7) * 0.008})`
      ctx.fillRect(x + offset, y, 63, 31)
      ctx.strokeStyle = brick ? "rgba(225,204,172,.23)" : "rgba(87,73,49,.12)"
      ctx.lineWidth = 1
      ctx.strokeRect(x + offset, y, 64, 32)
    }
  }
  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshStandardMaterial({ map, roughness: brick ? 0.95 : 0.8 })
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
  // Retained call signature for primitives; directional shadows supply contact.
  void parent; void rx; void rz; void opacity
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

/** Botanical silhouettes: layered cypress sprays, spreading oak, open pecan. */
export function toyTree(x: number, z: number, seed: number) {
  const g = new THREE.Group(), bark = hold(0x716450)
  const species = seed % 3
  const foliage = [0x426c59, 0x63815c, 0x789061][species]
  const branch = (a: THREE.Vector3, b: THREE.Vector3, radius: number) => {
    const limb = mesh(new THREE.CylinderGeometry(radius * 0.45, radius, a.distanceTo(b), 7), bark)
    limb.position.copy(a).add(b).multiplyScalar(0.5)
    limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(limb)
  }
  const height = species === 0 ? 2.65 : 1.95 + (seed % 4) * 0.13
  branch(new THREE.Vector3(), new THREE.Vector3(0.12, height * 0.85, 0), 0.065)
  // Irregular radial leaf sprays, built from tapered rings rather than spheres.
  const spray = (cx: number, cy: number, cz: number, radius: number, tall: number, phase: number) => {
    const points: THREE.Vector2[] = []
    for (const [r, y] of [[0.18, 0], [0.84, 0.18], [1, 0.38], [0.74, 0.68], [0.08, 1]]) points.push(new THREE.Vector2(r * radius, y * tall))
    const geo = new THREE.LatheGeometry(points, 7 + Math.floor(phase) % 3)
    const pos = geo.getAttribute("position")
    for (let i = 0; i < pos.count; i++) { const angle = Math.atan2(pos.getZ(i), pos.getX(i)); const k = 1 + 0.075 * Math.sin(angle * 5 + phase) + 0.035 * Math.cos(angle * 3 + pos.getY(i) * 4); pos.setXYZ(i, pos.getX(i) * k, pos.getY(i), pos.getZ(i) * k) }
    geo.computeVertexNormals()
    const crown = mesh(geo, hold(foliage + (Math.floor(phase) % 3) * 0x030302, { side: THREE.DoubleSide, flatShading: true }), cx, cy, cz)
    g.add(crown)
  }
  if (species === 0) {
    for (let i = 0; i < 5; i++) spray(0.08 + Math.sin(i + seed) * 0.035, 0.6 + i * 0.4, 0, 0.43 - i * 0.06, 0.88, seed + i)
  } else {
    const count = species === 1 ? 5 : 4
    for (let i = 0; i < count; i++) {
      const angle = i * 2.4 + seed, reach = (species === 1 ? 0.68 : 0.53) * (0.65 + i % 3 * 0.16)
      const end = new THREE.Vector3(Math.cos(angle) * reach, height * (0.48 + i * 0.105), Math.sin(angle) * reach)
      branch(new THREE.Vector3(0.04, 0.6 + i * 0.07, 0), end, 0.033)
      spray(end.x, end.y - 0.12, end.z, species === 1 ? 0.49 : 0.32, species === 1 ? 0.58 : 0.88, seed + i)
    }
  }
  g.rotation.z = (seed % 3 - 1) * 0.055
  g.rotation.y = seed * 1.71
  g.scale.setScalar(0.86 + seed % 4 * 0.07)
  g.position.set(x, 0, z)
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
  void _n; void _id
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

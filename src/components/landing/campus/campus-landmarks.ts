"use client"

import * as THREE from "three"
import type { BuildingId } from "./campus-data"
import { clockFaces, gableRoof, hold, masonry, mesh, rbox, steps } from "./campus-kit"

export const PIN_Y: Record<BuildingId, number> = { quad: 6.45, counselor: 2.48, library: 3.35, classroom: 2.28, registrar: 2.72, dorm: 3.35, gym: 2.18, union: 2.32 }

// TransferPath's architectural alphabet: limestone piers, deep round-headed
// reveals, clay folded roofs, and paired bands crossing every facade.
function palette() {
  return { stone: masonry(0xe4d8bc), brick: masonry(0xb77760, true), trim: hold(0xf5e7cb), roof: hold(0xa6503e), glass: hold(0x304e49), bronze: hold(0x655744) }
}
function arch(w: number, h: number, material: THREE.Material) {
  const s = new THREE.Shape()
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h - w / 2)
  s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); s.closePath()
  return mesh(new THREE.ExtrudeGeometry(s, { depth: 0.045, bevelEnabled: false, curveSegments: 16 }), material)
}
function bay(parent: THREE.Group, x: number, y: number, z: number, w: number, h: number, p: ReturnType<typeof palette>) {
  const surround = arch(w + 0.13, h + 0.09, p.trim); surround.position.set(x, y - 0.04, z)
  const recess = arch(w, h, p.glass); recess.position.set(x, y, z + 0.05)
  parent.add(surround, recess)
  parent.add(rbox(0.035, h * 0.72, 0.05, p.trim, x, y + h * 0.36, z + 0.11, 0))
  parent.add(rbox(w + 0.2, 0.07, 0.17, p.trim, x, y - 0.05, z + 0.06, 0))
}
function residentialBay(parent: THREE.Group, x: number, y: number, z: number, w: number, h: number, p: ReturnType<typeof palette>) {
  parent.add(rbox(w + 0.12, h + 0.1, 0.08, p.trim, x, y + h / 2, z + 0.025, 0))
  parent.add(rbox(w, h, 0.03, p.glass, x, y + h / 2, z + 0.075, 0))
  parent.add(rbox(0.035, h, 0.04, p.trim, x, y + h / 2, z + 0.1, 0))
  parent.add(rbox(w, 0.03, 0.04, p.trim, x, y + h * 0.55, z + 0.1, 0))
}
function roof(w: number, d: number, y: number, p: ReturnType<typeof palette>, pitch = 0.28) {
  const g = gableRoof(w + 0.18, d + 0.18, d * pitch, p.roof, y)
  // Raised tile seams follow the pitch; a legible rhythm at map distance.
  for (let x = -w / 2; x <= w / 2; x += 0.18) for (const side of [-1, 1]) {
    const seam = rbox(0.025, 0.027, Math.hypot(d / 2 + 0.13, d * pitch), p.brick, x, d * pitch / 2 + 0.018, side * (d / 4 + 0.055), 0)
    seam.rotation.x = side * Math.atan2(d * pitch, d / 2 + 0.13)
    g.add(seam)
  }
  return g
}
function hall(w: number, d: number, h: number, bays: number, floors = 1, roofPitch = 0.28) {
  const p = palette(), g = new THREE.Group()
  g.add(rbox(w, h, d, p.stone, 0, h / 2, 0, 0))
  g.add(rbox(w + 0.12, 0.18, d + 0.12, p.brick, 0, 0.09, 0, 0))
  for (const y of [h - 0.12, h - 0.23]) g.add(rbox(w + 0.06, 0.055, d + 0.06, p.brick, 0, y, 0, 0))
  const opening = floors > 1 ? residentialBay : bay
  for (let level = 0; level < floors; level++) {
    for (let i = 0; i < bays; i++) opening(g, -w / 2 + (i + 0.5) * w / bays, 0.25 + level * (h - 0.3) / floors, d / 2, w / bays * 0.57, (h - 0.4) / floors * 0.84, p)
    const side = new THREE.Group()
    for (let i = 0; i < 2; i++) opening(side, (i - 0.5) * d / 2, 0.25 + level * (h - 0.3) / floors, 0, d * 0.24, (h - 0.4) / floors * 0.84, p)
    side.rotation.y = Math.PI / 2; side.position.x = w / 2; g.add(side)
  }
  g.add(roof(w, d, h, p, roofPitch))
  return g
}
export function buildClockTower() {
  const g = new THREE.Group(), p = palette()
  g.add(rbox(1.15, 0.2, 1.15, p.trim, 0, 0.1, 0, 0), rbox(0.82, 3.6, 0.82, p.stone, 0, 1.95, 0, 0))
  for (const x of [-0.36, 0.36]) for (const z of [-0.36, 0.36]) g.add(rbox(0.13, 3.65, 0.13, p.brick, x, 1.97, z, 0))
  for (const y of [0.35, 2.9, 3.55, 4.48]) g.add(rbox(1.02, 0.1, 1.02, p.trim, 0, y, 0, 0))
  bay(g, 0, 0.35, 0.42, 0.26, 1.85, p)
  g.add(rbox(1.0, 0.88, 1.0, p.brick, 0, 4, 0, 0))
  const faces = clockFaces(0.35, 0.515); faces.position.y = 4.02; g.add(faces)
  for (const x of [-0.38, 0.38]) for (const z of [-0.38, 0.38]) g.add(rbox(0.14, 0.7, 0.14, p.stone, x, 4.85, z, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.11, 0.21, 0.27, 16), p.bronze, 0, 4.83, 0), roof(1.08, 1.08, 5.21, p), steps(0.8, 0.5, p.trim, 0.64))
  return g
}
export function buildLibrary() {
  const g = hall(4.35, 1.55, 1.35, 9, 1, 0.1), p = palette()
  // A continuous glass lantern, not a second tiled hall: visible across the campus.
  const lantern = new THREE.Group()
  lantern.add(rbox(3.65, 0.66, 0.86, p.glass, 0, 0.33, 0, 0))
  lantern.add(gableRoof(3.8, 1.02, 0.42, hold(0x698e83), 0.66))
  for (let x = -1.8; x <= 1.81; x += 0.3) {
    lantern.add(rbox(0.045, 0.7, 0.94, p.trim, x, 0.33, 0, 0))
    for (const side of [-1, 1]) {
      const rib = rbox(0.035, 0.035, 0.67, p.trim, x, 0.88, side * 0.255, 0)
      rib.rotation.x = side * Math.atan2(0.42, 0.51)
      lantern.add(rib)
    }
  }
  lantern.add(rbox(3.88, 0.065, 0.08, p.bronze, 0, 1.1, 0, 0))
  lantern.add(rbox(3.85, 0.09, 1.0, p.trim, 0, 0, 0, 0))
  lantern.position.set(0.15, 1.51, 0); g.add(lantern)
  // Squared archive stack breaks the long lantern's symmetry without another gable.
  const archive = hall(0.92, 1.85, 2.35, 2, 3)
  archive.remove(archive.children[archive.children.length - 1])
  archive.add(rbox(1.08, 0.16, 2.01, p.trim, 0, 2.38, 0, 0))
  archive.add(rbox(0.84, 0.08, 1.77, p.bronze, 0, 2.48, 0, 0))
  archive.position.set(-1.72, 0, -0.65); g.add(archive)
  g.add(steps(4.15, 0.42, p.trim, 1.1)); return g
}

export function buildCounselorHall() {
  const g = hall(2.3, 1.5, 1.6, 4), p = palette()
  const entry = hall(0.85, 0.95, 2.5, 1); entry.position.set(0, 0, 0.56); g.add(entry)
  g.add(steps(1.25, 0.48, p.trim, 1.12)); return g
}
export function buildClassrooms() {
  const g = hall(2.75, 1.05, 1.35, 5)
  const end = hall(0.85, 2.15, 1.55, 2); end.position.set(-1.12, 0, -0.2); g.add(end); return g
}
export function buildRegistrar() {
  const g = hall(1.9, 1.45, 1.65, 3)
  const loggia = hall(2.15, 0.7, 0.8, 5, 1, 0.1); loggia.position.set(0, 0, 0.86); g.add(loggia); return g
}
export function buildDorms() {
  const g = new THREE.Group()
  const p = palette()
  for (const x of [-0.79, 0.79]) {
    const wing = hall(1.05, 1.5, 2.65, 3, 3)
    wing.add(rbox(0.2, 0.55, 0.22, p.brick, -0.25, 2.72, -0.25, 0))
    wing.add(rbox(0.26, 0.055, 0.28, p.trim, -0.25, 3.01, -0.25, 0))
    wing.position.x = x; g.add(wing)
  }
  const link = hall(0.7, 0.7, 1.5, 1); link.position.z = -0.55; g.add(link); return g
}
export function buildRecCenter() {
  const g = hall(2.7, 1.95, 0.82, 5, 1, 0.02), p = palette()
  // Three broad northlight sheds give the low recreation hall a sawtooth skyline.
  for (const z of [-0.62, 0, 0.62]) {
    const panel = rbox(2.78, 0.065, 0.66, p.roof, 0, 1.06, z, 0)
    panel.rotation.x = -0.32; g.add(panel)
    g.add(rbox(2.6, 0.24, 0.04, hold(0x73958a), 0, 0.99, z + 0.3, 0))
    for (const x of [-1.3, -0.65, 0, 0.65, 1.3]) g.add(rbox(0.04, 0.26, 0.06, p.trim, x, 1, z + 0.32, 0))
  }
  return g
}
export function buildUnion() {
  const g = hall(2.9, 1.4, 1.15, 5, 1, 0.14), p = palette()
  // Deep shaded terrace, supported by the same masonry piers as the halls.
  g.add(roof(3.0, 1.05, 0.92, p, 0.12))
  const terrace = g.children[g.children.length - 1]; terrace.position.z = 0.92
  for (const x of [-1.25, -0.63, 0, 0.63, 1.25]) g.add(rbox(0.1, 0.95, 0.1, p.stone, x, 0.48, 1.18, 0))
  return g
}
export function buildLandmark(id: BuildingId): THREE.Group {
  const builders = { quad: buildClockTower, counselor: buildCounselorHall, library: buildLibrary, classroom: buildClassrooms, registrar: buildRegistrar, dorm: buildDorms, gym: buildRecCenter, union: buildUnion }
  return builders[id]()
}

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
function roof(w: number, d: number, y: number, p: ReturnType<typeof palette>) {
  const g = gableRoof(w + 0.18, d + 0.18, d * 0.28, p.roof, y)
  // Raised tile seams follow the pitch; a legible rhythm at map distance.
  for (let x = -w / 2; x <= w / 2; x += 0.18) for (const side of [-1, 1]) {
    const seam = rbox(0.025, 0.027, Math.hypot(d / 2 + 0.13, d * 0.28), p.brick, x, d * 0.14 + 0.018, side * (d / 4 + 0.055), 0)
    seam.rotation.x = side * Math.atan2(d * 0.28, d / 2 + 0.13)
    g.add(seam)
  }
  return g
}
function hall(w: number, d: number, h: number, bays: number, floors = 1) {
  const p = palette(), g = new THREE.Group()
  g.add(rbox(w, h, d, p.stone, 0, h / 2, 0, 0))
  g.add(rbox(w + 0.12, 0.18, d + 0.12, p.brick, 0, 0.09, 0, 0))
  for (const y of [h - 0.12, h - 0.23]) g.add(rbox(w + 0.06, 0.055, d + 0.06, p.brick, 0, y, 0, 0))
  for (let level = 0; level < floors; level++) {
    for (let i = 0; i < bays; i++) bay(g, -w / 2 + (i + 0.5) * w / bays, 0.25 + level * (h - 0.3) / floors, d / 2, w / bays * 0.57, (h - 0.4) / floors * 0.84, p)
    const side = new THREE.Group()
    for (let i = 0; i < 2; i++) bay(side, (i - 0.5) * d / 2, 0.25 + level * (h - 0.3) / floors, 0, d * 0.24, (h - 0.4) / floors * 0.84, p)
    side.rotation.y = Math.PI / 2; side.position.x = w / 2; g.add(side)
  }
  g.add(roof(w, d, h, p))
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
  const g = hall(3.7, 1.35, 1.65, 7), p = palette()
  const archive = hall(0.92, 2.2, 2.3, 2, 2); archive.position.set(-1.48, 0, -0.56); g.add(archive)
  // Three roof lanterns make the reading room recognizable from above.
  for (const x of [-0.65, 0.25, 1.15]) { const lantern = hall(0.5, 0.55, 0.36, 1); lantern.position.set(x, 1.91, 0); g.add(lantern) }
  g.add(steps(3.45, 0.42, p.trim, 0.94)); return g
}
export function buildCounselorHall() {
  const g = hall(2.3, 1.5, 1.6, 4), p = palette()
  const entry = hall(0.8, 0.75, 2.15, 1); entry.position.set(0, 0, 0.56); g.add(entry)
  g.add(steps(1.25, 0.48, p.trim, 1.12)); return g
}
export function buildClassrooms() {
  const g = hall(3.2, 1.15, 1.45, 6)
  const end = hall(0.7, 1.55, 1.9, 1); end.position.set(-1.35, 0, -0.2); g.add(end); return g
}
export function buildRegistrar() {
  const g = hall(1.9, 1.45, 1.65, 3)
  const loggia = hall(1.5, 0.45, 0.95, 3); loggia.position.set(0, 0, 0.86); g.add(loggia); return g
}
export function buildDorms() {
  const g = new THREE.Group()
  for (const x of [-0.91, 0.91]) { const wing = hall(1.25, 1.8, 2.65, 3, 3); wing.position.x = x; g.add(wing) }
  const link = hall(0.7, 0.7, 1.5, 1); link.position.z = -0.55; g.add(link); return g
}
export function buildRecCenter() { return hall(2.65, 1.6, 1.15, 5) }
export function buildUnion() {
  const g = hall(2.1, 1.4, 1.25, 4), p = palette()
  // Deep shaded terrace, supported by the same masonry piers as the halls.
  g.add(roof(2.15, 0.75, 0.92, p))
  const terrace = g.children[g.children.length - 1]; terrace.position.z = 0.92
  for (const x of [-0.95, -0.32, 0.32, 0.95]) g.add(rbox(0.1, 0.95, 0.1, p.stone, x, 0.48, 1.18, 0))
  return g
}
export function buildLandmark(id: BuildingId): THREE.Group {
  const builders = { quad: buildClockTower, counselor: buildCounselorHall, library: buildLibrary, classroom: buildClassrooms, registrar: buildRegistrar, dorm: buildDorms, gym: buildRecCenter, union: buildUnion }
  return builders[id]()
}

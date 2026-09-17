"use client"

/**
 * TransferPath campus: authored landmark halls + sparse Kenney CC0 life/props.
 * Ground follows the cream-and-ink dossier palette rather than game-board turf.
 */

import * as THREE from "three"
import { CAMPUS_BUILDINGS, type BuildingId } from "./campus-data"
import { buildLandmark, PIN_Y } from "./campus-landmarks"
import {
  C,
  bench,
  blobShadow,
  flat,
  fountain,
  hedge,
  kiosk,
  lambert,
  mesh,
  numberPin,
  rbox,
  toyTree,
} from "./campus-kit"
import { stamp, uniquifyMaterials, type KitLibrary } from "./campus-models"

function keyOf(x: number, z: number) {
  return `${Math.round(x * 2) / 2},${Math.round(z * 2) / 2}`
}

function tag(obj: THREE.Object3D, id: BuildingId) {
  obj.userData.buildingId = id
  obj.traverse((c) => {
    c.userData.buildingId = id
  })
}

function islandShape(scale = 1) {
  // Soft organic plate — more control points + larger radii so the silhouette
  // reads as foam-edged island instead of a faceted lozenge against the void.
  const s = new THREE.Shape()
  const pts: [number, number][] = [
    [-6.2, -5.55],
    [-3.4, -6.05],
    [-0.2, -5.85],
    [3.1, -6.15],
    [5.9, -5.35],
    [6.85, -3.1],
    [6.55, -0.4],
    [6.95, 2.4],
    [5.85, 4.85],
    [3.0, 5.95],
    [-0.15, 6.15],
    [-3.35, 5.75],
    [-5.95, 4.55],
    [-6.95, 2.15],
    [-6.65, -0.55],
    [-6.85, -3.25],
  ]
  const scaled = pts.map(([x, z]) => [x * scale, z * scale] as [number, number])
  const n = scaled.length
  const mid = (i: number, j: number): [number, number] => [
    (scaled[i][0] + scaled[j][0]) / 2,
    (scaled[i][1] + scaled[j][1]) / 2,
  ]
  const m0 = mid(n - 1, 0)
  s.moveTo(m0[0], m0[1])
  for (let i = 0; i < n; i++) {
    const m = mid(i, (i + 1) % n)
    s.quadraticCurveTo(scaled[i][0], scaled[i][1], m[0], m[1])
  }
  s.closePath()
  return s
}

export function buildCampusWorld(root: THREE.Group, lib: KitLibrary) {
  const meshById = new Map<BuildingId, THREE.Group>()
  const occupied = new Set<string>()
  const reserved = new Set<string>()
  const mark = (x: number, z: number) => occupied.add(keyOf(x, z))
  const reserveRect = (x0: number, z0: number, x1: number, z1: number) => {
    for (let x = x0; x <= x1; x += 0.5) {
      for (let z = z0; z <= z1; z += 0.5) reserved.add(keyOf(x, z))
    }
  }

  const occupyBox = (obj: THREE.Object3D) => {
    obj.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(obj)
    if (!Number.isFinite(box.min.x)) return
    for (let x = Math.floor(box.min.x); x <= Math.floor(box.max.x); x++) {
      for (let z = Math.floor(box.min.z); z <= Math.floor(box.max.z); z++) mark(x, z)
    }
  }

  // Lambert on the plate so sun shadows seat instead of floating over unlit Basic mats.
  const grassMat = lambert(0x7d896f, { emissive: new THREE.Color(0x7d896f), emissiveIntensity: 0.12 })
  const sandMat = lambert(0xe4d8bd, { emissive: new THREE.Color(0xe4d8bd), emissiveIntensity: 0.1 })
  const waterMat = lambert(0x8db7bd, { transparent: true, opacity: 0.64 })
  const waterDeepMat = lambert(0x668e96)
  const pierMat = lambert(0xc5b69b)
  const islandMat = lambert(0x6e7a62, { emissive: new THREE.Color(0x6e7a62), emissiveIntensity: 0.14 })
  const skirtMat = lambert(0x5a6650, { emissive: new THREE.Color(0x5a6650), emissiveIntensity: 0.1 })
  const foamMat = lambert(0x8a9680, { emissive: new THREE.Color(0x8a9680), emissiveIntensity: 0.16 })
  const plazaMat = lambert(0xf2ede2, { emissive: new THREE.Color(0xf2ede2), emissiveIntensity: 0.14 })
  const plazaAlt = lambert(0xe5ddcf, { emissive: new THREE.Color(0xe5ddcf), emissiveIntensity: 0.12 })
  const walkMat = lambert(0xa89880, { emissive: new THREE.Color(0xa89880), emissiveIntensity: 0.1 })
  const roadMat = lambert(0xd4c9b4, { emissive: new THREE.Color(0xd4c9b4), emissiveIntensity: 0.1 })
  const curbMat = lambert(0x4a525a, { emissive: new THREE.Color(0x4a525a), emissiveIntensity: 0.08 })
  const hedgeMat = flat(0x405443)

  const drop = mesh(
    new THREE.CircleGeometry(12.4, 64),
    new THREE.MeshBasicMaterial({ color: 0x1a3040, transparent: true, opacity: 0.18, depthWrite: false }),
    0.2,
    -1.34,
    0.35,
    false
  )
  drop.rotation.x = -Math.PI / 2
  drop.scale.set(1.08, 0.92, 1)
  root.add(drop)

  // Unified green underplate — no leftover tan cylinder reading as unfinished seams.
  const underplate = mesh(new THREE.CylinderGeometry(11.2, 11.6, 0.38, 96), skirtMat, 0.05, -1.12, 0.25, false)
  underplate.scale.set(1.02, 1, 0.94)
  root.add(underplate)

  const islandGeo = new THREE.ExtrudeGeometry(islandShape(1), {
    depth: 0.58,
    bevelEnabled: true,
    bevelSize: 0.1,
    bevelThickness: 0.09,
    bevelSegments: 4,
    curveSegments: 48,
  })
  islandGeo.rotateX(-Math.PI / 2)
  const island = mesh(islandGeo, islandMat, 0.05, -0.74, 0.2, false)
  root.add(island)

  // Soft foam lip — slightly larger, paler skirt so the void edge reads continuous.
  const lipGeo = new THREE.ExtrudeGeometry(islandShape(1.045), {
    depth: 0.14,
    bevelEnabled: true,
    bevelSize: 0.06,
    bevelThickness: 0.05,
    bevelSegments: 3,
    curveSegments: 48,
  })
  lipGeo.rotateX(-Math.PI / 2)
  root.add(mesh(lipGeo, foamMat, 0.05, -0.78, 0.2, false))

  // Single soft void fade — no stacked concentric rings (AI-island trope).
  {
    const soft = new THREE.Mesh(
      new THREE.CircleGeometry(8.2, 96),
      new THREE.MeshBasicMaterial({
        color: 0xc5d4c0,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
      }),
    )
    soft.rotation.x = -Math.PI / 2
    soft.position.set(0.05, -0.84, 0.2)
    soft.scale.set(1.06, 0.9, 1)
    soft.renderOrder = -2
    root.add(soft)
  }

  const sand = mesh(new THREE.CircleGeometry(5.4, 48), sandMat, -8.2, 0.02, 2.5, false)
  sand.rotation.x = -Math.PI / 2
  sand.scale.set(1.22, 0.72, 1)
  root.add(sand)

  const waterDeep = mesh(new THREE.CircleGeometry(48, 64), waterDeepMat, -8, -1.32, 3.4, false)
  waterDeep.rotation.x = -Math.PI / 2
  root.add(waterDeep)
  const water = mesh(new THREE.CircleGeometry(28, 64), waterMat, -9, -1.05, 4, false)
  water.rotation.x = -Math.PI / 2
  root.add(water)

  const city = new THREE.Group()
  city.position.y = 0.05
  root.add(city)

  for (let x = -2.4; x <= 2.4; x += 0.8) {
    for (let z = -1.2; z <= 2.4; z += 0.8) {
      const tile = rbox(
        0.76,
        0.08,
        0.76,
        (Math.round((x + 20) * 2) + Math.round((z + 20) * 2)) % 2 === 0 ? plazaMat : plazaAlt,
        x,
        0.05,
        z,
        0.02,
        false
      )
      city.add(tile)
    }
  }

  city.add(rbox(1.55, 0.06, 1.35, grassMat, 0, 0.09, 1.05, 0.04, false))
  // Quiet stone pad — avoid bright + that reads as a sports crosshair on the plate.
  city.add(rbox(1.15, 0.07, 1.15, walkMat, 0, 0.075, 0.95, 0.03, false))

  const lane = (x: number, z: number, w: number, d: number, mat = walkMat) => {
    city.add(rbox(w, 0.07, d, mat, x, 0.055, z, 0.02, false))
  }
  const artery = (w: number, d: number, x: number, z: number) => {
    city.add(rbox(w + 0.22, 0.06, d + 0.22, curbMat, x, 0.04, z, 0.03, false))
    city.add(rbox(w, 0.09, d, roadMat, x, 0.055, z, 0.03, false))
  }
  artery(12.4, 0.95, 0.1, 0.15)
  artery(0.95, 9.8, -2.55, 0.45)
  artery(0.95, 8.2, 2.85, 0.65)
  artery(9.8, 0.9, 0.15, 2.85)
  artery(7.6, 0.85, -0.15, -2.15)
  lane(-2.9, 0.85, 2.8, 0.42)
  lane(2.9, 0.85, 2.8, 0.42)
  lane(0, 3.05, 0.42, 1.9)
  lane(-3.5, -1.35, 3.6, 0.4)
  lane(3.5, -1.35, 3.6, 0.4)
  lane(-3.6, 2.55, 0.4, 2.5)
  lane(3.5, 2.2, 0.4, 2.3)
  lane(-2.4, -2.15, 0.4, 1.7)
  lane(2.2, 3.55, 2.8, 0.4)

  const add = (key: string, x: number, z: number, rot = 0, scale = 1, shadow = true) => {
    const g = stamp(lib, key, x, z, rot, scale, shadow)
    city.add(g)
    occupyBox(g)
    return g
  }

  reserveRect(-1.6, -0.8, 1.6, 2.4)
  reserveRect(3.0, -1.6, 5.8, 0.8)
  reserveRect(-1.6, 2.2, 1.4, 4.2)
  reserveRect(-3.8, -2.8, -0.2, -0.6)
  reserveRect(3.2, 1.6, 5.8, 3.6)
  reserveRect(-5.6, -3.2, -2.8, -0.8)
  reserveRect(1.8, 2.8, 4.6, 5.2)
  reserveRect(-5.4, -0.2, -2.6, 2.2)

  const placeLandmark = (id: BuildingId) => {
    const meta = CAMPUS_BUILDINGS.find((b) => b.id === id)!
    const g = new THREE.Group()
    g.position.set(meta.x, 0, meta.z)
    const hall = buildLandmark(id)
    g.add(hall)
    uniquifyMaterials(g)
    tag(g, id)

    // Invisible pick volume — keeps directory/map lockstep honest when props crowd the facade.
    const box = new THREE.Box3().setFromObject(hall)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(size.x, 1.1) * 1.08, Math.max(size.y, 1.4) * 1.05, Math.max(size.z, 1.1) * 1.08),
      new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0, depthWrite: false }),
    )
    hit.position.set(center.x - g.position.x, Math.max(size.y, 1.4) * 0.52, center.z - g.position.z)
    hit.userData.buildingId = id
    hit.userData.isHitVolume = true
    g.add(hit)
    const index = CAMPUS_BUILDINGS.findIndex((b) => b.id === id)
    const pin = numberPin(index + 1, id)
    pin.position.set(0, PIN_Y[id], 0)
    g.add(pin)
    city.add(g)
    meshById.set(id, g)
    occupyBox(g)
    return g
  }

  CAMPUS_BUILDINGS.forEach((b) => placeLandmark(b.id))

  // Quad furniture
  const font = fountain()
  font.position.set(0, 0, 1.05)
  city.add(font)
  city.add(hedge(0.18, 0.38, 2.05, -1.25, 1.05, hedgeMat))
  city.add(hedge(0.18, 0.38, 2.05, 1.25, 1.05, hedgeMat))
  city.add(bench(lambert(C.creamDeep), -0.85, 1.85, 0.2))
  city.add(bench(lambert(C.creamDeep), 0.85, 1.85, -0.2))

  add("castle/flag-wide", 0.08, -0.32, 0.1, 0.42, false)
  add("castle/flag", 4.55, 2.55, 0.12, 0.65, false)
  add("castle/stairs-stone", 0, 0.55, 0, 0.85)
  add("suburban/planter", -1.15, 2.15, 0, 1)
  add("suburban/planter", 1.15, 2.15, 0, 1)
  add("suburban/planter", 4.15, 0.25, 0, 1)
  add("roads/light-square", 3.25, 2.25, 0, 1)
  add("roads/light-square", -2.65, 2.25, 0, 1)
  add("roads/light-curved", 1.85, -1.55, 0, 1)
  add("roads/light-square", -4.15, -1.15, 0, 1)

  // L4: one awning + one parasol — less cafe clutter
  add("commercial/detail-parasol-a", -3.65, 1.75, 0.1, 0.95)
  add("commercial/detail-awning-wide", -4.05, 1.55, Math.PI / 2, 0.88)

  const spoke = (x1: number, z1: number) => {
    const x0 = 0
    const z0 = -0.28
    const dx = x1 - x0
    const dz = z1 - z0
    const len = Math.hypot(dx, dz)
    const curb = rbox(0.82, 0.07, len * 0.9, curbMat, (x0 + x1) / 2, 0.045, (z0 + z1) / 2, 0.02, false)
    const m = rbox(0.68, 0.1, len * 0.9, roadMat, (x0 + x1) / 2, 0.06, (z0 + z1) / 2, 0.02, false)
    curb.rotation.y = Math.atan2(dx, dz)
    m.rotation.y = Math.atan2(dx, dz)
    city.add(curb)
    city.add(m)
  }
  CAMPUS_BUILDINGS.forEach((b) => {
    if (b.id === "quad") return
    spoke(b.x, b.z)
  })

  // Short irregular hedge clusters — not continuous ribbon borders.
  const hedgeRows: [number, number, number, number, number][] = [
    [-4.85, -2.75, 0.72, 0.28, 0.18],
    [-4.05, -2.92, 0.55, 0.34, 0.16],
    [3.75, -1.78, 0.62, 0.26, 0.18],
    [4.45, -1.95, 0.48, 0.32, 0.15],
    [1.55, 2.35, 0.18, 0.3, 0.55],
    [1.62, 2.95, 0.16, 0.36, 0.42],
    [-4.45, 2.05, 0.18, 0.28, 0.48],
    [-4.55, 2.55, 0.15, 0.34, 0.38],
    [4.95, 0.95, 0.16, 0.3, 0.45],
    [5.05, 1.45, 0.18, 0.26, 0.35],
  ]
  hedgeRows.forEach(([x, z, w, h, d]) => city.add(hedge(w, h, d, x, z, hedgeMat)))

  const lot = (cx: number, cz: number, w: number, d: number) => {
    city.add(rbox(w, 0.04, d, plazaMat, cx, 0.03, cz, 0.02, false))
    // Broken corners only — avoid full perimeter ribbons.
    city.add(hedge(w * 0.28, 0.2, 0.1, cx - w * 0.28, cz - d / 2, hedgeMat))
    city.add(hedge(w * 0.22, 0.24, 0.1, cx + w * 0.32, cz - d / 2, hedgeMat))
    city.add(hedge(w * 0.24, 0.18, 0.1, cx - w * 0.18, cz + d / 2, hedgeMat))
    city.add(hedge(0.1, 0.22, d * 0.32, cx - w / 2, cz - d * 0.15, hedgeMat))
    city.add(hedge(0.1, 0.26, d * 0.28, cx + w / 2, cz + d * 0.12, hedgeMat))
  }
  lot(4.15, -0.55, 3.6, 2.2)
  lot(-0.15, 3.25, 2.8, 2.3)
  lot(-1.85, -1.75, 3.6, 2.0)
  lot(4.55, 2.55, 2.5, 2.2)
  lot(-4.15, -2.15, 3.2, 2.3)
  lot(3.15, 3.85, 3.0, 3.0)
  lot(-4.05, 1.05, 2.9, 2.5)

  lane(4.15, 0.55, 0.48, 1.35)
  lane(-0.15, 2.25, 0.48, 1.2)
  lane(-1.85, -0.85, 0.48, 0.95)
  lane(4.55, 1.55, 0.48, 1.15)
  lane(3.15, 2.75, 0.48, 1.2)
  lane(-4.05, 2.05, 0.48, 1.1)

  // Sparse authored canopy — fewer stamps, mixed silhouettes via seed.
  const trees: [number, number, number][] = [
    [-1.45, 0.55, 1],
    [1.55, 0.45, 4],
    [-1.35, 2.35, 7],
    [1.25, 2.15, 2],
    [-3.95, 0.75, 10],
    [3.45, 0.25, 5],
    [-2.95, -1.65, 13],
    [2.75, -1.55, 8],
    [5.45, 2.75, 11],
    [-5.45, 2.25, 3],
    [-3.65, -2.95, 16],
    [1.05, 3.95, 6],
    [-1.25, 3.75, 19],
    [4.05, 3.65, 9],
    [0.75, -2.25, 14],
    [-4.95, 0.05, 21],
    [2.65, 4.65, 12],
    [-5.55, -1.95, 17],
    [5.05, -3.15, 15],
    [-2.85, 3.25, 20],
  ]
  trees.forEach(([x, z, seed]) => {
    if (occupied.has(keyOf(x, z))) return
    const t = toyTree(x, z, seed)
    city.add(t)
    occupyBox(t)
  })

  const clusters: [number, number, number][] = [
    [-5.15, 3.35, 41],
    [5.15, 3.95, 43],
    [4.75, -3.45, 44],
    [-5.25, -3.15, 45],
    [0.25, 4.65, 46],
  ]
  clusters.forEach(([x, z, seed]) => {
    if (occupied.has(keyOf(x, z)) || reserved.has(keyOf(x, z))) return
    const t = toyTree(x, z, seed)
    city.add(t)
    occupyBox(t)
  })

  // Seawall + extra walk grid so leftover tan doesn't read as empty plate
  city.add(rbox(0.42, 0.28, 8.8, lambert(0x6a5a40, { emissive: new THREE.Color(0x6a5a40), emissiveIntensity: 0.08 }), -6.55, 0.14, 1.4, 0.04, false))
  ;[-4, -2, 0, 2, 4].forEach((x) => lane(x, -3.15, 0.42, 1.4))
  ;[-3, -1, 1, 3].forEach((z) => lane(5.15, z, 1.5, 0.42))

  const lamp = (x: number, z: number) => {
    const g = new THREE.Group()
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.72, 8), flat(0x3d4f68), 0, 0.36, 0, false))
    g.add(mesh(new THREE.SphereGeometry(0.08, 10, 8), flat(0xf7e4a8), 0, 0.78, 0, false))
    g.position.set(x, 0, z)
    city.add(g)
  }
  ;[
    [-1.6, 1.05],
    [1.6, 1.05],
    [0, 2.55],
    [-3.4, 0.85],
    [3.4, 0.85],
    [-4.9, 3.15],
    [4.9, 2.55],
    [-2.2, -2.05],
    [2.2, -2.05],
  ].forEach(([x, z]) => lamp(x, z))

  const cafeTable = (x: number, z: number) => {
    const g = new THREE.Group()
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 12), flat(0xf7f2e8), 0, 0.28, 0, false))
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.26, 8), flat(0x6b4a2e), 0, 0.14, 0, false))
    g.position.set(x, 0, z)
    city.add(g)
  }
  ;[
    [-3.55, 1.65],
    [-4.15, 1.75],
    [-3.75, 2.05],
    [-4.45, 1.45],
    [-3.35, 1.35],
  ].forEach(([x, z]) => cafeTable(x, z))

  const garden = (x: number, z: number, w: number, d: number) => {
    city.add(rbox(w, 0.08, d, grassMat, x, 0.06, z, 0.03, false))
    city.add(hedge(w + 0.08, 0.22, 0.1, x, z - d / 2, hedgeMat))
    city.add(hedge(w + 0.08, 0.22, 0.1, x, z + d / 2, hedgeMat))
  }
  garden(-4.35, -3.15, 1.4, 1.05)
  garden(3.15, -3.15, 1.35, 1.0)
  garden(5.15, 1.05, 1.1, 1.25)
  garden(-1.15, 4.15, 1.2, 0.95)
  garden(1.55, 4.25, 1.15, 0.9)
  garden(0.15, -2.85, 1.05, 0.75)
  garden(5.35, 3.55, 0.95, 0.85)
  garden(-5.15, 1.85, 0.9, 0.8)
  garden(5.65, -1.15, 1.35, 1.15)
  garden(5.85, 1.85, 1.2, 1.05)
  garden(1.85, -3.55, 1.45, 1.1)
  garden(-2.65, 4.55, 1.25, 1.0)
  garden(0.95, 4.85, 1.15, 0.95)
  garden(-5.35, -0.55, 1.1, 1.2)


  // Palms removed — they read as asset-pack toys against the paper campus.

  const deck = rbox(4.05, 0.1, 1.05, pierMat, -8.65, 0.06, 2.55, 0.03)
  city.add(deck)
  add("castle/bridge-straight", -6.55, 2.45, Math.PI / 2, 0.95)
  // L4: two quiet pier stalls, not a carnival row
  city.add(kiosk(lambert(C.cream), lambert(C.terracottaDeep), -8.15, 2.35, 0.1))
  city.add(bench(lambert(C.creamDeep), 2.15, -1.55, 0.1))
  city.add(bench(lambert(C.creamDeep), -2.25, 0.35, -0.15))
  city.add(bench(lambert(C.creamDeep), 4.35, 1.85, 0.4))

  const boat = (x: number, z: number, rot: number, color: number) => {
    const g = new THREE.Group()
    g.add(
      rbox(0.88, 0.13, 0.32, lambert(color), 0, 0.08, 0, 0.04),
      rbox(0.3, 0.14, 0.24, lambert(C.trim), -0.12, 0.18, 0, 0.03)
    )
    blobShadow(g, 0.55, 0.28, 0.22)
    g.position.set(x, 0, z)
    g.rotation.y = rot
    return g
  }
  city.add(boat(-9.45, 2.55, 0.15, C.navySoft))
  city.add(boat(-9.25, 4.65, -0.25, 0xf2eee4))

  // L4: sparse cars — Kenney vehicles read toy when dense
  add("cars/sedan", 3.05, 0.15, Math.PI / 2, 0.16)
  add("cars/sedan", -3.55, -2.45, 0.35, 0.15)

  const people: THREE.Group[] = []
  const walkers = [
    "people/character-male-a",
    "people/character-female-a",
    "people/character-male-b",
    "people/character-female-b",
    "people/character-male-c",
    "people/character-female-c",
    "people/character-male-d",
    "people/character-female-d",
  ]
  // Keep enough figures for scale without turning the campus into a toy crowd.
  const walk: { x: number; z: number }[] = [
    { x: 0.25, z: 1.15 },
    { x: 4.15, z: -1.55 },
    { x: 0.2, z: 3.15 },
    { x: -3.65, z: 1.55 },
    { x: 3.35, z: 3.55 },
    { x: -3.85, z: -2.15 },
    { x: -6.55, z: 2.55 },
    { x: 4.55, z: 2.15 },
    { x: -1.55, z: -1.55 },
    { x: -8.15, z: 2.45 },
  ]
  walk.forEach((w, i) => {
    const p = stamp(lib, walkers[i % walkers.length], w.x, w.z, i * 0.7, 1.28, false)
    p.userData.home = w
    p.userData.phase = i * 0.55
    city.add(p)
    people.push(p)
  })

  const pawnColors = [0x2c3d55, 0xc45c3a, 0xf4ead6, 0x5a8f78, 0xb86b52, 0x3d516c]
  walk.forEach((w, i) => {
    if (i % 4 !== 0) return
    const pawn = new THREE.Group()
    const shirt = lambert(pawnColors[i % pawnColors.length])
    pawn.add(mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.44, 8), shirt, 0, 0.3, 0))
    pawn.add(mesh(new THREE.SphereGeometry(0.13, 10, 8), flat(0xf0d2b4), 0, 0.6, 0))
    pawn.position.set(w.x + 0.35, 0, w.z - 0.2)
    pawn.userData.home = { x: w.x + 0.35, z: w.z - 0.2 }
    pawn.userData.phase = i * 0.7 + 1
    city.add(pawn)
    people.push(pawn)
  })

  return { meshById, people, water }
}

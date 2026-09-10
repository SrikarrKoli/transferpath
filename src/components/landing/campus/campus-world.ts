"use client"

/**
 * Concept-C diorama campus world:
 * thick pedestal island, radial paths, sandstone + terracotta, dense landscaping.
 */

import * as THREE from "three"
import { CAMPUS_BUILDINGS, type BuildingId, type CampusBuilding } from "./campus-data"

function M(color: number, roughness = 0.78, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness })
}

const PALETTE = {
  sand: 0xe4d5bc,
  sandDeep: 0xcbb896,
  terra: 0xb85c38,
  terraDeep: 0x9a4a2e,
  slate: 0x6e737a,
  grass: 0x6a7f52,
  grassDark: 0x576844,
  path: 0xd6cfbf,
  island: 0xe8e0d2,
  islandEdge: 0xcfc4b0,
  glass: 0x7eb0d4,
  metal: 0x3a3a3a,
  water: 0x4fa3d4,
  trunk: 0x6b4a2e,
  leaf: 0x3f8a3a,
  leaf2: 0x57a048,
  hedge: 0x3d7a38,
  white: 0xf3eee4,
  blueRoof: 0x5a6b62,
  greenRoof: 0x3d6b45,
}

function tag(obj: THREE.Object3D, id?: BuildingId) {
  if (!id) return
  obj.traverse((c) => {
    c.userData.buildingId = id
  })
  obj.userData.buildingId = id
}

function mesh(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  cast = true
) {
  const m = new THREE.Mesh(geo, mat)
  m.position.set(x, y, z)
  m.castShadow = cast
  m.receiveShadow = true
  return m
}

function numberPin(n: number, id: BuildingId) {
  const g = new THREE.Group()
  g.userData.buildingId = id
  g.userData.isPin = true

  const makeBadge = (active: boolean) => {
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, 256, 256)
    ctx.beginPath()
    ctx.arc(128, 128, 100, 0, Math.PI * 2)
    ctx.fillStyle = active ? "#1a2332" : "#f4f1ea"
    ctx.fill()
    if (!active) {
      ctx.beginPath()
      ctx.arc(128, 128, 96, 0, Math.PI * 2)
      ctx.strokeStyle = "#1a2332"
      ctx.lineWidth = 8
      ctx.stroke()
    }
    ctx.fillStyle = active ? "#f4f1ea" : "#1a2332"
    ctx.font = "700 78px ui-monospace, SFMono-Regular, Menlo, monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(String(n).padStart(2, "0"), 128, 136)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }

  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeBadge(false), transparent: true, depthTest: false, opacity: 0.96 })
  )
  s.scale.set(2.6, 2.6, 1)
  s.position.y = 1.85
  s.userData.buildingId = id
  s.userData.isPinSprite = true
  s.userData.texIdle = s.material.map
  s.userData.texActive = makeBadge(true)
  g.add(s)

  const stem = mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.7, 8), M(PALETTE.metal), 0, 0.85, 0, false)
  stem.userData.buildingId = id
  g.add(stem)
  const base = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 12), M(PALETTE.sandDeep), 0, 0.05, 0, false)
  base.userData.buildingId = id
  g.add(base)

  return g
}

function windows(
  g: THREE.Group,
  w: number,
  h: number,
  d: number,
  y0: number,
  cols: number,
  rows: number,
  id: BuildingId
) {
  const glass = M(PALETTE.glass, 0.22, 0.4)
  glass.emissive = new THREE.Color(0x3a6e96)
  glass.emissiveIntensity = 0.12
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = -w / 2 + 0.5 + (c / Math.max(1, cols - 1)) * (w - 1.0)
      const wy = y0 + 0.5 + (r / Math.max(1, rows - 1)) * (h - 1.05)
      const front = mesh(new THREE.BoxGeometry(0.26, 0.34, 0.04), glass, wx, wy, d / 2 + 0.025)
      g.add(front)
      tag(front, id)
    }
  }
}

/** Simple pitched roof — two boxes, no extrude artifacts. */
function pitchedRoof(w: number, d: number, h: number, color: number) {
  const g = new THREE.Group()
  const mat = M(color, 0.68)
  const left = mesh(new THREE.BoxGeometry(w * 0.72, 0.12, d + 0.2), mat, -w * 0.18, h * 0.35, 0)
  left.rotation.z = 0.42
  const right = mesh(new THREE.BoxGeometry(w * 0.72, 0.12, d + 0.2), mat, w * 0.18, h * 0.35, 0)
  right.rotation.z = -0.42
  g.add(left, right)
  g.add(mesh(new THREE.BoxGeometry(w + 0.15, 0.1, d + 0.15), mat, 0, 0.05, 0))
  return g
}

function hipRoofBox(w: number, d: number, h: number, color: number) {
  // Flattened square pyramid for hip roofs
  const roof = mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.68, h, 4), M(color, 0.68), 0, 0, 0)
  roof.rotation.y = Math.PI / 4
  return roof
}

function addHedge(root: THREE.Group, x: number, z: number, w: number, d: number, h = 0.55) {
  root.add(mesh(new THREE.BoxGeometry(w, h, d), M(PALETTE.hedge, 0.9), x, h / 2, z, false))
}

function addTree(root: THREE.Group, x: number, z: number, s = 1) {
  root.add(
    mesh(new THREE.CylinderGeometry(0.09 * s, 0.13 * s, 0.9 * s, 7), M(PALETTE.trunk), x, 0.45 * s, z)
  )
  const leaf = Math.random() > 0.45 ? PALETTE.leaf : PALETTE.leaf2
  root.add(mesh(new THREE.SphereGeometry(0.78 * s, 12, 12), M(leaf, 0.88), x, 1.25 * s, z))
  root.add(
    mesh(
      new THREE.SphereGeometry(0.5 * s, 10, 10),
      M(leaf, 0.88),
      x + 0.28 * s,
      1.4 * s,
      z - 0.12 * s
    )
  )
  root.add(
    mesh(
      new THREE.SphereGeometry(0.42 * s, 10, 10),
      M(leaf, 0.88),
      x - 0.22 * s,
      1.35 * s,
      z + 0.18 * s
    )
  )
}

function buildSandstoneBlock(
  b: CampusBuilding,
  w: number,
  h: number,
  d: number,
  roofColor = PALETTE.terra,
  floors = 2
) {
  const g = new THREE.Group()
  g.userData.id = b.id
  g.add(mesh(new THREE.BoxGeometry(w + 0.5, 0.22, d + 0.5), M(PALETTE.sandDeep), 0, 0.11, 0))
  const body = mesh(new THREE.BoxGeometry(w, h, d), M(PALETTE.sand), 0, 0.22 + h / 2, 0)
  g.add(body)
  g.add(mesh(new THREE.BoxGeometry(w + 0.18, 0.1, d + 0.18), M(PALETTE.sandDeep), 0, 0.22 + h, 0))
  const roof = pitchedRoof(w + 0.45, d + 0.35, 0.95, roofColor)
  roof.position.y = 0.22 + h + 0.02
  g.add(roof)
  windows(g, w, h, d, 0.22, Math.max(3, Math.floor(w * 0.9)), floors, b.id)
  // stairs
  g.add(mesh(new THREE.BoxGeometry(w * 0.42, 0.14, 0.7), M(PALETTE.path), 0, 0.1, d / 2 + 0.45))
  g.add(mesh(new THREE.BoxGeometry(w * 0.36, 0.12, 0.45), M(PALETTE.path), 0, 0.2, d / 2 + 0.28))
  g.add(mesh(new THREE.BoxGeometry(0.65, 1.1, 0.1), M(PALETTE.sandDeep), 0, 0.75, d / 2 + 0.02))
  tag(g, b.id)
  g.position.set(b.x, 0, b.z)
  return g
}

function buildNeoclassical(b: CampusBuilding) {
  const g = new THREE.Group()
  g.userData.id = b.id
  const w = 5.6
  const h = 3.35
  const d = 3.9
  g.add(mesh(new THREE.BoxGeometry(w + 1.1, 0.28, d + 1.1), M(PALETTE.sandDeep), 0, 0.14, 0))
  g.add(mesh(new THREE.BoxGeometry(w, h, d), M(PALETTE.white), 0, 0.28 + h / 2, 0))
  // colonnade
  for (let i = 0; i < 6; i++) {
    const x = -w / 2 + 0.55 + (i / 5) * (w - 1.1)
    g.add(
      mesh(
        new THREE.CylinderGeometry(0.14, 0.16, h * 0.78, 14),
        M(PALETTE.white),
        x,
        0.28 + (h * 0.78) / 2,
        d / 2 + 0.38
      )
    )
  }
  g.add(
    mesh(new THREE.BoxGeometry(w + 0.3, 0.22, 0.9), M(PALETTE.sandDeep), 0, 0.28 + h * 0.84, d / 2 + 0.38)
  )
  const ped = new THREE.Shape()
  ped.moveTo(-(w + 0.35) / 2, 0)
  ped.lineTo((w + 0.35) / 2, 0)
  ped.lineTo(0, 1.2)
  const pedMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(ped, { depth: 0.24, bevelEnabled: false }),
    M(PALETTE.white)
  )
  pedMesh.position.set(0, 0.28 + h + 0.05, d / 2 + 0.14)
  pedMesh.castShadow = true
  g.add(pedMesh)
  const roof = pitchedRoof(w + 0.2, d + 0.2, 0.7, PALETTE.terraDeep)
  roof.position.y = 0.28 + h + 0.05
  g.add(roof)
  windows(g, w, h, d, 0.28, 5, 3, b.id)
  // grand stair
  for (let i = 0; i < 4; i++) {
    g.add(
      mesh(
        new THREE.BoxGeometry(w * 0.55 - i * 0.15, 0.12, 0.4),
        M(PALETTE.path),
        0,
        0.08 + i * 0.12,
        d / 2 + 0.85 - i * 0.22
      )
    )
  }
  tag(g, b.id)
  g.position.set(b.x, 0, b.z)
  return g
}

function buildTower(b: CampusBuilding) {
  const g = new THREE.Group()
  g.userData.id = b.id
  // attached admin wing behind tower
  g.add(mesh(new THREE.BoxGeometry(5.2, 2.4, 3.2), M(PALETTE.sand), 0, 1.2, -1.4))
  const wingRoof = pitchedRoof(5.5, 3.5, 0.85, PALETTE.terra)
  wingRoof.position.set(0, 2.45, -1.4)
  g.add(wingRoof)
  // tower shaft
  g.add(mesh(new THREE.BoxGeometry(2.15, 2.1, 2.15), M(PALETTE.sand), 0, 1.05, 0.55))
  g.add(mesh(new THREE.BoxGeometry(1.75, 4.2, 1.75), M(PALETTE.sand), 0, 4.15, 0.55))
  g.add(mesh(new THREE.BoxGeometry(2.05, 1.35, 2.05), M(PALETTE.sandDeep), 0, 6.85, 0.55))
  g.add(mesh(new THREE.ConeGeometry(1.15, 1.7, 4), M(PALETTE.greenRoof, 0.62), 0, 8.35, 0.55))
  for (const face of [
    [0, 1.1],
    [0, -1.1],
    [1.1, 0],
    [-1.1, 0],
  ] as const) {
    const clock = mesh(
      new THREE.CircleGeometry(0.3, 22),
      new THREE.MeshStandardMaterial({
        color: 0xfff8e7,
        emissive: 0xffe6a8,
        emissiveIntensity: 0.22,
      }),
      face[0],
      6.85,
      0.55 + face[1],
      false
    )
    if (face[0] !== 0) clock.rotation.y = Math.PI / 2
    g.add(clock)
  }
  // plaza path under tower (fountain lives at world origin)
  g.add(mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.08, 32), M(PALETTE.path), 0, 0.04, 0.2, false))
  tag(g, b.id)
  g.position.set(b.x, 0, b.z)
  return g
}

function buildModern(b: CampusBuilding) {
  const g = new THREE.Group()
  g.userData.id = b.id
  const w = 5.0
  const h = 2.35
  const d = 3.5
  g.add(mesh(new THREE.BoxGeometry(w, h, d), M(PALETTE.white), 0, h / 2, 0))
  const glass = M(PALETTE.glass, 0.18, 0.45)
  glass.emissive = new THREE.Color(0x3d6ea5)
  glass.emissiveIntensity = 0.14
  g.add(mesh(new THREE.BoxGeometry(w * 0.88, h * 0.7, 0.08), glass, 0, h * 0.5, d / 2 + 0.02))
  const roof = pitchedRoof(w + 0.3, d + 0.25, 0.75, PALETTE.blueRoof)
  roof.position.y = h + 0.02
  g.add(roof)
  // practice courts (intentional rec amenity)
  for (const oz of [-0.35, 2.15]) {
    g.add(mesh(new THREE.BoxGeometry(3.1, 0.04, 2.05), M(0x4f8a52, 0.92), w / 2 + 2.2, 0.03, oz, false))
    g.add(
      mesh(new THREE.BoxGeometry(0.04, 0.02, 2.0), M(PALETTE.white, 0.5), w / 2 + 2.2, 0.06, oz, false)
    )
    g.add(
      mesh(
        new THREE.BoxGeometry(3.05, 0.015, 0.04),
        M(PALETTE.white, 0.5),
        w / 2 + 2.2,
        0.06,
        oz,
        false
      )
    )
  }
  for (const z of [-1.3, 0.9, 3.1]) {
    for (const x of [w / 2 + 0.75, w / 2 + 3.65]) {
      g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 6), M(PALETTE.metal), x, 0.48, z, false))
    }
  }
  tag(g, b.id)
  g.position.set(b.x, 0, b.z)
  return g
}

function buildCafe(b: CampusBuilding) {
  const g = new THREE.Group()
  g.userData.id = b.id
  const w = 4.4
  const h = 2.05
  const d = 3.1
  g.add(mesh(new THREE.BoxGeometry(w, h, d), M(PALETTE.sand), 0, h / 2, 0))
  const roof = pitchedRoof(w + 0.4, d + 0.35, 0.8, PALETTE.terra)
  roof.position.y = h + 0.02
  g.add(roof)
  windows(g, w, h, d, 0, 4, 2, b.id)
  const glass = M(PALETTE.glass, 0.2, 0.4)
  g.add(mesh(new THREE.BoxGeometry(w * 0.55, h * 0.55, 0.06), glass, 0, h * 0.45, d / 2 + 0.02))
  for (const [ux, uz] of [
    [-1.15, d / 2 + 1.2],
    [0.25, d / 2 + 1.35],
    [1.55, d / 2 + 1.15],
  ] as const) {
    g.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.07, 14), M(PALETTE.white), ux, 0.38, uz, false))
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.15, 8), M(PALETTE.metal), ux, 0.7, uz, false))
    g.add(mesh(new THREE.ConeGeometry(0.62, 0.28, 14), M(0xf5f5f5, 0.6), ux, 1.32, uz, false))
  }
  tag(g, b.id)
  g.position.set(b.x, 0, b.z)
  return g
}

function addFountain(root: THREE.Group, x: number, z: number, r = 1.15) {
  root.add(mesh(new THREE.CylinderGeometry(r + 0.35, r + 0.4, 0.18, 28), M(PALETTE.path), x, 0.1, z, false))
  root.add(mesh(new THREE.CylinderGeometry(r + 0.15, r + 0.2, 0.35, 28), M(PALETTE.sandDeep), x, 0.28, z))
  const water = mesh(new THREE.CylinderGeometry(r, r, 0.12, 28), M(PALETTE.water, 0.12, 0.5), x, 0.42, z)
  water.name = "fountainWater"
  root.add(water)
  root.add(mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.55, 16), M(PALETTE.sand), x, 0.65, z))
  root.add(mesh(new THREE.SphereGeometry(0.22, 12, 12), M(PALETTE.white, 0.4), x, 1.0, z, false))
  return water
}

export function buildCampusWorld(root: THREE.Group) {
  const meshById = new Map<BuildingId, THREE.Group>()

  // Ground fills the frame — same tone as the panel so edges disappear
  const paper = mesh(new THREE.BoxGeometry(80, 0.2, 60), M(0xe8e2d4, 0.98), 0, -0.18, 0, false)
  root.add(paper)

  // Wide lawn — map ground, not a floating tile
  const lawn = mesh(new THREE.BoxGeometry(56, 0.14, 42), M(PALETTE.grass, 0.95), 0, 0.05, 0, false)
  root.add(lawn)
  const plaza = mesh(new THREE.CylinderGeometry(5.8, 5.8, 0.08, 56), M(PALETTE.grassDark, 0.95), 0, 0.12, 0, false)
  root.add(plaza)

  // Paths: concentric + radial
  const pathMat = M(PALETTE.path, 0.9)
  for (const [r0, r1] of [
    [2.6, 3.5],
    [6.8, 7.7],
  ] as const) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 72), pathMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.11
    ring.receiveShadow = true
    root.add(ring)
  }
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2
    const spoke = mesh(
      new THREE.BoxGeometry(1.15, 0.06, 13.2),
      pathMat,
      Math.sin(ang) * 6.5,
      0.12,
      Math.cos(ang) * 6.5,
      false
    )
    spoke.rotation.y = ang
    root.add(spoke)
  }

  // Central + secondary fountains
  const waterMain = addFountain(root, 0, 0, 1.35)
  const waterSide = addFountain(root, 5.5, 6.2, 0.95)

  // Hedge ribbons along mid ring
  for (let i = 0; i < 16; i++) {
    if (i % 2 === 0) continue
    const ang = (i / 16) * Math.PI * 2
    addHedge(root, Math.sin(ang) * 5.4, Math.cos(ang) * 5.4, 1.4, 0.35, 0.48)
  }

  // Lamp posts
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2
    const lx = Math.sin(ang) * 7.35
    const lz = Math.cos(ang) * 7.35
    root.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.0, 6), M(PALETTE.metal), lx, 1.0, lz, false))
    root.add(
      mesh(
        new THREE.SphereGeometry(0.13, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0xffe6a8, emissive: 0xffd27a, emissiveIntensity: 0.55 }),
        lx,
        2.05,
        lz,
        false
      )
    )
  }

  // Tree clusters (Concept C density)
  const treeSpots: [number, number, number][] = []
  for (let i = 0; i < 70; i++) {
    const ang = (i / 70) * Math.PI * 2 + (i % 3) * 0.07
    const r = 4.8 + (i % 5) * 2.4 + (i % 2) * 0.35
    treeSpots.push([Math.sin(ang) * r, Math.cos(ang) * r, 0.65 + (i % 4) * 0.12])
  }
  // Extra grove pockets
  for (const [x, z] of [
    [-14, -2],
    [-13, 3],
    [14, 1],
    [12, 8],
    [-6, -14],
    [6, -14],
    [-12, 12],
  ] as const) {
    treeSpots.push([x, z, 0.9], [x + 1.2, z + 0.8, 0.7], [x - 0.9, z + 1.1, 0.75])
  }
  for (const [x, z, s] of treeSpots) {
    // keep plaza open
    if (Math.hypot(x, z) < 3.8) continue
    addTree(root, x, z, s)
  }

  // Decorative dorm cluster (residential zone)
  for (const [dx, dz, rot] of [
    [-9.5, 11.5, 0.2],
    [-6.8, 12.8, -0.15],
    [-4.0, 11.2, 0.1],
  ] as const) {
    const deco = new THREE.Group()
    deco.add(mesh(new THREE.BoxGeometry(2.5, 3.5, 2.1), M(PALETTE.sand), 0, 1.75, 0))
    const roof = hipRoofBox(2.8, 2.4, 0.75, PALETTE.terra)
    roof.position.y = 3.75
    deco.add(roof)
    deco.position.set(dx, 0, dz)
    deco.rotation.y = rot
    root.add(deco)
  }

  // Courtyard academic wing (non-interactive filler for density)
  {
    const wing = new THREE.Group()
    wing.add(mesh(new THREE.BoxGeometry(6.5, 2.2, 2.4), M(PALETTE.sand), 0, 1.1, 0))
    wing.add(mesh(new THREE.BoxGeometry(2.4, 2.2, 5.0), M(PALETTE.sand), -2.0, 1.1, 1.3))
    const r1 = pitchedRoof(6.8, 2.7, 0.7, PALETTE.terraDeep)
    r1.position.y = 2.25
    wing.add(r1)
    wing.position.set(11.5, 0, -2.5)
    root.add(wing)
  }

  CAMPUS_BUILDINGS.forEach((b, i) => {
    let g: THREE.Group
    switch (b.style) {
      case "tower":
        g = buildTower(b)
        break
      case "neoclassical":
        g = buildNeoclassical(b)
        break
      case "modern":
        g = buildModern(b)
        break
      case "cafe":
        g = buildCafe(b)
        break
      case "brick":
        g = buildSandstoneBlock(b, 3.5, 4.5, 2.7, PALETTE.terra, 3)
        break
      case "limestone":
      default:
        g = buildSandstoneBlock(b, 5.1, 3.4, 3.9, PALETTE.terraDeep, 3)
        break
    }
    const pin = numberPin(i + 1, b.id)
    const pinY = b.style === "tower" ? 7.4 : b.style === "brick" ? 4.4 : 3.5
    pin.position.y = pinY
    g.add(pin)
    root.add(g)
    meshById.set(b.id, g)
  })

  // Tiny people for life
  const people: THREE.Group[] = []
  const colors = [0x1e3a5f, 0xc45c26, 0x2f6f4e, 0x5b4d9a, 0xb33b5a, 0xffffff]
  for (let i = 0; i < 10; i++) {
    const p = new THREE.Group()
    p.add(
      mesh(new THREE.CapsuleGeometry(0.11, 0.22, 3, 6), M(colors[i % colors.length], 0.5), 0, 0.38, 0)
    )
    const ang = (i / 10) * Math.PI * 2
    p.position.set(Math.sin(ang) * 4.5, 0, Math.cos(ang) * 4.5)
    root.add(p)
    people.push(p)
  }

  // Prefer main fountain for gentle animation
  const water = waterMain
  void waterSide

  return { meshById, people, water }
}

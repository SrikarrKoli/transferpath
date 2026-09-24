"use client"

/**
 * TransferPath campus: limestone arcades, clay roofs, and botanical courts.
 * Ground follows the cream-and-ink dossier palette rather than game-board turf.
 */

import * as THREE from "three"
import { CAMPUS_BUILDINGS, type BuildingId } from "./campus-data"
import { buildLandmark } from "./campus-landmarks"
import { C, bench, lambert, mesh, toyTree } from "./campus-kit"
import { uniquifyMaterials } from "./campus-models"

function holdPlant(i: number) {
  return lambert([0x607451, 0x72805b, 0x4d674e][i % 3], { flatShading: true })
}

function tag(obj: THREE.Object3D, id: BuildingId) {
  obj.userData.buildingId = id
  obj.traverse((c) => {
    c.userData.buildingId = id
  })
}

export function buildCampusWorld(root: THREE.Group) {
  const meshById = new Map<BuildingId, THREE.Group>()
  const city = new THREE.Group()
  root.add(city)
  // A single landscape texture, extending to the horizon. Selection never touches it.
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 2048
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#b6c9ac"; ctx.fillRect(0, 0, 2048, 2048)
  const scale = 64, origin = 1024
  const rect = (x: number, z: number, w: number, d: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(origin + (x - w / 2) * scale, origin + (z - d / 2) * scale, w * scale, d * scale)
  }
  // Bounded garden walks connect the court; open lawn frames the architecture.
  rect(0, 0.8, 10.6, 0.32, "#d2d0b7")
  rect(-2.5, 0.1, 0.28, 9.7, "#d2d0b7")
  rect(2.5, 0.1, 0.28, 9.7, "#d2d0b7")
  rect(0, 4.95, 10.6, 0.3, "#d2d0b7")
  rect(0, -4.8, 10.6, 0.3, "#d2d0b7")
  // Clock court is a limestone oval, not a selection surface.
  ctx.fillStyle = "#d9d3b9"
  ctx.beginPath(); ctx.ellipse(origin, origin - 0.2 * scale, 1.35 * scale, 1.5 * scale, 0, 0, Math.PI * 2); ctx.fill()
  for (const b of CAMPUS_BUILDINGS) rect(b.x, b.z + 0.4, b.id === "library" ? 4.5 : 2.8, 2.5, "#d9d3b9")
  let seed = 83
  for (let i = 0; i < 125000; i++) {
    seed = (seed * 16807) % 2147483647; const x = seed % 2048
    seed = (seed * 16807) % 2147483647; const y = seed % 2048
    ctx.fillStyle = i % 2 ? "#ffffff12" : "#43573d0c"; ctx.fillRect(x, y, 1, 1)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const ground = mesh(new THREE.PlaneGeometry(32, 32), new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }), 0, 0, 0, false)
  ground.rotation.x = -Math.PI / 2
  root.add(ground)
  const beyond = mesh(new THREE.PlaneGeometry(180, 180), lambert(0xb6c9ac), 0, -0.015, 0, false)
  beyond.rotation.x = -Math.PI / 2; root.add(beyond)
  for (const [x, z, w] of [[-4.3, -4.1, 2.9], [4.5, -2.4, 2.4], [-4.1, 2.55, 1.7], [0, 5.6, 3.4]]) {
    // Limestone-edged beds echo the stepped building plinths.
    city.add(mesh(new THREE.BoxGeometry(w, 0.075, 0.48), lambert(C.creamDeep), x, 0.04, z, false))
    city.add(mesh(new THREE.BoxGeometry(w - 0.12, 0.035, 0.34), lambert(0x777a5b), x, 0.09, z, false))
    for (let i = 0; i < Math.floor(w / 0.39); i++) {
      const px = x - w / 2 + 0.24 + i * 0.39
      const h = 0.19 + (i % 3) * 0.065
      const shrub = mesh(new THREE.DodecahedronGeometry(0.23, 0), holdPlant(i), px, 0.13 + h / 2, z + Math.sin(i * 2.4) * 0.045)
      shrub.scale.set(1.1, h / 0.3, 0.72)
      shrub.rotation.y = i * 0.73
      city.add(shrub)
    }
  }

  const placeLandmark = (id: BuildingId) => {
    const meta = CAMPUS_BUILDINGS.find((b) => b.id === id)!
    const g = new THREE.Group()
    g.position.set(meta.x, 0, meta.z)
    const hall = buildLandmark(id)
    if (id === "library") hall.scale.set(1, 1, 1)
    else if (id === "dorm") hall.scale.y = 0.8
    else if (id === "gym") hall.scale.y = 0.8
    else if (id !== "quad") hall.scale.y = 0.9
    const box = new THREE.Box3().setFromObject(hall)
    g.add(hall)
    uniquifyMaterials(g)
    tag(g, id)

    // Invisible pick volume — keeps directory/map lockstep honest when props crowd the facade.
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(size.x, 1.1) * 1.08, Math.max(size.y, 1.4) * 1.05, Math.max(size.z, 1.1) * 1.08),
      new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0, depthWrite: false }),
    )
    hit.position.copy(center)
    g.userData.bounds = box.clone()
    g.userData.footprint = { x: center.x, z: center.z, width: size.x + 0.45, depth: size.z + 0.45 }
    hit.userData.buildingId = id
    hit.userData.isHitVolume = true
    g.add(hit)
    city.add(g)
    meshById.set(id, g)
    return g
  }

  CAMPUS_BUILDINGS.forEach((b) => placeLandmark(b.id))

  // Cypress, live oak, and pecan silhouettes placed at irregular court edges.
  ;[[-5.8, 2.8], [-3.5, 3.65], [5.25, -2.45], [-5.5, -3.5], [-0.3, -4.6], [5.5, 4.1], [3.1, -3.8]].forEach(([x, z], i) => {
    city.add(toyTree(x, z, i))
  })
  city.add(bench(lambert(C.creamDeep), -1.3, 1.45, 0))
  city.add(bench(lambert(C.creamDeep), 1.3, 1.45, 0))
  return { meshById, people: [] as THREE.Group[] }
}

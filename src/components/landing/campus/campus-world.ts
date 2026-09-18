"use client"

/**
 * TransferPath campus: authored landmark halls + sparse Kenney CC0 life/props.
 * Ground follows the cream-and-ink dossier palette rather than game-board turf.
 */

import * as THREE from "three"
import { CAMPUS_BUILDINGS, type BuildingId } from "./campus-data"
import { buildLandmark } from "./campus-landmarks"
import { C, bench, lambert, mesh, toyTree } from "./campus-kit"
import { uniquifyMaterials } from "./campus-models"

function tag(obj: THREE.Object3D, id: BuildingId) {
  obj.userData.buildingId = id
  obj.traverse((c) => {
    c.userData.buildingId = id
  })
}

export function buildCampusWorld(root: THREE.Group) {
  const meshById = new Map<BuildingId, THREE.Group>()
  // One continuous terrain surface; paths are flush inlays, never stacked slabs.
  const ground = mesh(new THREE.PlaneGeometry(180, 180), lambert(0xc8bea4), 0, 0, 0, false)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  root.add(ground)
  const city = new THREE.Group()
  root.add(city)
  // One drawn landscape surface: aggregate, lawn courts, joined walks and plaza.
  const canvas = document.createElement("canvas")
  canvas.width = 1536; canvas.height = 1152
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#aaa98b"; ctx.fillRect(0, 0, 1536, 1152)
  const rect = (x: number, z: number, w: number, d: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect((x - w / 2 + 8) * 96, (z - d / 2 + 6) * 96, w * 96, d * 96)
  }
  rect(0, 0.8, 14.8, 1.15, "#d9cfb6")
  rect(-2.5, 0, 0.85, 10.8, "#d9cfb6")
  rect(2.5, 0, 0.85, 10.8, "#d9cfb6")
  rect(0, 0.3, 3.8, 3.15, "#c6b998")
  rect(0, 4.9, 14.8, 0.7, "#d9cfb6")
  rect(0, -4.9, 14.8, 0.7, "#d9cfb6")
  rect(-6.8, 0, 0.7, 10.5, "#d9cfb6")
  rect(6.8, 0, 0.7, 10.5, "#d9cfb6")
  ctx.strokeStyle = "#827c6240"; ctx.lineWidth = 1
  for (let i = 0; i < 1536; i += 32) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1152); ctx.stroke() }
  for (let i = 0; i < 1152; i += 32) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1536, i); ctx.stroke() }
  let seed = 83
  for (let i = 0; i < 95000; i++) {
    seed = (seed * 16807) % 2147483647; const x = seed % 1536
    seed = (seed * 16807) % 2147483647; const y = seed % 1152
    ctx.fillStyle = i % 2 ? "#fff6da13" : "#494c3c12"; ctx.fillRect(x, y, 1.5, 1.5)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  // Continue the paving texture beyond the campus court to every viewport edge.
  const paving = document.createElement("canvas")
  paving.width = paving.height = 512
  const pavingContext = paving.getContext("2d")!
  pavingContext.fillStyle = "#b6b29b"
  pavingContext.fillRect(0, 0, 512, 512)
  pavingContext.strokeStyle = "#8b86682b"
  pavingContext.lineWidth = 1
  for (let i = 0; i <= 512; i += 32) {
    pavingContext.beginPath(); pavingContext.moveTo(i, 0); pavingContext.lineTo(i, 512); pavingContext.stroke()
    pavingContext.beginPath(); pavingContext.moveTo(0, i); pavingContext.lineTo(512, i); pavingContext.stroke()
  }
  const surrounding = new THREE.CanvasTexture(paving)
  surrounding.colorSpace = THREE.SRGBColorSpace
  surrounding.anisotropy = 8
  surrounding.wrapS = surrounding.wrapT = THREE.RepeatWrapping
  surrounding.repeat.set(33.75, 33.75)
  ground.material = new THREE.MeshStandardMaterial({ map: surrounding, color: 0xd0c8b5, roughness: 1 })
  const plate = mesh(new THREE.PlaneGeometry(16, 12), new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }), 0, 0.01, 0, false)
  plate.rotation.x = -Math.PI / 2
  city.add(plate)

  const placeLandmark = (id: BuildingId) => {
    const meta = CAMPUS_BUILDINGS.find((b) => b.id === id)!
    const g = new THREE.Group()
    g.position.set(meta.x, 0, meta.z)
    const hall = buildLandmark(id)
    if (id === "library") hall.scale.set(1, 1, 1)
    else if (id === "dorm") hall.scale.y = 0.8
    else if (id === "gym") hall.scale.y = 0.8
    else if (id !== "quad") hall.scale.y = 0.9
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
    hit.position.copy(center)
    g.userData.footprint = { x: center.x, z: center.z, width: size.x + 0.45, depth: size.z + 0.45 }
    const footprint = g.userData.footprint
    const halo = new THREE.Group()
    const bronze = new THREE.MeshBasicMaterial({ color: 0xb48b47, transparent: true, opacity: 0.95 })
    const w = footprint.width, d = footprint.depth
    for (const z of [-d / 2, d / 2]) halo.add(mesh(new THREE.BoxGeometry(w, 0.025, 0.065), bronze, 0, 0, z, false))
    for (const x of [-w / 2, w / 2]) halo.add(mesh(new THREE.BoxGeometry(0.065, 0.025, d), bronze, x, 0, 0, false))
    const wash = mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: 0xffcf77, transparent: true, opacity: 0.20, depthWrite: false }), 0, -0.01, 0, false)
    wash.rotation.x = -Math.PI / 2
    halo.add(wash)
    halo.position.set(meta.x + center.x, 0.045, meta.z + center.z)
    halo.visible = false
    city.add(halo)
    g.userData.halo = halo
    hit.userData.buildingId = id
    hit.userData.isHitVolume = true
    g.add(hit)
    city.add(g)
    meshById.set(id, g)
    return g
  }

  CAMPUS_BUILDINGS.forEach((b) => placeLandmark(b.id))

  // Seven individually varied angular live oaks.
  ;[[-5.8, 2.8], [-3.0, 3.8], [5.7, -2.3], [-6, -3.8], [-0.3, -4.6], [5.9, 4.2], [3.1, -3.8]].forEach(([x, z], i) => {
    city.add(toyTree(x, z, i))
  })
  city.add(bench(lambert(C.creamDeep), -1.3, 1.45, 0))
  city.add(bench(lambert(C.creamDeep), 1.3, 1.45, 0))
  return { meshById, people: [] as THREE.Group[] }
}

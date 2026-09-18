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
  const inlay = (x: number, z: number, w: number, d: number, color: number) => {
    const surface = mesh(new THREE.PlaneGeometry(w, d), lambert(color), x, 0.008, z, false)
    surface.rotation.x = -Math.PI / 2
    surface.receiveShadow = true
    city.add(surface)
  }
  inlay(0, 0.8, 11.8, 0.8, 0xe3d9c3)
  inlay(-2.5, 0.7, 0.7, 8.4, 0xe3d9c3)
  inlay(2.5, 0.7, 0.7, 8.4, 0xe3d9c3)
  inlay(0, 2.1, 4.4, 1.5, 0xe3d9c3)
  inlay(0, 0.8, 2.8, 1.6, 0xa0a087)

  const placeLandmark = (id: BuildingId) => {
    const meta = CAMPUS_BUILDINGS.find((b) => b.id === id)!
    const g = new THREE.Group()
    g.position.set(meta.x, 0, meta.z)
    const hall = buildLandmark(id)
    if (id === "library") hall.scale.set(1.04, 1.15, 1.04)
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
    hit.userData.buildingId = id
    hit.userData.isHitVolume = true
    g.add(hit)
    city.add(g)
    meshById.set(id, g)
    return g
  }

  CAMPUS_BUILDINGS.forEach((b) => placeLandmark(b.id))

  // Sparse, pointed cypress silhouettes frame the architecture.
  ;[[-5.4, 2.4], [-3.0, 3.5], [5.7, -2.3], [3.0, -3.1]].forEach(([x, z], i) => {
    city.add(toyTree(x, z, i * 3))
  })
  city.add(bench(lambert(C.creamDeep), -1.3, 1.45, 0))
  city.add(bench(lambert(C.creamDeep), 1.3, 1.45, 0))
  return { meshById, people: [] as THREE.Group[] }
}

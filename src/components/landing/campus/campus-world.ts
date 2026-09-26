"use client"

/**
 * TransferPath campus: limestone arcades, clay roofs, and botanical courts.
 * Ground follows the cream-and-ink dossier palette rather than game-board turf.
 */

import * as THREE from "three"
import { CAMPUS_BUILDINGS, type BuildingId } from "./campus-data"
import { buildLandmark, PIN_Y } from "./campus-landmarks"
import { C, bench, lambert, mesh, toyTree, campusGate, bannerLamp, reflectingBasin, hold } from "./campus-kit"
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
  // Open the courts enough for a readable engraved apron in front of each hall.
  const positions: Record<BuildingId, [number, number]> = { quad: [.5,-2.3], counselor: [2.8,-6.7], library: [.3,4], classroom: [-9.5,-2.5], registrar: [8.1,-1.2], dorm: [-6.35,-3.8], gym: [5,3.2], union: [-4.9,5.6] }
  const buildings = CAMPUS_BUILDINGS.map(b => ({...b, x: positions[b.id][0], z: positions[b.id][1]}))
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
  rect(.6, .8, 15.8, .24, "#d2d0b7")
  rect(-2, .1, .24, 10.4, "#d2d0b7")
  rect(3, .8, .24, 11.8, "#d2d0b7")
  rect(.5, -6.1, 15.2, .24, "#d2d0b7")
  rect(5.5, 1.8, 5, .24, "#d2d0b7")
  for (const b of buildings) {
    const edge = b.x < 0 ? -2 : 3
    rect((b.x + edge) / 2, b.z, Math.abs(b.x - edge), .24, "#d2d0b7")
  }
  // Clock court is a limestone oval, not a selection surface.
  ctx.fillStyle = "#d9d3b9"
  ctx.beginPath(); ctx.ellipse(origin + .5 * scale, origin - 2.3 * scale, 1.35 * scale, 1.5 * scale, 0, 0, Math.PI * 2); ctx.fill()
  for (const b of buildings) rect(b.x, b.z + 0.4, b.id === "library" ? 4.5 : 2.8, 2.5, "#d9d3b9")
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
  const beyond = mesh(new THREE.PlaneGeometry(180, 180), hold(0xb6c9ac), 0, -0.015, 0, false)
  beyond.rotation.x = -Math.PI / 2; root.add(beyond)
  for (const [x, z, w] of [[-5.35, -4.5, 2.9], [2.5, -7.5, 2.4], [-5.9, 7.25, 1.7], [-1.8, 6.85, 2.1]]) {
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
    const meta = buildings.find((b) => b.id === id)!
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
    g.userData.pin = new THREE.Vector3(id === "dorm" ? .79 : id === "library" ? .15 : 0, PIN_Y[id] * hall.scale.y, 0)
    if (id === "classroom") g.userData.pin.set(-.65, 2.35, 0)
    if (id === "registrar") g.userData.pin.set(.1, 2.55, .1)
    g.userData.label = new THREE.Vector3(meta.x + center.x, .02, meta.z + box.max.z + .38)
    const labelOffsets: Partial<Record<BuildingId, [number, number]>> = { quad: [.8,-.2], counselor: [1.2,.9], classroom: [1,.95], library: [1,1.1], registrar: [1.1,1], union: [1,1], dorm: [.9,.95], gym: [.6,.65] }
    const offset = labelOffsets[id]
    if (offset) { g.userData.label.x += offset[0]; g.userData.label.z += offset[1] }
    g.userData.bounds = box.clone()
    // Measure the base, excluding roofs and other elevated overhangs.
    const base = new THREE.Box3()
    hall.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      const bounds = new THREE.Box3().setFromObject(child, true)
      if (bounds.min.y < .25) base.union(bounds)
    })
    const baseSize = base.getSize(new THREE.Vector3())
    const baseCenter = base.getCenter(new THREE.Vector3())
    g.userData.footprint = { x: baseCenter.x, z: baseCenter.z, width: baseSize.x + .2, depth: baseSize.z + .2 }
    hit.userData.buildingId = id
    hit.userData.isHitVolume = true
    g.add(hit)
    city.add(g)
    meshById.set(id, g)
    return g
  }

  CAMPUS_BUILDINGS.forEach((b) => placeLandmark(b.id))

  // Cypress, live oak, and pecan silhouettes placed at irregular court edges.
  ;[[-5.5, 7.5], [-5.9, 8.8], [3.25, -7.55], [-6.55, -3.9], [-4.8, -3.5], [9.9, -.1], [1.1, -8.9]].forEach(([x, z], i) => {
    city.add(toyTree(x, z, i))
  })
  const gate = campusGate(); gate.position.set(8, 0, 1.8); gate.rotation.y = .45; city.add(gate)
  const basin = reflectingBasin(); basin.position.set(2, 0, .2); city.add(basin)
  ;[[-3.8, -1.7], [5.1, -4.1], [4, .9]].forEach(([x,z], i) => city.add(bannerLamp(x,z,i)))
  for (const [x,z] of [[6.4, 4.2], [9.4, -1.5], [-4.6, 8]]) {
    city.add(mesh(new THREE.BoxGeometry(.75,.08,.36), hold(C.creamDeep),x,.04,z,false))
    for(let i=0;i<9;i++) city.add(mesh(new THREE.DodecahedronGeometry(.07,0),hold([0xb7796e,0xd4b8a0,0x9d655b][i%3]),x-.3+(i%5)*.14,.16+(i%2)*.04,z+(i>4?.1:-.08)))
  }
  city.add(bench(lambert(C.creamDeep), 3, .4, 0))
  city.add(bench(lambert(C.creamDeep), 2, 1.5, 0))
  return { meshById, obstacles: city.children.filter(child => !child.userData.buildingId), people: [] as THREE.Group[] }
}

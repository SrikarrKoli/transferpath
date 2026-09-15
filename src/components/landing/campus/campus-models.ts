"use client"

import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

export type KitLibrary = Map<string, THREE.Group>

/** Kenney life/props only — landmark halls are custom meshes. */
const FILES: Record<string, string[]> = {
  castle: ["flag", "flag-wide", "stairs-stone", "bridge-straight", "rocks-small"],
  commercial: ["detail-awning-wide", "detail-parasol-a", "detail-parasol-b"],
  suburban: ["planter"],
  roads: ["light-square", "light-curved"],
  cars: ["sedan", "suv", "taxi", "hatchback-sports"],
  people: [
    "character-male-a",
    "character-male-b",
    "character-male-c",
    "character-male-d",
    "character-female-a",
    "character-female-b",
    "character-female-c",
    "character-female-d",
  ],
  nature: [
    "tree_palm",
    "tree_palmShort",
    "plant_bushLarge",
    "plant_bush",
    "rock_largeB",
    "flower_purpleA",
    "flower_yellowA",
  ],
}

export const CAMPUS_MODEL_URLS: { key: string; url: string }[] = Object.entries(FILES).flatMap(([kit, names]) =>
  names.map((name) => ({
    key: `${kit}/${name}`,
    url: `/campus/models/${kit}/${name}.glb`,
  }))
)

function preparePrototype(root: THREE.Object3D) {
  root.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      c.castShadow = true
      c.receiveShadow = true
      const list = Array.isArray(c.material) ? c.material : [c.material]
      const next = list.map((m) => {
        if (!(m instanceof THREE.MeshStandardMaterial)) return m
        const l = new THREE.MeshLambertMaterial({
          map: m.map,
          color: m.color.clone(),
          transparent: m.transparent,
          opacity: m.opacity,
          vertexColors: m.vertexColors,
          alphaTest: m.alphaTest,
        })
        l.emissive = new THREE.Color(0x1c160e)
        l.emissiveIntensity = 0.05
        m.dispose()
        return l
      })
      c.material = Array.isArray(c.material) ? next : next[0]
    }
  })
}

export async function loadCampusLibrary(onProgress?: (done: number, total: number) => void): Promise<KitLibrary> {
  const loader = new GLTFLoader()
  const lib: KitLibrary = new Map()
  let done = 0
  const total = CAMPUS_MODEL_URLS.length
  await Promise.all(
    CAMPUS_MODEL_URLS.map(async ({ key, url }) => {
      const gltf = await loader.loadAsync(url)
      const g = gltf.scene
      preparePrototype(g)
      lib.set(key, g)
      done += 1
      onProgress?.(done, total)
    })
  )
  return lib
}

export function uniquifyMaterials(obj: THREE.Object3D) {
  obj.traverse((c) => {
    if (!(c instanceof THREE.Mesh)) return
    const list = Array.isArray(c.material) ? c.material : [c.material]
    const cloned = list.map((m) => {
      const n = m.clone()
      if (n instanceof THREE.MeshStandardMaterial || n instanceof THREE.MeshLambertMaterial) {
        n.userData._baseEmissive = n.emissive.clone()
        n.userData._baseIntensity = n.emissiveIntensity
      }
      return n
    })
    c.material = Array.isArray(c.material) ? cloned : cloned[0]
  })
}

export function stamp(
  lib: KitLibrary,
  key: string,
  x: number,
  z: number,
  rotY = 0,
  scale = 1,
  shadow = true
): THREE.Group {
  const proto = lib.get(key)
  if (!proto) {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    return g
  }
  const g = proto.clone(true)
  g.position.set(x, 0, z)
  g.rotation.y = rotY
  if (scale !== 1) g.scale.setScalar(scale)
  g.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(g)
  if (Number.isFinite(box.min.y)) g.position.y -= box.min.y
  const size = new THREE.Vector3()
  box.getSize(size)
  const isFoliage = /tree|plant|flower|path|bush/i.test(key)
  if (shadow && !isFoliage) {
    const shadowR = Math.max(0.28, Math.min(1.25, Math.max(size.x, size.z) * 0.42))
    const blob = new THREE.Mesh(
      new THREE.CircleGeometry(shadowR, 20),
      new THREE.MeshBasicMaterial({ color: 0x1e2c10, transparent: true, opacity: 0.42, depthWrite: false })
    )
    blob.rotation.x = -Math.PI / 2
    blob.scale.set(1.15, 1.85, 1)
    blob.position.set(0.18, 0.014, -0.22)
    blob.receiveShadow = false
    blob.castShadow = false
    g.add(blob)
  }
  return g
}

export function stampAt(
  lib: KitLibrary,
  key: string,
  x: number,
  y: number,
  z: number,
  rotY = 0,
  scale = 1,
  shadow = true
): THREE.Group {
  const g = stamp(lib, key, x, z, rotY, scale, shadow)
  g.position.y += y
  return g
}

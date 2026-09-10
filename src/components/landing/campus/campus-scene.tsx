"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { CAMPUS_BUILDINGS, type BuildingId } from "./campus-data"
import { buildCampusWorld } from "./campus-world"

type Props = {
  selected: BuildingId | null
  hovered: BuildingId | null
  focusToken: number
  onHover: (id: BuildingId | null) => void
  onSelect: (id: BuildingId) => void
  onEnter: (id: BuildingId) => void
}

/** Concept C camera: readable isometric diorama, gentle orbit. */
export function CampusScene({
  selected,
  hovered,
  focusToken,
  onHover,
  onSelect,
  onEnter,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef(selected)
  const hoveredRef = useRef(hovered)
  const focusTokenRef = useRef(focusToken)
  const onHoverRef = useRef(onHover)
  const onSelectRef = useRef(onSelect)
  const onEnterRef = useRef(onEnter)
  selectedRef.current = selected
  hoveredRef.current = hovered
  focusTokenRef.current = focusToken
  onHoverRef.current = onHover
  onSelectRef.current = onSelect
  onEnterRef.current = onEnter
  const lastClickRef = useRef<{ id: BuildingId | null; t: number }>({ id: null, t: 0 })

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const w0 = mount.clientWidth || 960
    const h0 = mount.clientHeight || 640
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(w0, h0)
    renderer.setClearColor(0xf4f1ea, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()

    // Near-isometric orthographic for map/diorama read (Concept C)
    const aspect = w0 / h0
    const frustum = 16
    const camera = new THREE.OrthographicCamera(
      (-frustum * aspect) / 1,
      (frustum * aspect) / 1,
      frustum,
      -frustum,
      0.1,
      200
    )
    const orbit = { theta: Math.PI / 4.15, phi: 0.68, radius: 36 }
    const look = new THREE.Vector3(0, 0.2, 0)
    const lookGoal = new THREE.Vector3(0, 0.2, 0)
    const radiusGoal = { v: 36 }

    scene.add(new THREE.AmbientLight(0xfff4e6, 0.55))
    const sun = new THREE.DirectionalLight(0xffe2bf, 1.95)
    sun.position.set(-26, 34, 10) // stronger raking light
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -42
    sun.shadow.camera.right = 42
    sun.shadow.camera.top = 42
    sun.shadow.camera.bottom = -42
    sun.shadow.bias = -0.0002
    sun.shadow.normalBias = 0.04
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xcfe4ff, 0.28)
    fill.position.set(18, 8, -10)
    scene.add(fill)
    scene.add(new THREE.HemisphereLight(0xfff0d8, 0x6a7a58, 0.4))

    const root = new THREE.Group()
    scene.add(root)
    const { meshById, people, water } = buildCampusWorld(root)

    const applyCam = () => {
      camera.position.set(
        look.x + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta),
        look.y + orbit.radius * Math.cos(orbit.phi),
        look.z + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta)
      )
      camera.lookAt(look)
      const a = mount.clientWidth / mount.clientHeight
      const f = orbit.radius * 0.32
      camera.left = -f * a
      camera.right = f * a
      camera.top = f
      camera.bottom = -f
      camera.updateProjectionMatrix()
    }

    const focusBuilding = (id: BuildingId) => {
      const b = CAMPUS_BUILDINGS.find((x) => x.id === id)
      if (!b) return
      lookGoal.set(b.x * 0.35, 0.6, b.z * 0.35)
      radiusGoal.v = id === "quad" ? 34 : 26
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let dragging = false
    let lastX = 0
    let lastFocusToken = focusToken

    const setPointer = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    const pick = (): BuildingId | null => {
      raycaster.setFromCamera(pointer, camera)
      for (const hit of raycaster.intersectObjects(root.children, true)) {
        let o: THREE.Object3D | null = hit.object
        while (o) {
          const id = o.userData.buildingId as BuildingId | undefined
          if (id && meshById.has(id)) return id
          o = o.parent
        }
      }
      return null
    }

    const onMove = (e: PointerEvent) => {
      setPointer(e)
      if (dragging) {
        orbit.theta -= (e.clientX - lastX) * 0.004
        lastX = e.clientX
        return
      }
      const id = pick()
      if (id !== hoveredRef.current) onHoverRef.current(id)
      mount.style.cursor = id ? "pointer" : "grab"
    }
    const onDown = (e: PointerEvent) => {
      setPointer(e)
      lastX = e.clientX
      const id = pick()
      if (id) {
        const now = performance.now()
        onSelectRef.current(id)
        focusBuilding(id)
        if (lastClickRef.current.id === id && now - lastClickRef.current.t < 420) {
          onEnterRef.current(id)
        }
        lastClickRef.current = { id, t: now }
      } else {
        dragging = true
        mount.setPointerCapture(e.pointerId)
        mount.style.cursor = "grabbing"
      }
    }
    const onUp = (e: PointerEvent) => {
      dragging = false
      try {
        mount.releasePointerCapture(e.pointerId)
      } catch {
        /* */
      }
      mount.style.cursor = "grab"
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      radiusGoal.v = THREE.MathUtils.clamp(radiusGoal.v + e.deltaY * 0.03, 18, 48)
    }

    mount.addEventListener("pointermove", onMove)
    mount.addEventListener("pointerdown", onDown)
    mount.addEventListener("pointerup", onUp)
    mount.addEventListener("wheel", onWheel, { passive: false })

    if (selectedRef.current) focusBuilding(selectedRef.current)

    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = (now - t0) / 1000
      if (focusTokenRef.current !== lastFocusToken) {
        lastFocusToken = focusTokenRef.current
        if (selectedRef.current) focusBuilding(selectedRef.current)
      }
      look.lerp(lookGoal, reduced ? 1 : 0.06)
      orbit.radius = THREE.MathUtils.lerp(orbit.radius, radiusGoal.v, 0.08)
      if (!reduced && !dragging) orbit.theta += 0.0002
      applyCam()

      if (!reduced) {
        water.rotation.y = t * 0.12
        people.forEach((p, i) => {
          const a = t * 0.22 + i * 0.8
          p.position.x = Math.sin(a) * 4.0
          p.position.z = Math.cos(a) * 4.0
        })
      }

      for (const [id, g] of meshById) {
        const on = selectedRef.current === id || hoveredRef.current === id
        g.position.y = THREE.MathUtils.lerp(g.position.y, on ? 0.28 : 0, 0.12)
        g.traverse((c) => {
          if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshStandardMaterial) {
            if (!c.userData._baseEmissive) {
              c.userData._baseEmissive = c.material.emissive.clone()
              c.userData._baseIntensity = c.material.emissiveIntensity
            }
            if (on) {
              c.material.emissive.setHex(0xb85c38)
              c.material.emissiveIntensity = 0.12
            } else {
              c.material.emissive.copy(c.userData._baseEmissive)
              c.material.emissiveIntensity = c.userData._baseIntensity
            }
          }
          if (c.userData.isPinSprite && c instanceof THREE.Sprite) {
            const mat = c.material as THREE.SpriteMaterial
            const next = on ? c.userData.texActive : c.userData.texIdle
            if (next && mat.map !== next) {
              mat.map = next
              mat.needsUpdate = true
            }
            mat.opacity = 1
            c.scale.setScalar(on ? 3.1 : 2.6)
          }
        })
      }

      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const onResize = () => {
      applyCam()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      mount.removeEventListener("pointermove", onMove)
      mount.removeEventListener("pointerdown", onDown)
      mount.removeEventListener("pointerup", onUp)
      mount.removeEventListener("wheel", onWheel)
      renderer.dispose()
      mount.replaceChildren()
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 touch-none" />
}

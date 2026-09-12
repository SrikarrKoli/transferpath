"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { CAMPUS_BUILDINGS, type BuildingId } from "./campus-data"
import { loadCampusLibrary } from "./campus-models"
import { buildCampusWorld } from "./campus-world"

type Props = {
  selected: BuildingId | null
  hovered: BuildingId | null
  focusToken: number
  onHover: (id: BuildingId | null) => void
  onSelect: (id: BuildingId) => void
  onEnter: (id: BuildingId) => void
}

export function CampusScene({ selected, hovered, focusToken, onHover, onSelect, onEnter }: Props) {
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
  const [status, setStatus] = useState("Building campus…")

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let cancelled = false
    let raf = 0
    let renderer: THREE.WebGLRenderer | undefined
    let pmrem: THREE.PMREMGenerator | undefined

    const w0 = mount.clientWidth || 960
    const h0 = mount.clientHeight || 640
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(w0, h0)
    renderer.setClearColor(0xa8d8e6, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ReinhardToneMapping
    renderer.toneMappingExposure = 1.12
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0xb2dce8, 48, 86)
    pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.08).texture

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 240)
    const orbit = { theta: Math.PI / 3.15, phi: 0.88, radius: 20.4 }
    const look = new THREE.Vector3(0.15, 0.55, 0.55)
    const lookGoal = look.clone()
    const radiusGoal = { v: 19.2 }

    scene.add(new THREE.AmbientLight(0xfff4e6, 0.92))
    scene.add(new THREE.HemisphereLight(0xf4fbff, 0xd4b07a, 0.62))
    const sun = new THREE.DirectionalLight(0xfff3dc, 1.85)
    sun.position.set(-14, 22, 12)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -16
    sun.shadow.camera.right = 16
    sun.shadow.camera.top = 16
    sun.shadow.camera.bottom = -16
    sun.shadow.bias = -0.00018
    sun.shadow.normalBias = 0.02
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xb7d4f0, 0.48)
    fill.position.set(20, 9, -14)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xfff7ee, 0.55)
    rim.position.set(4, 12, 18)
    scene.add(rim)

    const root = new THREE.Group()
    scene.add(root)

    const applyCam = () => {
      camera.position.set(
        look.x + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta),
        look.y + orbit.radius * Math.cos(orbit.phi),
        look.z + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta)
      )
      camera.lookAt(look)
      const a = mount.clientWidth / Math.max(1, mount.clientHeight)
      const f = orbit.radius * 0.3
      camera.left = -f * a
      camera.right = f * a
      camera.top = f
      camera.bottom = -f
      camera.updateProjectionMatrix()
    }

    const focusBuilding = (id: BuildingId) => {
      const b = CAMPUS_BUILDINGS.find((x) => x.id === id)
      if (!b) return
      lookGoal.set(b.x * 0.9, 0.85, b.z * 0.9)
      radiusGoal.v = 22
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let dragging = false
    let panning = false
    let lastX = 0
    let lastY = 0
    let lastFocusToken = focusToken
    let meshById = new Map<BuildingId, THREE.Group>()
    let people: THREE.Group[] = []
    let water: THREE.Object3D | undefined

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
      if (panning) {
        const dx = e.clientX - lastX
        const dy = e.clientY - lastY
        lastX = e.clientX
        lastY = e.clientY
        const right = new THREE.Vector3()
        camera.getWorldDirection(right)
        const up = new THREE.Vector3(0, 1, 0)
        right.cross(up).normalize()
        const fwd = new THREE.Vector3().crossVectors(up, right)
        lookGoal.addScaledVector(right, -dx * 0.028)
        lookGoal.addScaledVector(fwd, -dy * 0.028)
        return
      }
      if (dragging) {
        orbit.theta -= (e.clientX - lastX) * 0.005
        orbit.phi = THREE.MathUtils.clamp(orbit.phi + (e.clientY - lastY) * 0.002, 0.42, 1.05)
        lastX = e.clientX
        lastY = e.clientY
        return
      }
      const id = pick()
      if (id !== hoveredRef.current) onHoverRef.current(id)
      mount.style.cursor = id ? "pointer" : "grab"
    }
    const onDown = (e: PointerEvent) => {
      setPointer(e)
      lastX = e.clientX
      lastY = e.clientY
      const id = pick()
      if (id && e.button === 0) {
        const now = performance.now()
        onSelectRef.current(id)
        focusBuilding(id)
        if (lastClickRef.current.id === id && now - lastClickRef.current.t < 420) {
          onEnterRef.current(id)
        }
        lastClickRef.current = { id, t: now }
      } else {
        panning = e.button === 2 || e.shiftKey
        dragging = !panning
        mount.setPointerCapture(e.pointerId)
        mount.style.cursor = panning ? "move" : "grabbing"
      }
    }
    const onUp = (e: PointerEvent) => {
      dragging = false
      panning = false
      try {
        mount.releasePointerCapture(e.pointerId)
      } catch {
        /* */
      }
      mount.style.cursor = "grab"
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      radiusGoal.v = THREE.MathUtils.clamp(radiusGoal.v + e.deltaY * 0.02, 15, 34)
    }
    const onContext = (e: Event) => e.preventDefault()

    mount.addEventListener("pointermove", onMove)
    mount.addEventListener("pointerdown", onDown)
    mount.addEventListener("pointerup", onUp)
    mount.addEventListener("wheel", onWheel, { passive: false })
    mount.addEventListener("contextmenu", onContext)

    const tintMaterial = (mat: THREE.Material, on: boolean) => {
      if (mat instanceof THREE.MeshBasicMaterial) {
        if (!mat.userData._baseColor) mat.userData._baseColor = mat.color.clone()
        if (on) mat.color.copy(mat.userData._baseColor).offsetHSL(0.015, 0.06, 0.07)
        else mat.color.copy(mat.userData._baseColor)
        return
      }
      if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshLambertMaterial)) return
      if (!mat.userData._baseEmissive) {
        mat.userData._baseEmissive = mat.emissive.clone()
        mat.userData._baseIntensity = mat.emissiveIntensity
      }
      if (on) {
        mat.emissive.setHex(0xb85c38)
        mat.emissiveIntensity = 0.16
      } else {
        mat.emissive.copy(mat.userData._baseEmissive)
        mat.emissiveIntensity = mat.userData._baseIntensity
      }
    }

    const t0 = performance.now()
    const tick = (now: number) => {
      const t = (now - t0) / 1000
      if (focusTokenRef.current !== lastFocusToken) {
        lastFocusToken = focusTokenRef.current
        if (selectedRef.current) focusBuilding(selectedRef.current)
      }
      look.lerp(lookGoal, reduced ? 1 : 0.07)
      orbit.radius = THREE.MathUtils.lerp(orbit.radius, radiusGoal.v, 0.08)
      if (!reduced && !dragging && !panning) orbit.theta += 0.00016
      applyCam()

      if (!reduced) {
        if (water) water.position.y = -0.72 + Math.sin(t * 1.15) * 0.025
        people.forEach((p) => {
          const home = p.userData.home as { x: number; z: number } | undefined
          if (!home) return
          const ph = p.userData.phase as number
          p.position.x = home.x + Math.sin(t * 0.32 + ph) * 1.35
          p.position.z = home.z + Math.cos(t * 0.26 + ph) * 0.55
        })
      }

      for (const [id, g] of meshById) {
        const on = selectedRef.current === id || hoveredRef.current === id
        g.position.y = THREE.MathUtils.lerp(g.position.y, on ? 0.12 : 0, 0.12)
        g.traverse((c) => {
          if (c instanceof THREE.Mesh) {
            const mats = Array.isArray(c.material) ? c.material : [c.material]
            mats.forEach((m) => tintMaterial(m, on))
          }
          if (c.userData.isPinSprite && c instanceof THREE.Sprite) {
            const mat = c.material as THREE.SpriteMaterial
            const next = on ? c.userData.texActive : c.userData.texIdle
            if (next && mat.map !== next) {
              mat.map = next
              mat.needsUpdate = true
            }
            // hide floating indices until hover/select — kills badge spam
            c.scale.set(on ? 0.48 : 0.36, on ? 0.28 : 0.22, 1)
            mat.opacity = on ? 0.98 : 0.0
            c.visible = on
          }
        })
      }

      renderer!.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }

    const onResize = () => {
      applyCam()
      renderer!.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener("resize", onResize)

    ;(async () => {
      try {
        const lib = await loadCampusLibrary((done, total) => {
          if (!cancelled) setStatus(`Loading city ${done}/${total}`)
        })
        if (cancelled) return
        const built = buildCampusWorld(root, lib)
        meshById = built.meshById
        people = built.people
        water = built.water
        setStatus("")
        applyCam()
        raf = requestAnimationFrame(tick)
      } catch (err) {
        console.error(err)
        if (!cancelled) setStatus("Could not load campus models")
      }
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      mount.removeEventListener("pointermove", onMove)
      mount.removeEventListener("pointerdown", onDown)
      mount.removeEventListener("pointerup", onUp)
      mount.removeEventListener("wheel", onWheel)
      mount.removeEventListener("contextmenu", onContext)
      pmrem?.dispose()
      renderer?.dispose()
      mount.replaceChildren()
    }
  }, [])

  return (
    <div className="absolute inset-0">
      <div ref={mountRef} className="absolute inset-0 touch-none" />
      {status ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#a8d8e6]">
          <p className="font-heading text-lg font-semibold text-[#1a2332]">{status}</p>
        </div>
      ) : null}
    </div>
  )
}

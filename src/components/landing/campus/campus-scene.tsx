"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
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

export function CampusScene({ selected, hovered, focusToken, onHover, onSelect, onEnter }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef(selected)
  const hoveredRef = useRef(hovered)
  const focusTokenRef = useRef(focusToken)
  const onHoverRef = useRef(onHover)
  const onSelectRef = useRef(onSelect)
  const onEnterRef = useRef(onEnter)
  useEffect(() => {
    selectedRef.current = selected
    hoveredRef.current = hovered
    focusTokenRef.current = focusToken
    onHoverRef.current = onHover
    onSelectRef.current = onSelect
    onEnterRef.current = onEnter
  }, [selected, hovered, focusToken, onHover, onSelect, onEnter])
  const [status, setStatus] = useState("Building campus…")

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let cancelled = false
    let raf = 0

    const w0 = mount.clientWidth || 960
    const h0 = mount.clientHeight || 640
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setSize(w0, h0)
    renderer.setClearColor(0xc4c0ab, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.95
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0xc4c0ab, 52, 90)
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.08).texture
    scene.environmentIntensity = 0.25

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 240)
    const orbit = { theta: Math.PI / 3.15, phi: 0.88, radius: 20.4 }
    const look = new THREE.Vector3(0.15, 0.55, 0.55)
    const lookGoal = look.clone()
    const radiusGoal = { v: 22 }

    scene.add(new THREE.AmbientLight(0xfff4e6, 0.24))
    scene.add(new THREE.HemisphereLight(0xc9dded, 0xb49a73, 0.65))
    const sun = new THREE.DirectionalLight(0xffe4bc, 2.4)
    sun.position.set(-9, 15, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -11
    sun.shadow.camera.right = 11
    sun.shadow.camera.top = 11
    sun.shadow.camera.bottom = -11
    sun.shadow.bias = -0.00012
    sun.shadow.normalBias = 0.018
    sun.shadow.radius = 2
    sun.shadow.camera.far = 50
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xb7d4f0, 0.18)
    fill.position.set(20, 9, -14)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xfff7ee, 0.1)
    rim.position.set(4, 12, 18)
    scene.add(rim)
    const selectionLight = new THREE.SpotLight(0xffd59c, 75, 16, 0.40, 0.75, 2)
    scene.add(selectionLight, selectionLight.target)
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
      lookGoal.set(b.x * 0.64, 0.9, b.z * 0.64 + 0.25)
      radiusGoal.v = 18.4
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let dragging = false
    let panning = false
    let lastX = 0
    let lastY = 0
    let lastFocusToken = -1
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
        onSelectRef.current(id)
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
    const onDoubleClick = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect()
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      const id = pick()
      if (id) onEnterRef.current(id)
    }
    const onLeave = () => onHoverRef.current(null)
    const onContext = (e: Event) => e.preventDefault()

    mount.addEventListener("pointerleave", onLeave)
    mount.addEventListener("pointermove", onMove)
    mount.addEventListener("pointerdown", onDown)
    mount.addEventListener("pointerup", onUp)
    mount.addEventListener("wheel", onWheel, { passive: false })
    mount.addEventListener("contextmenu", onContext)
    mount.addEventListener("dblclick", onDoubleClick)

    // Structural flags survive separate Three module instances in lazy-loaded chunks.
    const tintMaterial = (material: THREE.Material | null | undefined, mode: "idle" | "focus" | "dim" | "hover") => {
      const mat = material as THREE.MeshLambertMaterial | undefined
      if (!mat?.color?.isColor) return
      if (!mat.userData._baseColor?.isColor) mat.userData._baseColor = mat.color.clone()
      const base = mat.userData._baseColor as THREE.Color
      mat.color.copy(base).multiplyScalar(mode === "dim" ? 0.72 : 1)
      if (mode === "focus") mat.color.multiplyScalar(1.04)
      if (mode === "hover") mat.color.offsetHSL(0, 0, 0.035)
      if (!mat.emissive?.isColor) return
      if (!mat.userData._baseEmissive?.isColor) {
        mat.userData._baseEmissive = mat.emissive.clone()
        mat.userData._baseIntensity = mat.emissiveIntensity
      }
      mat.emissive.copy(mat.userData._baseEmissive)
      mat.emissiveIntensity = mat.userData._baseIntensity ?? 0
      if (mode === "dim") mat.emissiveIntensity *= 0.72
      if (mode === "focus") { mat.emissive.setHex(0xffc77e); mat.emissiveIntensity = 0.025 }
    }

    const t0 = performance.now()
    let previousFrame = t0
    const tick = (now: number) => {
      const ease = reduced ? 1 : 1 - Math.exp(-5 * Math.min((now - previousFrame) / 1000, 0.25))
      previousFrame = now
      const t = (now - t0) / 1000
      if (focusTokenRef.current !== lastFocusToken) {
        lastFocusToken = focusTokenRef.current
        if (selectedRef.current) focusBuilding(selectedRef.current)
        else { lookGoal.set(0.15, 0.55, 0.55); radiusGoal.v = 22 }
      }
      look.lerp(lookGoal, ease)
      if (look.distanceToSquared(lookGoal) < 0.000004) look.copy(lookGoal)
      orbit.radius = THREE.MathUtils.lerp(orbit.radius, radiusGoal.v, ease)
      if (Math.abs(orbit.radius - radiusGoal.v) < 0.002) orbit.radius = radiusGoal.v
      // A stable orientation makes the directory a learnable map.
      applyCam()

      if (!reduced) {
        if (water) water.position.y = -0.72 + Math.sin(t * 0.72) * 0.008
        people.forEach((p) => {
          const home = p.userData.home as { x: number; z: number } | undefined
          if (!home) return
          const ph = p.userData.phase as number
          p.position.x = home.x + Math.sin(t * 0.32 + ph) * 1.35
          p.position.z = home.z + Math.cos(t * 0.26 + ph) * 0.55
        })
      }

      const hasSelection = !!selectedRef.current
      selectionLight.visible = hasSelection
      const active = CAMPUS_BUILDINGS.find((b) => b.id === selectedRef.current)
      if (active) {
        selectionLight.position.set(active.x - 2, 8, active.z + 3)
        selectionLight.target.position.set(active.x, 1, active.z)
      }
      for (const [id, g] of meshById) {
        const isSelected = selectedRef.current === id
        const isHovered = hoveredRef.current === id
        const mode: "idle" | "focus" | "dim" | "hover" = isSelected
          ? "focus"
          : hasSelection
            ? "dim"
            : isHovered
              ? "hover"
              : "idle"
        const lift = isSelected ? 0.48 : isHovered && !hasSelection ? 0.1 : 0
        ;(g.userData.halo as THREE.Group).visible = isSelected
        g.position.y = THREE.MathUtils.lerp(g.position.y, lift, ease)
        if (Math.abs(g.position.y - lift) < 0.001) g.position.y = lift
        g.traverse((c) => {
          if ((c as THREE.Mesh).isMesh && !c.userData.isHitVolume) {
            const material = (c as THREE.Mesh).material
            const mats = Array.isArray(material) ? material : [material]
            mats.forEach((m) => tintMaterial(m, mode))
          }

        })
      }

      camera.updateMatrixWorld()
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
        const built = buildCampusWorld(root)
        meshById = built.meshById
        for (const building of CAMPUS_BUILDINGS) {
          if (!meshById.has(building.id)) throw new Error(`Missing campus landmark: ${building.id}`)
        }
        people = built.people

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
      mount.removeEventListener("pointerleave", onLeave)
      mount.removeEventListener("pointermove", onMove)
      mount.removeEventListener("pointerdown", onDown)
      mount.removeEventListener("pointerup", onUp)
      mount.removeEventListener("wheel", onWheel)
      mount.removeEventListener("contextmenu", onContext)
      mount.removeEventListener("dblclick", onDoubleClick)
      pmrem?.dispose()
      renderer?.dispose()
      mount.replaceChildren()
    }
  }, [])

  return (
    <div className="absolute inset-0" data-campus-ready={!status}>
      <div ref={mountRef} className="absolute inset-0 touch-none" />
      {status ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#c8bea4]">
          <p className="font-heading text-lg font-semibold text-[#1a2332]">{status}</p>
        </div>
      ) : null}
    </div>
  )
}

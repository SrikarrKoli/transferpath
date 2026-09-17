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
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setSize(w0, h0)
    renderer.setClearColor(0xc5d4c0, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ReinhardToneMapping
    renderer.toneMappingExposure = 1.1
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0xc5d4c0, 52, 90)
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
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -16
    sun.shadow.camera.right = 16
    sun.shadow.camera.top = 16
    sun.shadow.camera.bottom = -16
    sun.shadow.bias = -0.00012
    sun.shadow.normalBias = 0.035
    sun.shadow.radius = 3.5
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xb7d4f0, 0.48)
    fill.position.set(20, 9, -14)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xfff7ee, 0.55)
    rim.position.set(4, 12, 18)
    scene.add(rim)
    // Warm uplight — follows selection so map focus is obvious without a SaaS glow stick.
    const selectGlow = new THREE.PointLight(0xffc089, 0, 4.2, 2.2)
    selectGlow.position.set(0, 0.35, 0)
    scene.add(selectGlow)

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
    const selectionHalo = new THREE.Group()
    selectionHalo.visible = false
    // Ground-embedded ink+gold mark — reads as plaza inlay, not floating UI glow.
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x1a2332,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    })
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x1a2332,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    })
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xe8c46a,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    })
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.05, 64), discMat)
    disc.rotation.x = -Math.PI / 2
    disc.position.y = 0.048
    const outerRing = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.18, 64), outerMat)
    outerRing.rotation.x = -Math.PI / 2
    outerRing.position.y = 0.055
    const innerRing = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.92, 64), innerMat)
    innerRing.rotation.x = -Math.PI / 2
    innerRing.position.y = 0.062
    selectionHalo.add(disc, outerRing, innerRing)
    root.add(selectionHalo)
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
        // Click once to select; click the selected building again to enter.
        if (selectedRef.current === id) {
          onEnterRef.current(id)
        } else {
          onSelectRef.current(id)
          focusBuilding(id)
        }
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

    const tintMaterial = (
      mat: THREE.Material,
      mode: "idle" | "focus" | "dim" | "hover",
    ) => {
      if (!mat) return
      if (mat instanceof THREE.MeshBasicMaterial) {
        if (!mat.color) return
        if (!(mat.userData._baseColor instanceof THREE.Color)) {
          mat.userData._baseColor = mat.color.clone()
          mat.userData._baseOpacity = mat.opacity
          mat.userData._baseTransparent = mat.transparent
        }
        const base = mat.userData._baseColor as THREE.Color
        if (mode === "focus") mat.color.copy(base).offsetHSL(0.02, 0.08, 0.1)
        else if (mode === "hover") mat.color.copy(base).offsetHSL(0.01, 0.04, 0.05)
        else if (mode === "dim") mat.color.copy(base).multiplyScalar(0.52)
        else mat.color.copy(base)
        // Keep opacity only if the material started transparent (glass/water).
        if (mat.userData._baseTransparent) {
          mat.opacity = mode === "dim" ? mat.userData._baseOpacity * 0.5 : mat.userData._baseOpacity
        }
        return
      }
      if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshLambertMaterial)) return
      if (!mat.color || !mat.emissive) return
      if (!(mat.userData._baseEmissive instanceof THREE.Color) || !(mat.userData._baseColor instanceof THREE.Color)) {
        mat.userData._baseEmissive = mat.emissive.clone()
        mat.userData._baseIntensity = mat.emissiveIntensity
        mat.userData._baseColor = mat.color.clone()
      }
      const baseCol = mat.userData._baseColor as THREE.Color
      const baseEm = mat.userData._baseEmissive as THREE.Color
      if (mode === "focus") {
        mat.color.copy(baseCol)
        mat.emissive.setHex(0xb85a32)
        mat.emissiveIntensity = 0.52
      } else if (mode === "hover") {
        mat.color.copy(baseCol)
        mat.emissive.setHex(0x8a5a3a)
        mat.emissiveIntensity = 0.28
      } else if (mode === "dim") {
        mat.color.copy(baseCol).multiplyScalar(0.58)
        mat.emissive.copy(baseEm).multiplyScalar(0.45)
        mat.emissiveIntensity = (mat.userData._baseIntensity ?? 1) * 0.45
      } else {
        mat.color.copy(baseCol)
        mat.emissive.copy(baseEm)
        mat.emissiveIntensity = mat.userData._baseIntensity ?? 1
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
        if (water) water.position.y = -0.72 + Math.sin(t * 0.72) * 0.008
        people.forEach((p) => {
          const home = p.userData.home as { x: number; z: number } | undefined
          if (!home) return
          const ph = p.userData.phase as number
          p.position.x = home.x + Math.sin(t * 0.32 + ph) * 1.35
          p.position.z = home.z + Math.cos(t * 0.26 + ph) * 0.55
        })
      }

      {
        const sid = selectedRef.current
        if (sid && meshById.has(sid)) {
          const g = meshById.get(sid)!
          selectionHalo.visible = true
          selectionHalo.position.x = g.position.x
          selectionHalo.position.z = g.position.z
          selectionHalo.position.y = 0
          // Quiet pulse — mark stays ground-seated.
          const pulse = 0.92 + Math.sin(performance.now() * 0.0024) * 0.05
          discMat.opacity = 0.22 + pulse * 0.06
          outerMat.opacity = 0.75 + pulse * 0.15
          innerMat.opacity = 0.8 + pulse * 0.1
          selectGlow.intensity = 0.85 + Math.sin(performance.now() * 0.0024) * 0.15
          selectGlow.position.set(g.position.x, 0.28 + g.position.y, g.position.z)
        } else {
          selectionHalo.visible = false
          selectGlow.intensity = THREE.MathUtils.lerp(selectGlow.intensity, 0, 0.15)
        }
      }
      const hasSelection = !!selectedRef.current
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
        const lift = isSelected ? 0.28 : isHovered && !hasSelection ? 0.1 : 0
        g.position.y = THREE.MathUtils.lerp(g.position.y, lift, 0.14)
        g.traverse((c) => {
          if (c instanceof THREE.Mesh && !c.userData.isHitVolume) {
            const mats = Array.isArray(c.material) ? c.material : [c.material]
            mats.forEach((m) => tintMaterial(m, mode))
          }
          if (c.userData.isPinSprite && c instanceof THREE.Sprite) {
            const mat = c.material as THREE.SpriteMaterial
            const on = isSelected || isHovered
            const next = on ? c.userData.texActive : c.userData.texIdle
            if (next && mat.map !== next) {
              mat.map = next
              mat.needsUpdate = true
            }
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

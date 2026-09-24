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
    renderer.setClearColor(0xc5d4c0, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.VSMShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.95
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0xc5d4c0, 52, 90)
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.08).texture
    scene.environmentIntensity = 0.25

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 240)
    const orbit = { theta: Math.PI / 3.15, phi: 0.88, radius: 24.5 }
    const look = new THREE.Vector3(0.15, 0.55, 0.55)
    const lookGoal = look.clone()
    const radiusGoal = { v: 24.5 }

    scene.add(new THREE.AmbientLight(0xfff4e6, 0.24))
    scene.add(new THREE.HemisphereLight(0xc9dded, 0x789178, 0.65))
    const sun = new THREE.DirectionalLight(0xfff5e5, 2.8)
    sun.position.set(-7, 22, 6)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -11
    sun.shadow.camera.right = 11
    sun.shadow.camera.top = 11
    sun.shadow.camera.bottom = -11
    sun.shadow.bias = -0.00012
    sun.shadow.normalBias = 0.018
    sun.shadow.radius = 4
    sun.shadow.blurSamples = 8
    sun.shadow.camera.far = 50
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xb7d4f0, 0.18)
    fill.position.set(20, 9, -14)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xfff7ee, 0.1)
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
      const f = orbit.radius * 0.3 * Math.max(1, 1.15 / a)
      camera.left = -f * a
      camera.right = f * a
      camera.top = f
      camera.bottom = -f
      camera.updateProjectionMatrix()
    }

    const focusBuilding = (id: BuildingId) => {
      const b = CAMPUS_BUILDINGS.find((x) => x.id === id)
      if (!b) return
      lookGoal.set(b.x * 0.2, 0.7, b.z * 0.2 + 0.4)
      radiusGoal.v = 24.5
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
      mat.color.copy(base)
      // Apply the 0.62 dim in perceptual color space: linear-light multiplication
      // was largely undone by tone mapping and left neighbors equally prominent.
      if (mode === "dim") mat.color.convertLinearToSRGB().multiplyScalar(0.62).convertSRGBToLinear()
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
      if (mode === "focus") { mat.emissive.setHex(0xf4e7d1); mat.emissiveIntensity = 0.025 }
    }

    const t0 = performance.now()
    let previousFrame = t0
    let lastRenderedFrame = ""
    let lastSignFrame = ""
    const tick = (now: number) => {
      const ease = reduced ? 1 : 1 - Math.exp(-5 * Math.min((now - previousFrame) / 1000, 0.25))
      previousFrame = now
      const t = (now - t0) / 1000
      if (focusTokenRef.current !== lastFocusToken) {
        lastFocusToken = focusTokenRef.current
        if (selectedRef.current) focusBuilding(selectedRef.current)
        else { lookGoal.set(0.15, 0.55, 0.55); radiusGoal.v = 24.5 }
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
        g.position.y = THREE.MathUtils.lerp(g.position.y, lift, ease)
        if (Math.abs(g.position.y - lift) < 0.001) g.position.y = lift
        if (g.userData.selectionMode !== mode) g.traverse((c) => {
          if ((c as THREE.Mesh).isMesh && !c.userData.isHitVolume) {
            const material = (c as THREE.Mesh).material
            const mats = Array.isArray(material) ? material : [material]
            mats.forEach((m) => tintMaterial(m, mode))
          }

        })
        g.userData.selectionMode = mode
      }

      camera.updateMatrixWorld()
      root.updateMatrixWorld(true)
      const frame = [selectedRef.current, hoveredRef.current, look.x, look.y, look.z, orbit.radius, orbit.theta, orbit.phi, mount.clientWidth, mount.clientHeight, ...[...meshById.values()].map(g => g.position.y)].join(":")
      // All destinations use the same projected bounds and collision-aware sign placement.
      const stage = mount.parentElement?.parentElement
      const sign = stage?.querySelector<HTMLElement>(".campus-arrival-dock")
      const tether = stage?.querySelector<SVGSVGElement>(".campus-sign-tether")
      const activeGroup = selectedRef.current ? meshById.get(selectedRef.current) : undefined
      const signFrame = `${frame}:${sign?.offsetWidth}:${sign?.offsetHeight}`
      if (sign && tether && activeGroup && (signFrame !== lastSignFrame || sign.style.visibility !== "visible")) {
        lastSignFrame = signFrame
        const width = mount.clientWidth, height = mount.clientHeight
        const project = (v: THREE.Vector3) => {
          const p = v.project(camera)
          return { x: (p.x * 0.5 + 0.5) * width, y: (-p.y * 0.5 + 0.5) * height }
        }
        const rects = [...meshById.values()].map((group) => {
          const box = group.userData.bounds as THREE.Box3
          const points = []
          for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
            points.push(project(new THREE.Vector3(x, y, z).add(group.position)))
          }
          return { group, left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)), top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y)) }
        })
        const box = activeGroup.userData.bounds as THREE.Box3
        // The front facade is part of the selected mass, even when lifted off its footprint.
        const fallback = project(new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y * 0.38, box.max.z - 0.16).add(activeGroup.position))
        const activeRect = rects.find(r => r.group === activeGroup)!
        const anchors: { x: number; y: number }[] = []
        // Sample real, visible surfaces so a rear hall's tether never starts on
        // an intervening tower, or on empty space inside its bounding rectangle.
        for (const [u, v] of [[0.12, 0.78], [0.88, 0.78], [0.2, 0.88], [0.8, 0.88], [0.15, 0.5], [0.85, 0.5], [0.25, 0.7], [0.75, 0.7], [0.5, 0.2], [0.5, 0.65]]) {
          const x = THREE.MathUtils.lerp(activeRect.left, activeRect.right, u)
          const y = THREE.MathUtils.lerp(activeRect.top, activeRect.bottom, v)
          raycaster.setFromCamera(new THREE.Vector2(x / width * 2 - 1, 1 - y / height * 2), camera)
          const visible = raycaster.intersectObjects(root.children, true).find(hit => !hit.object.userData.isHitVolume)
          if (visible?.object.userData.buildingId === selectedRef.current) anchors.push({ x, y })
        }
        if (!anchors.length) anchors.push(fallback)
        const anchor = anchors[0]
        const sw = sign.offsetWidth, sh = sign.offsetHeight
        const clampX = (x: number) => THREE.MathUtils.clamp(x, 16, Math.max(16, width - sw - 16))
        const topInset = window.innerWidth >= 1024 ? 78 : 126
        const clampY = (y: number) => THREE.MathUtils.clamp(y, topInset, Math.max(topInset, height - sh - 24))
        let best = { x: clampX(anchor.x - sw / 2), y: clampY(anchor.y + 44), ex: anchor.x, ey: anchor.y + 44, ax: anchor.x, ay: anchor.y, score: Infinity }
        const candidates: typeof best[] = []
        // Search the open lawn around the silhouette, including side placements for tall landmarks.
        for (const anchor of anchors) for (let angle = 0; angle < 4; angle++) for (const distance of [24, 40, 64, 96, 140, 200]) for (const align of [-0.4, 0, 0.4]) {
          const radians = angle * Math.PI / 2
          const x = clampX(anchor.x + Math.cos(radians) * (distance + sw / 2) - sw / 2)
          const y = clampY(anchor.y + Math.sin(radians) * (distance + sh / 2) - sh / 2 + (angle % 2 ? 0 : align * sh))
          const ex = THREE.MathUtils.clamp(anchor.x, x, x + sw)
          const ey = THREE.MathUtils.clamp(anchor.y, y, y + sh)
          let score = Math.hypot(ex - anchor.x, ey - anchor.y) * 2 + (angle % 2 ? 35 : 0) + Math.abs(align) * 10
          for (const r of rects) {
            const overlap = Math.max(0, Math.min(x + sw + 12, r.right) - Math.max(x - 12, r.left)) * Math.max(0, Math.min(y + sh + 12, r.bottom) - Math.max(y - 12, r.top))
            score += overlap * 25
          }
          candidates.push({ x, y, ex, ey, ax: anchor.x, ay: anchor.y, score })
        }
        // Bounding rectangles reserve room for the plaque. Actual visible surfaces
        // judge its leader: a rear hall can overlap a tower's box without being hidden.
        for (const candidate of candidates.sort((a, b) => a.score - b.score).slice(0, 24)) {
          let score = candidate.score
          for (let step = 1; step < 12; step++) {
            const x = THREE.MathUtils.lerp(candidate.ax, candidate.ex, step / 12)
            const y = THREE.MathUtils.lerp(candidate.ay, candidate.ey, step / 12)
            const possible = rects.filter(r => x > r.left && x < r.right && y > r.top && y < r.bottom).map(r => r.group.children[0])
            if (!possible.length) continue
            raycaster.setFromCamera(new THREE.Vector2(x / width * 2 - 1, 1 - y / height * 2), camera)
            const hit = raycaster.intersectObjects(possible, true)[0]
            if (hit && hit.object.userData.buildingId !== selectedRef.current) score += 240
          }
          if (score < best.score) best = { ...candidate, score }
        }
        sign.style.left = `${best.x}px`; sign.style.top = `${best.y}px`
        sign.style.visibility = "visible"
        tether.setAttribute("viewBox", `0 0 ${width} ${height}`)
        tether.querySelectorAll("line").forEach(line => {
          line.setAttribute("x1", `${best.ax}`); line.setAttribute("y1", `${best.ay}`)
          line.setAttribute("x2", `${best.ex}`); line.setAttribute("y2", `${best.ey}`)
        })
        const dot = tether.querySelector("circle")!
        dot.setAttribute("cx", `${best.ax}`); dot.setAttribute("cy", `${best.ay}`)
        tether.style.visibility = "visible"
      }
      // This authored map has no idle animation; preserve a settled frame instead
      // of continuously redrawing thousands of static architectural surfaces.
      if (frame !== lastRenderedFrame) {
        renderer.render(scene, camera)
        lastRenderedFrame = frame
      }
      raf = requestAnimationFrame(tick)
    }

    const onResize = () => {
      applyCam()
      renderer!.setSize(mount.clientWidth, mount.clientHeight)
      lastRenderedFrame = ""
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

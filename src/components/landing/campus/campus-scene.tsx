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
    const orbit = { theta: Math.PI / 3.15, phi: 0.88, radius: 28.5 }
    const look = new THREE.Vector3(0.1, 0.55, 0.4)
    const lookGoal = look.clone()
    const radiusGoal = { v: 28.5 }

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
    // Depth-tested ground ink: architecture occludes the map outline naturally.
    const footprint = new THREE.Group()
    const footprintGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-.5, .04, -.5), new THREE.Vector3(.5, .04, -.5),
      new THREE.Vector3(.5, .04, .5), new THREE.Vector3(-.5, .04, .5),
    ])
    footprint.add(new THREE.LineLoop(footprintGeometry, new THREE.LineBasicMaterial({ color: 0x263b35, transparent: true, opacity: .55 })))
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1, .28, 1), new THREE.MeshStandardMaterial({ color: 0xe4dec9, roughness: 1 }))
    plate.position.y = .14; plate.receiveShadow = true; footprint.add(plate)
    // Hairline border and short, depth-tested survey ticks stay on the stone.
    footprint.children[0].position.y = .245
    for (const x of [-.5, .5]) for (const z of [-.5, .5]) {
      const points = [new THREE.Vector3(x - Math.sign(x)*.07, .287, z), new THREE.Vector3(x, .287, z), new THREE.Vector3(x, .287, z-Math.sign(z)*.1)]
      footprint.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x263b35 })))
    }
    footprint.visible = false
    scene.add(footprint)

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
      // Preserve warm roof and limestone detail while the selected landmark lifts.
      if (mode === "dim") mat.color.convertLinearToSRGB().multiplyScalar(0.80).convertSRGBToLinear()
      if (mode === "focus") mat.color.multiply(new THREE.Color(0xffeed8)).multiplyScalar(1.08)
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
    const tick = (now: number) => {
      const ease = reduced ? 1 : 1 - Math.exp(-5 * Math.min((now - previousFrame) / 1000, 0.25))
      previousFrame = now
      const t = (now - t0) / 1000
      if (focusTokenRef.current !== lastFocusToken) {
        lastFocusToken = focusTokenRef.current
        lookGoal.set(0.1, 0.55, 0.4); radiusGoal.v = 28.5
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
        const lift = isSelected ? 0.3 : isHovered && !hasSelection ? 0.1 : 0
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
      const project = (v: THREE.Vector3) => {
        const p = v.project(camera)
        return { x: (p.x * .5 + .5) * mount.clientWidth, y: (-p.y * .5 + .5) * mount.clientHeight }
      }
      const markers = [...meshById].map(([id, group]) => {
        const anchor = project((group.userData.pin as THREE.Vector3).clone().add(group.position))
        return { id, x: anchor.x, y: anchor.y - 25, selected: id === selectedRef.current }
      }).sort((a, b) => Number(b.selected) - Number(a.selected) || a.y - b.y)
      const placed: { x: number; y: number; width: number }[] = []
      for (const marker of markers) {
        const el = mount.parentElement?.querySelector<HTMLElement>(`[data-marker="${marker.id}"]`)
        if (!el) continue
        const width = marker.selected ? 32 : 26
        const originalY = marker.y
        for (const other of placed) {
          if (marker.x - 15 < other.x + other.width - 11 && marker.x + width - 11 > other.x - 15 && Math.abs(marker.y - other.y) < 32) marker.y = other.y - 32
        }
        el.style.left = `${marker.x}px`; el.style.top = `${marker.y}px`
        el.style.setProperty("--campus-stem", `${Math.min(18, 12 + originalY - marker.y)}px`)
        placed.push({ x: marker.x, y: marker.y, width })
      }
      for (const [id, group] of meshById) {
        const label = mount.parentElement?.querySelector<HTMLElement>(`[data-ground-label="${id}"]`)
        if (!label) continue
        const anchor = project((group.userData.label as THREE.Vector3).clone())
        label.style.left = `${anchor.x}px`; label.style.top = `${anchor.y}px`
      }
      const active = selectedRef.current ? meshById.get(selectedRef.current) : undefined
      footprint.visible = !!active
      if (active) {
        const f = active.userData.footprint as { x: number; z: number; width: number; depth: number }
        footprint.position.set(active.position.x + f.x, 0, active.position.z + f.z)
        footprint.scale.set(f.width, 1, f.depth)
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
      footprintGeometry.dispose()
      footprint.traverse(obj => {
        const drawable = obj as THREE.Mesh
        drawable.geometry?.dispose()
        const materials = drawable.material ? (Array.isArray(drawable.material) ? drawable.material : [drawable.material]) : []
        materials.forEach(material => material.dispose())
      })
      pmrem?.dispose()
      renderer?.dispose()
      mount.replaceChildren()
    }
  }, [])

  return (
    <div className="absolute inset-0" data-campus-ready={!status}>
      <div ref={mountRef} className="absolute inset-0 touch-none" />
      <div className="campus-ground-labels" aria-hidden="true">{CAMPUS_BUILDINGS.map((b, i) => <span key={b.id} className="campus-ground-label" data-ground-label={b.id} data-selected={selected === b.id} data-muted={!!selected && selected !== b.id}><strong>{String(i + 1).padStart(2, "0")} · {b.name}</strong><em>{b.short}</em></span>)}</div>
      <div className="campus-map-markers">{CAMPUS_BUILDINGS.map((b, i) => <button key={b.id} data-marker={b.id} className="campus-map-marker" data-selected={selected === b.id} data-muted={!!selected && selected !== b.id} data-hovered={!selected && hovered === b.id} aria-label={b.name} aria-pressed={selected === b.id} onClick={() => onSelect(b.id)} onMouseEnter={() => onHover(b.id)} onMouseLeave={() => onHover(null)}><span className="campus-roundel">{String(i + 1).padStart(2, "0")}</span></button>)}</div>
      {status ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#c8bea4]">
          <p className="font-heading text-lg font-semibold text-[#1a2332]">{status}</p>
        </div>
      ) : null}
    </div>
  )
}

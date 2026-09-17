"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { CAMPUS_BUILDINGS, type BuildingId } from "./campus-data"
import { PIN_Y } from "./campus-landmarks"
import { loadCampusLibrary } from "./campus-models"
import { buildCampusWorld } from "./campus-world"

type Props = {
  selected: BuildingId | null
  hovered: BuildingId | null
  focusToken: number
  onHover: (id: BuildingId | null) => void
  onSelect: (id: BuildingId) => void
  onEnter: (id: BuildingId) => void
  onAnchor: (x: number, y: number) => void
}

export function CampusScene({ selected, hovered, focusToken, onHover, onSelect, onEnter, onAnchor }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const labelRefs = useRef(new Map<BuildingId, HTMLButtonElement>())
  const selectedRef = useRef(selected)
  const hoveredRef = useRef(hovered)
  const focusTokenRef = useRef(focusToken)
  const onHoverRef = useRef(onHover)
  const onSelectRef = useRef(onSelect)
  const onEnterRef = useRef(onEnter)
  const onAnchorRef = useRef(onAnchor)
  selectedRef.current = selected
  hoveredRef.current = hovered
  focusTokenRef.current = focusToken
  onHoverRef.current = onHover
  onSelectRef.current = onSelect
  onEnterRef.current = onEnter
  onAnchorRef.current = onAnchor
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
    renderer.shadowMap.type = THREE.PCFShadowMap
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
    const radiusGoal = { v: 22 }

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
      // Keep the selected landmark left of the right-hand plaque.
      const shift = selectedRef.current && mount.clientWidth >= 768 ? 0.85 : 0
      camera.left += shift
      camera.right += shift
      camera.updateProjectionMatrix()
    }

    const focusBuilding = (id: BuildingId) => {
      const b = CAMPUS_BUILDINGS.find((x) => x.id === id)
      if (!b) return
      lookGoal.set(b.x * 0.9, id === "quad" ? 2.0 : 1.3, b.z * 0.9)
      radiusGoal.v = 23
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let dragging = false
    let panning = false
    let lastX = 0
    let lastY = 0
    let lastFocusToken = -1
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
    const onContext = (e: Event) => e.preventDefault()

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
      // Exposure and sRGB encoding soften a linear color multiplier. Attenuate
      // the final display color too, so selection reads under bright campus light.
      if (!mat.userData.campusDim) {
        const dim = { value: 1 }
        mat.userData.campusDim = dim
        mat.onBeforeCompile = (shader) => {
          shader.uniforms.campusDim = dim
          shader.fragmentShader = "uniform float campusDim;\n" + shader.fragmentShader.replace(
            "#include <colorspace_fragment>",
            "#include <colorspace_fragment>\ngl_FragColor.rgb *= campusDim;",
          )
        }
        mat.customProgramCacheKey = () => "campus-selection-dim-v1"
        mat.needsUpdate = true
      }
      mat.userData.campusDim.value = mode === "dim" ? 0.55 : 1
      if (!mat.userData._baseColor?.isColor) mat.userData._baseColor = mat.color.clone()
      const base = mat.userData._baseColor as THREE.Color
      mat.color.copy(base)
      if (mode === "dim") mat.color.multiplyScalar(0.34)
      if (mode === "focus") mat.color.offsetHSL(0, 0, 0.055)
      if (mode === "hover") mat.color.offsetHSL(0, 0, 0.035)
      if (!mat.emissive?.isColor) return
      if (!mat.userData._baseEmissive?.isColor) {
        mat.userData._baseEmissive = mat.emissive.clone()
        mat.userData._baseIntensity = mat.emissiveIntensity
      }
      mat.emissive.copy(mat.userData._baseEmissive)
      mat.emissiveIntensity = mat.userData._baseIntensity ?? 0
      if (mode === "dim") mat.emissiveIntensity *= 0.34
      if (mode === "focus") { mat.emissive.setHex(0xe3d6b8); mat.emissiveIntensity = 0.18 }
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

      {
        const sid = selectedRef.current
        if (sid && meshById.has(sid)) {
          const g = meshById.get(sid)!
          selectionHalo.visible = true
          selectionHalo.position.x = g.position.x
          selectionHalo.position.z = g.position.z
          selectionHalo.position.y = 0.19
          const footprint = g.userData.footprint as { x: number; z: number; width: number; depth: number }
          selectionHalo.position.x += footprint.x
          selectionHalo.position.z += footprint.z
          selectionHalo.scale.set(footprint.width / 1.8, 1, footprint.depth / 1.8)
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
        const lift = isSelected ? 0.12 : isHovered && !hasSelection ? 0.1 : 0
        g.position.y = THREE.MathUtils.lerp(g.position.y, lift, ease)
        if (Math.abs(g.position.y - lift) < 0.001) g.position.y = lift
        g.traverse((c) => {
          if ((c as THREE.Mesh).isMesh && !c.userData.isHitVolume) {
            const material = (c as THREE.Mesh).material
            const mats = Array.isArray(material) ? material : [material]
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

      camera.updateMatrixWorld()
      for (const [id, group] of meshById) {
        const label = labelRefs.current.get(id)
        if (!label) continue
        group.updateWorldMatrix(true, false)
        const point = group.localToWorld(new THREE.Vector3(0, PIN_Y[id], 0)).project(camera)
        label.style.left = `${(point.x + 1) * mount.clientWidth / 2}px`
        label.style.top = `${(1 - point.y) * mount.clientHeight / 2}px`
        label.style.visibility = point.z >= -1 && point.z <= 1 ? "visible" : "hidden"
      }
      const selectedGroup = selectedRef.current ? meshById.get(selectedRef.current) : undefined
      if (selectedGroup && selectedRef.current) {
        selectedGroup.updateWorldMatrix(true, false)
        const anchor = selectedGroup.localToWorld(new THREE.Vector3(0, PIN_Y[selectedRef.current], 0)).project(camera)
        onAnchorRef.current((anchor.x + 1) * mount.clientWidth / 2, (1 - anchor.y) * mount.clientHeight / 2)
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
    <div className="absolute inset-0">
      <div ref={mountRef} className="absolute inset-0 touch-none" />
      {!status && CAMPUS_BUILDINGS.map((building, index) => (
        <button
          key={building.id}
          ref={(node) => { if (node) labelRefs.current.set(building.id, node); else labelRefs.current.delete(building.id) }}
          type="button"
          className="campus-map-label"
          data-selected={selected === building.id}
          data-muted={!!selected && selected !== building.id}
          data-hovered={hovered === building.id}
          aria-pressed={selected === building.id}
          onClick={() => onSelect(building.id)}
          onDoubleClick={() => onEnter(building.id)}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onEnter(building.id) } }}
          onMouseEnter={() => onHover(building.id)}
          onMouseLeave={() => onHover(null)}
        >
          <span>{String(index + 1).padStart(2, "0")} · {building.name}</span>
          {selected === building.id && <small>{building.feature}</small>}
        </button>
      ))}
      {status ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#a8d8e6]">
          <p className="font-heading text-lg font-semibold text-[#1a2332]">{status}</p>
        </div>
      ) : null}
    </div>
  )
}

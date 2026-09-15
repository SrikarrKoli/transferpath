"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

type Props = {
  combo: number
  score: number
}

/**
 * CSS-3D-feel cabinet built in Three.js — idle sway + mouse parallax.
 */
export function Cabinet3D({ combo, score }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef({ combo, score })
  stateRef.current = { combo, score }

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const w = mount.clientWidth || 420
    const h = mount.clientHeight || 520

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100)
    camera.position.set(0, 0.15, 4.2)

    const light = new THREE.DirectionalLight(0xff4dc8, 2.2)
    light.position.set(2, 3, 4)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0x66ffff, 0.55))
    const rim = new THREE.PointLight(0xb8ff3c, 1.4, 12)
    rim.position.set(-2, -1, 2)
    scene.add(rim)

    const group = new THREE.Group()
    scene.add(group)

    // Cabinet body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x14101c,
      metalness: 0.55,
      roughness: 0.35,
    })
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.6, 1.1), bodyMat)
    body.position.y = -0.1
    group.add(body)

    // Bezel
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 1.15, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x2a2038, metalness: 0.4, roughness: 0.4 })
    )
    bezel.position.set(0, 0.55, 0.56)
    group.add(bezel)

    // Screen (emissive plane)
    const screenCanvas = document.createElement("canvas")
    screenCanvas.width = 512
    screenCanvas.height = 384
    const ctx = screenCanvas.getContext("2d")!
    const screenTex = new THREE.CanvasTexture(screenCanvas)
    screenTex.colorSpace = THREE.SRGBColorSpace
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 1.0),
      new THREE.MeshBasicMaterial({ map: screenTex })
    )
    screen.position.set(0, 0.55, 0.63)
    group.add(screen)

    // Marquee
    const marquee = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.35, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0xff2d95,
        emissive: 0xff2d95,
        emissiveIntensity: 0.65,
        metalness: 0.2,
        roughness: 0.4,
      })
    )
    marquee.position.set(0, 1.35, 0.35)
    group.add(marquee)

    // Control panel shelf
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.18, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x1c1528, metalness: 0.5, roughness: 0.35 })
    )
    shelf.position.set(0, -0.35, 0.55)
    group.add(shelf)

    // Buttons
    const btnColors = [0xb8ff3c, 0x00f0ff, 0xff2d95, 0xffc107]
    btnColors.forEach((c, i) => {
      const btn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.08, 24),
        new THREE.MeshStandardMaterial({
          color: c,
          emissive: c,
          emissiveIntensity: 0.5,
          roughness: 0.3,
        })
      )
      btn.rotation.x = Math.PI / 2
      btn.position.set(-0.45 + i * 0.3, -0.28, 0.78)
      group.add(btn)
    })

    // Joystick
    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.28, 12),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.6, roughness: 0.25 })
    )
    stick.position.set(0.55, -0.18, 0.72)
    group.add(stick)
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xff2d95,
        emissive: 0xff2d95,
        emissiveIntensity: 0.4,
      })
    )
    ball.position.set(0.55, -0.02, 0.72)
    group.add(ball)

    const mouse = { x: 0, y: 0 }
    const onMove = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect()
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1
      mouse.y = ((e.clientY - r.top) / r.height) * 2 - 1
    }
    mount.addEventListener("pointermove", onMove)

    const drawScreen = () => {
      const { combo, score } = stateRef.current
      ctx.fillStyle = "#070512"
      ctx.fillRect(0, 0, 512, 384)
      // scan
      for (let y = 0; y < 384; y += 3) {
        ctx.fillStyle = "rgba(0,255,255,0.03)"
        ctx.fillRect(0, y, 512, 1)
      }
      ctx.fillStyle = "#ff2d95"
      ctx.font = "bold 28px monospace"
      ctx.fillText("TRANSFERPATH", 130, 48)
      ctx.fillStyle = "#b8ff3c"
      ctx.font = "bold 42px monospace"
      ctx.fillText("ATTRACT MODE", 95, 110)
      ctx.fillStyle = "#00f0ff"
      ctx.font = "20px monospace"
      ctx.fillText(`COMBO x${combo}`, 40, 180)
      ctx.fillText(`SCORE ${score}`, 40, 220)
      ctx.fillStyle = "#ffffff"
      ctx.font = "16px monospace"
      ctx.fillText("HIT THE PADS · CLEAR THE STAGE", 70, 290)
      ctx.fillStyle = combo > 4 ? "#b8ff3c" : "#ffc107"
      ctx.fillRect(40, 320, Math.min(432, 48 + combo * 28), 18)
      screenTex.needsUpdate = true
    }

    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = (now - t0) / 1000
      drawScreen()
      if (!reduced) {
        group.rotation.y = mouse.x * 0.35 + Math.sin(t * 0.7) * 0.08
        group.rotation.x = -mouse.y * 0.18 + Math.sin(t * 0.9) * 0.04
        group.position.y = Math.sin(t * 1.2) * 0.04
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const onResize = () => {
      const nw = mount.clientWidth
      const nh = mount.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      mount.removeEventListener("pointermove", onMove)
      renderer.dispose()
      mount.replaceChildren()
    }
  }, [])

  return <div ref={mountRef} className="h-[420px] w-full sm:h-[520px]" aria-hidden />
}

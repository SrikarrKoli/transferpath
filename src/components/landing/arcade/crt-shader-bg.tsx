"use client"

import { useEffect, useRef } from "react"

/**
 * Full-bleed CRT plasma / scanline shader — attract-mode atmosphere.
 */
export function CrtShaderBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false })
    if (!gl) return

    const vs = `
      attribute vec2 a;
      void main(){ gl_Position = vec4(a,0.0,1.0); }
    `
    const fs = `
      precision mediump float;
      uniform vec2 u_res;
      uniform float u_t;
      void main(){
        vec2 uv = gl_FragCoord.xy / u_res;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= u_res.x / u_res.y;

        float t = u_t * 0.35;
        float plasma = sin(p.x * 3.2 + t) + sin(p.y * 4.1 - t * 1.3)
          + sin((p.x + p.y) * 2.4 + t * 0.7) + sin(length(p) * 5.0 - t);
        plasma *= 0.25;

        vec3 voidCol = vec3(0.02, 0.01, 0.06);
        vec3 mag = vec3(0.95, 0.08, 0.55);
        vec3 cyan = vec3(0.05, 0.92, 0.95);
        vec3 lime = vec3(0.55, 1.0, 0.2);

        float m = smoothstep(-0.2, 0.55, plasma);
        float c = smoothstep(0.1, 0.8, sin(plasma * 3.0 + t));
        vec3 col = mix(voidCol, mag, m * 0.45);
        col = mix(col, cyan, c * 0.28);
        col += lime * pow(max(0.0, sin(p.y * 18.0 + t * 2.0)), 12.0) * 0.08;

        // scanlines
        float scan = sin(gl_FragCoord.y * 1.75) * 0.04;
        col -= scan;

        // vignette
        float vig = smoothstep(1.35, 0.15, length(p * vec2(0.85, 1.0)));
        col *= vig;

        gl_FragColor = vec4(col, 1.0);
      }
    `

    function compile(type: number, src: string) {
      const sh = gl!.createShader(type)!
      gl!.shaderSource(sh, src)
      gl!.compileShader(sh)
      return sh
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, "a")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, "u_res")
    const uT = gl.getUniformLocation(prog, "u_t")

    let raf = 0
    const start = performance.now()
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.floor(canvas.clientWidth * dpr)
      canvas.height = Math.floor(canvas.clientHeight * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener("resize", resize)

    const frame = (now: number) => {
      const t = reduced ? 0 : (now - start) / 1000
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uT, t)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  )
}

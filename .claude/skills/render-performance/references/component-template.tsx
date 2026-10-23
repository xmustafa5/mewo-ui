"use client"

/*
 * The shape of a mewo WebGL component. Copy it, replace the shader and the props, keep the structure:
 * every comment marks one of the rules in SKILL.md. `registry/mewo/ui/grainient.tsx` is this template
 * with a real effect in it; `pattern-waves.tsx` is the same structure on top of `ogl`.
 */

import { useEffect, useRef, type ComponentProps } from "react"
import { cn } from "@/lib/utils"

export interface ExampleEffectProps extends Omit<ComponentProps<"div">, "color"> {
  /** Any CSS colour. */
  color?: string
  /** 0 renders one frame and stops. */
  speed?: number
  /** Freeze the animation; the last frame stays. */
  paused?: boolean
  /** Override the device pixel ratio, which is capped at 2. */
  dpr?: number
}

type Settings = { color: string; speed: number; paused: boolean; dpr?: number }

// Rule 5: a fragment budget keeps a 5K display at laptop cost.
const PIXEL_BUDGET = 4.5e6

const VERTEX = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const FRAGMENT = `#version 300 es
precision highp float;
uniform float uTime;
uniform vec3 uColor;
in vec2 vUv;
out vec4 outColor;
void main() {
  float v = 0.5 + 0.5 * sin(vUv.x * 6.0 + uTime) * cos(vUv.y * 4.0 - uTime * 0.7);
  outColor = vec4(uColor * v, 1.0);
}`

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

const parseColor = (value: string): [number, number, number] => {
  const probe = document.createElement("canvas").getContext("2d")
  if (!probe) return [1, 1, 1]
  probe.fillStyle = "#000"
  probe.fillStyle = value
  const hex = probe.fillStyle
  if (!hex.startsWith("#")) return [1, 1, 1]
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export function ExampleEffect({ color = "#1821fb", speed = 1, paused = false, dpr, className, style, ...rest }: ExampleEffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const settings: Settings = { color, speed: Math.max(0, speed), paused, dpr }
  const settingsRef = useRef(settings)
  const wakeRef = useRef<(() => void) | null>(null)

  // Rule 2: this effect runs exactly once. A prop change never reaches it.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // Strict Mode rule: the canvas is made here, not in JSX, so a remount gets a fresh context.
    const canvas = document.createElement("canvas")
    canvas.className = "absolute inset-0 block h-full w-full"
    canvas.setAttribute("aria-hidden", "true")
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false })
    if (!gl) return // jsdom, GPU-less CI, an old browser: the root stays empty and nothing throws.
    root.appendChild(canvas)

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
    const program = gl.createProgram()
    if (!vertex || !fragment || !program) return
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    const vao = gl.createVertexArray()
    const uTime = gl.getUniformLocation(program, "uTime")
    const uColor = gl.getUniformLocation(program, "uColor")

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    let width = 1
    let height = 1
    let raf = 0
    let last = 0
    let time = 0
    let visible = true
    let dirty = true
    let colorKey = ""
    let rgb: [number, number, number] = [1, 1, 1]

    const draw = () => {
      const s = settingsRef.current
      if (s.color !== colorKey) {
        colorKey = s.color
        rgb = parseColor(s.color)
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.uniform1f(uTime, time)
      gl.uniform3f(uColor, rgb[0], rgb[1], rgb[2])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      dirty = false
    }

    const frame = (now: number) => {
      raf = 0
      if (!visible) return
      const s = settingsRef.current
      // dt is clamped so a tab switch does not jump the animation.
      const dt = last ? clamp((now - last) / 1000, 1 / 240, 0.05) : 1 / 60
      last = now
      const moving = !s.paused && !reduced && s.speed > 0
      if (moving) time += dt * s.speed
      draw()
      // Rule 3: keep looping only while something moves.
      if (moving || dirty) raf = requestAnimationFrame(frame)
      else last = 0
    }

    const wake = () => {
      // Rule 4: never schedule while off-screen or in a hidden tab.
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const resize = () => {
      const s = settingsRef.current
      width = Math.max(1, root.clientWidth)
      height = Math.max(1, root.clientHeight)
      // Rule 5: cap the pixel ratio and the fragment count.
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (width * height)))
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))
      dirty = true
      wake()
    }

    const onVisibility = () => {
      last = 0
      wake()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(root)
    const intersection = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting)
      if (visible) {
        last = 0
        wake()
      }
    })
    intersection.observe(root)
    document.addEventListener("visibilitychange", onVisibility)
    resize()
    wakeRef.current = () => {
      dirty = true
      wake()
    }

    // Rule 6: release everything, then the context, then the element.
    return () => {
      cancelAnimationFrame(raf)
      wakeRef.current = null
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      canvas.remove()
    }
  }, [])

  // Rule 1 and the lint rule: props reach the loop through a ref written in an effect, never in render,
  // and the only thing a prop change does is wake the loop for one frame.
  useEffect(() => {
    settingsRef.current = settings
    wakeRef.current?.()
  })

  return (
    <div
      ref={rootRef}
      data-slot="example-effect"
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={style}
      {...rest}
    />
  )
}

"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export interface AuroraBackgroundProps extends React.ComponentProps<"div"> {
  /** Fade the aurora out towards the bottom-left so content stays readable. */
  showRadialMask?: boolean
}

/*
 * The aurora is a WebGL 2 shader. An animated CSS gradient under a 40px blur repaints and re-blurs the
 * whole section on every frame, on screen or not; the shader draws the same field on the GPU at a quarter
 * of the resolution (it is blur-soft, so nothing is lost) and stops when the section is out of view.
 * The static CSS gradient below is what renders first, without JavaScript, with reduced motion, and
 * wherever WebGL is unavailable. The shader takes over from it on its first frame.
 */

// The CSS gradient's stops, which the shader reproduces: 100deg, these colours from 10% to 60%.
const GRADIENT =
  "bg-[length:300%_200%] bg-[linear-gradient(100deg,#3b82f6_10%,#a5b4fc_20%,#93c5fd_30%,#ddd6fe_40%,#60a5fa_50%,#3b82f6_60%)]"
const RADIAL_MASK = "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]"

// The field is drawn at this fraction of the CSS size and stretched; it is as soft as a 40px blur.
const RESOLUTION = 0.25
// The CSS animation moved background-position from 0% to 300% in 60s: six layer widths, a tenth a second.
const DRIFT = 0.1

const VERTEX = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

// Mirrors the CSS: the layer is the section grown by 10% on each side, the gradient image is 300% x 200%
// of the layer, tiled horizontally and moving left, and the mask is an ellipse from the top-right corner.
const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform float uTime;
uniform float uDrift;
uniform float uMask;
in vec2 vUv;
out vec4 outColor;

const vec3 C0 = vec3(0.231, 0.510, 0.965);
const vec3 C1 = vec3(0.647, 0.706, 0.988);
const vec3 C2 = vec3(0.576, 0.773, 0.992);
const vec3 C3 = vec3(0.867, 0.839, 0.996);
const vec3 C4 = vec3(0.376, 0.647, 0.980);

vec3 ramp(float t) {
  if (t <= 0.1) return C0;
  if (t <= 0.2) return mix(C0, C1, (t - 0.1) * 10.0);
  if (t <= 0.3) return mix(C1, C2, (t - 0.2) * 10.0);
  if (t <= 0.4) return mix(C2, C3, (t - 0.3) * 10.0);
  if (t <= 0.5) return mix(C3, C4, (t - 0.4) * 10.0);
  if (t <= 0.6) return mix(C4, C0, (t - 0.5) * 10.0);
  return C0;
}

void main() {
  vec2 q = (vec2(vUv.x, 1.0 - vUv.y) + 0.1) / 1.2;
  vec2 layer = uSize * 1.2;
  vec2 image = layer * vec2(3.0, 2.0);
  vec2 p = vec2(mod(q.x * layer.x + uTime * uDrift * layer.x, image.x), q.y * layer.y + 0.5 * layer.y);
  vec2 dir = vec2(0.98481, 0.17365);
  float span = image.x * dir.x + image.y * dir.y;
  float t = dot(p - image * 0.5, dir) / span + 0.5;
  float mask = mix(1.0, 1.0 - clamp((length(vec2(q.x - 1.0, q.y)) / 1.41421 - 0.1) / 0.6, 0.0, 1.0), uMask);
  float alpha = 0.5 * mask;
  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  outColor = vec4(ramp(t) * alpha + dither, alpha);
}`

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

export function AuroraBackground({ children, showRadialMask = true, className, ...props }: AuroraBackgroundProps) {
  const reduceMotion = useReducedMotion()
  const layerRef = React.useRef<HTMLDivElement>(null)
  const fallbackRef = React.useRef<HTMLDivElement>(null)
  const maskRef = React.useRef(showRadialMask)
  const wakeRef = React.useRef<(() => void) | null>(null)

  React.useEffect(() => {
    const layer = layerRef.current
    const fallback = fallbackRef.current
    if (!layer || !fallback) return
    // Reduced motion keeps the CSS gradient, which is static and costs nothing after its first paint.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

    // The canvas is made here, not in JSX: React Strict Mode runs this effect twice in development, and
    // a context the first cleanup lost would come straight back from getContext() on the same element.
    const canvas = document.createElement("canvas")
    canvas.className = "absolute inset-0 block size-full"
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false })
    if (!gl) return

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
    const program = gl.createProgram()
    if (!vertex || !fragment || !program) {
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      return
    }
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      return
    }
    const vao = gl.createVertexArray()
    const uSize = gl.getUniformLocation(program, "uSize")
    const uTime = gl.getUniformLocation(program, "uTime")
    const uDrift = gl.getUniformLocation(program, "uDrift")
    const uMask = gl.getUniformLocation(program, "uMask")
    layer.appendChild(canvas)

    let width = 1
    let height = 1
    let time = 0
    let last = 0
    let raf = 0
    let visible = true
    let lost = false
    let replaced = false

    const draw = () => {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.uniform2f(uSize, width, height)
      gl.uniform1f(uTime, time)
      gl.uniform1f(uDrift, DRIFT)
      gl.uniform1f(uMask, maskRef.current ? 1 : 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      // The shader's first frame matches the CSS gradient's first frame, so the swap does not show.
      if (!replaced) {
        replaced = true
        fallback.style.display = "none"
      }
    }

    const frame = (now: number) => {
      raf = 0
      if (!visible || lost || document.hidden) return
      time += last ? Math.min(0.05, Math.max(1 / 240, (now - last) / 1000)) : 0
      last = now
      draw()
      raf = requestAnimationFrame(frame)
    }

    const wake = () => {
      if (!raf && visible && !lost && !document.hidden) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }

    const resize = () => {
      width = Math.max(1, layer.clientWidth)
      height = Math.max(1, layer.clientHeight)
      canvas.width = Math.max(1, Math.round(width * RESOLUTION))
      canvas.height = Math.max(1, Math.round(height * RESOLUTION))
      if (!raf && !lost) draw()
      wake()
    }

    // Losing the context (a GPU reset, too many contexts) hands the section back to the CSS gradient.
    const onLost = (event: Event) => {
      event.preventDefault()
      lost = true
      replaced = false
      cancelAnimationFrame(raf)
      raf = 0
      fallback.style.display = ""
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(layer)
    const intersection = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting)
      wake()
    })
    intersection.observe(layer)
    document.addEventListener("visibilitychange", wake)
    canvas.addEventListener("webglcontextlost", onLost)
    resize()
    wakeRef.current = () => {
      if (!raf && !lost) draw()
    }

    return () => {
      cancelAnimationFrame(raf)
      wakeRef.current = null
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener("visibilitychange", wake)
      canvas.removeEventListener("webglcontextlost", onLost)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      canvas.remove()
      fallback.style.display = ""
    }
  }, [])

  React.useEffect(() => {
    maskRef.current = showRadialMask
    wakeRef.current?.()
  }, [showRadialMask])

  return (
    <div
      data-slot="aurora-background"
      className={cn("relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden bg-background", className)}
      {...props}
    >
      <div ref={layerRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          ref={fallbackRef}
          data-slot="aurora-fallback"
          className={cn("absolute -inset-[10%] opacity-50 blur-[40px]", GRADIENT, showRadialMask && RADIAL_MASK)}
        />
      </div>
      <motion.div
        data-slot="aurora-content"
        className="relative z-10 flex w-full flex-col items-center"
        // `initial` must not depend on reduced motion: it is serialised into the SSR markup,
        // which the server always renders unreduced. Only the transition changes.
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  )
}

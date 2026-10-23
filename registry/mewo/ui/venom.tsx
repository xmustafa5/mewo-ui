"use client"

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface VenomProps extends Omit<ComponentProps<"div">, "color" | "children"> {
  /** The word the symbiote covers. Leave it out to cover `children` instead. */
  text?: string
  /** An `<svg>` to cover when there is no `text`. Only its shape is used. */
  children?: ReactNode
  /** Colour of the dark matter. */
  color?: string
  /** Colour of the wet highlights. */
  highlight?: string
  /** How many tendrils reach for the pointer. 0 keeps the symbiote on the shape. */
  tendrils?: number
  /** How far from the shape the pointer can be and still be reached, in pixels. */
  reach?: number
  /** Width of a tendril at its root, in pixels. */
  thickness?: number
  /** How much the tendrils writhe. */
  writhe?: number
  /** How much the surface crawls and its edge boils. */
  boil?: number
  /** Share of the box the shape fills, 0 to 1. */
  scale?: number
  /** Font for `text`. Defaults to the font the component inherits. */
  fontFamily?: string
  fontWeight?: number | string
  /** 0 freezes the surface; the tendrils still reach. */
  speed?: number
  /** Freeze everything; the last frame stays. */
  paused?: boolean
  /** Override the device pixel ratio, which is capped at 2. */
  dpr?: number
}

type Settings = {
  text: string
  svg: string
  color: string
  highlight: string
  tendrils: number
  reach: number
  thickness: number
  writhe: number
  boil: number
  scale: number
  fontFamily?: string
  fontWeight: number | string
  speed: number
  paused: boolean
  dpr?: number
}

type Tendril = {
  planted: boolean
  /** Where it grows from, on the shape's edge, and the edge's outward normal. */
  ax: number
  ay: number
  nx: number
  ny: number
  /** The tip, on a spring towards the pointer. */
  tipX: number
  tipY: number
  vx: number
  vy: number
  /** The last place the pointer was seen, so a tendril retracts from where it was reaching. */
  aimX: number
  aimY: number
  /** 0 retracted, 1 fully out. */
  ext: number
  wait: number
  letGo: boolean
  /** How far past its length the pointer is pulling it, 0 to 1. */
  strain: number
  seed: number
  spin: number
  orbit: number
  vigor: number
  twigAt: number
  twigSide: number
}

const PIXEL_BUDGET = 4.5e6
/** The goo field is smooth, so it is computed at CSS-pixel density at most, and within this budget. */
const FIELD_BUDGET = 1.2e6
/** The shape's distance field is rebuilt on the CPU when the shape or the box changes; this caps its cost. */
const SHAPE_BUDGET = 1.6e5
/** Edge points a tendril can grow from. */
const EDGE_POINTS = 720
const MAX_TENDRILS = 16
const SEGMENTS = 44
const TWIG_SEGMENTS = 18
const MAX_CAPSULES = MAX_TENDRILS * (SEGMENTS + TWIG_SEGMENTS - 2)
/** Per capsule: start x, y, end x, y, start radius, end radius. */
const FLOATS = 6
const TAU = Math.PI * 2
const INF = 1e20

const FULLSCREEN = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const NOISE = `
uvec3 pcg3(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
vec3 grad(vec3 cell) {
  uvec3 h = pcg3(uvec3(ivec3(cell) + 32768));
  return vec3(h & 0xffffu) / 32767.5 - 1.0;
}
float corner(vec3 i, vec3 f, vec3 o) {
  return dot(grad(i + o), f - o);
}
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = p - i;
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(mix(corner(i, f, vec3(0, 0, 0)), corner(i, f, vec3(1, 0, 0)), u.x),
        mix(corner(i, f, vec3(0, 1, 0)), corner(i, f, vec3(1, 1, 0)), u.x), u.y),
    mix(mix(corner(i, f, vec3(0, 0, 1)), corner(i, f, vec3(1, 0, 1)), u.x),
        mix(corner(i, f, vec3(0, 1, 1)), corner(i, f, vec3(1, 1, 1)), u.x), u.y),
    u.z);
}`

// The body: the shape's distance field, its edge boiling with noise and swelling towards the pointer.
// R is the goo field (0.5 at the surface), G the crawl that rides on top of it, A the height of the surface:
// a rounded profile `uDome` pixels wide, plus a swell under the pointer when it is over the shape.
const FIELD = `#version 300 es
precision highp float;
uniform sampler2D uSdf;
uniform vec2 uView;
uniform vec2 uField;
uniform float uTime;
uniform float uUnit;
uniform float uBoil;
uniform float uSoft;
uniform float uDome;
uniform vec4 uPull;
out vec4 outField;
${NOISE}
void main() {
  vec2 p = vec2(gl_FragCoord.x, uField.y - gl_FragCoord.y) / uField * uView;
  float d = texture(uSdf, p / uView).r;
  float bound = uBoil * 3.0 + uSoft * 1.2 + uPull.z;
  if (d > bound) {
    outField = vec4(0.0, 0.5, 0.0, 0.0);
    return;
  }
  vec2 q = p / uUnit;
  float t = uTime;
  float edge = noise(vec3(q * 0.022, t * 0.35)) + 0.5 * noise(vec3(q * 0.05 + 7.1, t * 0.6))
    + 1.2 * noise(vec3(q * 0.008 + 3.7, t * 0.15));
  float body = d - uBoil * edge;
  vec2 toPull = p - uPull.xy;
  float swell = uPull.z * exp(-dot(toPull, toPull) / (uPull.w * uPull.w));
  body -= swell;
  float field = 1.0 - smoothstep(-uSoft, uSoft, body);
  float rise = min(max(-body, 0.0) / uDome, 1.0);
  float height = sqrt(1.0 - (rise - 1.0) * (rise - 1.0)) * (1.0 + 0.6 * swell / uDome);
  vec2 warp = vec2(noise(vec3(q * 0.012, t * 0.2)), noise(vec3(q * 0.012 + 19.3, t * 0.2)));
  float crawl = noise(vec3(q * 0.035 + warp * 2.5, t * 0.45));
  crawl *= 1.0 - smoothstep(bound * 0.5, bound, d);
  outField = vec4(field, crawl * 0.5 + 0.5, 0.0, height);
}`

// A tendril is a chain of tapered capsules, one instance per segment, each measuring its exact distance so the
// tube stays round through every bend. Into B goes a soft falloff that the shading pass adds to the body's
// field, so the two melt together; into A a round profile. Both blend with MAX, so the chain has no seams.
const TENDRIL_VERTEX = `#version 300 es
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aSegment;
layout(location = 2) in vec2 aRadius;
uniform vec2 uView;
uniform float uSoft;
out vec2 vPoint;
flat out vec4 vSegment;
flat out vec2 vRadius;
void main() {
  vec2 axis = aSegment.zw - aSegment.xy;
  float len = length(axis);
  vec2 dir = len > 1e-4 ? axis / len : vec2(1.0, 0.0);
  float pad = max(aRadius.x, aRadius.y) + uSoft;
  vec2 point = (aSegment.xy + aSegment.zw) * 0.5 + dir * aCorner.x * (len * 0.5 + pad)
    + vec2(-dir.y, dir.x) * aCorner.y * pad;
  vPoint = point;
  vSegment = aSegment;
  vRadius = aRadius;
  vec2 clip = point / uView * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`

const TENDRIL_FRAGMENT = `#version 300 es
precision highp float;
uniform float uSoft;
uniform float uDome;
in vec2 vPoint;
flat in vec4 vSegment;
flat in vec2 vRadius;
out vec4 outField;
void main() {
  vec2 pa = vPoint - vSegment.xy;
  vec2 ba = vSegment.zw - vSegment.xy;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  float r = mix(vRadius.x, vRadius.y, h);
  float d = length(pa - ba * h);
  // A tube no thicker than the body's rounded edge is lower than it; a thicker one rises to the same top.
  float height = sqrt(max(r * r - d * d, 0.0)) / max(uDome, r);
  outField = vec4(0.0, 0.0, 1.0 - smoothstep(r - uSoft, r + uSoft, d), height);
}`

// The surface: wherever body and tendrils together pass 0.5, shaded as wet black with a hard key light and a
// rim that is brighter on the lit side. Where a tendril melts into the body the field's slope stands in for
// height.
const SHADE = `#version 300 es
precision highp float;
uniform sampler2D uField;
uniform vec2 uCanvas;
uniform vec2 uTexel;
uniform vec3 uColor;
uniform vec3 uHighlight;
uniform float uRelief;
uniform float uCrawl;
out vec4 outColor;
float height(vec4 v) {
  float f = v.r + v.b;
  return max(v.a, smoothstep(0.5, 1.0, f) * 0.35) + (v.g - 0.5) * uCrawl * smoothstep(0.55, 0.95, f);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uCanvas;
  vec4 c = texture(uField, uv);
  float f = c.r + c.b;
  float aa = fwidth(f) * 0.7 + 1e-4;
  float alpha = smoothstep(0.5 - aa, 0.5 + aa, f);
  if (alpha <= 0.0) {
    outColor = vec4(0.0);
    return;
  }
  vec2 dx = vec2(uTexel.x, 0.0);
  vec2 dy = vec2(0.0, uTexel.y);
  vec2 g = vec2(
    height(texture(uField, uv + dx)) - height(texture(uField, uv - dx)),
    height(texture(uField, uv + dy)) - height(texture(uField, uv - dy)));
  vec3 n = normalize(vec3(-g * uRelief, 1.0));
  vec3 key = normalize(normalize(vec3(-0.5, 0.65, 0.6)) + vec3(0.0, 0.0, 1.0));
  vec3 fill = normalize(normalize(vec3(0.6, -0.45, 0.65)) + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, key), 0.0), 70.0);
  float sheen = pow(max(dot(n, key), 0.0), 10.0);
  float back = pow(max(dot(n, fill), 0.0), 28.0);
  vec2 side = n.xy / max(length(n.xy), 1e-4);
  float rim = pow(1.0 - n.z, 3.0) * (0.3 + 0.7 * max(dot(side, vec2(-0.6, 0.8)), 0.0));
  vec3 color = uColor + uHighlight * (spec * 1.1 + sheen * 0.07 + back * 0.25 + rim * 0.35);
  outColor = vec4(min(color, vec3(1.0)) * alpha, alpha);
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

const link = (gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  if (!vertex || !fragment || !program) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program
  gl.deleteProgram(program)
  return null
}

const locate = (gl: WebGL2RenderingContext, program: WebGLProgram, names: string[]) =>
  Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)]))

/** One row or column of the Felzenszwalb–Huttenlocher squared distance transform, in place. */
const transform1d = (
  grid: Float64Array,
  offset: number,
  stride: number,
  length: number,
  f: Float64Array,
  v: Uint32Array,
  z: Float64Array,
) => {
  v[0] = 0
  z[0] = -INF
  z[1] = INF
  for (let q = 0; q < length; q++) f[q] = grid[offset + q * stride]
  for (let q = 1, k = 0, s = 0; q < length; q++) {
    do {
      const r = v[k]
      s = (f[q] - f[r] + q * q - r * r) / (q - r) / 2
    } while (s <= z[k] && --k > -1)
    k++
    v[k] = q
    z[k] = s
    z[k + 1] = INF
  }
  for (let q = 0, k = 0; q < length; q++) {
    while (z[k + 1] < q) k++
    const r = v[k]
    grid[offset + q * stride] = f[r] + (q - r) * (q - r)
  }
}

const transform2d = (grid: Float64Array, width: number, height: number) => {
  const size = Math.max(width, height)
  const f = new Float64Array(size)
  const v = new Uint32Array(size)
  const z = new Float64Array(size + 1)
  for (let x = 0; x < width; x++) transform1d(grid, x, width, height, f, v, z)
  for (let y = 0; y < height; y++) transform1d(grid, y * width, 1, width, f, v, z)
}

/** A box blur along rows, then columns, in place. Run on a distance field it rounds the creases at inner corners. */
const blur = (grid: Float32Array, width: number, height: number, radius: number) => {
  const line = new Float32Array(Math.max(width, height))
  const pass = (count: number, length: number, at: (i: number, k: number) => number) => {
    for (let i = 0; i < count; i++) {
      for (let k = 0; k < length; k++) line[k] = grid[at(i, k)]
      let sum = 0
      for (let k = -radius; k <= radius; k++) sum += line[clamp(k, 0, length - 1)]
      for (let k = 0; k < length; k++) {
        grid[at(i, k)] = sum / (radius * 2 + 1)
        sum += line[Math.min(k + radius + 1, length - 1)] - line[Math.max(k - radius, 0)]
      }
    }
  }
  pass(height, width, (y, x) => y * width + x)
  pass(width, height, (x, y) => y * width + x)
}

/** Signed distance from an anti-aliased mask, in mask pixels: negative inside. Edge pixels use their coverage. */
const signedDistance = (pixels: Uint8ClampedArray, width: number, height: number) => {
  const size = width * height
  const outer = new Float64Array(size)
  const inner = new Float64Array(size)
  for (let i = 0; i < size; i++) {
    const a = pixels[i * 4 + 3] / 255
    const d = 0.5 - a
    outer[i] = a === 1 ? 0 : a === 0 ? INF : d > 0 ? d * d : 0
    inner[i] = a === 0 ? 0 : a === 1 ? INF : d < 0 ? d * d : 0
  }
  transform2d(outer, width, height)
  transform2d(inner, width, height)
  const out = new Float32Array(size)
  for (let i = 0; i < size; i++) out[i] = Math.sqrt(outer[i]) - Math.sqrt(inner[i])
  return out
}

const makeTendril = (): Tendril => ({
  planted: false,
  ax: 0,
  ay: 0,
  nx: 0,
  ny: 0,
  tipX: 0,
  tipY: 0,
  vx: 0,
  vy: 0,
  aimX: 0,
  aimY: 0,
  ext: 0,
  wait: Math.random() * 0.4,
  letGo: false,
  strain: 0,
  seed: Math.random(),
  spin: (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 1.6),
  orbit: 6 + Math.random() * 22,
  vigor: 0.7 + Math.random() * 0.6,
  twigAt: 0.35 + Math.random() * 0.3,
  twigSide: Math.random() < 0.5 ? -1 : 1,
})

export function Venom({
  text,
  children,
  color = "#050507",
  highlight = "#ffffff",
  tendrils = 8,
  reach = 200,
  thickness = 6,
  writhe = 1,
  boil = 1,
  scale = 0.7,
  fontFamily,
  fontWeight = 300,
  speed = 1,
  paused = false,
  dpr,
  className,
  style,
  ...rest
}: VenomProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const settings: Settings = {
    text: text ?? "",
    svg: "",
    color,
    highlight,
    tendrils,
    reach,
    thickness,
    writhe,
    boil,
    scale,
    fontFamily,
    fontWeight,
    speed: Math.max(0, speed),
    paused,
    dpr,
  }
  const settingsRef = useRef(settings)
  const wakeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // The canvas is made here, not in JSX: React Strict Mode runs this effect twice in development, and the
    // context the first cleanup loses would come straight back from getContext() on the same element.
    const canvas = document.createElement("canvas")
    canvas.className = "pointer-events-none absolute inset-0 block h-full w-full"
    canvas.setAttribute("aria-hidden", "true")
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    })
    if (!gl) return
    // The shape is rasterised here once per change, and read back for its distance field.
    const mask = document.createElement("canvas")
    const ctx = mask.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const fieldProgram = link(gl, FULLSCREEN, FIELD)
    const tendrilProgram = link(gl, TENDRIL_VERTEX, TENDRIL_FRAGMENT)
    const shadeProgram = link(gl, FULLSCREEN, SHADE)
    if (!fieldProgram || !tendrilProgram || !shadeProgram) return
    root.appendChild(canvas)

    const fieldUniforms = locate(gl, fieldProgram, [
      "uSdf",
      "uView",
      "uField",
      "uTime",
      "uUnit",
      "uBoil",
      "uSoft",
      "uDome",
      "uPull",
    ])
    const tendrilUniforms = locate(gl, tendrilProgram, ["uView", "uSoft", "uDome"])
    const shadeUniforms = locate(gl, shadeProgram, [
      "uField",
      "uCanvas",
      "uTexel",
      "uColor",
      "uHighlight",
      "uRelief",
      "uCrawl",
    ])

    // Half floats keep the relief smooth; plain bytes are the fallback where they cannot be rendered to.
    const floatField = Boolean(gl.getExtension("EXT_color_buffer_float"))
    const fieldTexture = gl.createTexture()
    const sdfTexture = gl.createTexture()
    const framebuffer = gl.createFramebuffer()
    for (const texture of [fieldTexture, sdfTexture]) {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([4096]))

    const emptyVao = gl.createVertexArray()
    const tendrilVao = gl.createVertexArray()
    const instances = new Float32Array(MAX_CAPSULES * FLOATS)
    const cornerBuffer = gl.createBuffer()
    const instanceBuffer = gl.createBuffer()
    gl.bindVertexArray(tendrilVao)
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, instances.byteLength, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, FLOATS * 4, 0)
    gl.vertexAttribDivisor(1, 1)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, FLOATS * 4, 16)
    gl.vertexAttribDivisor(2, 1)
    gl.bindVertexArray(null)

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    const view = { width: 1, height: 1 }
    const field = { width: 1, height: 1, ratio: 1 }
    const shape = {
      key: "",
      generation: 0,
      sdf: new Float32Array([INF]),
      width: 1,
      height: 1,
      edge: new Float32Array(0),
      edges: 0,
      unit: 1,
      /** Half the width of the shape's thickest stroke, which sets how round the surface is. */
      depth: 20,
    }
    const pointer = { x: 0, y: 0, inside: false }
    const pull = { x: 0, y: 0, amount: 0 }
    const swarm = Array.from({ length: MAX_TENDRILS }, makeTendril)
    const line = new Float32Array(SEGMENTS * 2)
    const widths = new Float32Array(SEGMENTS)
    const colors = { key: "", body: [0, 0, 0], light: [1, 1, 1] }
    let presence = 0
    let capsules = 0
    let time = 0
    let clock = 0
    let raf = 0
    let last = 0
    let visible = true

    const parseColor = (value: string) => {
      ctx.fillStyle = "#000"
      ctx.fillStyle = value
      const hex = String(ctx.fillStyle)
      if (!hex.startsWith("#")) return [1, 1, 1]
      const n = parseInt(hex.slice(1), 16)
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
    }

    const sampleShape = (x: number, y: number) => {
      const { sdf, width, height } = shape
      const gx = clamp((x / view.width) * width - 0.5, 0, width - 1)
      const gy = clamp((y / view.height) * height - 0.5, 0, height - 1)
      const x0 = Math.floor(gx)
      const y0 = Math.floor(gy)
      const x1 = Math.min(x0 + 1, width - 1)
      const y1 = Math.min(y0 + 1, height - 1)
      const fx = gx - x0
      const fy = gy - y0
      const top = sdf[y0 * width + x0] + (sdf[y0 * width + x1] - sdf[y0 * width + x0]) * fx
      const bottom = sdf[y1 * width + x0] + (sdf[y1 * width + x1] - sdf[y1 * width + x0]) * fx
      return top + (bottom - top) * fy
    }

    // The mask becomes a distance field in CSS pixels, the edge points tendrils grow from, and a size unit
    // that keeps the boil and the crawl in proportion to the shape.
    const measureShape = (width: number, height: number) => {
      const sdf = signedDistance(ctx.getImageData(0, 0, width, height).data, width, height)
      const toCss = view.width / width
      for (let i = 0; i < sdf.length; i++) sdf[i] = clamp(sdf[i] * toCss, -4096, 4096)
      // Liquid has no sharp inside corners: two passes of about 4 CSS pixels round them off.
      const radius = Math.max(1, Math.round(4 / toCss))
      blur(sdf, width, height, radius)
      blur(sdf, width, height, radius)
      const points: number[] = []
      let depth = 0
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = y * width + x
          if (sdf[i] > 0) continue
          depth = Math.max(depth, -sdf[i])
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
          if (sdf[i - 1] > 0 || sdf[i + 1] > 0 || sdf[i - width] > 0 || sdf[i + width] > 0) {
            const gx = sdf[i + 1] - sdf[i - 1]
            const gy = sdf[i + width] - sdf[i - width]
            const length = Math.hypot(gx, gy) || 1
            points.push(((x + 0.5) / width) * view.width, ((y + 0.5) / height) * view.height, gx / length, gy / length)
          }
        }
      }
      const total = points.length / 4
      const stride = Math.max(1, Math.ceil(total / EDGE_POINTS))
      const edge = new Float32Array(Math.ceil(total / stride) * 4)
      for (let i = 0, j = 0; i < total; i += stride, j += 4) {
        for (let k = 0; k < 4; k++) edge[j + k] = points[i * 4 + k]
      }
      const size = total ? Math.sqrt((maxX - minX + 1) * (maxY - minY + 1)) * toCss : 200
      Object.assign(shape, {
        sdf,
        width,
        height,
        edge,
        edges: edge.length / 4,
        unit: clamp(size / 200, 0.5, 2.5),
        depth: depth || 20,
      })
      for (const tendril of swarm) tendril.letGo = tendril.planted
      gl.bindTexture(gl.TEXTURE_2D, sdfTexture)
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, width, height, 0, gl.RED, gl.FLOAT, sdf)
    }

    const rebuildShape = () => {
      const s = settingsRef.current
      const key = [view.width, view.height, s.scale, s.text, s.fontFamily, s.fontWeight, s.text ? "" : s.svg].join("|")
      if (key === shape.key) return
      shape.key = key
      const generation = ++shape.generation
      const ratio = Math.min(1, Math.sqrt(SHAPE_BUDGET / (view.width * view.height)))
      const width = Math.max(8, Math.round(view.width * ratio))
      const height = Math.max(8, Math.round(view.height * ratio))
      const fit = clamp(s.scale, 0.05, 1)
      const prepare = () => {
        mask.width = width
        mask.height = height
        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = "#000"
      }

      if (s.text) {
        prepare()
        const family = s.fontFamily || getComputedStyle(root).fontFamily || "sans-serif"
        ctx.font = `${s.fontWeight} 100px ${family}`
        const m = ctx.measureText(s.text)
        const glyphWidth = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
        const glyphHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
        if (glyphWidth > 0 && glyphHeight > 0) {
          const k = Math.min((width * fit) / glyphWidth, (height * fit) / glyphHeight)
          ctx.font = `${s.fontWeight} ${100 * k}px ${family}`
          const x = width / 2 - ((m.actualBoundingBoxRight - m.actualBoundingBoxLeft) * k) / 2
          const y = height / 2 + ((m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) * k) / 2
          ctx.fillText(s.text, x, y)
        }
        measureShape(width, height)
        return
      }

      const svg = holderRef.current?.querySelector("svg")
      if (!svg) {
        prepare()
        measureShape(width, height)
        return
      }
      const box = svg.viewBox?.baseVal
      const aspect =
        box && box.width > 0 && box.height > 0
          ? box.width / box.height
          : Number(svg.getAttribute("width")) / Number(svg.getAttribute("height")) || 1
      const drawWidth = Math.min(width * fit, height * fit * aspect)
      const drawHeight = drawWidth / aspect
      const clone = svg.cloneNode(true) as SVGSVGElement
      clone.setAttribute("width", String(drawWidth))
      clone.setAttribute("height", String(drawHeight))
      const image = new Image()
      image.onload = () => {
        if (generation !== shape.generation) return
        prepare()
        ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
        measureShape(width, height)
        wake()
      }
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`
    }

    /** The edge point nearest the pointer, and its distance. */
    const nearestEdge = () => {
      const { edge, edges } = shape
      let nearest = -1
      let closest = Infinity
      for (let i = 0; i < edges; i++) {
        const d = Math.hypot(edge[i * 4] - pointer.x, edge[i * 4 + 1] - pointer.y)
        if (d < closest) {
          closest = d
          nearest = i
        }
      }
      return [nearest, closest] as const
    }

    /** How directly the edge a tendril grows from faces the pointer, -1 to 1. */
    const facing = (x: number, y: number, nx: number, ny: number) => {
      const d = Math.hypot(pointer.x - x, pointer.y - y)
      return d > 0.001 ? ((pointer.x - x) * nx + (pointer.y - y) * ny) / d : 1
    }

    const plant = (tendril: Tendril, nearest: number, closest: number, band: number) => {
      const { edge, edges } = shape
      if (nearest < 0) return
      // Grow from near the pointer, on an edge that faces it, as far from the other tendrils as possible.
      let pick = nearest
      let best = -Infinity
      for (let i = 0; i < edges; i++) {
        const ex = edge[i * 4]
        const ey = edge[i * 4 + 1]
        const d = Math.hypot(ex - pointer.x, ey - pointer.y)
        if (d > closest + band) continue
        if (facing(ex, ey, edge[i * 4 + 2], edge[i * 4 + 3]) < 0.1) continue
        let spacing = 120
        for (const other of swarm) {
          if (other !== tendril && other.planted) spacing = Math.min(spacing, Math.hypot(other.ax - ex, other.ay - ey))
        }
        const score = spacing + Math.random() * 30 - (d - closest) * 0.25
        if (score > best) {
          best = score
          pick = i
        }
      }
      Object.assign(tendril, {
        planted: true,
        ax: edge[pick * 4],
        ay: edge[pick * 4 + 1],
        nx: edge[pick * 4 + 2],
        ny: edge[pick * 4 + 3],
        tipX: edge[pick * 4],
        tipY: edge[pick * 4 + 1],
        vx: 0,
        vy: 0,
        ext: 0,
        strain: 0,
        letGo: false,
      })
    }

    // Moves the swarm one step. Returns whether anything is still moving.
    const update = (dt: number) => {
      const s = settingsRef.current
      const count = reduced ? 0 : clamp(Math.round(s.tendrils), 0, MAX_TENDRILS)
      const reachPx = Math.max(1, s.reach)
      const longest = reachPx * 1.5
      const distance = pointer.inside && shape.edges ? sampleShape(pointer.x, pointer.y) : Infinity
      const near = !reduced && distance < reachPx
      // Over the shape the symbiote already has the pointer: the tendrils go back in and the surface swells.
      const active = near && distance > 0
      presence += ((active ? 1 : 0) - presence) * (1 - Math.exp(-dt / 0.3))

      // The body swells towards the pointer from the point of its edge nearest to it, or under it.
      let pullTarget = 0
      if (near) {
        const gx = sampleShape(pointer.x + 2, pointer.y) - sampleShape(pointer.x - 2, pointer.y)
        const gy = sampleShape(pointer.x, pointer.y + 2) - sampleShape(pointer.x, pointer.y - 2)
        const length = Math.hypot(gx, gy) || 1
        const lean = Math.max(0, distance)
        const qx = pointer.x - (gx / length) * lean
        const qy = pointer.y - (gy / length) * lean
        const follow = pull.amount < 0.05 ? 1 : 1 - Math.exp(-dt / 0.08)
        pull.x += (qx - pull.x) * follow
        pull.y += (qy - pull.y) * follow
        pullTarget = s.thickness * 1.6 * (0.35 + 0.65 * (1 - clamp(distance / reachPx, 0, 1)))
      }
      pull.amount += (pullTarget - pull.amount) * (1 - Math.exp(-dt / 0.25))

      const [nearest, closest] = active ? nearestEdge() : [-1, Infinity]
      const band = Math.max(40, reachPx * 0.45)
      let busy = near || presence > 0.002 || pull.amount > 0.05
      for (let i = 0; i < MAX_TENDRILS; i++) {
        const tendril = swarm[i]
        const wanted = active && i < count && !tendril.letGo
        if (!tendril.planted) {
          if (!wanted) continue
          tendril.wait -= dt
          if (tendril.wait <= 0) plant(tendril, nearest, closest, band)
          if (!tendril.planted) continue
        }
        if (active) {
          tendril.aimX = pointer.x
          tendril.aimY = pointer.y
          // Rooted somewhere that no longer faces the pointer, or far from where it could grow now: let go,
          // then grow again from a better place.
          const from = Math.hypot(pointer.x - tendril.ax, pointer.y - tendril.ay)
          if (from > closest + band * 1.6 || facing(tendril.ax, tendril.ay, tendril.nx, tendril.ny) < -0.2) {
            tendril.letGo = true
          }
        }
        const out = active && i < count && !tendril.letGo
        tendril.ext = out
          ? Math.min(1, tendril.ext + dt * 1.4 * tendril.vigor)
          : Math.max(0, tendril.ext - dt * 2.2)
        if (!out && tendril.ext === 0) {
          tendril.planted = false
          tendril.letGo = false
          tendril.wait = Math.random() * 0.35
          continue
        }
        busy = true

        // The tips circle the pointer, as if trying to close around it, and strain when it is out of reach.
        const angle = tendril.seed * TAU + clock * tendril.spin
        let tx = tendril.aimX + Math.cos(angle) * tendril.orbit
        let ty = tendril.aimY + Math.sin(angle) * tendril.orbit
        const length = Math.hypot(tx - tendril.ax, ty - tendril.ay)
        tendril.strain = clamp((length - longest) / longest, 0, 1)
        if (length > longest) {
          tx = tendril.ax + ((tx - tendril.ax) / length) * longest
          ty = tendril.ay + ((ty - tendril.ay) / length) * longest
        }
        const stiffness = 70 * tendril.vigor
        const damping = 0.9 * Math.sqrt(stiffness)
        const steps = Math.ceil(dt * 120)
        const h = dt / steps
        for (let n = 0; n < steps; n++) {
          tendril.vx += (stiffness * (tx - tendril.tipX) - damping * tendril.vx) * h
          tendril.vy += (stiffness * (ty - tendril.tipY) - damping * tendril.vy) * h
          tendril.tipX += tendril.vx * h
          tendril.tipY += tendril.vy * h
        }
      }
      return busy
    }

    // Writes the polyline in `line` and `widths` as one capsule per segment.
    const emit = (points: number) => {
      for (let j = 0; j < points - 1; j++) {
        const o = capsules * FLOATS
        instances[o] = line[j * 2]
        instances[o + 1] = line[j * 2 + 1]
        instances[o + 2] = line[j * 2 + 2]
        instances[o + 3] = line[j * 2 + 3]
        instances[o + 4] = widths[j]
        instances[o + 5] = widths[j + 1]
        capsules++
      }
    }

    // A cubic from (x0, y0) leaving along (dx0, dy0), to (x3, y3) arriving along (dx3, dy3), with a travelling
    // wave along its own normal so it is never a straight line.
    const curve = (
      points: number,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x3: number,
      y3: number,
      amplitude: number,
      phase: number,
      pace: number,
    ) => {
      for (let j = 0; j < points; j++) {
        const s = j / (points - 1)
        const u = 1 - s
        const bx = u * u * u * x0 + 3 * u * u * s * x1 + 3 * u * s * s * x2 + s * s * s * x3
        const by = u * u * u * y0 + 3 * u * u * s * y1 + 3 * u * s * s * y2 + s * s * s * y3
        const dx = 3 * u * u * (x1 - x0) + 6 * u * s * (x2 - x1) + 3 * s * s * (x3 - x2)
        const dy = 3 * u * u * (y1 - y0) + 6 * u * s * (y2 - y1) + 3 * s * s * (y3 - y2)
        const length = Math.hypot(dx, dy) || 1
        const wave =
          (Math.sin(s * 9 - clock * 5 * pace + phase * 20) + 0.5 * Math.sin(s * 17 + clock * 3.3 + phase * 7)) *
          amplitude *
          Math.sin(Math.PI * s) ** 0.8
        line[j * 2] = bx - (dy / length) * wave
        line[j * 2 + 1] = by + (dx / length) * wave
      }
    }

    const buildTendrils = () => {
      const s = settingsRef.current
      const thick = Math.max(1, s.thickness)
      const writheAmount = Math.max(0, s.writhe)
      capsules = 0
      for (const tendril of swarm) {
        if (!tendril.planted || tendril.ext <= 0.001) continue
        const e = 1 - (1 - tendril.ext) ** 3
        // The root starts inside the body so the two melt together.
        const x0 = tendril.ax - tendril.nx * thick * 0.8
        const y0 = tendril.ay - tendril.ny * thick * 0.8
        const x3 = tendril.ax + (tendril.tipX - tendril.ax) * e
        const y3 = tendril.ay + (tendril.tipY - tendril.ay) * e
        const length = Math.hypot(x3 - x0, y3 - y0) || 0.001
        const dx = (x3 - x0) / length
        const dy = (y3 - y0) / length
        const bend =
          Math.sin(clock * 1.1 * tendril.spin + tendril.seed * 9) * 0.3 +
          tendril.strain * Math.sin(clock * 13 + tendril.seed * 40) * 0.12
        curve(
          SEGMENTS,
          x0,
          y0,
          x0 + tendril.nx * length * 0.4,
          y0 + tendril.ny * length * 0.4,
          x3 - dx * length * 0.35 - dy * length * bend,
          y3 - dy * length * 0.35 + dx * length * bend,
          x3,
          y3,
          Math.min(length * 0.08, thick * 2.4) * writheAmount * (1 + tendril.strain),
          tendril.seed,
          tendril.vigor,
        )
        // Tapers to a point, flares where it leaves the body as if pulled out of it, and pulses along its length.
        for (let j = 0; j < SEGMENTS; j++) {
          const s = j / (SEGMENTS - 1)
          const taper = (1 - s) ** 0.8 + 0.35 * (1 - s) ** 6
          widths[j] = thick * (0.3 + 0.7 * e) * taper * (1 + 0.22 * Math.sin(s * 12 - clock * 7 + tendril.seed * 5))
        }
        // The branch is read off the parent before the parent's line is overwritten.
        const at = Math.round(tendril.twigAt * (SEGMENTS - 1))
        const sx = line[at * 2]
        const sy = line[at * 2 + 1]
        const tx = line[at * 2 + 2] - line[at * 2 - 2]
        const ty = line[at * 2 + 3] - line[at * 2 - 1]
        const tangent = Math.hypot(tx, ty) || 1
        const rootWidth = widths[at] * 0.75
        emit(SEGMENTS)

        const grown = clamp((tendril.ext - 0.35) / 0.65, 0, 1)
        if (grown <= 0.01) continue
        const twigLength = length * (1 - tendril.twigAt) * 0.6 * (1 - (1 - grown) ** 3)
        const turn = tendril.twigSide * (0.75 + 0.3 * Math.sin(clock * 1.7 + tendril.seed * 3))
        const ux = tx / tangent
        const uy = ty / tangent
        const vx = ux * Math.cos(turn) - uy * Math.sin(turn)
        const vy = ux * Math.sin(turn) + uy * Math.cos(turn)
        const ex = sx + vx * twigLength
        const ey = sy + vy * twigLength
        const sway = Math.sin(clock * 2.1 + tendril.seed * 11) * 0.2
        curve(
          TWIG_SEGMENTS,
          sx,
          sy,
          sx + ux * twigLength * 0.45,
          sy + uy * twigLength * 0.45,
          ex - vx * twigLength * 0.3 - vy * twigLength * sway,
          ey - vy * twigLength * 0.3 + vx * twigLength * sway,
          ex,
          ey,
          Math.min(twigLength * 0.1, thick * 1.5) * writheAmount,
          tendril.seed + 0.5,
          tendril.vigor * 1.3,
        )
        for (let j = 0; j < TWIG_SEGMENTS; j++) widths[j] = rootWidth * (1 - j / (TWIG_SEGMENTS - 1)) ** 0.8
        emit(TWIG_SEGMENTS)
      }
    }

    const render = () => {
      const s = settingsRef.current
      if (s.color + s.highlight !== colors.key) {
        colors.key = s.color + s.highlight
        colors.body = parseColor(s.color)
        colors.light = parseColor(s.highlight)
      }
      const thick = Math.max(1, s.thickness)
      const soft = Math.max(4, thick * 0.8)
      const boilAmount = reduced ? 0 : Math.max(0, s.boil)
      const dome = clamp(shape.depth * 0.55, 4, 28)

      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
      gl.viewport(0, 0, field.width, field.height)
      gl.disable(gl.BLEND)
      gl.useProgram(fieldProgram)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, sdfTexture)
      gl.uniform1i(fieldUniforms.uSdf, 0)
      gl.uniform2f(fieldUniforms.uView, view.width, view.height)
      gl.uniform2f(fieldUniforms.uField, field.width, field.height)
      gl.uniform1f(fieldUniforms.uTime, time)
      gl.uniform1f(fieldUniforms.uUnit, shape.unit)
      gl.uniform1f(fieldUniforms.uBoil, boilAmount * 2.6 * shape.unit)
      gl.uniform1f(fieldUniforms.uSoft, soft)
      gl.uniform1f(fieldUniforms.uDome, dome)
      gl.uniform4f(fieldUniforms.uPull, pull.x, pull.y, pull.amount, thick * 3.5 + 18)
      gl.bindVertexArray(emptyVao)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      if (capsules) {
        // Overlapping capsules keep the larger value, so a chain reads as one smooth tube. The body is in R,
        // which this pass leaves alone; the shading pass adds the two so they melt together.
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE)
        gl.blendEquation(gl.MAX)
        gl.colorMask(false, false, true, true)
        gl.useProgram(tendrilProgram)
        gl.uniform2f(tendrilUniforms.uView, view.width, view.height)
        gl.uniform1f(tendrilUniforms.uSoft, soft)
        gl.uniform1f(tendrilUniforms.uDome, dome)
        gl.bindVertexArray(tendrilVao)
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, instances, 0, capsules * FLOATS)
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, capsules)
        gl.colorMask(true, true, true, true)
        gl.blendEquation(gl.FUNC_ADD)
        gl.disable(gl.BLEND)
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(shadeProgram)
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture)
      gl.uniform1i(shadeUniforms.uField, 0)
      gl.uniform2f(shadeUniforms.uCanvas, canvas.width, canvas.height)
      gl.uniform2f(shadeUniforms.uTexel, 1 / field.width, 1 / field.height)
      gl.uniform3f(shadeUniforms.uColor, colors.body[0], colors.body[1], colors.body[2])
      gl.uniform3f(shadeUniforms.uHighlight, colors.light[0], colors.light[1], colors.light[2])
      // Height is in units of the dome, so this makes the slope at its middle about 45 degrees at any size.
      gl.uniform1f(shadeUniforms.uRelief, dome * field.ratio * 0.5)
      gl.uniform1f(shadeUniforms.uCrawl, 0.6 * boilAmount)
      gl.bindVertexArray(emptyVao)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.bindVertexArray(null)
    }

    const frame = (now: number) => {
      raf = 0
      if (!visible || document.hidden) return
      const s = settingsRef.current
      // dt is clamped so a tab switch does not jump the animation.
      const dt = last ? clamp((now - last) / 1000, 1 / 240, 0.05) : 1 / 60
      last = now
      rebuildShape()
      const crawling = !s.paused && !reduced && s.speed > 0
      if (crawling) time += dt * s.speed
      let busy = false
      if (!s.paused) {
        busy = update(dt)
        if (busy) clock += dt * (s.speed > 0 ? s.speed : 1)
      }
      buildTendrils()
      render()
      // Keep looping only while something moves: the surface, or a tendril, or the pull of the pointer.
      if (crawling || busy) raf ||= requestAnimationFrame(frame)
      else last = 0
    }

    const wake = () => {
      // Never schedule while off-screen or in a hidden tab.
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const resize = () => {
      const s = settingsRef.current
      view.width = Math.max(1, root.clientWidth)
      view.height = Math.max(1, root.clientHeight)
      const area = view.width * view.height
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / area))
      canvas.width = Math.max(1, Math.round(view.width * ratio))
      canvas.height = Math.max(1, Math.round(view.height * ratio))
      field.ratio = Math.min(ratio, 1, Math.sqrt(FIELD_BUDGET / area))
      field.width = Math.max(1, Math.round(view.width * field.ratio))
      field.height = Math.max(1, Math.round(view.height * field.ratio))
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture)
      if (floatField) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, field.width, field.height, 0, gl.RGBA, gl.HALF_FLOAT, null)
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, field.width, field.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fieldTexture, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      wake()
    }

    const onMove = (event: PointerEvent) => {
      if (reduced) return
      const rect = root.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height
      if (!inside && !pointer.inside) return
      // The root may be scaled by CSS; the field lives in its layout pixels.
      pointer.x = (x / rect.width) * view.width
      pointer.y = (y / rect.height) * view.height
      pointer.inside = inside
      // Only a pointer within reach starts the loop; one leaving it finds the loop running and lets it settle.
      if (inside && sampleShape(pointer.x, pointer.y) < settingsRef.current.reach) wake()
    }

    // A running loop sees this and lets the tendrils go back in; an idle one has nothing to undo.
    const onLeave = () => {
      pointer.inside = false
    }

    const onOut = (event: PointerEvent) => {
      if (!event.relatedTarget) onLeave()
    }

    const onVisibility = () => {
      last = 0
      wake()
    }

    const onFonts = () => {
      // A web font that finishes loading changes the shape of the text.
      shape.key = ""
      wake()
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onMove, { passive: true })
    window.addEventListener("pointerout", onOut, { passive: true })
    window.addEventListener("blur", onLeave)
    document.addEventListener("visibilitychange", onVisibility)
    document.fonts?.addEventListener("loadingdone", onFonts)
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
    resize()
    wakeRef.current = wake

    return () => {
      cancelAnimationFrame(raf)
      shape.generation++
      wakeRef.current = null
      resizeObserver.disconnect()
      intersection.disconnect()
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onMove)
      window.removeEventListener("pointerout", onOut)
      window.removeEventListener("blur", onLeave)
      document.removeEventListener("visibilitychange", onVisibility)
      document.fonts?.removeEventListener("loadingdone", onFonts)
      gl.deleteBuffer(cornerBuffer)
      gl.deleteBuffer(instanceBuffer)
      gl.deleteVertexArray(tendrilVao)
      gl.deleteVertexArray(emptyVao)
      gl.deleteFramebuffer(framebuffer)
      gl.deleteTexture(fieldTexture)
      gl.deleteTexture(sdfTexture)
      gl.deleteProgram(fieldProgram)
      gl.deleteProgram(tendrilProgram)
      gl.deleteProgram(shadeProgram)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      canvas.remove()
    }
  }, [])

  // Props reach the loop through a ref written here, never in render. The SVG is read from the hidden copy
  // React keeps of it, so a changed icon is picked up like any other prop.
  useEffect(() => {
    settingsRef.current = { ...settings, svg: settings.text ? "" : (holderRef.current?.innerHTML ?? "") }
    wakeRef.current?.()
  })

  return (
    <div
      ref={rootRef}
      data-slot="venom"
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={style}
      {...rest}
    >
      {settings.text ? <span className="sr-only">{settings.text}</span> : null}
      {settings.text ? null : (
        <div ref={holderRef} hidden>
          {children}
        </div>
      )}
    </div>
  )
}

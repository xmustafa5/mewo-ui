"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface PictureCloudControls {
  /** Moves the cloud to a point in its sequence, 0 to 1, without a React render (call it from a scroll handler). */
  setProgress: (progress: number) => void
}

export interface PictureCloudProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Pictures for the tiles, cycled. Left out, the tiles are painted in the warm stone tones of old museum objects. */
  images?: string[]
  /** Where the cloud is in its sequence, 0 to 1: a ring of petals forms, drifts into a pile, a second ring flies in
   * and follows, the pile grows into a turning ball that ghosts, pulls back, slides aside and fades. */
  progress?: number
  /** `setProgress(p)`, to drive it every frame (from a scroll position, say) without re-rendering. */
  controlsRef?: React.Ref<PictureCloudControls>
  /** How many tiles make the ball; the rings scale with it. */
  count?: number
  /** Petals in the first ring. */
  petals?: number
  /** Faint outlined squares around the ball in the later part of the sequence. */
  outlines?: boolean
  /** Override the device pixel ratio, which is capped at 2. */
  dpr?: number
}

type Settings = { images: string[]; count: number; petals: number; outlines: boolean; dpr?: number }
type Keys = readonly (readonly [number, number])[]

// The sequence, in the scroll positions it was measured at (viewport heights of a long story): progress 0 to 1 maps
// onto START to END. Every length is in heights of the cloud's box from its centre, y down.
const START = 50.4
const END = 84
const PIXEL_BUDGET = 4.5e6
const SPACING = 0.7
const SIZE = { ring: 0.0156, ball: 0.0133 }
const ASPECTS = [0.667, 0.833, 1, 1.2, 1.667]
const MOTION = {
  converge: [51.8, 57.4, 0.15, 1.6], // the first ring drifts into the centre pile: start, end, stagger share, ease power
  core: 0.075, // the pile's radius
  keep: 0.12, // share of tiles that stay visible in the pile
  ringIn: [57.4, 58.8, 0.3, 2], // the second ring flies in from outside
  ringOut: [58.6, 61.4, 0.15, 1.6], // and drifts into the centre
  ringFrom: 1.8, // how far out it starts, × its place
  form: [60.2, 61.8, 0.35, 2], // the pile grows into the ball
  grow: [60.2, 61.8, 0.2], // the ball's scale as it forms: from, to, starting scale
  pull: [70.6, 71.5, 0.76], // the ball pulls back once: from, to, final scale
  turnFrom: 60.2, // the ball turns about its vertical axis from here
  turn: 0.35, // radians per viewport height of scroll
  ghost: [63.6, 67.8], // the shell ghosts, the core stays
  ball: { share: 0.1, rc: 0.13, rin: 0.16, R: 0.3, faint: 0.113 },
  fog: { centre: 0.4, slope: 0.75, max: 0.75 }, // the far side fades towards the page colour
} as const
const SPREAD: Keys = [[50.4, 1], [50.45, 1], [50.6, 1.7], [50.7, 1.661], [51.05, 1.385], [51.2, 1.309], [51.45, 1.034], [51.6, 1]]
const OPACITY: Keys = [[50.4, 0.135], [50.5, 0.279], [50.65, 0.378], [50.8, 0.548], [50.9, 0.636], [51.2, 0.794], [51.45, 0.958], [51.6, 1], [82.85, 0.967], [83.05, 0.706], [83.25, 0.31], [83.4, 0.16], [83.55, 0]]
const GHOST: Keys = [[63.7, 0.005], [63.9, 0.064], [64.05, 0.166], [64.2, 0.36], [64.4, 0.711], [64.55, 0.886], [64.65, 0.955], [64.85, 1], [66.65, 1], [66.85, 0.958], [66.95, 0.885], [67.05, 0.777], [67.2, 0.549], [67.3, 0.361], [67.45, 0.172], [67.6, 0.064], [67.85, 0]]
const CENTRE_X: Keys = [[75.4, 0], [75.75, 0.078], [76.35, 0.288], [76.7, 0.339], [83.35, 0.335], [83.45, 0.27], [83.55, 0.063], [83.6, 0.016]]
const SQUARES: Keys = [[64.35, 0], [64.55, 0.097], [66.95, 0.097], [67.15, 0], [70.65, 0], [70.95, 0.452], [71.4, 1], [82.75, 1], [83.15, 0.624], [83.55, 0]]
// tiles near the centre of a ring are faint: opacity by distance from the centre
const FADE_A: Keys = [[0.02, 1], [0.06, 0.072], [0.1, 0.338], [0.14, 0.603], [0.18, 0.898], [0.22, 0.961], [0.26, 0.906], [0.3, 0.942], [0.34, 0.929], [0.38, 1], [0.42, 0.974]]
const FADE_B: Keys = [[0.02, 1], [0.06, 1], [0.1, 0.412], [0.14, 0.636], [0.18, 0.87], [0.22, 0.904], [0.26, 0.936], [0.3, 0.932], [0.34, 0.929], [0.38, 0.93], [0.42, 0.89]]
// the generated tiles' grounds, by quantile: warm greys and browns of old stone and clay
const TONES: [number, [number, number, number]][] = [[0, [65, 58, 53]], [0.1, [81, 73, 66]], [0.5, [124, 117, 97]], [0.9, [148, 130, 125]], [1, [166, 151, 146]]]
const TONE_CELLS = 24
const CELL = 128
const OUTLINE_ALPHA = 0.05
// reduced motion: the sequence jumps between its resting shapes instead of flowing
const RESTS: Keys = [[56, 51.7], [59.5, 58.7], [63, 62], [68, 65.5], [73, 72], [83, 78], [Infinity, 84]]

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number, p: number) => (x < 0.5 ? (2 * x) ** p / 2 : 1 - (2 - 2 * x) ** p / 2)

/** A keyframed value at v, linear between keys and held past either end. */
export function valueAt(keys: Keys, v: number) {
  if (v <= keys[0]![0]) return keys[0]![1]
  for (let i = 1; i < keys.length; i++) {
    const [b, vb] = keys[i]!
    if (v <= b) {
      const [a, va] = keys[i - 1]!
      return va + ((vb - va) * (v - a)) / (b - a)
    }
  }
  return keys[keys.length - 1]![1]
}

/** How strongly a point at angle theta (radians, y down) belongs to a ring of petals, one petal centred at the top:
 * 1 inside a petal, 0 in the gaps between them, with `gap` the share of each petal's span that fades. */
export function petalWeight(theta: number, petals: number, gap: number) {
  const span = (2 * Math.PI) / Math.max(1, petals)
  const phase = ((((theta + Math.PI / 2) / span + 0.5) % 1) + 1) % 1
  const edge = (x: number) => (x >= 1 ? 1 : x <= 0 ? 0 : x * x * (3 - 2 * x))
  return edge(phase / gap) * edge((1 - phase) / gap)
}

/** The scroll position the sequence shows at progress p (0 to 1), snapped to its resting shapes for reduced motion. */
export function sequenceAt(p: number, reduced = false) {
  const v = START + clamp01(p) * (END - START)
  if (!reduced) return v
  for (const [below, rest] of RESTS) if (v < below) return rest
  return END
}

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const fadeAt = (profile: Keys, r: number) => {
  let a = profile[0]![1]
  for (const [rr, v] of profile) if (r >= rr - 0.02) a = v
  return a
}

type Ring = { petals: number; gap: number; radius: number; width: number; inner: number; innerRadius: number }
// the share `inner` is of the places drawn; a petal's edges reject ring draws (on average `gap` of them), so the
// chance of drawing inside is set to keep that share among the accepted places

// n places in a ring of petals, kept apart by SPACING × the tile size where possible, plus a share scattered inside
function ringPlaces(n: number, r: () => number, ring: Ring) {
  const out: [number, number][] = []
  const dmin = SPACING * SIZE.ring
  const grid = new Map<string, [number, number][]>()
  const cellOf = (x: number, y: number, a = 0, b = 0) => `${Math.floor(x / dmin) + a}:${Math.floor(y / dmin) + b}`
  const near = (x: number, y: number) => {
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++) for (const [px, py] of grid.get(cellOf(x, y, a, b)) ?? []) if (Math.hypot(px - x, py - y) < dmin) return true
    return false
  }
  const kept = 1 - ring.gap
  const innerChance = (ring.inner * kept) / (1 - ring.inner + ring.inner * kept)
  for (let tries = 0; out.length < n && tries < n * 400; tries++) {
    const theta = r() * Math.PI * 2
    let rad: number
    if (r() < innerChance) rad = ring.innerRadius * r()
    else {
      if (r() > petalWeight(theta, ring.petals, ring.gap)) continue
      rad = ring.radius + ring.width * Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r())
    }
    const x = Math.cos(theta) * rad
    const y = Math.sin(theta) * rad
    if (tries < n * 60 && near(x, y)) continue
    out.push([x, y])
    const k = cellOf(x, y)
    grid.set(k, [...(grid.get(k) ?? []), [x, y]])
  }
  return out.sort((p, q) => Math.atan2(p[1], p[0]) - Math.atan2(q[1], q[0]))
}

type Tiles = {
  n: number
  ax: Float32Array; ay: Float32Array; bx: Float32Array; by: Float32Array; cx: Float32Array; cy: Float32Array
  sx: Float32Array; sy: Float32Array; sz: Float32Array
  fa: Float32Array; fb: Float32Array; delay: Float32Array; aspect: Float32Array; cell: Uint16Array
  core: Uint8Array; keep: Uint8Array; ring: Uint8Array
}

// the ball's tiles (which also make the first ring and the pile), then the second ring's own tiles
function buildTiles(count: number, petals: number, cells: number): Tiles {
  const r = rng(5)
  const nS = Math.max(50, Math.round(count))
  const A = ringPlaces(Math.round((nS * 470) / 1766), r, { petals, gap: 0.3, radius: 0.365, width: 0.022, inner: 0.25, innerRadius: 0.3 })
  const B = ringPlaces(Math.round((nS * 806) / 1766), r, { petals: 5, gap: 0.3, radius: 0.35, width: 0.04, inner: 0.21, innerRadius: 0.28 })
  const { share, rc, rin, R } = MOTION.ball
  const inBall = (r0: number, r1: number): [number, number, number] => {
    const s = Math.cbrt(r0 ** 3 + r() * (r1 ** 3 - r0 ** 3))
    const ct = 2 * r() - 1
    const ph = 2 * Math.PI * r()
    const st = Math.sqrt(1 - ct * ct)
    return [s * st * Math.cos(ph), s * st * Math.sin(ph), s * ct]
  }
  const nCore = Math.round(nS * share)
  const n = nS + B.length
  const f = () => new Float32Array(n)
  const t: Tiles = {
    n, ax: f(), ay: f(), bx: f(), by: f(), cx: f(), cy: f(), sx: f(), sy: f(), sz: f(), fa: f(), fb: f(), delay: f(), aspect: f(),
    cell: new Uint16Array(n), core: new Uint8Array(n), keep: new Uint8Array(n), ring: new Uint8Array(n),
  }
  for (let k = 0; k < n; k++) {
    const ring = k >= nS
    const pa = A[k % Math.max(1, A.length)] ?? [0, 0]
    const pb = (ring ? B[k - nS] : B[k % Math.max(1, B.length)]) ?? [0, 0]
    const ks = k % nS
    const s = ks < nCore ? inBall(0, rc) : inBall(rin, R)
    const ang = r() * Math.PI * 2
    const rad = MOTION.core * Math.sqrt(r())
    t.ax[k] = pa[0]; t.ay[k] = pa[1]; t.bx[k] = pb[0]; t.by[k] = pb[1]
    t.cx[k] = Math.cos(ang) * rad; t.cy[k] = Math.sin(ang) * rad
    t.sx[k] = s[0]; t.sy[k] = s[1]; t.sz[k] = s[2]
    t.core[k] = ks < nCore ? 1 : 0
    t.keep[k] = r() < MOTION.keep ? 1 : 0
    t.ring[k] = ring ? 1 : 0
    t.fa[k] = fadeAt(FADE_A, Math.hypot(pa[0], pa[1]))
    t.fb[k] = fadeAt(FADE_B, Math.hypot(pb[0], pb[1]))
    t.delay[k] = r()
    t.aspect[k] = ASPECTS[Math.floor(r() * ASPECTS.length)]!
    t.cell[k] = Math.floor(r() * cells)
  }
  return t
}

// a tile's own progress through a staggered move: its delay takes up `share` of the window
const staggered = (v: number, [v0, v1, share, power]: readonly number[], delay: number) =>
  ease(clamp01(((v - v0!) / (v1! - v0!) - share! * delay) / Math.max(0.05, 1 - share!)), power!)

type Placed = { x: Float32Array; y: Float32Array; w: Float32Array; h: Float32Array; alpha: Float32Array; depth: Float32Array; fog: Float32Array }

// every tile's box, opacity, depth and fog at scroll position v
function place(T: Tiles, v: number, out: Placed) {
  const M = MOTION
  const inFlow = v >= M.converge[0] && v < M.form[1]
  const inGhost = v >= M.ghost[0] && v <= M.ghost[1]
  const spread = inFlow || inGhost ? 1 : valueAt(SPREAD, v)
  const opacity = v < M.converge[0] || v >= 82.5 ? valueAt(OPACITY, v) : 1
  const ghost = valueAt(GHOST, v)
  const shiftX = valueAt(CENTRE_X, v)
  const ball = v >= M.form[0]
  const th = Math.max(0, v - M.turnFrom) * M.turn
  const cs = Math.cos(th)
  const sn = Math.sin(th)
  const grow = M.grow[2] + (1 - M.grow[2]) * ease(clamp01((v - M.grow[0]) / (M.grow[1] - M.grow[0])), 2)
  const sizeScale = 1 - (1 - M.pull[2]) * ease(clamp01((v - M.pull[0]) / (M.pull[1] - M.pull[0])), 2)
  const ballScale = sizeScale * grow
  for (let i = 0; i < T.n; i++) {
    let x: number, y: number, size: number, alpha: number
    let depth = 0
    let fog = 0
    if (T.ring[i]) {
      // the second ring: in from outside fading in, then into the centre fading out
      const qi = v < M.ringIn[0] ? 0 : staggered(v, M.ringIn, T.delay[i]!)
      const qo = v < M.ringOut[0] ? 0 : staggered(v, M.ringOut, T.delay[i]!)
      const k = 1 + (M.ringFrom - 1) * (1 - qi)
      const rx = T.bx[i]! * k
      const ry = T.by[i]! * k
      x = rx + (T.cx[i]! - rx) * qo
      y = ry + (T.cy[i]! - ry) * qo
      size = SIZE.ring
      alpha = v < M.ringIn[0] || v >= M.ringOut[1] ? 0 : T.fb[i]! * qi * (1 - ease(clamp01((qo - 0.6) / 0.4), 2))
    } else if (v < M.converge[0]) {
      // the first ring, forming from further out
      x = T.ax[i]! * spread
      y = T.ay[i]! * spread
      size = SIZE.ring
      alpha = opacity * T.fa[i]!
    } else if (!ball) {
      // the first ring drifts into the pile; all but a few fade as they arrive, so the pile stays light
      const p = staggered(v, M.converge, T.delay[i]!)
      x = T.ax[i]! + (T.cx[i]! - T.ax[i]!) * p
      y = T.ay[i]! + (T.cy[i]! - T.ay[i]!) * p
      size = SIZE.ring
      alpha = (T.fa[i]! + (1 - T.fa[i]!) * p) * (T.keep[i] ? 1 : 1 - ease(clamp01((p - 0.6) / 0.4), 2))
    } else {
      // the pile grows into the ball, turned about its vertical axis without perspective, so every tile keeps its
      // size; depth shows as draw order and the far side's fog
      const X = T.sx[i]! * cs + T.sz[i]! * sn
      const Z = -T.sx[i]! * sn + T.sz[i]! * cs
      const p = v < M.form[1] ? staggered(v, M.form, T.delay[i]!) : 1
      const tx = X * ballScale + shiftX
      const ty = T.sy[i]! * ballScale
      x = T.cx[i]! + (tx - T.cx[i]!) * p
      y = T.cy[i]! + (ty - T.cy[i]!) * p
      size = SIZE.ring + (SIZE.ball * sizeScale - SIZE.ring) * p
      alpha = opacity * (T.keep[i] ? 1 : ease(clamp01(p / 0.5), 2))
      if (ghost > 0 && !T.core[i]) alpha *= 1 - ghost * (1 - M.ball.faint)
      fog = Math.min(M.fog.max, Math.max(0, M.fog.centre - (M.fog.slope * Z) / M.ball.R)) * p
      depth = Z * p
    }
    const sq = Math.sqrt(T.aspect[i]!)
    out.x[i] = x
    out.y[i] = y
    out.w[i] = size * sq
    out.h[i] = size / sq
    out.alpha[i] = alpha
    out.depth[i] = depth
    out.fog[i] = fog
  }
  return ball
}

const VERTEX = `#version 300 es
in vec4 aBox;
in vec4 aUv;
in vec3 aStyle;
uniform vec2 uView;
out vec2 vUv;
out vec2 vLocal;
out vec3 vStyle;
void main() {
  vec2 q = vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1));
  vLocal = q;
  vUv = aUv.xy + q * aUv.zw;
  vStyle = aStyle;
  vec2 p = aBox.xy + (q - 0.5) * aBox.zw;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
}`

// kind 0 samples the atlas, kind 1 draws a one-pixel outline in the ink colour; fog mixes towards the page colour
const FRAGMENT = `#version 300 es
precision mediump float;
uniform sampler2D uMap;
uniform vec3 uFog;
uniform vec3 uInk;
in vec2 vUv;
in vec2 vLocal;
in vec3 vStyle;
out vec4 outColor;
void main() {
  vec4 tex = texture(uMap, vUv);
  vec2 d = min(vLocal, 1.0 - vLocal) / fwidth(vLocal);
  vec4 c = vStyle.x < 0.5 ? tex : vec4(uInk, step(min(d.x, d.y), 1.0));
  float a = c.a * vStyle.y;
  if (a < 0.003) discard;
  outColor = vec4(mix(c.rgb, uFog, vStyle.z) * a, a);
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

const toneAt = (q: number) => {
  let k = 0
  while (k < TONES.length - 2 && q > TONES[k + 1]![0]) k++
  const [qa, a] = TONES[k]!
  const [qb, b] = TONES[k + 1]!
  const t = (q - qa) / (qb - qa)
  return a.map((v, i) => Math.round(v + (b[i]! - v) * t)) as [number, number, number]
}

// a generated tile: a ground at its tone's quantile, with a small figure lighter or darker than it
function paintTone(g: CanvasRenderingContext2D, r: () => number, x: number, y: number, q: number) {
  const [R, G, B] = toneAt(q)
  const shade = (d: number) => `rgb(${Math.max(0, Math.min(255, R + d))},${Math.max(0, Math.min(255, G + d))},${Math.max(0, Math.min(255, B + d))})`
  g.fillStyle = shade(0)
  g.fillRect(x, y, CELL, CELL)
  for (let k = 0; k < 3; k++) {
    g.fillStyle = shade((r() - 0.5) * 70)
    g.beginPath()
    g.ellipse(x + CELL * (0.3 + r() * 0.4), y + CELL * (0.3 + r() * 0.4), CELL * (0.08 + r() * 0.12), CELL * (0.08 + r() * 0.12), 0, 0, Math.PI * 2)
    g.fill()
  }
}

/**
 * A cloud of small picture tiles that moves through a sequence as it is driven: a ring of petals forms and drifts
 * into a pile, a second ring flies in and follows, the pile grows into a ball that turns, ghosts its outer shell,
 * pulls back, slides aside and fades. One WebGL 2 draw call from one atlas; it draws only when its progress, size
 * or pictures change, and never off screen. Fills its parent.
 */
export function PictureCloud({ images = [], progress, controlsRef, count = 1766, petals = 10, outlines = true, dpr, className, ...props }: PictureCloudProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const settings: Settings = { images, count, petals, outlines, dpr }
  const settingsRef = React.useRef(settings)
  const progressRef = React.useRef(clamp01(progress ?? 0.1))
  const lastProgressPropRef = React.useRef(progress)
  const wakeRef = React.useRef<(() => void) | null>(null)

  React.useImperativeHandle(
    controlsRef,
    () => ({
      setProgress: (p: number) => {
        progressRef.current = clamp01(p)
        wakeRef.current?.()
      },
    }),
    []
  )

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const canvas = document.createElement("canvas")
    canvas.className = "absolute inset-0 block h-full w-full"
    canvas.setAttribute("aria-hidden", "true")
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: true, depth: false, stencil: false })
    if (!gl) return
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
    const uView = gl.getUniformLocation(program, "uView")
    const uFog = gl.getUniformLocation(program, "uFog")
    const uInk = gl.getUniformLocation(program, "uInk")
    const uMap = gl.getUniformLocation(program, "uMap")

    // one instance buffer: box (x, y, w, h in pixels), atlas rectangle, style (kind, alpha, fog)
    const STRIDE = 11
    const vao = gl.createVertexArray()
    const buffer = gl.createBuffer()
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    const attrib = (name: string, size: number, offset: number) => {
      const loc = gl.getAttribLocation(program, name)
      if (loc < 0) return
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, offset * 4)
      gl.vertexAttribDivisor(loc, 1)
    }
    attrib("aBox", 4, 0)
    attrib("aUv", 4, 4)
    attrib("aStyle", 3, 8)
    gl.bindVertexArray(null)

    // the atlas: one square cell per picture (or per generated tone), drawn edge to edge
    const atlas = document.createElement("canvas")
    const g = atlas.getContext("2d")
    const texture = gl.createTexture()
    let grid = 1
    let cells = TONE_CELLS
    let imagesKey = "\u0000"
    let atlasDirty = false
    let loads: HTMLImageElement[] = []
    const buildAtlas = (sources: string[]) => {
      for (const img of loads) img.onload = img.onerror = null
      loads = []
      cells = sources.length ? Math.min(64, sources.length) : TONE_CELLS
      grid = Math.ceil(Math.sqrt(cells))
      atlas.width = atlas.height = grid * CELL
      if (!g) return
      const r = rng(3)
      for (let i = 0; i < cells; i++) {
        const x = (i % grid) * CELL
        const y = Math.floor(i / grid) * CELL
        paintTone(g, r, x, y, (i + 0.5) / cells)
        const src = sources[i]
        if (!src) continue
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = () => {
          const iw = img.naturalWidth
          const ih = img.naturalHeight
          if (!iw || !ih) return
          const s = Math.min(iw, ih)
          g.drawImage(img, (iw - s) / 2, (ih - s) / 2, s, s, x, y, CELL, CELL)
          atlasDirty = true
          wake()
        }
        img.src = src
        loads.push(img)
      }
      atlasDirty = true
    }
    const uploadAtlas = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas)
      } catch {
        // a picture served without CORS taints the atlas: keep the last good upload
      }
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      atlasDirty = false
    }

    // the page's colours, read through a probe so the fog and the outlines follow the theme
    const probe = document.createElement("span")
    probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden"
    root.appendChild(probe)
    const swatch = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
    const themeColor = (css: string, fallback: [number, number, number]): [number, number, number] => {
      probe.style.color = css
      const value = getComputedStyle(probe).color
      if (!swatch || !value) return fallback
      swatch.clearRect(0, 0, 1, 1)
      swatch.fillStyle = value
      swatch.fillRect(0, 0, 1, 1)
      const [r, gg, b] = swatch.getImageData(0, 0, 1, 1).data
      return [r! / 255, gg! / 255, b! / 255]
    }
    let fogRgb: [number, number, number] = [1, 1, 1]
    let inkRgb: [number, number, number] = [0, 0, 0]
    const readTheme = () => {
      fogRgb = themeColor("var(--background, #fff)", [1, 1, 1])
      inkRgb = themeColor("var(--foreground, #000)", [0, 0, 0])
    }

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    let tiles: Tiles | null = null
    let tilesKey = ""
    let placed: Placed | null = null
    let order = new Uint32Array(0)
    let squares: Float32Array = new Float32Array(0)
    let data = new Float32Array(0)
    let width = 1
    let height = 1
    let raf = 0
    let visible = true
    let dirty = true
    let drawn = -1

    const ensureTiles = () => {
      const s = settingsRef.current
      const key = `${s.count}:${s.petals}:${cells}`
      if (key === tilesKey && tiles) return
      tilesKey = key
      tiles = buildTiles(s.count, s.petals, cells)
      const n = tiles.n
      const f = () => new Float32Array(n)
      placed = { x: f(), y: f(), w: f(), h: f(), alpha: f(), depth: f(), fog: f() }
      order = new Uint32Array(n)
      // outlined squares over a band wide enough for a 3.2 : 1 box, measured sizes, seeded
      const r = rng(21)
      squares = new Float32Array(366 * 3)
      for (let k = 0; k < 366; k++) {
        squares[k * 3] = (r() - 0.5) * 3.2
        squares[k * 3 + 1] = r() - 0.5
        squares[k * 3 + 2] = 0.03 + r() * 0.08
      }
      data = new Float32Array((n + squares.length / 3) * STRIDE)
      // the GPU buffer is sized once per tile set; each frame writes only what it draws
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW)
    }

    const draw = () => {
      const s = settingsRef.current
      const key = s.images.join("\u0001")
      if (key !== imagesKey) {
        imagesKey = key
        buildAtlas(s.images)
      }
      ensureTiles()
      if (atlasDirty) uploadAtlas()
      const T = tiles!
      const P = placed!
      const v = sequenceAt(progressRef.current, reduced)
      drawn = progressRef.current
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      dirty = false
      if (v <= START || v >= END) return
      const ball = place(T, v, P)
      // the cloud scales with its box's height, and shrinks to fit a narrow box
      const fit = Math.min(1, width / height / 0.95)
      const unit = height * fit
      const ox = width / 2
      const oy = height / 2
      for (let i = 0; i < T.n; i++) order[i] = i
      if (ball) order.sort((a, b) => P.depth[a]! - P.depth[b]!)
      const cell = 1 / grid
      let k = 0
      for (let j = 0; j < T.n; j++) {
        const i = order[j]!
        const alpha = P.alpha[i]!
        if (alpha <= 0.002) continue
        const a = T.aspect[i]!
        const c = T.cell[i]!
        const u0 = (c % grid) * cell
        const v0 = Math.floor(c / grid) * cell
        // the centre of the cell at the tile's proportions, inset a little so small mipmaps keep to the cell
        const du = (a >= 1 ? cell : cell * a) * 0.92
        const dv = (a >= 1 ? cell / a : cell) * 0.92
        const o = k * STRIDE
        data[o] = ox + P.x[i]! * unit
        data[o + 1] = oy + P.y[i]! * unit
        data[o + 2] = P.w[i]! * unit
        data[o + 3] = P.h[i]! * unit
        data[o + 4] = u0 + (cell - du) / 2
        data[o + 5] = v0 + (cell - dv) / 2
        data[o + 6] = du
        data[o + 7] = dv
        data[o + 8] = 0
        data[o + 9] = alpha
        data[o + 10] = P.fog[i]!
        k++
      }
      const sq = s.outlines ? valueAt(SQUARES, v) : 0
      if (sq > 0.002) {
        const shift = valueAt(CENTRE_X, v) * 1.27
        const reach = width / height / 2 + 0.1
        for (let q = 0; q < squares.length; q += 3) {
          const x = squares[q]! + shift
          if (Math.abs(x) > reach) continue
          const size = squares[q + 2]! * height
          const o = k * STRIDE
          data[o] = ox + x * height
          data[o + 1] = oy + squares[q + 1]! * height
          data[o + 2] = size
          data[o + 3] = size
          data[o + 8] = 1
          data[o + 9] = sq * OUTLINE_ALPHA
          data[o + 10] = 0
          k++
        }
      }
      if (!k) return
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, k * STRIDE)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.uniform1i(uMap, 0)
      gl.uniform2f(uView, width, height)
      gl.uniform3f(uFog, fogRgb[0], fogRgb[1], fogRgb[2])
      gl.uniform3f(uInk, inkRgb[0], inkRgb[1], inkRgb[2])
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, k)
      gl.bindVertexArray(null)
    }

    // one frame per change: nothing here moves by itself, so the loop never keeps running
    const frame = () => {
      raf = 0
      if (!visible || document.hidden) return
      if (dirty || atlasDirty || drawn !== progressRef.current) draw()
    }
    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const resize = () => {
      const s = settingsRef.current
      width = Math.max(1, root.clientWidth)
      height = Math.max(1, root.clientHeight)
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (width * height)))
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))
      dirty = true
      wake()
    }
    const onVisibility = () => wake()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(root)
    const intersection = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting)
      if (visible) wake()
    })
    intersection.observe(root)
    const themeObserver = new MutationObserver(() => {
      readTheme()
      dirty = true
      wake()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })
    document.addEventListener("visibilitychange", onVisibility)
    readTheme()
    resize()
    wakeRef.current = () => {
      dirty = true
      wake()
    }

    return () => {
      cancelAnimationFrame(raf)
      wakeRef.current = null
      for (const img of loads) img.onload = img.onerror = null
      resizeObserver.disconnect()
      intersection.disconnect()
      themeObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      gl.deleteBuffer(buffer)
      gl.deleteVertexArray(vao)
      gl.deleteTexture(texture)
      gl.deleteProgram(program)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      canvas.remove()
      probe.remove()
    }
  }, [])

  // props reach the loop through refs written here, never in render; a change only wakes it for one frame
  React.useEffect(() => {
    settingsRef.current = settings
    if (progress !== lastProgressPropRef.current) {
      lastProgressPropRef.current = progress
      if (progress !== undefined) progressRef.current = clamp01(progress)
    }
    wakeRef.current?.()
  })

  return <div ref={rootRef} data-slot="picture-cloud" className={cn("relative h-full w-full overflow-hidden", className)} {...props} />
}

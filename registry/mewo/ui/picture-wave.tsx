"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type PictureWaveState = "wave" | "field"
export type PictureWaveOrientation = "auto" | "horizontal" | "vertical"

export interface PictureWaveImage {
  /** The picture's URL, served with CORS. */
  src: string
  /** Its width ÷ height. A card takes these proportions between 0.6 and 1.7 and crops the picture beyond them. */
  aspect: number
}

export interface PictureWaveControls {
  /** Flies the wave in again from nothing. */
  replay: () => void
}

export interface PictureWaveProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** The pictures on the cards; each depth layer of the field cycles through them in its own order (up to 100). */
  images?: PictureWaveImage[]
  /** The two words riding the wave's ends; an empty list leaves them out. */
  words?: string[]
  /** `"wave"`: the cards fly in and hold one period of a sine between the words. `"field"`: the wave then bursts
   * into a field over the whole box that floats and leans away from the pointer. Back to `"wave"`, it gathers again. */
  state?: PictureWaveState
  /** The wave's long axis. `"auto"` lays it across, and stands it up in a box narrower than 900px, as on a phone. */
  orientation?: PictureWaveOrientation
  /** How far the field's cards lean away from the pointer, the nearer ones more: 0 holds them still. */
  lean?: number
  /** The field's slow idle drift. Off, nothing moves once the cards settle and the pointer rests. */
  float?: boolean
  /** Called with a picture's index in `images` when its card in the field is clicked. */
  onPick?: (index: number) => void
  /** `replay()`, to fly the wave in again. */
  controlsRef?: React.Ref<PictureWaveControls>
  /** Override the device pixel ratio, which is capped at 2. */
  dpr?: number
}

type Settings = Required<Pick<PictureWaveProps, "images" | "state" | "orientation" | "lean" | "float">> & Pick<PictureWaveProps, "onPick" | "dpr">
type World = "horizontal" | "vertical"
type Keys = readonly (readonly [number, number])[]

// the default pictures' proportions: the field's layout is seeded from them
const ASPECTS = [
  1, 1.286, 0.783, 0.75, 0.75, 0.75, 0.729, 0.639, 0.678, 1.27, 0.896, 1.13, 1.399, 0.834, 1.43, 0.531, 0.781, 0.803,
  0.564, 0.766, 1.047, 0.672, 0.682, 0.787, 1.258, 0.51, 0.688, 1.182, 1.442, 0.656, 1.249, 2.306, 1.326, 1.249, 1.135,
  0.75, 2.265, 1.306, 1.889, 0.971, 0.748, 0.49, 1.249, 0.748, 1.488, 0.678, 0.748, 0.75, 0.826, 0.814, 0.719, 1.384,
  1.058, 2.317, 1.59, 1.501, 1.506, 1.501, 1.497, 1.506, 1.506, 1.369, 1.323, 1.506, 1.008, 1.556, 0.756, 0.805, 1.299,
  1.358, 0.734, 1.333,
]
const PICTURES: PictureWaveImage[] = ASPECTS.map((aspect, i) => ({
  src: `https://picsum.photos/seed/mewo-picture-wave-${i + 1}/${Math.round(300 * aspect)}/300`,
  aspect,
}))
const WORDS = ["Between", "Rivers"]

// The sequence, in seconds from the first card: the wave grows in about its centre, holds (where "wave" rests),
// the words dim and go, the cards burst into the field and land at TIME.field.
const TIME = { wordsOn: 0.14, wave: 1.88, wordsDim: 1.96, wordsOff: 2.18, field: 3.83 }
// the wave's scale against time
const GROW: Keys = [[0, 0], [0.087, 0.05], [0.22, 0.124], [0.353, 0.273], [0.474, 0.471], [0.6, 0.703], [0.724, 0.843], [0.858, 0.942], [0.99, 0.983], [1.13, 1]]
// the field's drift and lean ease in over SETTLE_IN once it lands, and out over SETTLE_OUT before it gathers again
const SETTLE_IN = 1.5
const SETTLE_OUT = 0.5
// the pointer is followed with this time constant (s)
const LEAN_EASE = 0.35
const PIXEL_BUDGET = 4.5e6
const CELL = 256
const GROUND = [217, 212, 203] as const

// Every length is in heights of the box from its centre, y down. The wave: y = A sin(2π (x + span) / period + phase)
// along its long axis, from −span to span about its centre; gap runs from each end to the inner edge of its word.
type Ribbon = { axis: 0 | 1; centre: [number, number]; span: number; period: number; amp: number; phase: number; cardH: number; gap: [number, number] }
const RIBBON: Record<World, Ribbon> = {
  horizontal: { axis: 0, centre: [0.1235, 0.002], span: 0.4035, period: 0.756, amp: -0.154, phase: -0.17, cardH: 0.105, gap: [0.053, 0.042] },
  vertical: { axis: 1, centre: [-0.001, -0.0085], span: 0.2695, period: 0.506, amp: -0.076, phase: -0.18, cardH: 0.075, gap: [0.02, 0.026] },
}
// The burst: each card leaves its place in the wave for its place in the field, passing towards the viewer on the
// way (it grows and moves out from the centre by `push` at mid-flight, and rises by `drop`). `order`: which cards
// leave first (0 the start end, 1 the far end, 2 both ends, 3 the middle), over `spread` seconds; `ghost`: when the
// field's other cards fade in.
type Burst = { size: number; start: number; dur: number; spread: number; order: number; push: number; drop: number; power: number; ghost: [number, number] }
const BURST: Record<World, Burst> = {
  horizontal: { size: 0.93, start: 2.018, dur: 1.347, spread: 0.452, order: 1, push: 1.096, drop: -0.3, power: 1.89, ghost: [2.85, 3.2] },
  vertical: { size: 0.9, start: 1.951, dur: 1.12, spread: 0.402, order: 3, push: 1.724, drop: -0.255, power: 1.613, ghost: [2.73, 3.18] },
}
// The field: three depth layers (near pictures, mid pictures, pale far cards) spread evenly (Poisson-disc, no two in
// a layer overlapping) over `span` × `period`, which wraps vertically; the layers' parallax speeds shape the band the
// pictures keep clear of above the centre. Cards are drawn at `size` of their base size.
type Layer = { speed: number; h: [number, number]; gap: number; cls: 0 | 1; depth: number }
type Field = { span: number; period: number; size: number; layers: Layer[] }
const FIELD: Record<World, Field> = {
  horizontal: {
    span: 3.2, period: 3.0, size: 0.75,
    layers: [
      { speed: 0.708, h: [0.19, 0.27], gap: 0.42, cls: 0, depth: 1 },
      { speed: 0.637, h: [0.15, 0.21], gap: 0.36, cls: 0, depth: 0.7 },
      { speed: 0.566, h: [0.13, 0.2], gap: 0.32, cls: 1, depth: 0.45 },
    ],
  },
  vertical: {
    span: 1.5, period: 2.6, size: 0.75,
    layers: [
      { speed: 0.986, h: [0.15, 0.21], gap: 0.36, cls: 0, depth: 1 },
      { speed: 0.867, h: [0.12, 0.18], gap: 0.31, cls: 0, depth: 0.7 },
      { speed: 0.789, h: [0.11, 0.16], gap: 0.28, cls: 1, depth: 0.45 },
    ],
  },
}
// Across, pictures keep their inner edge `column` from the centre and out of a headline's box above the centre
// (half-width x, half-height h plus the card's, rising from y0 by `rise` per step of its layer's speed until
// `until`), so a title over the field stays clear. Pale cards may pass behind; standing up, the text fills the width.
const CLEAR = { column: 0.34, hero: { x: 0.52, h: 0.18, y0: -0.095, rise: 0.749, until: 0.95 } }

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const easeInOut = (x: number, p: number) => (x < 0.5 ? (2 * x) ** p / 2 : 1 - (2 - 2 * x) ** p / 2)
const wrap = (y: number, p: number) => (((y % p) + p) % p) - p / 2
// the field's offsets from the centre, pulled in a little, and less as the headline's box rises
const pushIn = (v: number) => Math.exp(-0.16 * (1 - clamp01(v)) ** 2)
const PUSH = pushIn(0)
// cards in the middle of the wave sit further back than its ends (smaller, drawn behind)
const deckDepth = (u: number) => 0.65 + 0.35 * Math.abs(2 * u - 1)
const deckAspect = (a: number) => Math.min(1.5, Math.max(0.6, a))
const delayOf = (order: number, u: number) => [u, 1 - u, 1 - Math.abs(2 * u - 1), Math.abs(2 * u - 1)][order]!

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** A keyframed value at k, linear between keys and held past either end. */
export function valueAt(keys: Keys, k: number) {
  if (k <= keys[0]![0]) return keys[0]![1]
  for (let i = 1; i < keys.length; i++) {
    const [b, vb] = keys[i]!
    if (k <= b) {
      const [a, va] = keys[i - 1]!
      return va + ((vb - va) * (k - a)) / (b - a)
    }
  }
  return keys[keys.length - 1]![1]
}

/** The wave's scale at time t: 0 before the first card, 1 once it has arrived. */
export const waveScale = (t: number) => valueAt(GROW, t)

/** The words' look at time t: hidden, shown, or dimmed just before the burst. */
export function wordsAt(t: number): "off" | "on" | "dim" {
  if (t >= TIME.wordsOn && t < TIME.wordsDim) return "on"
  return t >= TIME.wordsDim && t < TIME.wordsOff ? "dim" : "off"
}

/** A picture card's proportions: its picture's, between 0.6 and 1.7. */
export const pictureAspect = (a: number) => Math.min(1.7, Math.max(0.6, a))

export type FieldCard = {
  /** 0 a picture, 1 a pale card */
  cls: 0 | 1
  aspect: number
  /** the picture it shows (an index into the pictures), or −1 */
  img: number
  layer: number
  x0: number
  y0: number
  w: number
  h: number
  phase: number
  /** where it rests in the field: x, y, w, h */
  at0: [number, number, number, number]
}

function clearOfText(world: World, ly: Layer, x0: number, y0: number, w: number, h: number) {
  if (world !== "horizontal" || ly.cls !== 0) return true
  const F = FIELD[world]
  const H = CLEAR.hero
  if (Math.abs(x0) * PUSH - w / 2 < CLEAR.column) return false
  for (let v = 0; v <= H.until + 1e-6; v += 0.05) {
    const g = pushIn(v)
    if (Math.abs(x0) * g - w / 2 >= H.x) continue
    const y = wrap(y0 - ly.speed * v, F.period) * g
    if (Math.abs(y - (H.y0 - H.rise * v)) < h / 2 + H.h) return false
  }
  return true
}

/** The field's cards for a world, seeded, from the pictures' proportions. */
export function buildField(world: World, seed: number, pictures: number[]): FieldCard[] {
  const F = FIELD[world]
  const r = rng(seed)
  const cards: FieldCard[] = []
  for (const [li, ly] of F.layers.entries()) {
    // darts on a torus in y (the layer wraps); each draws its size first, so the text test sees the card's edges
    const pts: [number, number, number, number, number][] = []
    const order = pictures.map((_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1))
      ;[order[i], order[j]] = [order[j]!, order[i]!]
    }
    for (let tries = 0; tries < 6000; tries++) {
      const x = (r() - 0.5) * F.span
      const y = r() * F.period
      const h = ly.h[0] + r() * (ly.h[1] - ly.h[0])
      const img = ly.cls === 0 && order.length ? order[pts.length % order.length]! : -1
      const aspect = img >= 0 ? pictureAspect(pictures[img]!) : 0.75 + r() * 0.5
      if (!clearOfText(world, ly, x, y, h * aspect * F.size, h * F.size)) continue
      let ok = true
      for (const [px, py] of pts) {
        const dy = Math.min(Math.abs(py - y), F.period - Math.abs(py - y))
        if (Math.hypot(px - x, dy) < ly.gap) {
          ok = false
          break
        }
      }
      if (ok) pts.push([x, y, h, aspect, img])
    }
    for (const [x0, y0, h, aspect, img] of pts) {
      const w = h * aspect
      const card: FieldCard = { cls: ly.cls, aspect, img, layer: li, x0, y0, w, h, phase: r() * Math.PI * 2, at0: [0, 0, 0, 0] }
      const at = [0, 0, 0, 0]
      fieldAt(world, card, 0, 0, 0, 0, at)
      card.at0 = [at[0]!, at[1]!, at[2]!, at[3]!]
      cards.push(card)
    }
  }
  return cards
}

// a card in the field: [x, y, w, h] into out. float (0 to 1) scales its idle drift; lean is the pointer's pull
function fieldAt(world: World, c: FieldCard, time: number, float: number, leanX: number, leanY: number, out: number[]) {
  const F = FIELD[world]
  const depth = F.layers[c.layer]!.depth
  const fx = Math.sin(time * 0.4 + c.phase) * 0.004 * float - leanX * 0.022 * depth
  const fy = Math.cos(time * 0.33 + c.phase * 1.3) * 0.006 * float - leanY * 0.022 * depth
  out[0] = c.x0 * PUSH + fx
  out[1] = wrap(c.y0, F.period) * PUSH + fy
  out[2] = c.w * F.size
  out[3] = c.h * F.size
  return out
}

/** The point u (0 to 1) along the wave at full size, from its centre: [x, y] into out. */
export function wavePoint(world: World, u: number, out: number[]) {
  const R = RIBBON[world]
  const a = -R.span + 2 * R.span * u
  const across = R.amp * Math.sin((2 * Math.PI * (a + R.span)) / R.period + R.phase)
  out[R.axis] = a
  out[1 - R.axis] = across
  return out
}

const point = [0, 0]
// a card of the wave at time t, u along it, the wave at scale s: [x, y, w, h] into out; false while hidden
function burstAt(world: World, t: number, u: number, s: number, c: FieldCard, out: number[]) {
  if (t < 0 || s <= 0.001) return false
  const P = BURST[world]
  const R = RIBBON[world]
  const h0 = R.cardH * P.size * deckDepth(u) * s
  const w0 = h0 * deckAspect(c.aspect)
  wavePoint(world, u, point)
  const ax = R.centre[0] + point[0]! * s
  const ay = R.centre[1] + point[1]! * s
  const p = clamp01((t - P.start - P.spread * delayOf(P.order, u)) / P.dur)
  if (p <= 0) {
    out[0] = ax
    out[1] = ay
    out[2] = w0
    out[3] = h0
    return true
  }
  const e = easeInOut(p, P.power)
  const arc = Math.sin(Math.PI * e)
  const [fx, fy, fw, fh] = c.at0
  const m = 1 + P.push * arc
  out[0] = (ax + (fx - ax) * e) * m
  out[1] = (ay + (fy - ay) * e) * m + P.drop * arc
  out[2] = (w0 + (fw - w0) * e) * m
  out[3] = (h0 + (fh - h0) * e) * m
  return true
}

type Scene = { cards: FieldCard[]; slot: Int32Array; deck: number; order: number[] }

// the wave: the pictures resting near the middle band, in order along its long axis; draw order: far layers first,
// and in the wave its middle behind its ends
function buildScene(world: World, pictures: number[]): Scene {
  const cards = buildField(world, world === "horizontal" ? 21 : 23, pictures)
  const axis = RIBBON[world].axis
  const deck = cards
    .map((c, i) => [i, c.at0[axis]] as const)
    .filter(([i]) => cards[i]!.cls === 0 && Math.abs(cards[i]!.at0[1]) < 1.3)
    .sort((a, b) => a[1] - b[1])
    .map(([i]) => i)
  const slot = new Int32Array(cards.length).fill(-1)
  deck.forEach((i, k) => (slot[i] = k))
  const rank = (i: number) => (2 - cards[i]!.layer) * 10 + (slot[i]! < 0 ? 0 : Math.abs((2 * slot[i]!) / Math.max(1, deck.length - 1) - 1))
  const order = cards.map((_, i) => i).sort((a, b) => rank(a) - rank(b))
  return { cards, slot, deck: deck.length, order }
}

const VERTEX = `#version 300 es
in vec4 aBox;
in vec4 aUv;
in vec2 aStyle;
uniform vec2 uView;
out vec2 vUv;
out vec2 vStyle;
void main() {
  vec2 q = vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1));
  vUv = aUv.xy + q * aUv.zw;
  vStyle = aStyle;
  vec2 p = aBox.xy + (q - 0.5) * aBox.zw;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
}`

// kind 0 samples the atlas, kind 1 is a pale card in the theme's colour
const FRAGMENT = `#version 300 es
precision mediump float;
uniform sampler2D uMap;
uniform vec3 uPale;
in vec2 vUv;
in vec2 vStyle;
out vec4 outColor;
void main() {
  vec4 tex = texture(uMap, vUv);
  vec4 c = vStyle.x < 0.5 ? tex : vec4(uPale, 1.0);
  float a = c.a * vStyle.y;
  if (a < 0.003) discard;
  outColor = vec4(c.rgb * a, a);
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

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") ref(value)
  else if (ref) ref.current = value
}

const WORD =
  "absolute top-0 left-0 whitespace-nowrap text-foreground/40 opacity-0 transition-[opacity,color] duration-450 ease-[ease] data-[state=dim]:text-foreground/30 data-[state=dim]:opacity-100 data-[state=dim]:duration-250 data-[state=on]:text-foreground data-[state=on]:opacity-100 motion-reduce:transition-none"

/**
 * Picture cards fly in as one period of a sine between two words, hold, then burst into a field spread over the
 * whole box: three depth layers that drift slowly and lean away from the pointer, the nearer ones more. One WebGL 2
 * draw call from one atlas; it stops drawing once nothing moves, and never draws off screen. Fills its parent.
 */
export function PictureWave({
  images = PICTURES,
  words = WORDS,
  state = "field",
  orientation = "auto",
  lean = 1,
  float = true,
  onPick,
  controlsRef,
  dpr,
  className,
  ref,
  ...props
}: PictureWaveProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const wordsRef = React.useRef<HTMLParagraphElement>(null)
  const wordARef = React.useRef<HTMLSpanElement>(null)
  const wordBRef = React.useRef<HTMLSpanElement>(null)
  const settings: Settings = { images, state, orientation, lean, float, onPick, dpr }
  const settingsRef = React.useRef(settings)
  const wakeRef = React.useRef<(() => void) | null>(null)
  const replayRef = React.useRef<(() => void) | null>(null)

  React.useImperativeHandle(controlsRef, () => ({ replay: () => replayRef.current?.() }), [])

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
    const uPale = gl.getUniformLocation(program, "uPale")
    const uMap = gl.getUniformLocation(program, "uMap")

    // one instance buffer: box (centre x, y and size in pixels), atlas rectangle, style (kind, alpha)
    const STRIDE = 10
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
    attrib("aStyle", 2, 8)
    gl.bindVertexArray(null)

    // The atlas: one square cell per picture, the card's box centred in it at the card's proportions. Each picture
    // is cropped to fill that box, and the rest of its cell holds the same picture stretched, so the small mipmap
    // levels don't blend a neighbour into the card's edges. A quiet ground shows until a picture arrives; each one
    // goes up into its own cell, and the mipmaps are rebuilt at most once a frame.
    const texture = gl.createTexture()
    const anisotropy = gl.getExtension("EXT_texture_filter_anisotropic")
    let grid = 1
    let boxes: [number, number, number, number][] = []
    let mipsDirty = true
    let loads: HTMLImageElement[] = []
    const buildAtlas = (pictures: PictureWaveImage[]) => {
      for (const img of loads) img.onload = img.onerror = null
      loads = []
      grid = Math.max(1, Math.ceil(Math.sqrt(pictures.length)))
      const size = grid * CELL
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      if (anisotropy) gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, 4)
      const fbo = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
      gl.clearColor(GROUND[0] / 255, GROUND[1] / 255, GROUND[2] / 255, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.deleteFramebuffer(fbo)
      mipsDirty = true
      boxes = pictures.map((p, i) => {
        const a = pictureAspect(p.aspect)
        const w = a >= 1 ? CELL - 2 : Math.round((CELL - 2) * a)
        const h = a >= 1 ? Math.round((CELL - 2) / a) : CELL - 2
        const col = i % grid
        const row = Math.floor(i / grid)
        const x = (CELL - w) / 2
        const y = (CELL - h) / 2
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = () => {
          const iw = img.naturalWidth
          const ih = img.naturalHeight
          if (!iw || !ih) return
          const cell = document.createElement("canvas")
          cell.width = cell.height = CELL
          const g = cell.getContext("2d")
          if (!g) return
          g.fillStyle = `rgb(${GROUND.join(",")})`
          g.fillRect(0, 0, CELL, CELL)
          g.drawImage(img, 0, 0, CELL, CELL)
          const s = Math.max(w / iw, h / ih)
          g.drawImage(img, (iw - w / s) / 2, (ih - h / s) / 2, w / s, h / s, x, y, w, h)
          gl.bindTexture(gl.TEXTURE_2D, texture)
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
          try {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, col * CELL, row * CELL, gl.RGBA, gl.UNSIGNED_BYTE, cell)
          } catch {
            // a picture served without CORS can't go up: its card keeps the ground
            return
          }
          mipsDirty = true
          wake()
        }
        img.src = p.src
        loads.push(img)
        // UVs: v counts from the top (no flip)
        return [(col * CELL + x) / size, (row * CELL + y) / size, w / size, h / size]
      })
    }

    // the pale cards take a whisper of the ink over the page colour, read through a probe so they follow the theme
    const probe = document.createElement("span")
    probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden"
    root.appendChild(probe)
    const swatch = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
    let pale: [number, number, number] = [246 / 255, 246 / 255, 245 / 255]
    const readTheme = () => {
      probe.style.color = "color-mix(in srgb, var(--foreground, #000) 4%, var(--background, #fff))"
      const value = getComputedStyle(probe).color
      if (!swatch || !value) return
      swatch.clearRect(0, 0, 1, 1)
      swatch.fillStyle = value
      swatch.fillRect(0, 0, 1, 1)
      const [r, g, b] = swatch.getImageData(0, 0, 1, 1).data
      pale = [r! / 255, g! / 255, b! / 255]
    }

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    const scenes: Partial<Record<World, Scene>> = {}
    let shownImages: PictureWaveImage[] | null = null
    let imagesKey = "\u0000"
    let data = new Float32Array(0)
    let hits = new Float32Array(0)
    let hitCount = 0
    let width = 1
    let height = 1
    let rtl = false
    let shownWorld: World | null = null
    let wordWidths: [number, number] | null = null
    let shownWords = ""
    let raf = 0
    let last = 0
    let visible = true
    // the sequence's clock (s), how far the field has settled (0 to 1), the field's own clock for its drift
    let t = 0
    let settle = 0
    let clock = 0
    const mouse: [number, number] = [0, 0]
    const leaned: [number, number] = [0, 0]
    const out: [number, number, number, number] = [0, 0, 0, 0]

    const sceneFor = (world: World, pictures: PictureWaveImage[]) => {
      const scene = scenes[world] ?? buildScene(world, pictures.map((p) => p.aspect))
      scenes[world] = scene
      if (data.length < scene.cards.length * STRIDE) {
        data = new Float32Array(scene.cards.length * STRIDE)
        hits = new Float32Array(scene.cards.length * 5)
        // the GPU buffer is sized once per layout; each frame writes only what it draws
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW)
      }
      return scene
    }

    // the words ride just outside the wave's two ends, a little air from the cards; across, when one is too long
    // for its side, both are set a little smaller from their inner edges, never closer to the cards
    const placeWords = (world: World) => {
      const first = wordARef.current
      const second = wordBRef.current
      if (!first) return
      const key = `${first.textContent}\u0001${second?.textContent ?? ""}`
      if (!wordWidths || key !== shownWords) {
        shownWords = key
        wordWidths = [first.offsetWidth, second?.offsetWidth ?? 0]
      }
      const R = RIBBON[world]
      const s = waveScale(t)
      const k = R.axis
      const start = R.centre[k] - R.span * s - R.gap[0]
      const end = R.centre[k] + R.span * s + R.gap[1]
      const cross = R.centre[1 - k]!
      const gap = 0.045 * height
      const state = wordsAt(t)
      for (const el of [first, second]) if (el && el.dataset.state !== state) el.dataset.state = state
      if (k === 0) {
        // the first word opens the line: on the left, or on the right when the text runs right to left
        const [left, right, lw, rw] = rtl ? [second, first, wordWidths[1], wordWidths[0]] : [first, second, wordWidths[0], wordWidths[1]]
        const edge = 6.5 * 0.00625 * width
        const l = width / 2 + start * height - gap
        const r = width / 2 + end * height + gap
        const y = height / 2 + cross * height
        const fit = (room: number, w: number) => (w ? Math.min(1, Math.max(0.55, room / w)) : 1)
        const sc = Math.min(fit(l - edge, lw), fit(width - edge - r, rw))
        if (left) {
          left.style.transformOrigin = "100% 50%"
          left.style.transform = `translate(${l}px, ${y}px) translate(-100%, -50%) scale(${sc})`
        }
        if (right) {
          right.style.transformOrigin = "0 50%"
          right.style.transform = `translate(${r}px, ${y}px) translate(0, -50%) scale(${sc})`
        }
      } else {
        const x = width / 2 + cross * height
        first.style.transformOrigin = ""
        first.style.transform = `translate(${x}px, ${height / 2 + start * height - gap}px) translate(-50%, -100%)`
        if (second) {
          second.style.transformOrigin = ""
          second.style.transform = `translate(${x}px, ${height / 2 + end * height + gap}px) translate(-50%, 0)`
        }
      }
    }

    const draw = () => {
      const s = settingsRef.current
      const pictures = s.images.slice(0, 100)
      if (s.images !== shownImages) {
        // a new list with the same pictures (written inline by the consumer) keeps the atlas and the layout
        shownImages = s.images
        const key = pictures.map((p) => `${p.src}\u0002${p.aspect}`).join("\u0001")
        if (key !== imagesKey) {
          imagesKey = key
          delete scenes.horizontal
          delete scenes.vertical
          buildAtlas(pictures)
        }
      }
      const world: World = s.orientation === "auto" ? (width < 900 ? "vertical" : "horizontal") : s.orientation
      const line = wordsRef.current
      if (world !== shownWorld || (line && line.dataset.world !== world)) {
        shownWorld = world
        if (line) line.dataset.world = world
        wordWidths = null
      }
      const scene = sceneFor(world, pictures)
      if (mipsDirty) {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.generateMipmap(gl.TEXTURE_2D)
        mipsDirty = false
      }
      if (t < TIME.field) placeWords(world)
      else if (wordARef.current?.dataset.state !== "off") placeWords(world)

      const P = BURST[world]
      const ghost = clamp01((t - P.ghost[0]) / (P.ghost[1] - P.ghost[0]))
      const scale = waveScale(t)
      const inField = t >= TIME.field
      const drift = s.float && !reduced ? settle : 0
      const lx = leaned[0] * s.lean * settle
      const ly = leaned[1] * s.lean * settle
      const ox = width / 2
      const oy = height / 2
      let n = 0
      hitCount = 0
      for (const i of scene.order) {
        const c = scene.cards[i]!
        let alpha = 1
        if (!inField) {
          const k = scene.slot[i]!
          if (k < 0) {
            // the field's other cards fade in as the burst lands
            alpha = ghost
            if (alpha <= 0.002) continue
            fieldAt(world, c, clock, 0, 0, 0, out)
          } else if (!burstAt(world, t, scene.deck > 1 ? k / (scene.deck - 1) : 0.5, scale, c, out)) continue
        } else fieldAt(world, c, clock, drift, lx, ly, out)
        const picture = c.cls === 0 && c.img >= 0 && c.img < boxes.length
        const box = picture ? boxes[c.img]! : null
        const o = n * STRIDE
        const w = out[2] * height
        const h = out[3] * height
        const x = ox + out[0] * height
        const y = oy + out[1] * height
        data[o] = x
        data[o + 1] = y
        data[o + 2] = w
        data[o + 3] = h
        data[o + 4] = box ? box[0] : 0
        data[o + 5] = box ? box[1] : 0
        data[o + 6] = box ? box[2] : 0
        data[o + 7] = box ? box[3] : 0
        data[o + 8] = box ? 0 : 1
        data[o + 9] = alpha
        n++
        if (inField && picture) {
          const q = hitCount * 5
          hits[q] = c.img
          hits[q + 1] = x - w / 2
          hits[q + 2] = y - h / 2
          hits[q + 3] = x + w / 2
          hits[q + 4] = y + h / 2
          hitCount++
        }
      }

      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      if (!n) return
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, n * STRIDE)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.uniform1i(uMap, 0)
      gl.uniform2f(uView, width, height)
      gl.uniform3f(uPale, pale[0], pale[1], pale[2])
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n)
      gl.bindVertexArray(null)
    }

    // the loop runs while the sequence plays, the field settles or drifts, or the cards still follow the pointer
    const frame = (now: number) => {
      raf = 0
      if (!visible || document.hidden) {
        last = 0
        return
      }
      const dt = last ? Math.min(0.05, Math.max(1 / 240, (now - last) / 1000)) : 1 / 60
      const s = settingsRef.current
      const target = s.state === "wave" ? TIME.wave : TIME.field
      let moving = false
      if (reduced) {
        t = target
        settle = 0
      } else if (t < target) {
        t = Math.min(target, t + dt)
        moving = true
      } else if (t > target) {
        // leaving the field: its drift and lean ease out first, then the cards gather back into the wave
        if (settle > 0) settle = Math.max(0, settle - dt / SETTLE_OUT)
        else t = Math.max(target, t - dt)
        moving = true
      } else if (t >= TIME.field && settle < 1) {
        settle = Math.min(1, settle + dt / SETTLE_IN)
        moving = true
      }
      const k = reduced ? 0 : 1 - Math.exp(-dt / LEAN_EASE)
      leaned[0] += (mouse[0] - leaned[0]) * k
      leaned[1] += (mouse[1] - leaned[1]) * k
      // within a few hundredths of a pixel of the pointer, the lean lands and the loop may stop
      if (Math.abs(mouse[0] - leaned[0]) + Math.abs(mouse[1] - leaned[1]) < 2e-3) {
        leaned[0] = mouse[0]
        leaned[1] = mouse[1]
      } else if (settle > 0 && s.lean !== 0) moving = true
      if (settle > 0 && s.float && !reduced) {
        clock += dt
        moving = true
      }
      draw()
      last = moving ? now : 0
      if (moving) wake()
    }
    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const resize = () => {
      const s = settingsRef.current
      width = Math.max(1, root.clientWidth)
      height = Math.max(1, root.clientHeight)
      rtl = getComputedStyle(root).direction === "rtl"
      wordWidths = null
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (width * height)))
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))
      wake()
    }
    const pick = (clientX: number, clientY: number) => {
      const r = root.getBoundingClientRect()
      const x = clientX - r.left
      const y = clientY - r.top
      for (let k = hitCount - 1; k >= 0; k--) {
        const q = k * 5
        if (x >= hits[q + 1]! && x <= hits[q + 3]! && y >= hits[q + 2]! && y <= hits[q + 4]!) return hits[q]!
      }
      return -1
    }
    // the pointer, −1 to 1 across the box (held at its edges outside it): the field's cards lean away from it
    const onPointer = (e: PointerEvent) => {
      const r = root.getBoundingClientRect()
      mouse[0] = Math.min(1, Math.max(-1, ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1))
      mouse[1] = Math.min(1, Math.max(-1, ((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1))
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      const cursor = inside && settingsRef.current.onPick && pick(e.clientX, e.clientY) >= 0 ? "pointer" : ""
      if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor
      if (settle > 0 && settingsRef.current.lean !== 0) wake()
    }
    const onClick = (e: MouseEvent) => {
      const i = pick(e.clientX, e.clientY)
      if (i >= 0) settingsRef.current.onPick?.(i)
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
      wake()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pointermove", onPointer, { passive: true })
    canvas.addEventListener("click", onClick)
    document.fonts?.ready.then(() => {
      wordWidths = null
      wake()
    })
    readTheme()
    resize()
    wakeRef.current = () => {
      wordWidths = null
      wake()
    }
    replayRef.current = () => {
      t = 0
      settle = 0
      wake()
    }

    return () => {
      cancelAnimationFrame(raf)
      raf = -1
      wakeRef.current = null
      replayRef.current = null
      for (const img of loads) img.onload = img.onerror = null
      resizeObserver.disconnect()
      intersection.disconnect()
      themeObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pointermove", onPointer)
      canvas.removeEventListener("click", onClick)
      gl.deleteBuffer(buffer)
      gl.deleteVertexArray(vao)
      gl.deleteTexture(texture)
      gl.deleteProgram(program)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      canvas.remove()
      probe.remove()
    }
  }, [])

  // props reach the loop through refs written here, never in render; a change only wakes it
  React.useEffect(() => {
    settingsRef.current = settings
    wakeRef.current?.()
  })

  return (
    <div
      ref={(el: HTMLDivElement | null) => {
        rootRef.current = el
        setRef(ref, el)
      }}
      data-slot="picture-wave"
      className={cn("relative h-full w-full overflow-hidden [container-type:size]", className)}
      {...props}
    >
      {words.length > 0 && (
        <p
          ref={wordsRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] m-0 font-heading text-[length:5cqw] leading-none tracking-[-0.03em] data-[world=vertical]:text-[length:min(10.667cqw,48px)]"
        >
          <span ref={wordARef} className={WORD}>
            {words[0]}
          </span>
          {words[1] && (
            <span ref={wordBRef} className={WORD}>
              {words[1]}
            </span>
          )}
        </p>
      )}
    </div>
  )
}

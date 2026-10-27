"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface PictureOrbitImage {
  /** The picture's URL, served with CORS. */
  src: string
  /** Its width ÷ height. A card takes these proportions between 0.6 and 1.7 and crops the picture beyond them. */
  aspect: number
}

export interface PictureOrbitProps extends React.ComponentProps<"div"> {
  /** The pictures on the cards; each depth layer cycles through them in its own order (up to 100). */
  images?: PictureOrbitImage[]
  /** Held still in the middle while the cards travel around it. */
  children?: React.ReactNode
  /** View heights of scroll it stays pinned for, the cards rising all the while at their own pace. */
  length?: number
  /** How far the cards lean away from the pointer, the nearer ones more: 0 holds them still. */
  lean?: number
  /** The cards' slow idle drift. Off, nothing moves while the reader neither scrolls nor moves the pointer. */
  float?: boolean
  /** Called with a picture's index in `images` when its card is clicked. */
  onPick?: (index: number) => void
  /** Override the device pixel ratio, which is capped at 2. */
  dpr?: number
}

type Settings = Required<Pick<PictureOrbitProps, "images" | "length" | "lean" | "float">> & Pick<PictureOrbitProps, "onPick" | "dpr">
type World = "wide" | "narrow"

// the default pictures' proportions: the field's layout is seeded from them
const ASPECTS = [
  1, 1.286, 0.783, 0.75, 0.75, 0.75, 0.729, 0.639, 0.678, 1.27, 0.896, 1.13, 1.399, 0.834, 1.43, 0.531, 0.781, 0.803,
  0.564, 0.766, 1.047, 0.672, 0.682, 0.787, 1.258, 0.51, 0.688, 1.182, 1.442, 0.656, 1.249, 2.306, 1.326, 1.249, 1.135,
  0.75, 2.265, 1.306, 1.889, 0.971, 0.748, 0.49, 1.249, 0.748, 1.488, 0.678, 0.748, 0.75, 0.826, 0.814, 0.719, 1.384,
  1.058, 2.317, 1.59, 1.501, 1.506, 1.501, 1.497, 1.506, 1.506, 1.369, 1.323, 1.506, 1.008, 1.556, 0.756, 0.805, 1.299,
  1.358, 0.734, 1.333,
]
const PICTURES: PictureOrbitImage[] = ASPECTS.map((aspect, i) => ({
  src: `https://picsum.photos/seed/mewo-picture-orbit-${i + 1}/${Math.round(300 * aspect)}/300`,
  aspect,
}))

// where the field is when the stage pins (in its own scroll units: view heights at the layers' speeds)
const START = 17.9
const LENGTH = 4.6
// cards further than this from the middle (box heights, past their own half-height) are off the stage
const REACH = 0.7
// the pointer is followed with this time constant (s)
const LEAN_EASE = 0.35
const PIXEL_BUDGET = 4.5e6
const CELL = 256
const GROUND = [217, 212, 203] as const

// Every length is in heights of the box from its centre, y down. The field: three depth layers (near pictures, mid
// pictures, pale far cards) spread evenly (Poisson-disc, no two in a layer overlapping) over `span` × `period`,
// which wraps vertically, rising at their own parallax `speed` (box heights per view height of scroll). Each card
// rides an oval around the middle: its half-width is the card's distance out (`arc`, at least the layer's `clear`)
// × `out`, its half-height r0·(arc/a0)^p, never under r0, so the inner cards bow the most and every card draws in
// towards the top and bottom. Cards are drawn at `size` of their base size.
type Layer = { speed: number; h: [number, number]; gap: number; cls: 0 | 1; depth: number; clear: number }
type Field = { span: number; period: number; layers: Layer[]; oval: { r0: number; a0: number; p: number; out: number; size: number } }
const FIELD: Record<World, Field> = {
  wide: {
    span: 3.2, period: 3.0,
    oval: { r0: 0.72, a0: 0.5, p: 1.55, out: 1.5, size: 0.8 },
    layers: [
      { speed: 0.708, h: [0.19, 0.27], gap: 0.42, cls: 0, depth: 1, clear: 0.3 },
      { speed: 0.637, h: [0.15, 0.21], gap: 0.36, cls: 0, depth: 0.7, clear: 0.26 },
      { speed: 0.566, h: [0.13, 0.2], gap: 0.32, cls: 1, depth: 0.45, clear: 0 },
    ],
  },
  narrow: {
    span: 1.5, period: 2.6,
    oval: { r0: 0.7, a0: 0.27, p: 2.7, out: 1.5, size: 0.8 },
    layers: [
      { speed: 0.986, h: [0.15, 0.21], gap: 0.36, cls: 0, depth: 1, clear: 0 },
      { speed: 0.867, h: [0.12, 0.18], gap: 0.31, cls: 0, depth: 0.7, clear: 0 },
      { speed: 0.789, h: [0.11, 0.16], gap: 0.28, cls: 1, depth: 0.45, clear: 0 },
    ],
  },
}
// how the field is seeded: cards are drawn at `size`, and on a wide box the pictures keep their inner edge `column`
// from the centre and out of a headline's band above it (half-width x, half-height h plus the card's, rising from y0
// by `rise` per step of its layer's speed until `until`)
const SEED = { size: 0.75, column: 0.34, hero: { x: 0.52, h: 0.18, y0: -0.095, rise: 0.749, until: 0.95 } }

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const wrap = (y: number, p: number) => (((y % p) + p) % p) - p / 2
const pushIn = (v: number) => Math.exp(-0.16 * (1 - clamp01(v)) ** 2)
const PUSH = pushIn(0)

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** A picture card's proportions: its picture's, between 0.6 and 1.7. */
export const pictureAspect = (a: number) => Math.min(1.7, Math.max(0.6, a))

export type OrbitCard = {
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
  /** its oval's half-width before `out` */
  arc: number
}

function clearOfText(world: World, ly: Layer, x0: number, y0: number, w: number, h: number) {
  if (world !== "wide" || ly.cls !== 0) return true
  const F = FIELD[world]
  const H = SEED.hero
  if (Math.abs(x0) * PUSH - w / 2 < SEED.column) return false
  for (let v = 0; v <= H.until + 1e-6; v += 0.05) {
    const g = pushIn(v)
    if (Math.abs(x0) * g - w / 2 >= H.x) continue
    const y = wrap(y0 - ly.speed * v, F.period) * g
    if (Math.abs(y - (H.y0 - H.rise * v)) < h / 2 + H.h) return false
  }
  return true
}

/** The field's cards for a world, seeded, from the pictures' proportions. */
export function buildOrbit(world: World, pictures: number[]): OrbitCard[] {
  const F = FIELD[world]
  const r = rng(world === "wide" ? 21 : 23)
  const cards: OrbitCard[] = []
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
      if (!clearOfText(world, ly, x, y, h * aspect * SEED.size, h * SEED.size)) continue
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
      // the pictures' distances out are mapped back onto the range they had before the text clearance, from the
      // layer's `clear` to the field's edge
      const R = F.span / 2
      const w = h * aspect
      const inner = world === "wide" && ly.cls === 0 ? (SEED.column + (w * SEED.size) / 2) / PUSH : ly.clear
      const arc = ly.clear + ((Math.abs(x0) - inner) * (R - ly.clear)) / Math.max(1e-6, R - inner)
      cards.push({ cls: ly.cls, aspect, img, layer: li, x0, y0, w, h, phase: r() * Math.PI * 2, arc })
    }
  }
  return cards
}

/** A card at scroll position v: [x, y, w, h] into out. float (0 to 1) scales its idle drift; lean is the pointer's
 * pull. */
export function orbitAt(world: World, c: OrbitCard, v: number, time: number, float: number, leanX: number, leanY: number, out: number[]) {
  const F = FIELD[world]
  const ly = F.layers[c.layer]!
  const A = F.oval
  const fx = Math.sin(time * 0.4 + c.phase) * 0.004 * float - leanX * 0.022 * ly.depth
  const fy = Math.cos(time * 0.33 + c.phase * 1.3) * 0.006 * float - leanY * 0.022 * ly.depth
  const y = wrap(c.y0 - ly.speed * v, F.period)
  const ry = A.r0 * Math.max(1, (c.arc / A.a0) ** A.p)
  out[0] = Math.sign(c.x0) * c.arc * A.out * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)) + fx
  out[1] = y + fy
  out[2] = c.w * A.size
  out[3] = c.h * A.size
  return out
}

/** The nearest ancestor that scrolls vertically, or null when the page itself does. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === "auto" || overflowY === "scroll") return el
  }
  return null
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

const TITLE = (
  <p className="grid w-max text-start font-heading text-[length:5.25cqw] leading-[0.98] font-normal tracking-[-0.03em] text-foreground @max-[900px]:text-[length:min(10.27cqw,46.2px)]">
    <span className="whitespace-nowrap">
      <em className="text-[0.8em] italic">the </em>Land
    </span>
    {/* the second line steps in by 2.1em, so the two lines always overlap a little */}
    <span className="ps-[2.1em] whitespace-nowrap">
      <em className="text-[0.8em] italic">of the </em>Rivers
    </span>
  </p>
)

/**
 * Picture cards that rise past a still middle as the reader scrolls, each along an oval around it, so they bow out
 * around the text there and draw in towards the top and bottom: three depth layers at their own speeds, drifting
 * slowly and leaning away from the pointer. Pins to its nearest scroll container, or to the page. One WebGL 2 draw
 * call from one atlas; it draws only while something moves, and never off screen.
 */
export function PictureOrbit({
  images = PICTURES,
  children = TITLE,
  length = LENGTH,
  lean = 1,
  float = true,
  onPick,
  dpr,
  className,
  style,
  ...props
}: PictureOrbitProps) {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const settings: Settings = { images, length, lean, float, onPick, dpr }
  const settingsRef = React.useRef(settings)
  const wakeRef = React.useRef<(() => void) | null>(null)

  React.useEffect(() => {
    const stage = stageRef.current
    // The root's ref stays the consumer's, so the root is reached through the stage.
    const root = stage?.parentElement
    if (!stage || !root) return
    const canvas = document.createElement("canvas")
    canvas.className = "absolute inset-0 block h-full w-full"
    canvas.setAttribute("aria-hidden", "true")
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: true, depth: false, stencil: false })
    if (!gl) return
    stage.prepend(canvas)

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
    let boxes: [number, number, number, number][] = []
    let mipsDirty = true
    let loads: HTMLImageElement[] = []
    const buildAtlas = (pictures: PictureOrbitImage[]) => {
      for (const img of loads) img.onload = img.onerror = null
      loads = []
      const grid = Math.max(1, Math.ceil(Math.sqrt(pictures.length)))
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
    stage.appendChild(probe)
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

    const scroller = scrollParent(root)
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    const fields: Partial<Record<World, OrbitCard[]>> = {}
    let shownImages: PictureOrbitImage[] | null = null
    let imagesKey = "\u0000"
    let data = new Float32Array(0)
    let hits = new Float32Array(0)
    let hitCount = 0
    let width = 1
    let height = 1
    let raf = 0
    let last = 0
    let visible = true
    let drawnAt = Number.NaN
    // the field's own clock for its drift
    let clock = 0
    const mouse: [number, number] = [0, 0]
    const leaned: [number, number] = [0, 0]
    const out: [number, number, number, number] = [0, 0, 0, 0]

    const fieldFor = (world: World, pictures: PictureOrbitImage[]) => {
      const cards = fields[world] ?? buildOrbit(world, pictures.map((p) => p.aspect))
      fields[world] = cards
      if (data.length < cards.length * STRIDE) {
        data = new Float32Array(cards.length * STRIDE)
        hits = new Float32Array(cards.length * 5)
        // the GPU buffer is sized once per layout; each frame writes only what it draws
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW)
      }
      return cards
    }

    // view heights scrolled since the stage pinned (negative before)
    const pinned = () => {
      const viewport = scroller ? scroller.clientHeight : window.innerHeight
      const top = root.getBoundingClientRect().top - (scroller ? scroller.getBoundingClientRect().top : 0)
      return -top / Math.max(1, viewport)
    }

    const draw = (v: number) => {
      const s = settingsRef.current
      const pictures = s.images.slice(0, 100)
      if (s.images !== shownImages) {
        // a new list with the same pictures (written inline by the consumer) keeps the atlas and the layout
        shownImages = s.images
        const key = pictures.map((p) => `${p.src}\u0002${p.aspect}`).join("\u0001")
        if (key !== imagesKey) {
          imagesKey = key
          delete fields.wide
          delete fields.narrow
          buildAtlas(pictures)
        }
      }
      const world: World = width < 900 ? "narrow" : "wide"
      const cards = fieldFor(world, pictures)
      if (mipsDirty) {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.generateMipmap(gl.TEXTURE_2D)
        mipsDirty = false
      }
      const drift = s.float && !reduced ? 1 : 0
      const lx = reduced ? 0 : leaned[0] * s.lean
      const ly = reduced ? 0 : leaned[1] * s.lean
      const ox = width / 2
      const oy = height / 2
      let n = 0
      hitCount = 0
      // far layers first
      for (let layer = 2; layer >= 0; layer--)
        for (const c of cards) {
          if (c.layer !== layer) continue
          orbitAt(world, c, v, clock, drift, lx, ly, out)
          // only what can show
          if (Math.abs(out[1]) - out[3] / 2 > REACH) continue
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
          data[o + 9] = 1
          n++
          if (picture) {
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

    // the loop runs while the reader scrolls, the cards drift, or they still follow the pointer
    const frame = (now: number) => {
      raf = 0
      if (!visible || document.hidden) {
        last = 0
        return
      }
      const dt = last ? Math.min(0.05, Math.max(1 / 240, (now - last) / 1000)) : 1 / 60
      const s = settingsRef.current
      let moving = false
      const k = reduced ? 0 : 1 - Math.exp(-dt / LEAN_EASE)
      leaned[0] += (mouse[0] - leaned[0]) * k
      leaned[1] += (mouse[1] - leaned[1]) * k
      // within a few hundredths of a pixel of the pointer, the lean lands and the loop may stop
      if (Math.abs(mouse[0] - leaned[0]) + Math.abs(mouse[1] - leaned[1]) < 2e-3) {
        leaned[0] = mouse[0]
        leaned[1] = mouse[1]
      } else if (s.lean !== 0 && !reduced) moving = true
      if (s.float && !reduced) {
        clock += dt
        moving = true
      }
      // the cards rise at the field's own pace, from just before the stage pins to just after it lets go
      const v = START + Math.min(Math.max(pinned(), -1), Math.max(0, s.length) + 1)
      if (moving || v !== drawnAt || mipsDirty) {
        drawnAt = v
        draw(v)
      }
      last = moving ? now : 0
      if (moving) wake()
    }
    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const resize = () => {
      const s = settingsRef.current
      // Inside a scroll container the stage pins to that container, not the window.
      if (scroller) root.style.setProperty("--mewo-viewport", `${scroller.clientHeight}px`)
      width = Math.max(1, stage.clientWidth)
      height = Math.max(1, stage.clientHeight)
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (width * height)))
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))
      drawnAt = Number.NaN
      wake()
    }
    const pick = (clientX: number, clientY: number) => {
      const r = stage.getBoundingClientRect()
      const x = clientX - r.left
      const y = clientY - r.top
      for (let k = hitCount - 1; k >= 0; k--) {
        const q = k * 5
        if (x >= hits[q + 1]! && x <= hits[q + 3]! && y >= hits[q + 2]! && y <= hits[q + 4]!) return hits[q]!
      }
      return -1
    }
    // the pointer, −1 to 1 across the stage (held at its edges outside it): the cards lean away from it
    const onPointer = (e: PointerEvent) => {
      if (!visible) return
      const r = stage.getBoundingClientRect()
      mouse[0] = Math.min(1, Math.max(-1, ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1))
      mouse[1] = Math.min(1, Math.max(-1, ((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1))
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      const cursor = inside && settingsRef.current.onPick && pick(e.clientX, e.clientY) >= 0 ? "pointer" : ""
      if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor
      if (settingsRef.current.lean !== 0) wake()
    }
    const onClick = (e: MouseEvent) => {
      const i = pick(e.clientX, e.clientY)
      if (i >= 0) settingsRef.current.onPick?.(i)
    }
    const onVisibility = () => wake()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(stage)
    if (scroller) resizeObserver.observe(scroller)
    const intersection = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting)
        if (visible) wake()
      },
      // against the window, not the scroll box: the box's own clip still counts, and so does the box leaving the page
      { root: null }
    )
    intersection.observe(stage)
    const themeObserver = new MutationObserver(() => {
      readTheme()
      drawnAt = Number.NaN
      wake()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })
    const target = scroller ?? window
    target.addEventListener("scroll", wake, { passive: true })
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pointermove", onPointer, { passive: true })
    canvas.addEventListener("click", onClick)
    readTheme()
    resize()
    wakeRef.current = () => {
      drawnAt = Number.NaN
      wake()
    }

    return () => {
      cancelAnimationFrame(raf)
      raf = -1
      wakeRef.current = null
      for (const img of loads) img.onload = img.onerror = null
      resizeObserver.disconnect()
      intersection.disconnect()
      themeObserver.disconnect()
      target.removeEventListener("scroll", wake)
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
      data-slot="picture-orbit"
      className={cn("relative h-[calc(var(--mewo-viewport,100vh)*var(--mewo-length))]", className)}
      style={{ "--mewo-length": Math.max(0, length) + 1, ...style } as React.CSSProperties}
      {...props}
    >
      <div ref={stageRef} data-slot="picture-orbit-stage" className="sticky top-0 h-[var(--mewo-viewport,100vh)] w-full overflow-hidden [container-type:size]">
        {children != null && (
          <div data-slot="picture-orbit-content" className="pointer-events-none absolute inset-0 z-[1] grid place-items-center p-6 text-center">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

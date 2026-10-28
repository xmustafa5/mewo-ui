"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface PrismCarouselItem {
  /** Image URL. It is drawn with WebGL, so the server must allow cross-origin use (CORS). */
  src: string
  /** Image description for screen readers. */
  alt: string
  /** First caption line while the image is active. */
  title?: string
  /** Second caption line while the image is active. */
  subtitle?: string
  /** Opened when the active image is clicked or Enter is pressed. */
  href?: string
}

/** What `controlsRef` receives. */
export interface PrismCarouselControls {
  /** Moves to the next image. */
  next(): void
  /** Moves to the previous image. */
  previous(): void
  /** Moves to the image at `index`, the short way round when looping. */
  goTo(index: number): void
}

export interface PrismCarouselProps extends Omit<React.ComponentProps<"div">, "onSelect" | "draggable"> {
  /** Images to show, in order. They must allow cross-origin loading. */
  items?: PrismCarouselItem[]
  /** Index of the image shown first. */
  startIndex?: number
  /** Width divided by height of the active image. Neighbours are narrower crops of their images. */
  aspect?: number
  /** Height of the active image as a fraction of the space above the caption. */
  size?: number
  /** Height of the neighbouring images relative to the active one. */
  neighborScale?: number
  /** Space between images in pixels. */
  gap?: number
  /** Corner radius of the active image in pixels. Neighbours scale it with their height. */
  radius?: number
  /** Colour of the images that are not active, from 0 (monochrome) to 1 (full colour). */
  saturation?: number
  /** How much the images away from the centre darken. */
  dim?: number
  /** Strength of the band of spectrum that sweeps across each new image. 0 turns the colour on without a sweep. */
  sweep?: number
  /** Seconds the sweep takes to cross an image. */
  sweepDuration?: number
  /** How strongly images split into a spectrum while the carousel moves. 0 keeps them sharp. */
  dispersion?: number
  /** Advance to the next image every `interval` seconds. Holds off screen and for reduced-motion users. */
  autoplay?: boolean
  /** Seconds between autoplay steps. */
  interval?: number
  /** Wrap around at the ends. */
  loop?: boolean
  /** Show the title and subtitle of the active image. */
  captions?: boolean
  /** Show previous and next buttons with a counter. */
  controls?: boolean
  /** Drag or swipe sideways to move between images, with inertia and snapping. */
  draggable?: boolean
  /** Scroll to move between images, one image per notch. */
  wheel?: boolean
  /** Pause autoplay while the pointer is over the carousel. Hovering a neighbour also lets some colour in. */
  pauseOnHover?: boolean
  /** Background of the component, any CSS colour. Caption and controls turn near-black or near-white to suit it. */
  backgroundColor?: string
  /** Stops autoplay. Reduced-motion users also get no sweep or dispersion. */
  paused?: boolean
  /** Most device pixels per CSS pixel the canvas uses. It is never more than 2. */
  dpr?: number
  /** Receives `next()`, `previous()` and `goTo(index)` to move the carousel from outside. */
  controlsRef?: React.Ref<PrismCarouselControls>
  /** Called when a different image becomes active. */
  onIndexChange?: (index: number) => void
  /** Called when the active image is clicked or Enter is pressed. */
  onSelect?: (item: PrismCarouselItem, index: number) => void
  /** Rendered on top of the carousel, after the caption. */
  children?: React.ReactNode
}

const DEFAULT_ITEMS: PrismCarouselItem[] = [
  ["Harbour Light", "Morning on the water"],
  ["Paper Moon", "A quiet night in the city"],
  ["Salt Road", "Across the flats at noon"],
  ["Green Hour", "Rain on the hills"],
  ["Low Tide", "The sea pulls back"],
  ["Night Orchard", "Lanterns between the trees"],
  ["Copper Field", "Late sun on the grass"],
  ["Blue Hollow", "Cold air before dawn"],
].map(([title, subtitle], index) => ({
  src: `https://picsum.photos/seed/mewo-prism-carousel-${index + 1}/1200/800`,
  alt: `Placeholder photograph for ${title}`,
  title,
  subtitle,
}))

const DEFAULT_LABEL = "Prism carousel. Scroll, drag or use the arrow keys to move between images."

// Motion. Springs are in rad/s with a damping ratio.
// Navigation and the settle after a drag share one spring.
const POSITION_SPRING = { omega: 10, zeta: 0.94 }
// The image that stops being active drains its colour on this spring, starting this many ms later.
const COLOUR_OUT_SPRING = { omega: 7.55, zeta: 0.9 }
const COLOUR_OUT_DELAY = 75
// Hover colour on a neighbour, critically damped: quicker in than out. The shader lets 60% of it through.
const HOVER_IN = 14
const HOVER_OUT = 9.5
// The colour edge of a sweep, as a share of the image width, when it starts and once `sweepDuration` has
// passed. It runs on to 1.25 so the band leaves the image before the sweep ends. 10 means no sweep.
const SWEEP_FROM = -0.27
const SWEEP_TO = 1
const SWEEP_DONE = 1.25
const NO_SWEEP = 10
// Seconds of motion smeared into the spectrum per unit of `dispersion`, and the most it may spread
// as a share of an image's width.
const DISPERSION_TIME = 0.0056
const DISPERSION_MAX = 0.35
// Pixels a press travels before it becomes a drag.
const DRAG_THRESHOLD = 4
// Past either end without `loop`, a drag moves the row this much per pixel.
const OVERDRAG = 0.35
// Release speed is read over this many ms of pointer samples.
const VELOCITY_WINDOW = 100
// Seconds of release velocity projected forward to choose where a drag lands.
const RELEASE_LOOKAHEAD = 0.23
// Wheel delta per image. A step is taken once half of one has built up, at most two per event, and
// a pause this long in ms drops a partial step.
const WHEEL_STEP = 100
const WHEEL_MAX_STEPS = 2
const WHEEL_RESET = 250
// The caption swaps when a move crosses its midpoint, then fades in on an ease-out-quint.
const CAPTION_FADE = 470
const CAPTION_DELAY = 16
const CAPTION_EASE = "cubic-bezier(0.22, 1, 0.36, 1)"
// Shortest autoplay interval, in seconds.
const MIN_INTERVAL = 0.5
// The first step after idling covers about a frame and a half (ms), so a move starts the moment it is asked for.
const HEAD_START = 25
// dt is clamped so a hitch or a tab switch does not jump the springs.
const MAX_DT = 0.05
// Springs are integrated in fixed substeps so a slow frame does not change their shape.
const SUBSTEP = 1 / 240

// Layout.
// Pixels between the active image and the caption block.
const CAPTION_GAP = 16.15
// Pixels the caption block reserves beyond its own height.
const CAPTION_SLACK = 8.3
// The caption block's height before it has been measured.
const CAPTION_BLOCK = 84
// The active image never comes closer than this to the top.
const TOP_MARGIN = 45
// Width over height of the first neighbour, whatever the active aspect.
const NEIGHBOR_ASPECT = 0.72
// On a narrow container the active image is at most this share of the width, bending down past NARROW_FROM px.
const NARROW_WIDTH = 0.84
const NARROW_FROM = 400
const NARROW_BEND = 0.00076
// |offset| where the outermost images start to fade out.
const EDGE_FADE_START = 2.82

// Width between the active (|o| = 0) and first-neighbour (|o| = 1) sizes, as a 0..1 blend at |o| = 0, 0.05, ... 1.
// The shape depends on how much wider the active image is than a neighbour (ratio rho = Wa / Wn).
const T_RHO_HIGH = { rho: 3.157, t: [1, 0.9955, 0.9819, 0.9587, 0.9253, 0.8821, 0.8285, 0.7671, 0.7006, 0.6341, 0.5677, 0.5012, 0.4347, 0.3684, 0.3038, 0.2413, 0.184, 0.1304, 0.0817, 0.0386, 0] }
const T_RHO_LOW = { rho: 1.576, t: [1, 0.9977, 0.9856, 0.9645, 0.935, 0.8922, 0.8492, 0.7874, 0.7322, 0.6723, 0.6101, 0.5496, 0.4901, 0.4272, 0.3622, 0.3061, 0.2427, 0.1829, 0.122, 0.0612, 0] }
// Width beyond the first neighbour relative to it, at |o| = 1, 1.05, ... 2.9 (roughly a third per slot).
const R = [1, 0.9218, 0.852, 0.7898, 0.7345, 0.6879, 0.6503, 0.6205, 0.5976, 0.5734, 0.5479, 0.5243, 0.5001, 0.476, 0.4526, 0.4297, 0.4059, 0.3857, 0.3674, 0.3478, 0.3318, 0.316, 0.3004, 0.2848, 0.2719, 0.2579, 0.2462, 0.2356, 0.2234, 0.2138, 0.2043, 0.193, 0.1831, 0.173, 0.1621, 0.1525, 0.1432, 0.1338, 0.1247]
// Opacity of the outermost images at |o| = 2.82, 2.84, ... 3.42.
const FADE = [1, 0.992, 0.98, 0.969, 0.953, 0.939, 0.916, 0.894, 0.869, 0.843, 0.817, 0.788, 0.759, 0.718, 0.69, 0.653, 0.621, 0.576, 0.533, 0.498, 0.465, 0.429, 0.394, 0.352, 0.31, 0.278, 0.245, 0.217, 0.159, 0.094, 0]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const wrap = (i: number, n: number) => ((i % n) + n) % n
const pad2 = (n: number) => String(n).padStart(2, "0")

const table = (t: number[], x: number, step: number, x0 = 0) => {
  const f = (x - x0) / step
  if (f <= 0) return t[0]
  if (f >= t.length - 1) return t[t.length - 1]
  const i = Math.floor(f)
  return t[i] + (t[i + 1] - t[i]) * (f - i)
}

const smoothstep = (x: number) => {
  const t = clamp(x, 0, 1)
  return t * t * (3 - 2 * t)
}

type LayoutSettings = { aspect: number; size: number; neighborScale: number; gap: number }

type Metrics = {
  W: number
  H: number
  /** Vertical centre of the images. */
  cy: number
  /** Active image height and width. */
  Ha: number
  Wa: number
  /** First neighbour height and width. */
  Hn: number
  Wn: number
  rho: number
  gap: number
  /** Pixels of drag per image: the width of an image half a slot from the centre, plus the gap. */
  D: number
  /** Top of the caption block. */
  captionY: number
}

type Box = {
  /** Item index. */
  index: number
  /** Offset from the centre, in images. */
  o: number
  x: number
  y: number
  w: number
  h: number
  alpha: number
  bright: number
}

/** Image sizes for a container of W × H CSS pixels whose caption block is `captionBlock` pixels tall. */
export function computeMetrics(W: number, H: number, captionBlock: number, s: LayoutSettings): Metrics {
  const S = Math.max(1, H - (captionBlock > 0 ? captionBlock + CAPTION_SLACK : CAPTION_SLACK))
  const vertical = Math.min(s.size * S, S - 2 * TOP_MARGIN)
  const wCap = NARROW_WIDTH * W - NARROW_BEND * Math.max(0, W - NARROW_FROM) ** 2
  const Ha = Math.max(8, Math.min(vertical, wCap / s.aspect))
  const Wa = s.aspect * Ha
  const Hn = s.neighborScale * Ha
  const Wn = NEIGHBOR_ASPECT * Hn
  const m: Metrics = { W, H, cy: S / 2, Ha, Wa, Hn, Wn, rho: Wa / Math.max(1e-3, Wn), gap: s.gap, D: 1, captionY: S / 2 + Ha / 2 + CAPTION_GAP }
  m.D = imageWidth(0.5, m) + s.gap
  return m
}

/** Width of an image `o` slots from the centre. */
export function imageWidth(o: number, m: Metrics) {
  const a = Math.abs(o)
  if (a <= 1) {
    const k = (m.rho - T_RHO_HIGH.rho) / (T_RHO_LOW.rho - T_RHO_HIGH.rho)
    const t = table(T_RHO_HIGH.t, a, 0.05) + (table(T_RHO_LOW.t, a, 0.05) - table(T_RHO_HIGH.t, a, 0.05)) * k
    return m.Wn + (m.Wa - m.Wn) * clamp(t, 0, 1)
  }
  const r = a <= 2.9 ? table(R, a, 0.05, 1) : R[R.length - 1] * Math.pow(3, -(a - 2.9))
  return m.Wn * r
}

/** Height of an image `o` slots from the centre. */
export const imageHeight = (o: number, m: Metrics) => m.Hn + (m.Ha - m.Hn) * (1 - smoothstep(Math.abs(o)))

/** Opacity of an image `o` slots from the centre: only the outermost fade. */
export const imageOpacity = (o: number) => table(FADE, Math.abs(o), 0.02, EDGE_FADE_START)

/** Brightness of an image `o` slots from the centre. */
export const imageBrightness = (o: number, dim: number) => 1 - dim * smoothstep(Math.abs(o))

/** Every visible image for scroll position `p` (a continuous index), packed outwards from the centre line. */
export function layoutImages(p: number, count: number, loop: boolean, m: Metrics, dim: number): Box[] {
  if (!count) return []
  const k = Math.floor(p)
  const f = p - k
  const slots: { j: number; index: number; o: number; w: number; h: number }[] = []
  for (let j = -4; j <= 5; j++) {
    const raw = k + j
    if (!loop && (raw < 0 || raw >= count)) continue
    const o = j - f
    if (Math.abs(o) > 3.45) continue
    slots.push({ j, index: wrap(raw, count), o, w: imageWidth(o, m), h: imageHeight(o, m) })
  }
  const byJ = new Map(slots.map((s) => [s.j, s]))
  const centres = new Map<number, number>()
  // The centre line sits at fraction f between the centres of slot 0 and slot 1.
  const w0 = byJ.get(0)?.w ?? imageWidth(-f, m)
  const w1 = byJ.get(1)?.w ?? imageWidth(1 - f, m)
  const c0 = m.W / 2 - f * (w0 / 2 + m.gap + w1 / 2)
  centres.set(0, c0)
  let c = c0
  let prevW = w0
  for (let j = 1; j <= 5; j++) {
    const w = byJ.get(j)?.w ?? imageWidth(j - f, m)
    c += prevW / 2 + m.gap + w / 2
    centres.set(j, c)
    prevW = w
  }
  c = c0
  prevW = w0
  for (let j = -1; j >= -4; j--) {
    const w = byJ.get(j)?.w ?? imageWidth(j - f, m)
    c -= prevW / 2 + m.gap + w / 2
    centres.set(j, c)
    prevW = w
  }
  return slots
    .map((s) => ({ index: s.index, o: s.o, x: centres.get(s.j)! - s.w / 2, y: m.cy - s.h / 2, w: s.w, h: s.h, alpha: imageOpacity(s.o), bright: imageBrightness(s.o, dim) }))
    .filter((b) => b.alpha > 0.001 && b.w > 0.2 && b.x < m.W && b.x + b.w > 0)
}

type Spring = { x: number; v: number }

/** Advances a damped spring toward `target` by `dt` seconds. */
function stepSpring(s: Spring, target: number, omega: number, zeta: number, dt: number) {
  for (let t = 0; t < dt - 1e-9; t += SUBSTEP) {
    const h = Math.min(SUBSTEP, dt - t)
    s.v += (omega * omega * (target - s.x) - 2 * zeta * omega * s.v) * h
    s.x += s.v * h
  }
}

/** Where the colour edge of a sweep that began at `start` (ms) is at `now`. */
const sweepEdge = (now: number, start: number, duration: number) =>
  SWEEP_FROM + (SWEEP_TO - SWEEP_FROM) * ((now - start) / (Math.max(0.05, duration) * 1000))

// One rounded, cover-cropped quad per visible image, with the grey/colour mix, the spectrum sweep and the
// motion dispersion done per pixel.
const VERTEX = `#version 300 es
in vec2 aPos;
uniform vec4 uRect;   // x, y, w, h in device px (top-left origin)
uniform vec2 uRes;
out vec2 vLocal;
void main() {
  vLocal = aPos;
  vec2 px = uRect.xy + aPos * uRect.zw;
  vec2 clip = px / uRes * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vLocal;
uniform sampler2D uTex;
uniform float uHasTex;
uniform vec2 uSize;     // quad size incl. 1px padding, device px
uniform vec2 uBox;      // image size, device px
uniform float uRadius;  // device px
uniform vec4 uCrop;     // uv offset xy, uv scale zw (cover crop)
uniform float uAlpha;
uniform float uBright;
uniform float uSat;     // colour of inactive images, 0..1
uniform float uColour;  // colour owned by this image (fades out after it stops being active)
uniform float uHover;   // hover colour, 0..1
uniform float uReveal;  // sweep: position of the colour edge across the image (0..1), large when done
uniform float uSweep;   // sweep band strength
uniform float uDisp;    // dispersion spread, as a share of the rect width
out vec4 outColor;

float sdRound(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
float g(float x, float mu, float s) { float d = (x - mu) / s; return exp(-0.5 * d * d); }
// spectral weights across the dispersion taps: red leads, violet trails
vec3 spectrum(float t) {
  return vec3(g(t, 0.85, 0.22) + 0.25 * g(t, 0.05, 0.12), g(t, 0.5, 0.2), g(t, 0.12, 0.2)) + 0.04;
}
vec3 tex(vec2 local) { return texture(uTex, uCrop.xy + local * uCrop.zw).rgb; }

void main() {
  vec2 px = vLocal * uSize;
  float d = sdRound(px - uSize * 0.5, uBox * 0.5, uRadius);
  float cover = clamp(0.5 - d, 0.0, 1.0);
  if (cover <= 0.0) discard;

  vec3 col;
  if (uHasTex < 0.5) {
    col = vec3(0.16);
  } else if (uDisp > 0.0004) {
    vec3 acc = vec3(0.0), wsum = vec3(0.0);
    for (int k = 0; k < 9; k++) {
      float t = float(k) / 8.0;
      vec3 w = spectrum(t);
      acc += tex(vLocal + vec2((t - 0.5) * uDisp, 0.0)) * w;
      wsum += w;
    }
    col = acc / wsum;
  } else {
    col = tex(vLocal);
  }

  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float dd = vLocal.x - uReveal;
  float owned = uColour * (1.0 - smoothstep(-0.08, 0.10, dd));
  float amount = max(owned, uHover * 0.6);
  amount = uSat + (1.0 - uSat) * amount;
  vec3 c = mix(vec3(luma), col, amount);
  if (uSweep > 0.0) {
    vec3 tint = vec3(
      0.12 * g(dd, -0.13, 0.04) - 0.38 * g(dd, -0.03, 0.035) + 0.23 * g(dd, 0.09, 0.045),
      0.88 * g(dd, 0.02, 0.06),
      0.75 * g(dd, -0.035, 0.045));
    c += uSweep * tint * luma;
  }
  c = clamp(c * uBright, 0.0, 1.0);
  float a = uAlpha * cover;
  outColor = vec4(c * a, a);
}`

const UNIFORMS = ["uRect", "uRes", "uTex", "uHasTex", "uSize", "uBox", "uRadius", "uCrop", "uAlpha", "uBright", "uSat", "uColour", "uHover", "uReveal", "uSweep", "uDisp"] as const

type DrawItem = {
  /** Texture key: the item index. */
  key: number
  /** CSS pixels. */
  x: number
  y: number
  w: number
  h: number
  radius: number
  alpha: number
  bright: number
  sat: number
  colour: number
  hover: number
  reveal: number
  sweep: number
  disp: number
}

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

function createRenderer(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
  const program = gl.createProgram()
  if (!vertex || !fragment || !program) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  const vao = gl.createVertexArray()
  const buffer = gl.createBuffer()
  const blank = gl.createTexture()
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) || !vao || !buffer || !blank) {
    gl.deleteVertexArray(vao)
    gl.deleteBuffer(buffer)
    gl.deleteTexture(blank)
    gl.deleteProgram(program)
    return null
  }
  const u = Object.fromEntries(UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)])) as Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>
  gl.bindVertexArray(vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, "aPos")
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  gl.bindVertexArray(null)
  const textures = new Map<number, { texture: WebGLTexture; w: number; h: number }>()
  gl.bindTexture(gl.TEXTURE_2D, blank)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([40, 40, 40, 255]))
  let dpr = 1

  return {
    setSize(w: number, h: number, ratio: number) {
      dpr = ratio
      const width = Math.max(1, Math.round(w * ratio))
      const height = Math.max(1, Math.round(h * ratio))
      // Assigning the same size would clear the canvas.
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    },
    upload(key: number, image: HTMLImageElement) {
      const old = textures.get(key)
      if (old) gl.deleteTexture(old.texture)
      const texture = gl.createTexture()
      if (!texture) return
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      textures.set(key, { texture, w: image.naturalWidth, h: image.naturalHeight })
    },
    clearTextures() {
      textures.forEach((t) => gl.deleteTexture(t.texture))
      textures.clear()
    },
    draw(items: DrawItem[]) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.uniform2f(u.uRes, canvas.width, canvas.height)
      gl.uniform1i(u.uTex, 0)
      gl.activeTexture(gl.TEXTURE0)
      for (const it of items) {
        const t = textures.get(it.key)
        const w = it.w * dpr
        const h = it.h * dpr
        // The quad is padded by a pixel so the anti-aliased edge is not clipped.
        gl.uniform4f(u.uRect, it.x * dpr - 1, it.y * dpr - 1, w + 2, h + 2)
        gl.uniform2f(u.uSize, w + 2, h + 2)
        gl.uniform2f(u.uBox, w, h)
        gl.uniform1f(u.uRadius, Math.min(it.radius * dpr, Math.min(w, h) / 2))
        let cx = 0
        let cy = 0
        let sx = 1
        let sy = 1
        if (t) {
          const ta = t.w / t.h
          const ra = w / h
          if (ra > ta) sy = ta / ra
          else sx = ra / ta
          // The extra pixel of padding on each side.
          const px = sx / w
          const py = sy / h
          cx = (1 - sx) / 2 - px
          cy = (1 - sy) / 2 - py
          sx += 2 * px
          sy += 2 * py
        }
        gl.uniform4f(u.uCrop, cx, cy, sx, sy)
        gl.bindTexture(gl.TEXTURE_2D, t ? t.texture : blank)
        gl.uniform1f(u.uHasTex, t ? 1 : 0)
        gl.uniform1f(u.uAlpha, it.alpha)
        gl.uniform1f(u.uBright, it.bright)
        gl.uniform1f(u.uSat, it.sat)
        gl.uniform1f(u.uColour, it.colour)
        gl.uniform1f(u.uHover, it.hover)
        gl.uniform1f(u.uReveal, it.reveal)
        gl.uniform1f(u.uSweep, it.sweep)
        gl.uniform1f(u.uDisp, it.disp)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
      gl.bindVertexArray(null)
    },
    dispose() {
      textures.forEach((t) => gl.deleteTexture(t.texture))
      textures.clear()
      gl.deleteTexture(blank)
      gl.deleteBuffer(buffer)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
    },
  }
}

// Caption and controls turn near-black or near-white against `backgroundColor`. A 2D canvas parses the colour,
// so names, hsl() and oklch() all work; one probe serves every instance and each colour is parsed once.
const textColours = new Map<string, string | undefined>()
let colourProbe: CanvasRenderingContext2D | null = null

function textColourFor(bg: string) {
  if (!bg || bg === "transparent" || typeof document === "undefined") return undefined
  if (textColours.has(bg)) return textColours.get(bg)
  colourProbe ??= document.createElement("canvas").getContext("2d")
  if (!colourProbe) return undefined
  colourProbe.fillStyle = "#000"
  colourProbe.fillStyle = bg
  const value = String(colourProbe.fillStyle)
  const hex = value.match(/^#([0-9a-f]{6})$/i)
  let r = 0
  let g = 0
  let b = 0
  let a = 1
  if (hex) {
    const n = parseInt(hex[1], 16)
    r = n >> 16
    g = (n >> 8) & 255
    b = n & 255
  } else {
    const parts = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]
    r = parts[0]
    g = parts[1]
    b = parts[2]
    a = parts[3] ?? 1
  }
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  const colour = a < 0.2 ? undefined : lum > 0.55 ? "rgb(10, 10, 10)" : "rgb(250, 250, 250)"
  textColours.set(bg, colour)
  return colour
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia?.(REDUCED_MOTION)
  query?.addEventListener?.("change", onChange)
  return () => query?.removeEventListener?.("change", onChange)
}
const prefersReducedMotion = () => window.matchMedia?.(REDUCED_MOTION).matches ?? false
const subscribeNothing = () => () => {}

function selectItem(items: PrismCarouselItem[], index: number, onSelect?: (item: PrismCarouselItem, index: number) => void) {
  const item = items[index]
  if (!item) return
  onSelect?.(item, index)
  if (item.href) window.location.assign(item.href)
}

type Settings = {
  items: PrismCarouselItem[]
  count: number
  start: number
  aspect: number
  size: number
  neighborScale: number
  gap: number
  radius: number
  saturation: number
  dim: number
  sweep: number
  sweepDuration: number
  dispersion: number
  autoplay: boolean
  interval: number
  loop: boolean
  captions: boolean
  controls: boolean
  draggable: boolean
  wheel: boolean
  pauseOnHover: boolean
  paused: boolean
  dpr: number
  reduced: boolean
  hovering: boolean
  onIndexChange?: (index: number) => void
  onSelect?: (item: PrismCarouselItem, index: number) => void
}

type ImageFx = {
  colour: Spring
  colourTarget: number
  /** Time (ms) the colour spring may start: the delay before a colour drains. */
  colourFrom: number
  sweepStart: number | null
  hover: Spring
}

// Where the carousel is and what each image is doing. It outlives the WebGL setup, so a Strict Mode remount
// in development picks up where it was.
type Engine = {
  pos: Spring
  target: number
  owner: number
  pendingSnap: number
  display: number
  fx: Map<number, ImageFx>
  hovered: number
  drag: null | { id: number; x0: number; p0: number; active: boolean; samples: [number, number][] }
  wheelAcc: number
  wheelAt: number
  images: Map<string, HTMLImageElement>
}

const createEngine = (start: number): Engine => ({
  pos: { x: start, v: 0 },
  target: start,
  owner: start,
  pendingSnap: -1,
  display: start,
  fx: new Map(),
  hovered: -1,
  drag: null,
  wheelAcc: 0,
  wheelAt: 0,
  images: new Map(),
})

const fxOf = (e: Engine, i: number) => {
  let f = e.fx.get(i)
  if (!f) {
    f = { colour: { x: 0, v: 0 }, colourTarget: 0, colourFrom: 0, sweepStart: null, hover: { x: 0, v: 0 } }
    e.fx.set(i, f)
  }
  return f
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  )
}

export function PrismCarousel({
  items = DEFAULT_ITEMS,
  startIndex = 0,
  aspect = 1.5,
  size = 0.62,
  neighborScale = 0.66,
  gap = 14,
  radius = 18,
  saturation = 0,
  dim = 0.2,
  sweep = 1,
  sweepDuration = 1.1,
  dispersion = 1,
  autoplay = true,
  interval = 4.5,
  loop = true,
  captions = true,
  controls = true,
  draggable = true,
  wheel = true,
  pauseOnHover = true,
  backgroundColor = "transparent",
  paused = false,
  dpr = 2,
  controlsRef,
  onIndexChange,
  onSelect,
  className,
  style,
  children,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
  ...props
}: PrismCarouselProps) {
  const count = items.length
  const start = count ? clamp(Math.round(startIndex), 0, count - 1) : 0
  const [display, setDisplay] = React.useState(start)
  const [hovering, setHovering] = React.useState(false)
  const reduced = React.useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false)
  // Parsed on the client only: the server has no canvas, and hydration then re-renders with the colour.
  const fg = React.useSyncExternalStore(subscribeNothing, () => textColourFor(backgroundColor), () => undefined)

  const surfaceRef = React.useRef<HTMLDivElement>(null)
  const captionRef = React.useRef<HTMLDivElement>(null)
  const titlesRef = React.useRef<HTMLDivElement>(null)
  const engineRef = React.useRef<Engine | null>(null)
  const syncRef = React.useRef<(() => void) | null>(null)
  const apiRef = React.useRef<{ navigate: (delta: number) => void; goTo: (index: number) => void } | null>(null)
  const settings: Settings = {
    items,
    count,
    start,
    aspect,
    size,
    neighborScale,
    gap,
    radius,
    saturation,
    dim,
    sweep,
    sweepDuration,
    dispersion,
    autoplay,
    interval,
    loop,
    captions,
    controls,
    draggable,
    wheel,
    pauseOnHover,
    paused,
    dpr,
    reduced,
    hovering,
    onIndexChange,
    onSelect,
  }
  const settingsRef = React.useRef(settings)

  // This effect runs exactly once. A prop change reaches it through settingsRef and sync(), never by
  // tearing the context down.
  React.useEffect(() => {
    const surface = surfaceRef.current
    // The root's ref stays the consumer's, so the root is reached through the surface.
    const root = surface?.parentElement
    if (!surface || !root) return
    const e = (engineRef.current ??= createEngine(settingsRef.current.start))

    // The canvas is made here, not in JSX: React Strict Mode runs this effect twice in development, and a
    // context lost by the first cleanup would come straight back from getContext() on the same element.
    const canvas = document.createElement("canvas")
    canvas.className = "absolute inset-0 block h-full w-full"
    canvas.setAttribute("aria-hidden", "true")
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false })
    // Without WebGL 2 (jsdom, GPU-less CI, an old browser) no images draw, but the caption, controls,
    // keyboard and autoplay still work and nothing throws.
    const renderer = gl ? createRenderer(gl, canvas) : null
    if (renderer) surface.appendChild(canvas)

    let raf = 0
    let last = 0
    let visible = true
    let disposed = false
    let autoplayTimer = 0
    let width = 0
    let height = 0
    let captionBlock = CAPTION_BLOCK
    let metrics: Metrics | null = null
    let boxes: Box[] = []
    let loadedItems: PrismCarouselItem[] | null = null
    let loads = 0
    let watchedCaption: HTMLElement | null = null
    let dprKey = settingsRef.current.dpr
    let layoutKey = ""
    let autoplayKey = ""

    const layoutKeyOf = (s: Settings) => [s.aspect, s.size, s.neighborScale, s.gap, s.radius, s.saturation, s.dim, s.sweep, s.dispersion, s.loop, s.count, s.captions, s.controls].join()
    const autoplayKeyOf = (s: Settings) => [s.autoplay, s.paused, s.interval, s.pauseOnHover, s.hovering, s.loop, s.count, s.reduced].join()

    const measureCaption = () => {
      const el = captionRef.current
      return el && el.offsetHeight > 0 ? el.offsetHeight : 0
    }

    const layout = () => {
      metrics = computeMetrics(width, height, captionBlock, settingsRef.current)
      root.style.setProperty("--prism-caption-y", `${metrics.captionY}px`)
    }

    const draw = (now: number) => {
      const s = settingsRef.current
      if (!renderer || !metrics || !s.count) return
      const m = metrics
      boxes = layoutImages(e.pos.x, s.count, s.loop, m, s.dim)
      const speedPx = Math.abs(e.pos.v) * m.D
      const spread = s.reduced ? 0 : s.dispersion * DISPERSION_TIME * speedPx
      renderer.draw(
        boxes.map((b) => {
          const f = fxOf(e, b.index)
          let reveal = NO_SWEEP
          let sweepStrength = 0
          if (f.sweepStart !== null) {
            reveal = sweepEdge(now, f.sweepStart, s.sweepDuration)
            sweepStrength = s.sweep * f.colour.x
          }
          return {
            key: b.index,
            x: b.x,
            y: b.y,
            w: b.w,
            h: b.h,
            radius: s.radius * (b.h / m.Ha),
            alpha: b.alpha,
            bright: b.bright,
            sat: s.saturation,
            colour: f.colour.x,
            hover: f.hover.x,
            reveal,
            sweep: sweepStrength,
            disp: Math.min(DISPERSION_MAX, spread / Math.max(1, b.w)),
          }
        })
      )
    }

    const setDisplayIndex = (i: number) => {
      if (i === e.display) return
      e.display = i
      setDisplay(i)
      settingsRef.current.onIndexChange?.(i)
    }

    const frame = (now: number) => {
      raf = 0
      // Never schedule while off screen; the IntersectionObserver wakes the loop again.
      if (!visible) return
      const s = settingsRef.current
      const dt = clamp((now - last) / 1000, 0, MAX_DT)
      last = now
      let moving = false
      if (!e.drag?.active) {
        stepSpring(e.pos, e.target, POSITION_SPRING.omega, POSITION_SPRING.zeta, dt)
        if (Math.abs(e.pos.x - e.target) < 1e-4 && Math.abs(e.pos.v) < 1e-3) {
          e.pos.x = e.target
          e.pos.v = 0
        } else moving = true
      } else moving = true
      const shown = s.count ? wrap(Math.round(e.pos.x), s.count) : 0
      if (e.pendingSnap === shown) {
        const f = fxOf(e, shown)
        f.colour.x = 1
        f.colour.v = 0
        e.pendingSnap = -1
      }
      for (const [i, f] of e.fx) {
        if (now >= f.colourFrom) stepSpring(f.colour, f.colourTarget, COLOUR_OUT_SPRING.omega, COLOUR_OUT_SPRING.zeta, dt)
        if (Math.abs(f.colour.x - f.colourTarget) > 1e-3 || Math.abs(f.colour.v) > 1e-3) moving = true
        else {
          f.colour.x = f.colourTarget
          f.colour.v = 0
        }
        const hoverTarget = e.hovered === i && i !== e.owner ? 1 : 0
        stepSpring(f.hover, hoverTarget, hoverTarget ? HOVER_IN : HOVER_OUT, 1, dt)
        if (Math.abs(f.hover.x - hoverTarget) > 1e-3) moving = true
        else {
          f.hover.x = hoverTarget
          f.hover.v = 0
        }
        if (f.sweepStart !== null) {
          if (sweepEdge(now, f.sweepStart, s.sweepDuration) > SWEEP_DONE) f.sweepStart = null
          else moving = true
        }
      }
      setDisplayIndex(shown)
      draw(now)
      // The loop keeps going only while something moves: the position, a colour, a hover, a sweep or a drag.
      if (moving) raf = requestAnimationFrame(frame)
    }

    const wake = () => {
      if (raf || !visible || document.hidden) return
      last = performance.now() - HEAD_START
      raf = requestAnimationFrame(frame)
    }

    // The colour passes from the image that was active to the one that will be.
    const handOff = (to: number, now: number) => {
      const s = settingsRef.current
      if (to === e.owner) return
      const old = fxOf(e, e.owner)
      old.colourTarget = 0
      old.colourFrom = now + COLOUR_OUT_DELAY
      const f = fxOf(e, to)
      f.colourTarget = 1
      f.colourFrom = 0
      f.colour.v = 0
      if (s.sweep > 0 && !s.reduced) {
        f.colour.x = 1
        f.sweepStart = now
        e.pendingSnap = -1
      } else {
        // Without a sweep the colour snaps on as the move crosses its midpoint.
        f.colour.x = 0
        f.sweepStart = null
        e.pendingSnap = to
      }
      e.owner = to
    }

    // One step per interval. The timer restarts after every move, and holds while paused, hovered, off
    // screen, in a hidden tab and for reduced-motion users.
    const scheduleAutoplay = () => {
      window.clearTimeout(autoplayTimer)
      const s = settingsRef.current
      const held = s.paused || !s.autoplay || (s.pauseOnHover && s.hovering) || s.reduced || document.hidden || !visible || s.count < 2
      if (held) return
      if (!s.loop && e.target >= s.count - 1) return
      autoplayTimer = window.setTimeout(() => navigate(1), Math.max(MIN_INTERVAL, s.interval) * 1000)
    }

    const navigate = (delta: number) => {
      const s = settingsRef.current
      if (!s.count || !delta || e.drag?.active) return
      const next = s.loop ? e.target + delta : clamp(e.target + delta, 0, s.count - 1)
      if (next === e.target) return
      e.target = next
      handOff(wrap(next, s.count), performance.now())
      wake()
      scheduleAutoplay()
    }

    const goTo = (index: number) => {
      const s = settingsRef.current
      if (!s.count) return
      const i = wrap(Math.round(index), s.count)
      let delta = i - wrap(e.target, s.count)
      if (s.loop && Math.abs(delta) > s.count / 2) delta -= Math.sign(delta) * s.count
      navigate(delta)
    }

    const load = (list: PrismCarouselItem[]) => {
      loadedItems = list
      const generation = ++loads
      if (!renderer) return
      renderer.clearTextures()
      list.forEach((item, i) => {
        const done = (image: HTMLImageElement) => {
          if (disposed || generation !== loads) return
          renderer.upload(i, image)
          // The first image sweeps in once it has loaded.
          if (i === e.owner) {
            const f = fxOf(e, i)
            if (f.colourTarget === 0 && f.sweepStart === null) {
              const s = settingsRef.current
              f.colourTarget = 1
              f.colour.x = 1
              f.colour.v = 0
              if (s.sweep > 0 && !s.reduced) f.sweepStart = performance.now()
            }
          }
          wake()
        }
        const cached = e.images.get(item.src)
        if (cached?.complete && cached.naturalWidth) return done(cached)
        const image = cached ?? new Image()
        if (!cached) {
          image.crossOrigin = "anonymous"
          image.decoding = "async"
          image.src = item.src
          e.images.set(item.src, image)
        }
        image.addEventListener("load", () => done(image), { once: true })
        image.addEventListener("error", () => console.warn(`PrismCarousel: couldn't load ${item.src} (it must allow cross-origin use)`), { once: true })
      })
    }

    const resizeObserver = new ResizeObserver(() => resize())

    const watchCaption = () => {
      const el = captionRef.current
      if (el === watchedCaption) return
      if (watchedCaption) resizeObserver.unobserve(watchedCaption)
      if (el) resizeObserver.observe(el)
      watchedCaption = el
    }

    const resize = () => {
      const rect = root.getBoundingClientRect()
      width = rect.width
      height = rect.height
      captionBlock = measureCaption()
      // At most 2 device pixels per CSS pixel, and never more than `dpr`.
      renderer?.setSize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 2, Math.max(0.5, settingsRef.current.dpr)))
      layout()
      draw(performance.now())
    }

    // Called after every render with the new props in settingsRef. Each change does only what it needs.
    const sync = () => {
      const s = settingsRef.current
      if (s.items !== loadedItems) load(s.items)
      if (s.dpr !== dprKey) {
        dprKey = s.dpr
        resize()
      }
      const nextLayout = layoutKeyOf(s)
      if (nextLayout !== layoutKey) {
        layoutKey = nextLayout
        if (s.count) {
          if (e.target > s.count - 1 && !s.loop) e.target = s.count - 1
          watchCaption()
          captionBlock = measureCaption()
          layout()
          draw(performance.now())
          wake()
        }
      }
      const nextAutoplay = autoplayKeyOf(s)
      if (nextAutoplay !== autoplayKey) {
        autoplayKey = nextAutoplay
        scheduleAutoplay()
      }
    }

    const hit = (clientX: number, clientY: number) => {
      const r = surface.getBoundingClientRect()
      const x = clientX - r.left
      const y = clientY - r.top
      return boxes.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) ?? null
    }

    // Pointer: drag with inertia, click a neighbour to go to it, hover a neighbour for some colour.
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return
      e.drag = { id: event.pointerId, x0: event.clientX, p0: e.pos.x, active: false, samples: [[performance.now(), event.clientX]] }
    }

    const onPointerMove = (event: PointerEvent) => {
      const d = e.drag
      if (!d || d.id !== event.pointerId) {
        if (event.pointerType === "mouse" && !d) {
          const b = hit(event.clientX, event.clientY)
          const index = b && Math.abs(b.o) > 0.5 ? b.index : -1
          if (index !== e.hovered) {
            e.hovered = index
            wake()
          }
          surface.style.cursor = b ? "pointer" : ""
        }
        return
      }
      const s = settingsRef.current
      if (!d.active) {
        if (!s.draggable || Math.abs(event.clientX - d.x0) < DRAG_THRESHOLD) return
        d.active = true
        d.x0 = event.clientX
        try {
          surface.setPointerCapture(event.pointerId)
        } catch {
          // The pointer was already released.
        }
        surface.style.cursor = "grabbing"
      }
      const m = metrics
      if (!m) return
      // One pixel of drag is one pixel of travel at w(½) + gap per image.
      let p = d.p0 - (event.clientX - d.x0) / m.D
      if (!s.loop) {
        const lo = 0
        const hi = s.count - 1
        if (p < lo) p = lo - (lo - p) * OVERDRAG
        if (p > hi) p = hi + (p - hi) * OVERDRAG
      }
      const now = performance.now()
      d.samples.push([now, event.clientX])
      while (d.samples.length > 2 && now - d.samples[0][0] > VELOCITY_WINDOW) d.samples.shift()
      const [t0, x0] = d.samples[0]
      e.pos.v = now - t0 > 0 ? ((-(event.clientX - x0) / (now - t0)) * 1000) / m.D : 0
      e.pos.x = p
      e.target = Math.round(p)
      wake()
    }

    const onPointerUp = (event: PointerEvent) => {
      const d = e.drag
      if (!d || d.id !== event.pointerId) return
      e.drag = null
      surface.style.cursor = ""
      const s = settingsRef.current
      if (!d.active) {
        // A click: select the active image, or go to the neighbour that was clicked.
        const b = hit(event.clientX, event.clientY)
        if (!b) return
        if (Math.abs(b.o) < 0.5) selectItem(s.items, b.index, s.onSelect)
        else navigate(Math.round(b.o))
        return
      }
      const now = performance.now()
      const recent = d.samples.filter(([t]) => now - t < VELOCITY_WINDOW)
      let v = 0
      if (recent.length >= 2 && metrics) {
        const [ta, xa] = recent[0]
        const [tb, xb] = recent[recent.length - 1]
        if (tb > ta) v = ((-(xb - xa) / (tb - ta)) * 1000) / metrics.D
      }
      e.pos.v = v
      let target = Math.round(e.pos.x + v * RELEASE_LOOKAHEAD)
      if (!s.loop) target = clamp(target, 0, s.count - 1)
      e.target = target
      handOff(wrap(target, s.count), now)
      wake()
      scheduleAutoplay()
    }

    const onPointerLeave = () => {
      if (e.hovered === -1) return
      e.hovered = -1
      wake()
    }

    const onWheel = (event: WheelEvent) => {
      if (!settingsRef.current.wheel) return
      event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height || 400 : 1
      const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * unit
      const now = performance.now()
      if (now - e.wheelAt > WHEEL_RESET) e.wheelAcc = 0
      e.wheelAt = now
      e.wheelAcc += delta
      const steps = Math.sign(e.wheelAcc) * Math.min(WHEEL_MAX_STEPS, Math.round(Math.abs(e.wheelAcc) / WHEEL_STEP))
      if (steps) {
        e.wheelAcc -= steps * WHEEL_STEP
        navigate(steps)
      }
    }

    const onVisibility = () => {
      wake()
      scheduleAutoplay()
    }

    // Off screen the loop stops where it is and autoplay holds; both carry on when the carousel is back.
    const intersection = new IntersectionObserver((entries) => {
      const was = visible
      visible = entries.some((entry) => entry.isIntersecting)
      if (visible === was) return
      if (visible) wake()
      scheduleAutoplay()
    })

    resizeObserver.observe(root)
    watchCaption()
    intersection.observe(root)
    document.addEventListener("visibilitychange", onVisibility)
    surface.addEventListener("pointerdown", onPointerDown, { passive: true })
    surface.addEventListener("pointermove", onPointerMove, { passive: true })
    surface.addEventListener("pointerup", onPointerUp, { passive: true })
    surface.addEventListener("pointercancel", onPointerUp, { passive: true })
    surface.addEventListener("pointerleave", onPointerLeave, { passive: true })
    // Not passive: the wheel moves the carousel instead of the page while it is enabled.
    surface.addEventListener("wheel", onWheel, { passive: false })

    resize()
    load(settingsRef.current.items)
    layoutKey = layoutKeyOf(settingsRef.current)
    autoplayKey = autoplayKeyOf(settingsRef.current)
    scheduleAutoplay()
    syncRef.current = sync
    apiRef.current = { navigate, goTo }

    // Release everything, then the context, then the element.
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.clearTimeout(autoplayTimer)
      e.drag = null
      syncRef.current = null
      apiRef.current = null
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      surface.removeEventListener("pointerdown", onPointerDown)
      surface.removeEventListener("pointermove", onPointerMove)
      surface.removeEventListener("pointerup", onPointerUp)
      surface.removeEventListener("pointercancel", onPointerUp)
      surface.removeEventListener("pointerleave", onPointerLeave)
      surface.removeEventListener("wheel", onWheel)
      surface.style.cursor = ""
      renderer?.dispose()
      gl?.getExtension("WEBGL_lose_context")?.loseContext()
      canvas.remove()
    }
  }, [])

  // Props reach the loop through a ref written here, after the setup effect, never during render. It is a
  // layout effect so a change of layout (captions toggled, a new size) is measured and drawn before paint.
  React.useLayoutEffect(() => {
    settingsRef.current = settings
    syncRef.current?.()
  })

  // The caption swaps when a move crosses its midpoint, then fades in.
  const shownCaption = React.useRef(start)
  React.useLayoutEffect(() => {
    if (shownCaption.current === display) return
    shownCaption.current = display
    if (reduced) return
    titlesRef.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: CAPTION_FADE, delay: CAPTION_DELAY, easing: CAPTION_EASE, fill: "backwards" })
  }, [display, reduced])

  React.useImperativeHandle(
    controlsRef,
    () => ({
      next: () => apiRef.current?.navigate(1),
      previous: () => apiRef.current?.navigate(-1),
      goTo: (index: number) => apiRef.current?.goTo(index),
    }),
    []
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || event.target !== event.currentTarget) return
    if (event.key === "ArrowRight") {
      event.preventDefault()
      apiRef.current?.navigate(1)
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      apiRef.current?.navigate(-1)
    } else if (event.key === "Enter") selectItem(items, display, onSelect)
  }

  const item = items[display]

  return (
    <div
      data-slot="prism-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={DEFAULT_LABEL}
      tabIndex={0}
      className={cn("relative h-full min-h-105 w-full overflow-hidden text-foreground outline-none focus-visible:inset-ring-2 focus-visible:inset-ring-current/35", className)}
      style={{ backgroundColor, color: fg, ...style }}
      onKeyDown={handleKeyDown}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (event.pointerType === "mouse") setHovering(true)
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        if (event.pointerType === "mouse") setHovering(false)
      }}
      {...props}
    >
      <div ref={surfaceRef} data-slot="prism-carousel-surface" className="absolute inset-0 touch-pan-y select-none" />
      <ul className="sr-only">
        {items.map((it, i) => (
          <li key={i}>{it.title ? `${it.title}: ${it.alt}` : it.alt}</li>
        ))}
      </ul>
      {(captions || controls) && (
        <div ref={captionRef} data-slot="prism-carousel-caption" className="pointer-events-none absolute inset-x-0 top-[var(--prism-caption-y,82%)] flex flex-col items-center gap-3">
          {captions && (
            <div ref={titlesRef} className="flex flex-col items-center gap-0.5 text-center" aria-live={autoplay && !paused && !hovering && !reduced ? "off" : "polite"}>
              {item?.title && <span className="text-[15px] leading-[1.35] font-semibold">{item.title}</span>}
              {item?.subtitle && <span className="text-[13px] leading-[1.35] opacity-60">{item.subtitle}</span>}
            </div>
          )}
          {controls && (
            <div data-slot="prism-carousel-controls" className="pointer-events-auto flex items-center gap-3.5 text-[12px] tabular-nums">
              <button
                type="button"
                aria-label="Previous"
                onClick={() => apiRef.current?.navigate(-1)}
                className="grid size-8 cursor-pointer place-items-center rounded-full bg-current/10 transition-[background-color] duration-160 ease-[ease] hover:bg-current/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              >
                <Chevron direction="left" />
              </button>
              <span className="min-w-13 text-center opacity-60">
                {pad2(display + 1)} / {pad2(count)}
              </span>
              <button
                type="button"
                aria-label="Next"
                onClick={() => apiRef.current?.navigate(1)}
                className="grid size-8 cursor-pointer place-items-center rounded-full bg-current/10 transition-[background-color] duration-160 ease-[ease] hover:bg-current/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              >
                <Chevron direction="right" />
              </button>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

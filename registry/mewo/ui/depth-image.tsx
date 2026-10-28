"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface DepthImageProps extends Omit<React.ComponentProps<"div">, "children" | "onLoad" | "onError"> {
  /** Photo to relight. Must be same-origin, a data URL, or served with CORS. */
  image?: string
  /** Optional real depth map, white near and black far. Estimated from the photo when omitted. */
  depthMap?: string
  /** Accessible description of the photo. Without it the image is decorative. */
  alt?: string
  /** How the photo fills the box: cropped to cover it, or shown whole inside it. */
  fit?: "cover" | "contain"
  /** The lit photo, or debug views of the estimated depth or the normals. */
  view?: "lit" | "depth" | "normal"
  /** Estimated depth: 0 reads depth from vertical position only, 1 from brightness only. */
  depthFromLight?: number
  /** Blur of the height field, in steps of five texels of a 512-wide map. Applies to supplied depth maps too. */
  depthSmoothing?: number
  /** Contrast applied to the estimated depth. */
  depthContrast?: number
  /** Swap near and far. */
  invertDepth?: boolean
  /** Height of the relief in scene units; the plane is 2 tall. */
  displacement?: number
  /** Large-scale surface tilt from depth. */
  normalStrength?: number
  /** Fine surface detail read from the photo. */
  detail?: number
  /** Darkness of self-cast shadows; 0 disables them. */
  shadowIntensity?: number
  /** Penumbra width of the shadows. */
  shadowSoftness?: number
  /** Colour of the moving light. Any CSS colour. */
  lightColor?: string
  /** Brightness of the moving light. */
  lightIntensity?: number
  /** How quickly the light fades with distance: 0 is even, 4 is a tight pool. */
  falloff?: number
  /** Height of the light above the surface. */
  elevation?: number
  /** Flat fill light applied everywhere. */
  ambient?: number
  /** Colour of the fill light. Any CSS colour. */
  ambientColor?: string
  /** How much of the photo's own tone survives in unlit areas, 0 to 1. */
  colorPreserve?: number
  /** How quickly the light follows the pointer, 0 to 1 (per 60 fps frame). */
  follow?: number
  /** Move the light on a slow ellipse when the pointer is away. */
  autoOrbit?: boolean
  /** Size of the idle orbit, 0 to 1. */
  orbitRadius?: number
  /** Seconds per idle orbit. */
  orbitDuration?: number
  /** Floor colour of the unlit surface, so shadows settle on the page colour. */
  backgroundColor?: string
  /** Shown while the photo loads or if it fails. */
  fallbackColor?: string
  /** Freeze the light. */
  paused?: boolean
  /** Render scale cap. The device pixel ratio is also capped at 2 and by a pixel budget. */
  dpr?: number
  /** Content layered above the image. */
  children?: React.ReactNode
  /** The photo (and depth map) loaded and can be relit. */
  onLoad?: () => void
  /** The photo could not be used: it failed to load, or its server doesn't allow cross-origin reads (CORS). */
  onError?: (error: Error) => void
}

type Settings = {
  image: string
  depthMap?: string
  fit: "cover" | "contain"
  view: "lit" | "depth" | "normal"
  depthFromLight: number
  depthSmoothing: number
  depthContrast: number
  invertDepth: boolean
  displacement: number
  normalStrength: number
  detail: number
  shadowIntensity: number
  shadowSoftness: number
  lightColor: string
  lightIntensity: number
  falloff: number
  elevation: number
  ambient: number
  ambientColor: string
  colorPreserve: number
  follow: number
  autoOrbit: boolean
  orbitRadius: number
  orbitDuration: number
  backgroundColor: string
  paused: boolean
  dpr: number
  onLoad?: () => void
  onError?: (error: Error) => void
}

export interface DepthFieldOptions {
  depthFromLight: number
  depthSmoothing: number
  depthContrast: number
  invertDepth: boolean
}

export interface DepthField {
  w: number
  h: number
  /** 0 far to 1 near, blurred. */
  depth: Float32Array
  /** Depth and detail luminance, interleaved, as the GPU reads them. */
  rg: Float32Array
}

const DEFAULT_IMAGE = "https://picsum.photos/seed/mewo-depth-image-1/1600/1000"

// Resolution of the depth and detail map, in texels across. Its height follows the photo's aspect.
const MAP_WIDTH = 512
// Gaussian sigma per step of depthSmoothing, in map texels.
const SMOOTHING_SIGMA = 2.3
// Radii of the idle orbit, as a share of half the width and half the height, per unit of orbitRadius.
const ORBIT_X = 0.715
const ORBIT_Y = 0.82
// The photo is uploaded no wider than this, and a depth map is read no wider than DEPTH_MAX_WIDTH.
const PHOTO_MAX_WIDTH = 2048
const DEPTH_MAX_WIDTH = 1024
// The shader marches 28 shadow steps per pixel, so a large display is held to this many fragments.
const PIXEL_BUDGET = 4.5e6

// Calibrated constants of the lighting model, fitted against reference renders and calibration images.
const TUNING = Object.freeze({
  // Slope per unit of luminance gradient per texel, times detail.
  detailGain: 10.8,
  // The light falls off as E(r) = peak · lambert · (1 + (r / c)²)^(−p); peak, c and p depend on falloff and light height.
  peakGain: 8.2,
  // Penumbra growth per unit of distance, times shadowSoftness.
  shadowSoftScale: 4,
  // Furthest the shadow ray searches, in scene units.
  shadowReach: 1.2,
  // 0: the falloff uses the depth under the light; 1: each pixel's own depth. 0.5 matched best.
  heightMix: 0.5,
  // 0: exact sRGB decode; otherwise albedo = rgb^albedoGamma.
  albedoGamma: 0,
  // Multiplies the falloff radius c.
  widthScale: 1,
  // Multiplies the falloff exponent p.
  sharpScale: 1,
})

const UNIFORMS = [
  "uPhoto",
  "uField",
  "uView",
  "uImgHalf",
  "uTexel",
  "uDisp",
  "uNormal",
  "uDetail",
  "uShadow",
  "uSoft",
  "uAmbient",
  "uPreserve",
  "uLight",
  "uPeak",
  "uC",
  "uP",
  "uDetailGain",
  "uSoftK",
  "uReach",
  "uHeightMix",
  "uAlbedoGamma",
  "uElev",
  "uDUnder",
  "uLightColor",
  "uAmbientColor",
  "uBg",
  "uViewMode",
  "uReady",
] as const

const VERTEX = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uPhoto, uField;
uniform vec2 uView;        // half extents of the view in scene units (aspect, 1)
uniform vec2 uImgHalf;     // half extents of the displayed image in scene units
uniform vec2 uTexel;       // 1 / field size
uniform float uDisp, uNormal, uDetail, uShadow, uSoft, uAmbient, uPreserve;
uniform vec3 uLight;       // light position (scene units, y up), z = displacement + elevation
uniform float uPeak, uC, uP, uDetailGain, uSoftK, uReach, uHeightMix, uAlbedoGamma, uElev, uDUnder, uFall;
uniform vec3 uLightColor, uAmbientColor, uBg;
uniform int uViewMode;     // 0 lit, 1 depth, 2 normal
uniform int uReady;

vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 toSrgb(vec3 l) { return mix(l * 12.92, 1.055 * pow(l, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, l)); }

vec2 imageUv(vec2 p) { return vec2(p.x / uImgHalf.x * 0.5 + 0.5, 0.5 - p.y / uImgHalf.y * 0.5); }
float depthAt(vec2 uv) { return texture(uField, uv).r; }

void main() {
  vec2 p = (vUv * 2.0 - 1.0) * uView;   // scene position, y up
  vec2 uv = imageUv(p);
  bool inside = all(greaterThanEqual(uv, vec2(0.0))) && all(lessThanEqual(uv, vec2(1.0)));
  if (uReady == 0 || !inside) { outColor = vec4(toSrgb(uBg), 1.0); return; }

  vec2 f = texture(uField, uv).rg;
  float d = f.r;
  // Large-scale tilt: true slope of the displaced surface (scene units) × normal strength.
  vec2 du = vec2(uTexel.x, 0.0), dv = vec2(0.0, uTexel.y);
  vec2 sceneTexel = uTexel * uImgHalf * 2.0;
  float dx = (depthAt(uv + du) - depthAt(uv - du)) / (2.0 * sceneTexel.x);
  float dyDown = (depthAt(uv + dv) - depthAt(uv - dv)) / (2.0 * sceneTexel.y);
  // Fine detail from the photo's own brightness, per texel.
  float lx = (texture(uField, uv + du).g - texture(uField, uv - du).g) * 0.5;
  float lyDown = (texture(uField, uv + dv).g - texture(uField, uv - dv).g) * 0.5;
  float sx = uNormal * uDisp * dx + uDetail * uDetailGain * lx;
  float syUp = -(uNormal * uDisp * dyDown + uDetail * uDetailGain * lyDown);
  vec3 N = normalize(vec3(-sx, -syUp, 1.0));

  if (uViewMode == 1) { outColor = vec4(vec3(d), 1.0); return; }
  if (uViewMode == 2) { outColor = vec4(N * 0.5 + 0.5, 1.0); return; }

  vec3 srgb = texture(uPhoto, uv).rgb;
  vec3 albedo = uAlbedoGamma > 0.0 ? pow(srgb, vec3(uAlbedoGamma)) : toLinear(srgb);
  vec3 P = vec3(p, d * uDisp);
  vec3 Lv = uLight - P;
  vec3 L = normalize(Lv);
  float r = length(uLight.xy - p);
  float lambert = max(dot(N, L), 0.0);
  // Light height above the surface: blend of the depth under the light and this pixel's own depth.
  float gapPix = max(0.05, uElev + uDisp * (1.0 - mix(uDUnder, d, uHeightMix)));
  float zr = gapPix / 1.2;
  float peakPix = uPeak * pow(zr, -4.94);
  float cPix = uC * zr;
  float pPix = uP * pow(zr, -0.4);
  float atten = peakPix * pow(1.0 + (r / cPix) * (r / cPix), -pPix);

  // Soft self-shadow: march the height field toward the light.
  float vis = 1.0;
  if (uShadow > 0.0 && uDisp > 0.0) {
    vec2 dir = uLight.xy - p;
    float len = length(dir);
    const int STEPS = 28;
    for (int i = 1; i <= STEPS; i++) {
      float t = float(i) / float(STEPS);
      vec3 q = P + Lv * t * min(1.0, uReach / max(len, 1e-3));
      if (q.z >= uLight.z) break;
      vec2 quv = imageUv(q.xy);
      if (any(lessThan(quv, vec2(0.0))) || any(greaterThan(quv, vec2(1.0)))) break;
      float hField = depthAt(quv) * uDisp;
      float dist = length(q.xy - p) + 1e-3;
      vis = min(vis, clamp((q.z - hField) / (uSoft * dist * uSoftK + 1e-3) + 0.5, 0.0, 1.0));
    }
  }
  float shadow = 1.0 - uShadow * (1.0 - vis);

  vec3 E = uAmbient * uAmbientColor + uLightColor * atten * lambert * shadow;
  vec3 lit = albedo * E;
  lit = lit / (1.0 + lit);               // Reinhard
  lit = mix(lit, max(lit, albedo), uPreserve);
  outColor = vec4(toSrgb(min(lit + uBg, vec3(1.0))), 1.0);
}`

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Rec. 709 luminance, 0 to 1, of every pixel of RGBA bytes. */
export function luminance(rgba: ArrayLike<number>) {
  const count = Math.floor(rgba.length / 4)
  const lum = new Float32Array(count)
  for (let i = 0; i < count; i++) lum[i] = (0.2126 * rgba[i * 4] + 0.7152 * rgba[i * 4 + 1] + 0.0722 * rgba[i * 4 + 2]) / 255
  return lum
}

/** Separable Gaussian blur of a `w` by `h` map with clamped edges. A sigma of 0.01 or less returns the map itself. */
export function blur(src: Float32Array, w: number, h: number, sigma: number) {
  if (sigma <= 0.01) return src
  const r = Math.ceil(sigma * 3)
  const ker = new Float32Array(r * 2 + 1)
  let sum = 0
  for (let i = -r; i <= r; i++) sum += ker[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma))
  for (let i = 0; i < ker.length; i++) ker[i] /= sum
  const tmp = new Float32Array(w * h)
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      let s = 0
      for (let i = -r; i <= r; i++) s += src[row + clamp(x + i, 0, w - 1)] * ker[i + r]
      tmp[row + x] = s
    }
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0
      for (let i = -r; i <= r; i++) s += tmp[clamp(y + i, 0, h - 1) * w + x] * ker[i + r]
      out[y * w + x] = s
    }
  return out
}

/** Size of the depth map for a photo: 512 texels across, its height following the photo's aspect. */
export function fieldSize(width: number, height: number) {
  return { w: MAP_WIDTH, h: Math.max(1, Math.round((MAP_WIDTH * height) / width)) }
}

/**
 * The height field the light reads and the photo's luminance for fine detail, on a `w` by `h` grid. Depth is a
 * supplied map's luminance (`depthLum`) or is estimated from the photo: the bottom reads as near, and
 * `depthFromLight` mixes in brightness. Neither input is changed.
 */
export function buildField(lum: Float32Array, depthLum: Float32Array | null, w: number, h: number, o: DepthFieldOptions): DepthField {
  let depth: Float32Array
  if (depthLum) depth = Float32Array.from(depthLum)
  else {
    depth = new Float32Array(w * h)
    for (let y = 0; y < h; y++) {
      // The bottom of the photo reads as near.
      const v = y / Math.max(1, h - 1)
      for (let x = 0; x < w; x++) {
        const i = y * w + x
        const raw = v * (1 - o.depthFromLight) + lum[i] * o.depthFromLight
        depth[i] = clamp((raw - 0.5) * o.depthContrast + 0.5, 0, 1)
      }
    }
  }
  if (o.invertDepth) for (let i = 0; i < depth.length; i++) depth[i] = 1 - depth[i]
  depth = blur(depth, w, h, o.depthSmoothing * SMOOTHING_SIGMA)
  const detailLum = blur(lum, w, h, 1)
  const rg = new Float32Array(w * h * 2)
  for (let i = 0; i < w * h; i++) {
    rg[i * 2] = depth[i]
    rg[i * 2 + 1] = detailLum[i]
  }
  return { w, h, depth, rg }
}

/**
 * Half extents of the displayed photo in scene units, for a view `viewAspect` wide and 2 tall. Written into
 * `out` so the frame loop allocates nothing.
 */
export function imageExtents(imageAspect: number, viewAspect: number, fit: "cover" | "contain", out = { x: 1, y: 1 }) {
  if ((imageAspect > viewAspect) === (fit === "cover")) {
    out.x = imageAspect
    out.y = 1
  } else {
    out.x = viewAspect
    out.y = viewAspect / imageAspect
  }
  return out
}

/** Where the idle orbit puts the light at `angle`, in scene units with y up. A growing angle turns it counter-clockwise on screen. */
export function orbitPoint(angle: number, radius: number, aspect: number, out = { x: 0, y: 0 }) {
  out.x = Math.cos(angle) * ORBIT_X * radius * aspect
  out.y = Math.sin(angle) * ORBIT_Y * radius
  return out
}

/** The orbit angle that points at the light at (x, y), so the orbit resumes from wherever the pointer left it. */
export function orbitAngle(x: number, y: number, radius: number, aspect: number) {
  const r = Math.max(0.01, radius)
  return Math.atan2(y / (ORBIT_Y * r), x / (ORBIT_X * r * aspect))
}

/** Share of the way to its target the light covers in `dt` seconds: `follow` per 60 fps frame, the same curve at any frame rate. */
export function followStep(follow: number, dt: number) {
  return 1 - Math.pow(1 - clamp(follow, 0.001, 1), dt * 60)
}

const srgbToLinear = (value: number) => (value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4))

const parseColor = (probe: CanvasRenderingContext2D | null, color: string): [number, number, number] => {
  if (!probe) return [1, 1, 1]
  probe.fillStyle = "#000"
  probe.fillStyle = color
  // The browser normalises it to #rrggbb, or rgba() when it is translucent.
  const value = String(probe.fillStyle)
  if (value.startsWith("#")) return [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255) as [number, number, number]
  const m = value.match(/[\d.]+/g)?.map(Number) ?? [255, 255, 255]
  return [m[0] / 255, m[1] / 255, m[2] / 255]
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.decoding = "async"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

/** Rasterises an image (an SVG too) into a canvas no wider than `maxWidth`. */
const rasterise = (img: HTMLImageElement, maxWidth: number) => {
  const scale = Math.min(1, maxWidth / (img.naturalWidth || maxWidth))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round((img.naturalWidth || maxWidth) * scale))
  canvas.height = Math.max(1, Math.round((img.naturalHeight || maxWidth) * scale))
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}

/** Luminance of `source` resampled to `w` by `h`. Throws when the pixels cannot be read. */
const readLuminance = (source: HTMLCanvasElement, w: number, h: number) => {
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("No 2D context")
  ctx.drawImage(source, 0, 0, w, h)
  return luminance(ctx.getImageData(0, 0, w, h).data)
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

const link = (gl: WebGL2RenderingContext) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
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

const createTexture = (gl: WebGL2RenderingContext) => {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return texture
}

export function DepthImage({
  image = DEFAULT_IMAGE,
  depthMap,
  alt,
  fit = "cover",
  view = "lit",
  depthFromLight = 0.5,
  depthSmoothing = 7,
  depthContrast = 1.2,
  invertDepth = false,
  displacement = 1.5,
  normalStrength = 1.5,
  detail = 0.8,
  shadowIntensity = 0.7,
  shadowSoftness = 0.1,
  lightColor = "#ffffff",
  lightIntensity = 6,
  falloff = 2.5,
  elevation = 1.2,
  ambient = 0.02,
  ambientColor = "#ffffff",
  colorPreserve = 0,
  follow = 0.12,
  autoOrbit = true,
  orbitRadius = 0.6,
  orbitDuration = 10,
  backgroundColor = "#000000",
  fallbackColor = "#171717",
  paused = false,
  dpr = 1.5,
  children,
  onLoad,
  onError,
  className,
  style,
  ...props
}: DepthImageProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const settings: Settings = {
    image,
    depthMap,
    fit,
    view,
    depthFromLight,
    depthSmoothing,
    depthContrast,
    invertDepth,
    displacement,
    normalStrength,
    detail,
    shadowIntensity,
    shadowSoftness,
    lightColor,
    lightIntensity,
    falloff,
    elevation,
    ambient,
    ambientColor,
    colorPreserve,
    follow,
    autoOrbit,
    orbitRadius,
    orbitDuration,
    backgroundColor,
    paused,
    dpr,
    onLoad,
    onError,
  }
  const settingsRef = React.useRef(settings)
  const wakeRef = React.useRef<(() => void) | null>(null)

  // The WebGL pipeline is built once. A prop change only updates the ref and wakes the loop, and a new photo
  // replaces the two textures, never the context.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // The canvas is made here, not in JSX: React Strict Mode runs this effect twice in development, and the
    // context the first cleanup loses would come straight back from getContext() on the same element.
    const canvas = document.createElement("canvas")
    canvas.className = "absolute inset-0 block h-full w-full"
    canvas.setAttribute("aria-hidden", "true")
    // Alpha stays on so the fallback colour shows through while the photo loads.
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false })
    // jsdom, a GPU-less CI or an old browser: the root keeps its fallback colour and nothing throws.
    if (!gl) return
    const program = link(gl)
    if (!program) {
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      return
    }
    root.appendChild(canvas)

    const loc: Record<string, WebGLUniformLocation | null> = {}
    for (const name of UNIFORMS) loc[name] = gl.getUniformLocation(program, name)
    const vao = gl.createVertexArray()
    const buffer = gl.createBuffer()
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, "aPos")
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)
    const photoTexture = createTexture(gl)
    const fieldTexture = createTexture(gl)
    gl.useProgram(program)
    gl.uniform1i(loc.uPhoto, 0)
    gl.uniform1i(loc.uField, 1)

    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    // One colour probe for the component's life; each colour is parsed only when it changes.
    const probe = document.createElement("canvas").getContext("2d")
    const slot = () => ({ key: "", rgb: new Float32Array(3) })
    const colors = { light: slot(), ambient: slot(), background: slot() }
    const linearColor = (target: { key: string; rgb: Float32Array }, color: string) => {
      if (target.key !== color) {
        target.key = color
        target.rgb.set(parseColor(probe, color).map(srgbToLinear))
      }
      return target.rgb
    }

    // The light in scene units (the plane is 2 tall, y up), easing toward its target.
    const light = { x: 0, y: 0, tx: 0, ty: 0, angle: 0, pointer: false }
    const orbit = { x: 0, y: 0 }
    const extents = { x: 1, y: 1 }
    const photoSize = { width: 1, height: 1 }
    // The photo's luminance (and a depth map's) on the field grid, read once per photo.
    let pixels: { w: number; h: number; lum: Float32Array; depth: Float32Array | null } | null = null
    let field: DepthField | null = null
    const built: DepthFieldOptions = { depthFromLight: NaN, depthSmoothing: NaN, depthContrast: NaN, invertDepth: false }
    let sourceKey: string | null = null
    let generation = 0
    let ready = false
    let failed = false
    let blank = false
    let sizedDpr = 0
    let raf = 0
    let last = 0
    let visible = true

    const draw = () => {
      gl.viewport(0, 0, canvas.width, canvas.height)
      if (!ready || !field) {
        // Loading or failed: the root's fallback colour shows through.
        if (!blank) {
          gl.clearColor(0, 0, 0, 0)
          gl.clear(gl.COLOR_BUFFER_BIT)
          blank = true
        }
        return
      }
      blank = false
      const s = settingsRef.current
      const aspect = canvas.width / canvas.height
      // Displayed image extents in scene units.
      imageExtents(photoSize.width / photoSize.height, aspect, s.fit, extents)
      const hx = extents.x
      const hy = extents.y
      // The light's height above the surface under it drives the falloff.
      const u = clamp((light.x / hx) * 0.5 + 0.5, 0, 1)
      const v = clamp(0.5 - (light.y / hy) * 0.5, 0, 1)
      const dUnder = field.depth[Math.round(v * (field.h - 1)) * field.w + Math.round(u * (field.w - 1))]
      const f = Math.max(0, s.falloff)
      // Falloff bases at the reference light height 1.2, scaled per pixel in the shader.
      const peak = s.lightIntensity * TUNING.peakGain * Math.exp(-0.53 * f + 0.012 * f * f)
      const c = (0.85 + 0.4 * Math.exp(-3 * f)) * TUNING.widthScale
      const p = (0.9 + 0.41 * f) * TUNING.sharpScale
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.uniform2f(loc.uView, aspect, 1)
      gl.uniform2f(loc.uImgHalf, hx, hy)
      gl.uniform2f(loc.uTexel, 1 / field.w, 1 / field.h)
      gl.uniform1f(loc.uDisp, s.displacement)
      gl.uniform1f(loc.uNormal, s.normalStrength)
      gl.uniform1f(loc.uDetail, s.detail)
      gl.uniform1f(loc.uShadow, s.shadowIntensity)
      gl.uniform1f(loc.uSoft, Math.max(0.005, s.shadowSoftness))
      gl.uniform1f(loc.uAmbient, s.ambient)
      gl.uniform1f(loc.uPreserve, s.colorPreserve)
      gl.uniform3f(loc.uLight, light.x, light.y, s.displacement + s.elevation)
      gl.uniform1f(loc.uDetailGain, TUNING.detailGain)
      gl.uniform1f(loc.uHeightMix, TUNING.heightMix)
      gl.uniform1f(loc.uAlbedoGamma, TUNING.albedoGamma)
      gl.uniform1f(loc.uElev, s.elevation)
      gl.uniform1f(loc.uDUnder, dUnder)
      gl.uniform1f(loc.uSoftK, TUNING.shadowSoftScale)
      gl.uniform1f(loc.uReach, TUNING.shadowReach)
      gl.uniform1f(loc.uPeak, peak)
      gl.uniform1f(loc.uC, c)
      gl.uniform1f(loc.uP, p)
      gl.uniform3fv(loc.uLightColor, linearColor(colors.light, s.lightColor))
      gl.uniform3fv(loc.uAmbientColor, linearColor(colors.ambient, s.ambientColor))
      gl.uniform3fv(loc.uBg, linearColor(colors.background, s.backgroundColor))
      gl.uniform1i(loc.uViewMode, s.view === "depth" ? 1 : s.view === "normal" ? 2 : 0)
      gl.uniform1i(loc.uReady, 1)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, photoTexture)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    // The height field is rebuilt on the CPU when the photo or a depth setting changes, never per frame.
    const rebuild = () => {
      if (!pixels) return
      const s = settingsRef.current
      built.depthFromLight = s.depthFromLight
      built.depthSmoothing = s.depthSmoothing
      built.depthContrast = s.depthContrast
      built.invertDepth = s.invertDepth
      field = buildField(pixels.lum, pixels.depth, pixels.w, pixels.h, built)
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, field.w, field.h, 0, gl.RG, gl.FLOAT, field.rg)
      ready = true
    }

    const stale = (s: Settings) =>
      s.depthFromLight !== built.depthFromLight ||
      s.depthSmoothing !== built.depthSmoothing ||
      s.depthContrast !== built.depthContrast ||
      s.invertDepth !== built.invertDepth

    const frame = (now: number) => {
      raf = 0
      if (!visible || document.hidden) return
      const s = settingsRef.current
      // dt is clamped so a hitch or a tab switch does not jump the light.
      const dt = last ? clamp((now - last) / 1000, 1 / 240, 0.05) : 1 / 60
      last = now
      if (pixels && stale(s)) {
        try {
          rebuild()
        } catch {
          ready = false
        }
      }
      const reduced = motionQuery?.matches ?? false
      const orbiting = !light.pointer && s.autoOrbit && !s.paused && !reduced
      if (!s.paused) {
        if (orbiting) {
          light.angle += (dt / Math.max(0.5, s.orbitDuration)) * Math.PI * 2
          orbitPoint(light.angle, s.orbitRadius, canvas.width / Math.max(1, canvas.height), orbit)
          light.tx = orbit.x
          light.ty = orbit.y
        }
        const k = followStep(s.follow, dt)
        light.x += (light.tx - light.x) * k
        light.y += (light.ty - light.y) * k
      }
      draw()
      const moving = Math.abs(light.tx - light.x) + Math.abs(light.ty - light.y) > 1e-4
      // The loop runs only while the light orbits or is still easing toward its target. A paused light, a settled
      // one and a photo that failed to load cost nothing until a prop, the pointer or a new photo wakes it.
      if (!failed && !s.paused && (orbiting || moving)) raf = requestAnimationFrame(frame)
      else last = 0
    }

    // Nothing is scheduled while the image is off screen or the tab is hidden.
    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const resize = () => {
      const s = settingsRef.current
      const width = root.clientWidth
      const height = root.clientHeight
      // The device pixel ratio, capped by `dpr`, by 2 and by the fragment budget.
      const ratio = Math.min(window.devicePixelRatio || 1, s.dpr > 0 ? s.dpr : 2, 2, Math.sqrt(PIXEL_BUDGET / Math.max(1, width * height)))
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))
      sizedDpr = s.dpr
      // A resized canvas is blank, so it is drawn again at once rather than on the next frame.
      blank = true
      draw()
      wake()
    }

    // A new photo (or depth map) replaces the textures and the field; the pipeline stays.
    const load = () => {
      const s = settingsRef.current
      const key = `${s.image}\n${s.depthMap ?? ""}`
      if (key === sourceKey) return
      sourceKey = key
      const token = ++generation
      // The fallback colour shows until the new photo is ready; the light keeps moving meanwhile.
      ready = false
      failed = false
      pixels = null
      field = null
      Promise.all([loadImage(s.image), s.depthMap ? loadImage(s.depthMap) : Promise.resolve(null)])
        .then(([img, depthImg]) => {
          if (token !== generation) return
          const photo = rasterise(img, PHOTO_MAX_WIDTH)
          const depthSource = depthImg ? rasterise(depthImg, DEPTH_MAX_WIDTH) : null
          gl.bindTexture(gl.TEXTURE_2D, photoTexture)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, photo)
          photoSize.width = photo.width
          photoSize.height = photo.height
          try {
            // The pixels are read once here: a depth setting changing later only re-runs the maths.
            const { w, h } = fieldSize(photo.width, photo.height)
            pixels = { w, h, lum: readLuminance(photo, w, h), depth: depthSource ? readLuminance(depthSource, w, h) : null }
            rebuild()
          } catch {
            ready = false
          }
          wake()
          if (!ready) throw new Error("The image pixels could not be read (cross-origin image without CORS).")
          settingsRef.current.onLoad?.()
        })
        .catch((error: unknown) => {
          if (token !== generation) return
          // Stays on the fallback colour.
          ready = false
          failed = true
          pixels = null
          field = null
          wake()
          const reason =
            error instanceof Error && error.name === "SecurityError"
              ? "its server does not allow cross-origin use (CORS)"
              : error instanceof Error
                ? error.message
                : "it failed to load (check the URL, and that its server allows cross-origin use / CORS)"
          settingsRef.current.onError?.(new Error(`Couldn't use the image: ${reason}`))
        })
    }

    // The pointer is read on window, so content layered over the image never hides it from the light.
    const locate = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      return x >= 0 && y >= 0 && x < rect.width && y < rect.height ? rect : null
    }

    const leave = () => {
      if (!light.pointer) return
      light.pointer = false
      // The orbit resumes from wherever the pointer left the light.
      const s = settingsRef.current
      light.angle = orbitAngle(light.x, light.y, s.orbitRadius, canvas.width / Math.max(1, canvas.height))
      if (!s.paused) wake()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!visible && !light.pointer) return
      const rect = locate(event)
      if (!rect) return leave()
      const aspect = rect.width / Math.max(1, rect.height)
      light.pointer = true
      light.tx = (((event.clientX - rect.left) / rect.width) * 2 - 1) * aspect
      light.ty = 1 - ((event.clientY - rect.top) / rect.height) * 2
      if (!settingsRef.current.paused) wake()
    }

    // A scroll can carry the image out from under a still pointer; the browser reports that as pointerover.
    const onPointerOver = (event: PointerEvent) => {
      if (light.pointer && !locate(event)) leave()
    }

    // The pointer left the window, or a finger or pen lifted.
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) leave()
    }

    const onVisibility = () => {
      last = 0
      wake()
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerdown", onPointerMove, { passive: true })
    window.addEventListener("pointerover", onPointerOver, { passive: true })
    window.addEventListener("pointerout", onPointerOut, { passive: true })
    document.addEventListener("visibilitychange", onVisibility)
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
    load()
    resize()
    wakeRef.current = () => {
      load()
      if (settingsRef.current.dpr !== sizedDpr) resize()
      else wake()
    }

    // Everything is released, then the context, then the element.
    return () => {
      cancelAnimationFrame(raf)
      // A photo still loading is ignored when it arrives.
      generation++
      wakeRef.current = null
      resizeObserver.disconnect()
      intersection.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerdown", onPointerMove)
      window.removeEventListener("pointerover", onPointerOver)
      window.removeEventListener("pointerout", onPointerOut)
      document.removeEventListener("visibilitychange", onVisibility)
      gl.deleteTexture(photoTexture)
      gl.deleteTexture(fieldTexture)
      gl.deleteBuffer(buffer)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      canvas.remove()
    }
  }, [])

  // Props reach the loop through a ref written here, never in render, and a change only wakes the loop.
  React.useEffect(() => {
    settingsRef.current = settings
    wakeRef.current?.()
  })

  return (
    <div
      ref={rootRef}
      data-slot="depth-image"
      role={alt ? "img" : undefined}
      aria-label={alt}
      className={cn("relative h-full w-full touch-pan-y overflow-hidden", className)}
      style={{ background: fallbackColor, ...style }}
      {...props}
    >
      {children ? <div className="relative z-1 h-full">{children}</div> : null}
    </div>
  )
}

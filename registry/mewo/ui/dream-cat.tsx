"use client"

import * as React from "react"
import { Camera, Euler, GLTFLoader, Mat4, Mesh, Program, Quat, RenderTarget, Renderer, Texture, Transform, Triangle, Vec3, type GLTFMaterial, type OGLRenderingContext } from "ogl"
import { cn } from "@/lib/utils"

export interface DreamCatProps extends Omit<React.ComponentProps<"div">, "children" | "onLoad" | "onError"> {
  /** Address of the character's model: a .glb, y up, facing +z. Same-origin or served with CORS. */
  src?: string
  /** Accessible description of the character. Without it the character is decorative. */
  alt?: string
  /** Fur colour, any CSS colour. An empty string keeps the model's own blue. */
  color?: string
  /** Follow the pointer anywhere on the page: the hand reaches for it, the eyes look at it, the body leans toward it. */
  track?: boolean
  /** How far the arm can turn from its rest pose, in degrees. 180 lets it point anywhere. */
  reach?: number
  /** How far the forearm can stretch to bring the hand under the pointer, as a multiple of its length. 1 keeps it as modelled. */
  stretch?: number
  /** How far the eyes can roll, in degrees. 0 holds them still. */
  gaze?: number
  /** How far the body turns toward the pointer, in degrees. */
  lean?: number
  /** Seconds the pose takes to catch up with the pointer (about two thirds of the way). */
  smoothing?: number
  /** Size of the character in its box: 1 fits it whole, 2 fills the box with its head and hand. */
  zoom?: number
  /** Where the character's middle sits across its box: 0 at the left edge, 0.5 in the middle, 1 at the right edge. */
  x?: number
  /** Where the character's middle sits down its box: 0 at the top edge, 0.5 in the middle, 1 at the bottom edge. */
  y?: number
  /** Strength of the velvet sheen along the edges. */
  sheen?: number
  /** Overall brightness. */
  exposure?: number
  /** How thick the dream's fog is, 0 to 1. 0 for no fog. */
  fog?: number
  /** Colour of the fog and of the light along the character's fraying outline, any CSS colour. */
  fogColor?: string
  /** How strongly the hand stirs the fog as it moves through it. 0 leaves it still. */
  swirl?: number
  /** How much the character's outline blurs and comes apart into rising dots, 0 to 1. 0 keeps a clean outline. */
  dissolve?: number
  /** The pupils: rings that ripple outward with the dream, or plain. */
  eyes?: DreamCatEyes
  /** Speed of the dream's slow motion: the fog drifting and the wisps rising. 0 holds it still and costs nothing at rest. */
  drift?: number
  /** Render scale cap. The device pixel ratio is also capped at 2 and by a pixel budget. */
  dpr?: number
  /** Content layered above the character. */
  children?: React.ReactNode
  /** The model loaded and the first frame is drawn. */
  onLoad?: () => void
  /** The model could not be loaded. */
  onError?: (error: Error) => void
}

type Settings = Required<Pick<DreamCatProps, "track" | "reach" | "stretch" | "gaze" | "lean" | "smoothing" | "zoom" | "x" | "y" | "sheen" | "exposure" | "fog" | "fogColor" | "swirl" | "dissolve" | "drift" | "eyes" | "dpr">> &
  Pick<DreamCatProps, "src" | "color" | "onLoad" | "onError">

export type Bounds = { min: [number, number, number]; max: [number, number, number] }

export type DreamCatEyes = "rings" | "plain"

const PIXEL_BUDGET = 4.5e6
// the fog: a coarse grid over the box, about this many cells whatever its shape
const FOG_CELLS = 9000
// the fog's motion fades in a few seconds and the fog fills back in where the hand pushed it away; the swirl
// feeds its eddies back so it curls like smoke; the pressure steps keep it flowing without piling up
const FOG_DRAG = 1.6
const FOG_REFILL = 0.7
const FOG_SWIRL = 1.5
const FOG_PRESSURE_STEPS = 16
// below these the fog is left as it is and the loop may stop
const FOG_CALM_SPEED = 0.03
const FOG_CALM_THICKNESS = 0.02
const FOV = 22
// the box around the character, as a share of its size, so the ears and the hand never touch the edges
const MARGIN = 1.12
// Must match what ogl's Renderer passes to getContext(), so the probe below and ogl share one context.
const CONTEXT_ATTRIBUTES = {
  alpha: true,
  depth: true,
  stencil: false,
  antialias: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  powerPreference: "default" as const,
}
// how many dark rings cross a ringed pupil, from its middle to its rim
const PUPIL_RINGS = 3
// the parts the pose drives, by node name; a model without them still renders, standing still
const NODES = { body: "mewo", arm: "arm.R", pupils: ["pupil.L", "pupil.R"] }

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** How far an eased value moves toward its target this frame, for a time constant in seconds. */
export function followStep(smoothing: number, dt: number) {
  return smoothing <= 0 ? 1 : 1 - Math.exp(-dt / smoothing)
}

/**
 * Where the camera stands to frame the character: its x and y, and its distance in front of the character's
 * middle. `zoom` sets the size, then the camera moves so the character's middle lands at (`across`, `down`) in
 * the box, each 0 to 1 from the top left; past 0 or 1, the character goes partly out of the box.
 */
export function fitView(bounds: Bounds, aspect: number, zoom: number, across = 0.5, down = 0.5) {
  const t = Math.tan(toRadians(FOV) / 2)
  const halfWidth = ((bounds.max[0] - bounds.min[0]) / 2) * MARGIN
  const halfHeight = ((bounds.max[1] - bounds.min[1]) / 2) * MARGIN
  const distance = Math.max(halfHeight / t, halfWidth / (t * Math.max(aspect, 1e-3))) / zoom
  // half the view at the character's middle; the camera moves the opposite way to the character
  const viewX = t * distance * aspect
  const viewY = t * distance
  return {
    x: (bounds.min[0] + bounds.max[0]) / 2 - (across * 2 - 1) * viewX,
    y: (bounds.min[1] + bounds.max[1]) / 2 + (down * 2 - 1) * viewY,
    distance,
  }
}

/** The rotation that turns `from` toward `to`, by at most `limit` radians, scaled by `amount` (0 to 1). */
export function turnToward(from: Vec3, to: Vec3, limit: number, amount: number, out = new Quat()) {
  const a = from.clone().normalize()
  const b = to.clone().normalize()
  const axis = new Vec3().cross(a, b)
  const sin = axis.len()
  const angle = Math.atan2(sin, a.dot(b))
  if (sin < 1e-6 || amount <= 0) return out.identity()
  return out.fromAxisAngle(axis.scale(1 / sin), Math.min(angle, limit) * clamp(amount, 0, 1))
}

/**
 * Where a ray first meets a sphere, or, when it passes by, its point nearest the sphere's centre. The hand is
 * aimed at it: within the arm's length the hand lands under the pointer, and beyond it the forearm stretches.
 */
export function reachPoint(origin: Vec3, direction: Vec3, centre: Vec3, radius: number, out = new Vec3()) {
  const offset = new Vec3().sub(origin, centre)
  const b = offset.dot(direction)
  const disc = b * b - (offset.squaredLen() - radius * radius)
  const t = disc >= 0 ? -b - Math.sqrt(disc) : -b
  return out.copy(direction).scale(Math.max(t, 0)).add(origin)
}

/**
 * How much the forearm grows so that the hand's middle, `length` from the shoulder as modelled, lands `distance`
 * away. Only the part up to the wrist grows, so the hand keeps its round shape.
 */
export function stretchFor(distance: number, length: number, wrist: number, max: number) {
  return clamp(1 + (distance - length) / Math.max(wrist, 1e-3), 1, Math.max(1, max))
}

/**
 * The arm a joint moves, in the model's saved pose: the direction from the shoulder to its hand's middle, how far
 * that middle is, where the hand begins (the forearm stretches up to there), and how far forward the rest of the
 * body comes, so the hand can be kept in front of it.
 */
function armShape(mesh: Mesh, joint: Transform, shoulder: Vec3) {
  const joints = (mesh as Mesh & { skeleton?: { joints: Transform[] } }).skeleton?.joints ?? []
  const index = joints.indexOf(joint)
  const { position: positions, skinIndex: indices, skinWeight: weights } = mesh.geometry.attributes
  const position = positions?.data
  const joint4 = indices?.data
  const weight4 = weights?.data
  if (index < 0 || !position || !joint4 || !weight4) return null
  // weights stored as integers are fractions of their type's largest value
  const scale = weight4 instanceof Float32Array ? 1 : weight4 instanceof Uint8Array ? 1 / 255 : 1 / 65535
  const arm: number[] = []
  const reach: number[] = []
  let farthest = 0
  let front = -Infinity
  const q = new Vec3()
  for (let v = 0; v < position.length / 3; v++) {
    let weight = 0
    for (let k = 0; k < 4; k++) if (joint4[v * 4 + k] === index) weight += weight4[v * 4 + k] * scale
    if (weight < 0.05) front = Math.max(front, position[v * 3 + 2])
    if (weight < 0.95) continue
    const d = q.fromArray(position, v * 3).sub(shoulder).len()
    arm.push(v)
    reach.push(d)
    farthest = Math.max(farthest, d)
  }
  if (!arm.length) return null
  // a first direction, toward the middle of the far end
  const axis = new Vec3()
  arm.forEach((v, i) => {
    if (reach[i] >= farthest * 0.75) axis.add(q.fromArray(position, v * 3).sub(shoulder))
  })
  axis.normalize()
  // the hand's radius: the widest the arm gets around that line, out past its middle
  let radius = 0
  for (const v of arm) {
    q.fromArray(position, v * 3).sub(shoulder)
    const along = q.dot(axis)
    if (along < farthest * 0.5) continue
    radius = Math.max(radius, q.sub(axis.clone().scale(along)).len())
  }
  const length = farthest - radius
  return { index, axis, length, radius, wrist: Math.max(length - radius, length * 0.3), front: front + radius * 0.5 }
}

export type Fog = {
  width: number
  height: number
  /** The fog's motion, in cells a second, y up. */
  u: Float32Array
  v: Float32Array
  /** How thick the fog is in each cell, and how thick it is at rest. */
  density: Float32Array
  rest: Float32Array
  scratch: [Float32Array, Float32Array, Float32Array, Float32Array]
  calm: boolean
}

/**
 * The fog's grid over a box `aspect` times wider than tall, still and full everywhere. It holds what the hand
 * does to the fog (where it cleared it, and how it set it moving); the fog's look is drawn over it.
 */
export function createFog(aspect: number): Fog {
  const height = Math.max(8, Math.round(Math.sqrt(FOG_CELLS / Math.max(aspect, 0.1))))
  const width = Math.max(8, Math.round(height * aspect))
  const n = width * height
  const field = () => new Float32Array(n)
  const rest = field().fill(1)
  return { width, height, u: field(), v: field(), density: rest.slice(), rest, scratch: [field(), field(), field(), field()], calm: true }
}

/** The fog's grid as texels: how much fog is left, and its motion in box widths and heights a second. */
export function packFog(fog: Fog, out: Float32Array) {
  const { width, height, u, v, density } = fog
  for (let c = 0; c < width * height; c++) {
    out[c * 4] = density[c]
    out[c * 4 + 1] = u[c] / width
    out[c * 4 + 2] = v[c] / height
    out[c * 4 + 3] = 1
  }
  return out
}

/** A field read between its cells, its edge cells standing in past the edges. */
function sample(field: Float32Array, width: number, height: number, x: number, y: number) {
  const cx = clamp(x, 0, width - 1)
  const cy = clamp(y, 0, height - 1)
  const i = Math.min(Math.floor(cx), width - 2)
  const j = Math.min(Math.floor(cy), height - 2)
  const fx = cx - i
  const fy = cy - j
  const a = field[j * width + i]
  const b = field[j * width + i + 1]
  const c = field[(j + 1) * width + i]
  const d = field[(j + 1) * width + i + 1]
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

/**
 * The hand moving through the fog at (`x`, `y`) (0 to 1 from the box's bottom left), `radius` box heights wide,
 * at (`vx`, `vy`) box widths and heights a second. The fog round it is carried along by `amount` (0 to 1),
 * pushed a little outward and thinned, so the hand opens a clear path that the fog curls into behind it.
 */
export function stirFog(fog: Fog, x: number, y: number, radius: number, vx: number, vy: number, amount: number) {
  const { width, height, u, v, density } = fog
  const cx = x * (width - 1)
  const cy = y * (height - 1)
  const r = Math.max(radius * height, 1.5)
  const tx = vx * width
  const ty = vy * height
  const speed = Math.hypot(tx, ty)
  const k = clamp(amount, 0, 1)
  // a hand crossing the box in a second clears most of the fog it passes through
  const clearing = clamp(speed / Math.max(width, height), 0, 1) * 0.35
  for (let j = Math.max(0, Math.floor(cy - 3 * r)); j <= Math.min(height - 1, Math.ceil(cy + 3 * r)); j++) {
    for (let i = Math.max(0, Math.floor(cx - 3 * r)); i <= Math.min(width - 1, Math.ceil(cx + 3 * r)); i++) {
      const dx = i - cx
      const dy = j - cy
      const g = Math.exp(-(dx * dx + dy * dy) / (r * r)) * k
      if (g < 1e-4) continue
      const d = Math.hypot(dx, dy) || 1
      const c = j * width + i
      u[c] += (tx + (dx / d) * speed * 0.3 - u[c]) * g
      v[c] += (ty + (dy / d) * speed * 0.3 - v[c]) * g
      density[c] *= 1 - g * clearing
    }
  }
  if (k > 0) fog.calm = false
}

/**
 * One step of the fog: its eddies are fed back so it curls like smoke, its motion carries itself along and
 * fades, a pressure solve keeps it flowing without piling up, and it carries the fog, which drifts back toward
 * its resting pattern. Returns true once it is calm; a calm fog costs nothing to step.
 */
export function stepFog(fog: Fog, dt: number) {
  if (fog.calm) return true
  const { width: w, height: h, u, v, density, rest } = fog
  const [u0, v0, curl, pressure] = fog.scratch

  for (let j = 1; j < h - 1; j++)
    for (let i = 1; i < w - 1; i++) {
      const c = j * w + i
      curl[c] = 0.5 * (v[c + 1] - v[c - 1] - (u[c + w] - u[c - w]))
    }
  for (let j = 2; j < h - 2; j++)
    for (let i = 2; i < w - 2; i++) {
      const c = j * w + i
      const gx = 0.5 * (Math.abs(curl[c + 1]) - Math.abs(curl[c - 1]))
      const gy = 0.5 * (Math.abs(curl[c + w]) - Math.abs(curl[c - w]))
      const length = Math.hypot(gx, gy) + 1e-5
      u[c] += FOG_SWIRL * (gy / length) * curl[c] * dt
      v[c] -= FOG_SWIRL * (gx / length) * curl[c] * dt
    }

  u0.set(u)
  v0.set(v)
  const fade = Math.exp(-FOG_DRAG * dt)
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const c = j * w + i
      const x = i - dt * u0[c]
      const y = j - dt * v0[c]
      u[c] = sample(u0, w, h, x, y) * fade
      v[c] = sample(v0, w, h, x, y) * fade
    }

  // the box's edges are open: the fog may flow out, and comes back as it refills
  const divergence = curl
  for (let j = 1; j < h - 1; j++)
    for (let i = 1; i < w - 1; i++) {
      const c = j * w + i
      divergence[c] = 0.5 * (u[c + 1] - u[c - 1] + v[c + w] - v[c - w])
    }
  pressure.fill(0)
  for (let k = 0; k < FOG_PRESSURE_STEPS; k++)
    for (let j = 1; j < h - 1; j++)
      for (let i = 1; i < w - 1; i++) {
        const c = j * w + i
        pressure[c] = (pressure[c - 1] + pressure[c + 1] + pressure[c - w] + pressure[c + w] - divergence[c]) / 4
      }
  for (let j = 1; j < h - 1; j++)
    for (let i = 1; i < w - 1; i++) {
      const c = j * w + i
      u[c] -= 0.5 * (pressure[c + 1] - pressure[c - 1])
      v[c] -= 0.5 * (pressure[c + w] - pressure[c - w])
    }

  u0.set(density)
  const refill = 1 - Math.exp(-FOG_REFILL * dt)
  let fastest = 0
  let farthest = 0
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const c = j * w + i
      const carried = sample(u0, w, h, i - dt * u[c], j - dt * v[c])
      density[c] = carried + (rest[c] - carried) * refill
      fastest = Math.max(fastest, Math.abs(u[c]), Math.abs(v[c]))
      farthest = Math.max(farthest, Math.abs(density[c] - rest[c]))
    }
  if (fastest < FOG_CALM_SPEED && farthest < FOG_CALM_THICKNESS) {
    u.fill(0)
    v.fill(0)
    density.set(rest)
    fog.calm = true
  }
  return fog.calm
}

/** A CSS colour as linear RGB, or null when the browser can't read it. */
function linearColor(value: string | undefined): [number, number, number] | null {
  if (!value) return null
  const context = document.createElement("canvas").getContext("2d")
  if (!context) return null
  context.fillStyle = "#000"
  context.fillStyle = value
  const parsed = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(context.fillStyle)
  const channels = parsed
    ? parsed.slice(1).map((hex) => parseInt(hex, 16) / 255)
    : (/rgba?\(([^)]+)\)/.exec(context.fillStyle)?.[1].split(",").slice(0, 3).map((part) => parseFloat(part) / 255) ?? null)
  if (!channels) return null
  const linear = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return [linear[0], linear[1], linear[2]]
}

const VERTEX = /* glsl */ `#version 300 es
in vec3 position;
in vec3 normal;
#ifdef SKINNED
in vec4 skinIndex;
in vec4 skinWeight;
uniform sampler2D boneTexture;
uniform int boneTextureSize;
uniform vec3 uShoulder;
uniform vec3 uAxis;
uniform float uWrist;
uniform float uStretch;
uniform float uArmJoint;
mat4 bone(float index) {
  int i = int(index) * 4;
  return mat4(
    texelFetch(boneTexture, ivec2(i % boneTextureSize, i / boneTextureSize), 0),
    texelFetch(boneTexture, ivec2((i + 1) % boneTextureSize, (i + 1) / boneTextureSize), 0),
    texelFetch(boneTexture, ivec2((i + 2) % boneTextureSize, (i + 2) / boneTextureSize), 0),
    texelFetch(boneTexture, ivec2((i + 3) % boneTextureSize, (i + 3) / boneTextureSize), 0)
  );
}
#endif
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
out vec3 vNormal;
out vec3 vWorld;
out vec3 vLocal;
void main() {
  mat4 world = modelMatrix;
  vec3 at = position;
#ifdef SKINNED
  // the forearm grows along its length up to the wrist, and the hand moves out with it, keeping its shape
  float arm = dot(skinWeight, vec4(equal(skinIndex, vec4(uArmJoint))));
  float along = dot(position - uShoulder, uAxis);
  float grown = along < uWrist ? along * uStretch : along + uWrist * (uStretch - 1.0);
  at += uAxis * max(grown - along, 0.0) * arm;
  world = skinWeight.x * bone(skinIndex.x) + skinWeight.y * bone(skinIndex.y) + skinWeight.z * bone(skinIndex.z) + skinWeight.w * bone(skinIndex.w);
#endif
  vec4 p = world * vec4(at, 1.0);
  vWorld = p.xyz;
  vLocal = position;
  vNormal = mat3(world) * normal;
  gl_Position = projectionMatrix * viewMatrix * p;
}`

// A soft studio light on a velvet surface: wrapped diffuse from a key, a fill and a rim light, a sky-to-floor
// ambient, a sheen that brightens the surface where it turns away from the eye, and a gloss for the eyes.
const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
in vec3 vLocal;
uniform vec3 cameraPosition;
uniform float uRings;
uniform vec3 uRingAxis;
uniform float uRingScale;
uniform vec3 uRingLight;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uSheenColor;
uniform float uSheen;
uniform float uRoughness;
uniform float uGloss;
uniform vec3 uEmissive;
uniform float uExposure;
out vec4 fragColor;

const vec3 KEY = vec3(-0.42, 0.72, 0.55);
const vec3 FILL = vec3(0.75, 0.15, 0.6);
const vec3 RIM = vec3(0.2, 0.55, -0.8);

float wrapped(vec3 n, vec3 l, float wrap) {
  return max((dot(n, l) + wrap) / (1.0 + wrap), 0.0);
}

float gloss(vec3 n, vec3 v, vec3 l, float roughness) {
  vec3 h = normalize(v + l);
  float a = roughness * roughness;
  float a2 = a * a;
  float nh = max(dot(n, h), 0.0);
  float d = nh * nh * (a2 - 1.0) + 1.0;
  return a2 / (3.14159 * d * d) * max(dot(n, l), 0.0);
}

vec3 tonemap(vec3 c) {
  // a filmic curve that keeps saturated blues blue, then sRGB
  c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
  return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
}

void main() {
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vWorld);
  vec3 key = normalize(KEY);
  vec3 fill = normalize(FILL);
  vec3 rim = normalize(RIM);
  float nv = clamp(dot(n, v), 0.0, 1.0);

  vec3 ambient = mix(vec3(0.16, 0.17, 0.22), vec3(0.62, 0.68, 0.8), n.y * 0.5 + 0.5);
  vec3 light = ambient + vec3(1.0, 0.97, 0.92) * 2.1 * wrapped(n, key, 0.35) + vec3(0.7, 0.78, 1.0) * 0.55 * wrapped(n, fill, 0.5);
  vec3 base = uColor;
  if (uRings > 0.0) {
    // rings round the pupil's middle out to its rim, dark and light, rippling outward as the dream drifts
    float d = acos(clamp(dot(normalize(vLocal), uRingAxis), -1.0, 1.0)) * uRingScale - uTime * 0.6;
    float band = abs(fract(d) - 0.5) * 2.0;
    float w = fwidth(d) * 2.0;
    base = mix(uColor, uRingLight, smoothstep(0.5 - w, 0.5 + w, band) * uRings);
  }
  vec3 color = base * light;

  // velvet: the fibres catch the light at grazing angles, so the edges glow in a lighter tint
  float edge = pow(1.0 - nv, 2.2);
  vec3 sheen = uSheenColor * uSheen * (edge * (0.55 * ambient + 0.9 * wrapped(n, key, 0.6)) + 1.6 * pow(1.0 - nv, 4.0) * wrapped(n, rim, 0.8));
  color += sheen;

  if (uGloss > 0.0) {
    float spec = gloss(n, v, key, uRoughness) * 2.0 + gloss(n, v, fill, uRoughness) * 0.5;
    float fresnel = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
    color += uGloss * (spec * 0.25 + fresnel * 0.35 * ambient);
  }

  color += uEmissive;
  fragColor = vec4(tonemap(color * uExposure), 1.0);
}`

const COMPOSE_VERTEX = /* glsl */ `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`

// The dream, composed from the character drawn on its own: a luminous fog of slowly folding light behind it,
// the character blurring and turning to light toward its outline, which breaks into dots that drift upward, an
// aura and rising streaks round it, and thin veils of fog in front. Where the hand went the fog is thinner, and
// while the fog moves it drags the folds along.
const COMPOSE_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uStir;
uniform vec2 uResolution;
uniform float uTime;
uniform float uFog;
uniform vec3 uFogColor;
uniform float uDissolve;
uniform float uPixelRatio;
out vec4 fragColor;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 s = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  mat2 turn = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    sum += amp * noise(p);
    p = turn * p;
    amp *= 0.5;
  }
  return sum;
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 uv = vUv;
  vec2 p = uv * vec2(aspect, 1.0);
  float t = uTime;
  vec4 stir = texture(uStir, uv);
  float left = stir.r;
  vec2 drag = stir.gb * vec2(aspect, 1.0) * 0.08;

  // the fog: noise folded through itself, drifting; a fuller layer behind, thin veils in front
  vec2 q = p * 1.2 - drag;
  vec2 fold = vec2(fbm(q + vec2(0.0, t * 0.05)), fbm(q + vec2(5.2, 1.3) - vec2(t * 0.04, 0.0)));
  float back = smoothstep(0.25, 0.85, fbm(q + 1.7 * fold + vec2(t * 0.02, 0.0))) * left;
  float front = smoothstep(0.5, 0.9, fbm(p * 2.2 - drag * 1.5 + 1.3 * fold + vec2(-t * 0.06, t * 0.03) + 7.0)) * left;

  // how far inside the character this pixel is: the share of a disc round it that the character covers,
  // 1 deep inside, about half on the outline, falling to 0 a disc away; the same taps give its blurred colour
  float radius = 0.02 + 0.08 * uDissolve;
  vec4 blur = vec4(0.0);
  for (int k = 0; k < 16; k++) {
    float a = float(k) * 2.39996;
    float r = sqrt((float(k) + 0.5) / 16.0) * radius;
    blur += texture(uScene, uv + vec2(cos(a) / aspect, sin(a)) * r);
  }
  blur /= 16.0;
  float cover = blur.a;
  float edge = 1.0 - smoothstep(0.4, 0.98, cover);
  float wisp = fbm(p * 4.5 + vec2(0.0, -t * 0.22) + fold * 0.6);
  float wisp2 = fbm(p * 4.5 + vec2(3.7, -t * 0.18));
  vec2 smear = (vec2(wisp, wisp2) - 0.5) * radius * 0.7 * edge;
  smear.y -= radius * 0.4 * edge;
  smear.x /= aspect;
  // toward its outline the character comes apart into round dots, one to a small cell: nearly touching where
  // the character is, smaller and rarer further out, each a little off its cell's middle and there or not by
  // chance; the cells drift upward, so the dots rise
  float size = 8.0 * uPixelRatio;
  vec2 dp = vUv * uResolution - vec2(0.0, t * 16.0 * uPixelRatio);
  vec2 cell = floor(dp / size);
  vec2 inCell = dp - (cell + 0.5) * size;
  float chance = hash(cell);
  vec2 jitter = (vec2(hash(cell + 17.3), hash(cell + 41.7)) - 0.5) * size * 0.3;
  float dotRadius = size * mix(0.1, 0.5, smoothstep(0.15, 0.9, cover)) * (0.8 + 0.4 * hash(cell + 7.1));
  float dotShape = 1.0 - smoothstep(dotRadius - uPixelRatio, dotRadius, length(inCell - jitter));
  float band = smoothstep(0.0, 0.3, cover);
  float dots = dotShape * step(chance, band * uDissolve * 1.6);
  // the solid character gives way to the dots toward its outline; what is left blurs and turns to the light
  vec4 body = mix(texture(uScene, uv + smear), blur, edge * uDissolve);
  // the outline itself is worn away: bitten into by a finer noise that drifts up with the dream, and soft where
  // it gives, like fog; only along the outline: well inside, the character stays whole
  float wear = (fbm(p * 16.0 + vec2(0.0, -t * 0.3)) - 0.5) * 1.5 + (wisp - 0.5) * 0.7;
  float rim = 1.0 - smoothstep(0.88, 1.0, cover);
  float solid = uDissolve > 0.0 ? smoothstep(0.6, 0.95, cover + wear * uDissolve * rim) : 1.0;
  float bodyAlpha = body.a * solid;
  vec3 light = pow(uFogColor, vec3(1.0 / 2.2));
  vec3 bodyColor = mix(body.rgb, light * body.a, edge * 0.45 * uDissolve);
  float aura = uDissolve * smoothstep(0.0, 0.45, cover) * (1.0 - smoothstep(0.45, 1.0, cover)) * 0.7;
  vec3 dotColor = mix(blur.rgb / max(blur.a, 0.05), light, 0.1 + 0.65 * (1.0 - smoothstep(0.2, 0.9, cover)));
  // just outside the outline, tall streaks of noise rising: smoke leaving the character, its colour turning to light
  float streak = smoothstep(0.5, 0.82, fbm(p * vec2(7.0, 2.6) + vec2(0.0, -t * 0.35) + fold * 0.8));
  float smoke = uDissolve * streak * smoothstep(0.02, 0.35, cover) * (1.0 - smoothstep(0.35, 0.7, cover)) * 0.6;
  vec3 smokeColor = mix(blur.rgb / max(blur.a, 0.05), light, 0.55);

  float alpha = uFog * (0.22 + 0.6 * back);
  vec3 color = light * (0.75 + 0.7 * back) * alpha;
  color = bodyColor * solid + color * (1.0 - bodyAlpha);
  alpha = bodyAlpha + alpha * (1.0 - bodyAlpha);
  color += light * aura * 0.4;
  alpha = min(1.0, alpha + aura * 0.25);
  color = smokeColor * smoke + color * (1.0 - smoke);
  alpha = smoke + alpha * (1.0 - smoke);
  // only where the solid character has given way
  float dotAlpha = dots * 0.95 * (1.0 - solid);
  color = dotColor * dotAlpha + color * (1.0 - dotAlpha);
  alpha = dotAlpha + alpha * (1.0 - dotAlpha);
  float veil = uFog * 0.4 * front;
  color = light * (0.9 + 0.3 * front) * veil + color * (1.0 - veil);
  alpha = veil + alpha * (1.0 - veil);
  fragColor = vec4(color, alpha);
}`

type Part = { program: Program; fur: boolean; base: [number, number, number]; sheen: [number, number, number] }

/** A program for one of the model's materials, its uniforms set from the material's own factors. */
function makePart(gl: OGLRenderingContext, material: GLTFMaterial | undefined, skinned: boolean): Part {
  const fur = skinned || material?.name === "fur"
  const base = (material?.baseColorFactor?.slice(0, 3) ?? [0.8, 0.8, 0.8]) as [number, number, number]
  const sheenExtension = material?.extensions?.KHR_materials_sheen
  const sheen = (sheenExtension?.sheenColorFactor ?? (fur ? base.map((c) => c * 0.4 + 0.08) : [0, 0, 0])) as [number, number, number]
  const roughness = material?.roughnessFactor ?? 0.8
  const program = new Program(gl, {
    vertex: skinned ? VERTEX.replace("#version 300 es", "#version 300 es\n#define SKINNED") : VERTEX,
    fragment: FRAGMENT,
    cullFace: material?.doubleSided ? false : gl.BACK,
    uniforms: {
      uColor: { value: base.slice() },
      uSheenColor: { value: sheen.slice() },
      uSheen: { value: 1 },
      uRoughness: { value: Math.max(0.08, roughness) },
      // the eyes and pupils are smooth: they get the gloss, the fur gets none
      uGloss: { value: roughness < 0.6 ? 1 : 0 },
      uEmissive: { value: (material?.emissiveFactor ?? [0, 0, 0]).slice() },
      uExposure: { value: 1 },
      // rings on the pupils, set per pupil as it is drawn; off elsewhere
      uRings: { value: 0 },
      uRingAxis: { value: [0, 0, 1] },
      uRingScale: { value: 1 },
      uRingLight: { value: [0.81, 0.81, 0.86] },
      uTime: { value: 0 },
      // the arm's stretch, set once the arm is found; at rest it changes nothing
      ...(skinned ? { uShoulder: { value: [0, 0, 0] }, uAxis: { value: [0, 0, 1] }, uWrist: { value: 1 }, uStretch: { value: 1 }, uArmJoint: { value: -1 } } : {}),
    },
  })
  return { program, fur, base, sheen }
}

/** The world-space box around every mesh, in the pose the model was saved in. */
function measure(scene: Transform): Bounds {
  const min = new Vec3(Infinity, Infinity, Infinity)
  const max = new Vec3(-Infinity, -Infinity, -Infinity)
  const corner = new Vec3()
  scene.updateMatrixWorld(true)
  scene.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.geometry) return
    mesh.geometry.computeBoundingBox()
    const box = mesh.geometry.bounds
    // a skinned mesh is placed by its bones, not by its node
    const matrix = "skeleton" in mesh ? new Mat4() : mesh.worldMatrix
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? box.max[0] : box.min[0], i & 2 ? box.max[1] : box.min[1], i & 4 ? box.max[2] : box.min[2]).applyMatrix4(matrix)
      for (let a = 0; a < 3; a++) {
        min[a] = Math.min(min[a], corner[a])
        max[a] = Math.max(max[a], corner[a])
      }
    }
  })
  return { min: [min[0], min[1], min[2]], max: [max[0], max[1], max[2]] }
}

/**
 * A 3D character in a dream, for the background of a section: its outline frays into wisps in a slowly drifting
 * fog, its round hand reaches for the pointer wherever it is on the page (the arm stretching as far as it must)
 * and stirs the fog as it goes, the eyes follow the pointer and the body leans toward it. Drawn with WebGL 2, only while the pose is still catching up.
 */
export function DreamCat({
  src = "/models/mewo.glb",
  alt,
  color = "#000000",
  track = true,
  reach = 60,
  stretch = 2.3,
  gaze = 4,
  lean = 10,
  smoothing = 0.54,
  zoom = 2.15,
  x = 0.84,
  y = 0.71,
  sheen = 1.8,
  exposure = 0.7,
  fog = 0.5,
  fogColor = "#c6c6c6",
  swirl = 2.9,
  dissolve = 1,
  drift = 1.55,
  eyes = "rings",
  dpr = 1.5,
  onLoad,
  onError,
  className,
  children,
  ...props
}: DreamCatProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const settings: Settings = { src, color, track, reach, stretch, gaze, lean, smoothing, zoom, x, y, sheen, exposure, fog, fogColor, swirl, dissolve, drift, eyes, dpr, onLoad, onError }
  const settingsRef = React.useRef(settings)
  const wakeRef = React.useRef<(() => void) | null>(null)

  // The context and the scene are built once. A prop change only updates the ref and wakes the loop, and a new
  // model replaces the scene, never the context.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // The canvas is made here, not in JSX: React Strict Mode runs this effect twice in development, and the
    // context the first cleanup loses would come straight back from getContext() on the same element. ogl throws
    // when no context can be made (jsdom, a GPU-less browser), so the probe goes first, with ogl's own attributes.
    const canvas = document.createElement("canvas")
    if (!canvas.getContext("webgl2", CONTEXT_ATTRIBUTES)) return
    const renderer = new Renderer({ canvas, ...CONTEXT_ATTRIBUTES })
    const gl = renderer.gl
    if (!renderer.isWebgl2) {
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      return
    }
    gl.clearColor(0, 0, 0, 0)
    canvas.className = "absolute inset-0 block h-full w-full opacity-0 transition-opacity duration-700 motion-reduce:transition-none"
    canvas.setAttribute("aria-hidden", "true")
    root.prepend(canvas)

    const camera = new Camera(gl, { fov: FOV, near: 0.3, far: 40 })
    const scene = new Transform()

    // the hand's middle on screen (0 to 1 from the bottom left) and its radius in box heights, and where it was
    const onScreen = { hand: { x: 0, y: 0, r: 0, seen: false }, last: { x: 0, y: 0, seen: false } }
    // the character is drawn into this target, then composed into the dream on the canvas
    // (with a stencil, its depth buffer has 24 bits, enough to keep the pupils in front of the eyes)
    const sceneTarget = new RenderTarget(gl, { width: 1, height: 1, depth: true, stencil: true })
    // the fog's grid: simulated on the CPU, a cell per texel
    let fog = createFog(1)
    let fogTexels = packFog(fog, new Float32Array(fog.width * fog.height * 4))
    const fogTexture = new Texture(gl, {
      image: fogTexels,
      width: fog.width,
      height: fog.height,
      type: gl.FLOAT,
      format: gl.RGBA,
      // half floats filter linearly in every WebGL 2 browser; full floats need an extension
      internalFormat: (gl as WebGL2RenderingContext).RGBA16F,
      generateMipmaps: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      flipY: false,
    })
    const composeProgram = new Program(gl, {
      vertex: COMPOSE_VERTEX,
      fragment: COMPOSE_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      cullFace: false,
      uniforms: {
        uScene: { value: sceneTarget.texture },
        uStir: { value: fogTexture },
        uResolution: { value: [1, 1] },
        uTime: { value: 0 },
        uFog: { value: 0 },
        uFogColor: { value: [0.6, 0.5, 1] },
        uDissolve: { value: 0 },
        uPixelRatio: { value: 1 },
      },
    })
    const composeGeometry = new Triangle(gl)
    const composeMesh = new Mesh(gl, { geometry: composeGeometry, program: composeProgram })
    // a box of another shape gets a fog grid of its own, at rest
    const fitFog = (aspect: number) => {
      const next = createFog(aspect)
      if (next.width === fog.width && next.height === fog.height) return
      fog = next
      fogTexels = packFog(fog, new Float32Array(fog.width * fog.height * 4))
      fogTexture.image = fogTexels
      fogTexture.width = fog.width
      fogTexture.height = fog.height
      fogTexture.needsUpdate = true
    }
    // the dream's own clock, which runs only while it drifts
    let time = 0
    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    const dreaming = () => {
      const s = settingsRef.current
      return s.drift > 0 && (s.fog > 0 || s.dissolve > 0) && !(motionQuery?.matches ?? false)
    }
    let model: {
      parts: Part[]
      meshes: Mesh[]
      bounds: Bounds
      body: Transform | null
      arm: { node: Transform; rest: Quat; axis: Vec3; length: number; radius: number; wrist: number; front: number; uniforms: Program["uniforms"] } | null
      pupils: { node: Transform; rest: Quat; look: Vec3 }[]
      ringed: Program[]
    } | null = null
    let loaded = ""
    let generation = 0
    let planeZ = 1

    // the pointer in the box's clip space, and how much the pose follows it (0 at rest, 1 tracking)
    const aim = { x: 0, y: 0, weight: 0, tx: 0, ty: 0, tw: 0 }
    let raf = 0
    let last = 0
    let visible = true

    const target = new Vec3()
    const local = new Vec3()
    const direction = new Vec3()
    const origin = new Vec3()
    const hand = new Vec3()
    const inverse = new Mat4()
    const turn = new Quat()
    const euler = new Euler()

    const frameCamera = () => {
      if (!model) return
      const s = settingsRef.current
      const aspect = canvas.width / Math.max(1, canvas.height)
      const view = fitView(model.bounds, aspect, clamp(s.zoom, 0.3, 2.2), s.x, s.y)
      const middle = (model.bounds.min[2] + model.bounds.max[2]) / 2
      camera.perspective({ aspect })
      camera.position.set(view.x, view.y, middle + view.distance)
      // the eyes and the lean read the pointer where it crosses the front of the character
      planeZ = model.bounds.max[2]
      // a new framing moves the hand on screen without it moving: no stir from that
      onScreen.last.seen = false
      fitFog(aspect)
    }

    let colorKey: string | undefined
    let custom: [number, number, number] | null = null
    let fogKey: string | undefined
    const applyLook = () => {
      if (!model) return
      const s = settingsRef.current
      if (s.color !== colorKey) {
        colorKey = s.color
        custom = linearColor(s.color)
      }
      if (s.fogColor !== fogKey) {
        fogKey = s.fogColor
        const tint = linearColor(s.fogColor)
        if (tint) composeProgram.uniforms.uFogColor.value = tint
      }
      for (const program of model.ringed) program.uniforms.uRings.value = s.eyes === "plain" ? 0 : 1
      for (const part of model.parts) {
        const u = part.program.uniforms
        u.uExposure.value = s.exposure
        u.uSheen.value = s.sheen
        if (part.fur) {
          u.uColor.value = custom ?? part.base
          u.uSheenColor.value = custom ? custom.map((c) => c * 0.4 + 0.08) : part.sheen
        }
      }
    }

    // The pose for the eased pointer. The camera looks straight down -z, so the pointer is a ray from it; the body
    // leans and the eyes look toward where that ray crosses the character's front, and the hand goes where the
    // ray meets the arm's reach, the forearm stretching when the ray passes beyond it.
    const pose = () => {
      if (!model) return
      const s = settingsRef.current
      const t = Math.tan(toRadians(FOV) / 2)
      const aspect = canvas.width / Math.max(1, canvas.height)
      direction.set(aim.x * t * aspect, aim.y * t, -1).normalize()
      const depth = camera.position[2] - planeZ
      target.copy(direction).scale(depth / -direction[2]).add(camera.position)
      const middle = [(model.bounds.min[0] + model.bounds.max[0]) / 2, (model.bounds.min[1] + model.bounds.max[1]) / 2]

      if (model.body) {
        const limit = toRadians(s.lean)
        const yaw = clamp(Math.atan2(target[0] - middle[0], target[2]), -limit, limit)
        const pitch = clamp(-Math.atan2(target[1] - middle[1], target[2]), -limit, limit)
        model.body.quaternion.fromEuler(euler.set(pitch * aim.weight, yaw * aim.weight, 0))
      }
      scene.updateMatrixWorld(true)

      if (model.arm) {
        const { node, rest, axis, length, wrist, front, uniforms } = model.arm
        // in the arm's parent space: the ray against a sphere round the shoulder as wide as the arm is long, the
        // point slid along the ray to stay in front of the body, so the hand never sinks into it
        inverse.inverse(node.parent!.worldMatrix)
        origin.copy(camera.position).applyMatrix4(inverse)
        local.copy(direction).transformDirection(inverse)
        reachPoint(origin, local, node.position, length, hand)
        if (hand[2] < front && local[2] < 0) hand.copy(local).scale((front - origin[2]) / local[2]).add(origin)
        hand.sub(node.position)
        uniforms.uStretch.value = 1 + (stretchFor(hand.len(), length, wrist, s.stretch) - 1) * aim.weight
        turnToward(axis, hand, toRadians(s.reach), aim.weight, turn)
        node.quaternion.multiply(turn, rest)
        // where the hand's middle now is on screen, for the fog
        const out = length + wrist * (uniforms.uStretch.value - 1)
        hand.copy(axis).applyQuaternion(turn).scale(out).add(node.position).applyMatrix4(node.parent!.worldMatrix)
        const away = Math.max(camera.position[2] - hand[2], 1e-3)
        onScreen.hand.x = 0.5 + (hand[0] - camera.position[0]) / (t * aspect * away) / 2
        onScreen.hand.y = 0.5 + (hand[1] - camera.position[1]) / (t * away) / 2
        onScreen.hand.r = model.arm.radius / (t * away) / 2
        onScreen.hand.seen = true
      }
      for (const pupil of model.pupils) {
        local.copy(target).applyMatrix4(inverse.inverse(pupil.node.parent!.worldMatrix))
        turnToward(pupil.look, local, toRadians(s.gaze), aim.weight, turn)
        pupil.node.quaternion.multiply(turn, pupil.rest)
      }
      scene.updateMatrixWorld(true)
    }

    const render = () => {
      const s = settingsRef.current
      // the pupils' rings ripple on the dream's clock
      for (const program of model?.ringed ?? []) program.uniforms.uTime.value = time
      renderer.render({ scene, camera, target: sceneTarget })
      const u = composeProgram.uniforms
      u.uResolution.value = [canvas.width, canvas.height]
      u.uTime.value = time
      u.uFog.value = clamp(s.fog, 0, 1)
      u.uDissolve.value = clamp(s.dissolve, 0, 1)
      u.uPixelRatio.value = renderer.dpr
      renderer.render({ scene: composeMesh })
    }

    const draw = () => {
      if (!model) return
      pose()
      render()
    }

    // The hand stirs the fog round it as it moves, then the fog is stepped. Returns true once it is calm.
    const stir = (dt: number) => {
      const s = settingsRef.current
      const { hand, last } = onScreen
      if (s.fog <= 0 || !hand.seen) {
        last.seen = false
        return true
      }
      if (last.seen && s.swirl > 0) {
        const vx = (hand.x - last.x) / dt
        const vy = (hand.y - last.y) / dt
        const inside = hand.x > -hand.r && hand.x < 1 + hand.r && hand.y > -hand.r && hand.y < 1 + hand.r
        if (inside && Math.abs(vx) + Math.abs(vy) > 1e-3) stirFog(fog, hand.x, hand.y, hand.r, vx, vy, s.swirl * Math.min(1, 20 * dt))
      }
      last.x = hand.x
      last.y = hand.y
      last.seen = true
      if (fog.calm) return true
      const calm = stepFog(fog, dt)
      packFog(fog, fogTexels)
      fogTexture.needsUpdate = true
      return calm
    }

    const frame = (now: number) => {
      raf = 0
      const s = settingsRef.current
      const dt = last ? clamp((now - last) / 1000, 1 / 240, 0.05) : 1 / 60
      last = now
      const k = followStep(s.smoothing, dt)
      aim.x += (aim.tx - aim.x) * k
      aim.y += (aim.ty - aim.y) * k
      aim.weight += (aim.tw - aim.weight) * k
      // an eased value crosses a tiny epsilon late: snap it, so the loop ends when the motion visibly has
      const settled = Math.abs(aim.tx - aim.x) + Math.abs(aim.ty - aim.y) + Math.abs(aim.tw - aim.weight) < 2e-4
      if (settled) {
        aim.x = aim.tx
        aim.y = aim.ty
        aim.weight = aim.tw
      }
      const drifting = dreaming()
      if (drifting) time += dt * s.drift
      let calm = true
      if (model) {
        pose()
        calm = stir(dt)
        render()
      }
      // the loop runs while the pose catches up, the fog still moves or the dream drifts, never off screen
      if (visible && (!settled || !calm || drifting)) raf = requestAnimationFrame(frame)
      else last = 0
    }

    // Nothing is scheduled before the model is in, while the box is off screen or while the tab is hidden.
    const wake = () => {
      if (!raf && model && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const resize = () => {
      const s = settingsRef.current
      const width = root.clientWidth
      const height = root.clientHeight
      // The device pixel ratio, capped by `dpr`, by 2 and by the fragment budget.
      renderer.dpr = Math.min(window.devicePixelRatio || 1, s.dpr > 0 ? s.dpr : 2, 2, Math.sqrt(PIXEL_BUDGET / Math.max(1, width * height)))
      renderer.setSize(Math.max(1, width), Math.max(1, height))
      canvas.style.width = ""
      canvas.style.height = ""
      sceneTarget.setSize(canvas.width, canvas.height)
      frameCamera()
      // a resized canvas is blank, so it is drawn again at once rather than on the next frame
      draw()
    }

    const dispose = () => {
      if (!model) return
      for (const mesh of model.meshes) mesh.geometry.remove()
      for (const part of model.parts) part.program.remove()
      for (const mesh of model.meshes) if ("boneTexture" in mesh) gl.deleteTexture((mesh as unknown as { boneTexture: { texture: WebGLTexture } }).boneTexture.texture)
      scene.children.slice().forEach((child) => scene.removeChild(child))
      model = null
    }

    const load = () => {
      const s = settingsRef.current
      if (!s.src || s.src === loaded) return
      loaded = s.src
      const ticket = ++generation
      GLTFLoader.load(gl, s.src)
        .then((gltf) => {
          if (ticket !== generation) return
          dispose()
          const parts: Part[] = []
          const meshes: Mesh[] = []
          const originals = new Set<Program>()
          const byMaterial = new Map<string, Part>()
          for (const node of gltf.scene) node.setParent(scene)
          scene.traverse((node) => {
            const mesh = node as Mesh & { program: Program & { gltfMaterial?: GLTFMaterial } }
            if (!mesh.geometry) return
            const skinned = "skeleton" in mesh
            const material = mesh.program.gltfMaterial
            originals.add(mesh.program)
            const key = `${material?.name ?? "default"}|${skinned}`
            let part = byMaterial.get(key)
            if (!part) {
              part = makePart(gl, material, skinned)
              byMaterial.set(key, part)
              parts.push(part)
            }
            mesh.program = part.program
            // the bones move the skinned mesh past the bounds it was saved with
            mesh.frustumCulled = false
            meshes.push(mesh)
          })
          // the loader's own programs are replaced: one program per material, shared by the meshes that wear it
          for (const program of originals) program.remove()

          const named = (name: string) => {
            let found: Transform | null = null
            scene.traverse((node) => {
              if (!found && (node as Transform & { name?: string }).name === name) found = node
            })
            return found as Transform | null
          }
          const bounds = measure(scene)
          const arm = named(NODES.arm)
          const skin = meshes.find((mesh) => "skeleton" in mesh)
          // the arm turns its hand, not its bone, toward the pointer: the line from the shoulder to the hand's middle
          let reach: { axis: Vec3; length: number; radius: number; wrist: number; front: number; uniforms: Program["uniforms"] } | null = null
          if (arm?.parent && skin) {
            const shoulder = new Vec3().copy(arm.position).applyMatrix4(arm.parent.worldMatrix)
            const shape = armShape(skin, arm, shoulder)
            if (shape) {
              // the stretch works in the mesh's own space, before the bones move it
              const uniforms = skin.program.uniforms
              uniforms.uShoulder.value = [shoulder[0], shoulder[1], shoulder[2]]
              uniforms.uAxis.value = [shape.axis[0], shape.axis[1], shape.axis[2]]
              uniforms.uWrist.value = shape.wrist
              uniforms.uArmJoint.value = shape.index
              // the pose turns the arm in its parent's space
              const toParent = new Mat4().inverse(arm.parent.worldMatrix)
              const axis = shape.axis.clone().transformDirection(toParent)
              const front = new Vec3(shoulder[0], shoulder[1], shape.front).applyMatrix4(toParent)[2]
              reach = { axis, length: shape.length, radius: shape.radius, wrist: shape.wrist, front, uniforms }
            }
          }
          const ringed: Program[] = []
          const pupils = NODES.pupils.flatMap((name) => {
            const node = named(name)
            const mesh = node?.children.find((child) => (child as Mesh).geometry) as Mesh | undefined
            const data = mesh?.geometry.attributes.position?.data
            if (!node || !mesh || !data) return []
            // the pupil looks out through its own middle, from the eye's centre
            const middle = new Vec3()
            for (let i = 0; i < data.length; i += 3) middle.add(new Vec3(data[i], data[i + 1], data[i + 2]))
            middle.normalize()
            // its rim: the widest angle any of its points makes with its middle; the rings fit inside it
            let rim = 1e-3
            const point = new Vec3()
            for (let i = 0; i < data.length; i += 3) rim = Math.max(rim, point.set(data[i], data[i + 1], data[i + 2]).normalize().angle(middle))
            const axis = [middle[0], middle[1], middle[2]]
            const scale = PUPIL_RINGS / rim
            // the two pupils share a program, so each sets its own middle as it is drawn
            mesh.onBeforeRender(() => {
              mesh.program.uniforms.uRingAxis.value = axis
              mesh.program.uniforms.uRingScale.value = scale
            })
            if (!ringed.includes(mesh.program)) ringed.push(mesh.program)
            const look = middle.clone().applyQuaternion(node.quaternion).normalize()
            return [{ node, rest: new Quat().copy(node.quaternion), look }]
          })
          model = {
            parts,
            meshes,
            bounds,
            body: named(NODES.body),
            arm: arm && reach ? { node: arm, rest: new Quat().copy(arm.quaternion), ...reach } : null,
            pupils,
            ringed,
          }
          applyLook()
          resize()
          if (dreaming()) wake()
          canvas.style.opacity = "1"
          settingsRef.current.onLoad?.()
        })
        .catch((error: unknown) => {
          if (ticket !== generation) return
          settingsRef.current.onError?.(error instanceof Error ? error : new Error(String(error)))
        })
    }

    const rest = () => {
      if (aim.tw === 0) return
      aim.tw = 0
      wake()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!visible || !settingsRef.current.track) return
      const rect = root.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      // anywhere on the page; past the box, the hand waits at its edge
      aim.tx = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1)
      aim.ty = clamp(1 - ((event.clientY - rect.top) / rect.height) * 2, -1, 1)
      aim.tw = 1
      wake()
    }

    // The pointer left the window, or a finger or pen lifted.
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) rest()
    }

    const onVisibility = () => {
      last = 0
      wake()
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerdown", onPointerMove, { passive: true })
    window.addEventListener("pointerout", onPointerOut, { passive: true })
    document.addEventListener("visibilitychange", onVisibility)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(root)
    // against the window, so the loop also stops when a scrolling parent carries the box off the page
    const intersection = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting)
      if (visible) {
        last = 0
        wake()
      }
    })
    intersection.observe(root)
    load()
    wakeRef.current = () => {
      const s = settingsRef.current
      load()
      if (!s.track) rest()
      applyLook()
      frameCamera()
      draw()
      // a dream set drifting starts its clock
      if (dreaming()) wake()
    }

    // Everything is released, then the context, then the element.
    return () => {
      cancelAnimationFrame(raf)
      // a model still loading is ignored when it arrives
      generation++
      wakeRef.current = null
      resizeObserver.disconnect()
      intersection.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerdown", onPointerMove)
      window.removeEventListener("pointerout", onPointerOut)
      document.removeEventListener("visibilitychange", onVisibility)
      dispose()
      composeGeometry.remove()
      composeProgram.remove()
      gl.deleteTexture(fogTexture.texture)
      gl.deleteTexture(sceneTarget.texture.texture)
      gl.deleteFramebuffer(sceneTarget.buffer)
      if (sceneTarget.depthStencilBuffer) gl.deleteRenderbuffer(sceneTarget.depthStencilBuffer)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      canvas.remove()
    }
  }, [])

  // Props reach the loop through a ref written here, never in render, and a change draws one frame.
  React.useEffect(() => {
    settingsRef.current = settings
    wakeRef.current?.()
  })

  return (
    <div
      ref={rootRef}
      data-slot="dream-cat"
      role={alt ? "img" : undefined}
      aria-label={alt}
      className={cn("relative h-full w-full touch-pan-y overflow-hidden", className)}
      {...props}
    >
      {children ? <div className="relative z-1 h-full">{children}</div> : null}
    </div>
  )
}

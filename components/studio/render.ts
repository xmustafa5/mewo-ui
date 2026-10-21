import type { VideoCodec } from "mediabunny"
import { collectLayers, drawLayers } from "./compose"
import { frameUrl, nextTask, waitForBridge } from "./frame-url"
import type { StudioBridge } from "./frame/bridge"
import type { Layout } from "./sizes"
import type { Props, StudioEntry } from "./types"

/**
 * Offline rendering. A hidden frame is opened with `clock=manual`, so time inside it only moves when this
 * module steps it: every frame is rendered exactly, at any size, regardless of how fast the machine is.
 */

const FRAME_MS = 1000 / 60
/** Memory for the frames a seamless loop blends back into, so a long 4K render cannot exhaust the tab. */
const HEAD_BUDGET = 480 * 1024 * 1024

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const abortError = () => new DOMException("Export cancelled", "AbortError")

const guard = (signal?: AbortSignal) => {
  if (signal?.aborted) throw abortError()
}

type Output = { width: number; height: number }

type RendererOptions = { layout: Layout; output: Output; ratio: number; theme: string; seed?: number }

export async function createRenderer({ layout, output, ratio, theme, seed = 1 }: RendererOptions) {
  const iframe = document.createElement("iframe")
  iframe.src = frameUrl({ theme, clock: "manual", seed, dpr: ratio })
  iframe.setAttribute("aria-hidden", "true")
  iframe.tabIndex = -1
  Object.assign(iframe.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: `${layout.width}px`,
    height: `${layout.height}px`,
    border: "0",
    opacity: "0",
    pointerEvents: "none",
    zIndex: "-1",
    colorScheme: theme,
  })
  document.body.appendChild(iframe)

  let api: StudioBridge
  try {
    api = await waitForBridge(iframe)
  } catch (problem) {
    iframe.remove()
    throw problem
  }

  const canvas = document.createElement("canvas")
  canvas.width = output.width
  canvas.height = output.height
  const context = canvas.getContext("2d")
  if (!context) {
    iframe.remove()
    throw new Error("Could not create a drawing context.")
  }

  return {
    canvas,
    context,
    /** Loads the background and steps until it has drawn something and its assets are in. */
    async load(id: string, props: Props, signal?: AbortSignal) {
      await api.load(id, props)
      const view = iframe.contentDocument
      const started = performance.now()
      for (let frame = 0; ; frame += 1) {
        guard(signal)
        api.clock.step(1)
        await wait(16)
        const stage = api.stage()
        const layers = stage ? collectLayers(stage).layers.length : 0
        const images = view ? [...view.images].every((image) => image.complete) : true
        const fonts = view?.fonts?.status !== "loading"
        if (frame >= 18 && layers > 0 && images && fonts) break
        if (performance.now() - started > 9000) break
      }
    },
    step(ms: number) {
      api.clock.step(ms)
    },
    draw(fill: string | null) {
      const stage = api.stage()
      if (stage) drawLayers(context, collectLayers(stage), output.width, output.height, fill)
    },
    destroy() {
      iframe.remove()
    },
  }
}

type Renderer = Awaited<ReturnType<typeof createRenderer>>

async function advance(
  renderer: Renderer,
  seconds: number,
  frameMs: number,
  signal?: AbortSignal,
  onTick?: (progress: number) => void,
) {
  const steps = Math.round((seconds * 1000) / frameMs)
  for (let index = 0; index < steps; index += 1) {
    renderer.step(frameMs)
    if (index % 3 === 2) {
      guard(signal)
      onTick?.(index / steps)
      await nextTask()
    }
  }
}

export type ImageJob = {
  entry: StudioEntry
  props: Props
  theme: string
  layout: Layout
  output: Output
  ratio: number
  /** Seconds into the animation to capture. */
  moment: number
  fill: string | null
  signal?: AbortSignal
}

export async function renderImage({ entry, props, theme, layout, output, ratio, moment, fill, signal }: ImageJob) {
  const renderer = await createRenderer({ layout, output, ratio, theme })
  try {
    await renderer.load(entry.id, props, signal)
    await advance(renderer, moment, FRAME_MS, signal)
    guard(signal)
    renderer.step(FRAME_MS)
    renderer.draw(fill)
    return renderer.canvas
  } finally {
    renderer.destroy()
  }
}

const smooth = (t: number) => t * t * (3 - 2 * t)

export type VideoFormat = "mp4" | "webm"
export type VideoQuality = "standard" | "high" | "max"

const BITS_PER_PIXEL: Record<VideoQuality, number> = { standard: 0.06, high: 0.12, max: 0.25 }

const bitrateFor = (quality: VideoQuality, output: Output, fps: number, codec: VideoCodec) => {
  const efficiency = codec === "avc" || codec === "vp8" ? 1 : 0.65
  const raw = output.width * output.height * fps * (BITS_PER_PIXEL[quality] || BITS_PER_PIXEL.standard) * efficiency
  return Math.round(Math.min(Math.max(raw, 1e6), 8e7))
}

export const estimateVideoBytes = ({
  quality,
  output,
  fps,
  duration,
  format,
}: {
  quality: VideoQuality
  output: Output
  fps: number
  duration: number
  format: VideoFormat
}) => (bitrateFor(quality, output, fps, format === "webm" ? "vp9" : "avc") * duration) / 8

export async function videoSupport(): Promise<Record<VideoFormat, boolean>> {
  if (typeof VideoEncoder === "undefined") return { mp4: false, webm: false }
  const { canEncodeVideo } = await import("mediabunny")
  const probe = (codec: VideoCodec) => canEncodeVideo(codec, { width: 1920, height: 1080 }).catch(() => false)
  const [avc, vp9] = await Promise.all([probe("avc"), probe("vp9")])
  return { mp4: avc, webm: vp9 }
}

export type VideoProgress = {
  phase: "loading" | "warming" | "rendering" | "finishing"
  progress: number
  frame?: number
  frames?: number
  remaining?: number | null
}

export type VideoJob = {
  entry: StudioEntry
  props: Props
  theme: string
  layout: Layout
  output: Output
  ratio: number
  fps: number
  duration: number
  start: number
  loop: boolean
  format: VideoFormat
  quality: VideoQuality
  fill: string | null
  signal?: AbortSignal
  onProgress?: (update: VideoProgress) => void
}

export async function renderVideo({
  entry,
  props,
  theme,
  layout,
  output,
  ratio,
  fps,
  duration,
  start,
  loop,
  format,
  quality,
  fill,
  signal,
  onProgress,
}: VideoJob): Promise<Blob> {
  const { Output, Mp4OutputFormat, WebMOutputFormat, BufferTarget, CanvasSource, Quality, canEncodeVideo } =
    await import("mediabunny")
  const codecs: VideoCodec[] = format === "webm" ? ["vp9", "vp8", "av1"] : ["avc", "hevc"]
  let codec: VideoCodec | null = null
  for (const candidate of codecs) {
    if (await canEncodeVideo(candidate, { width: output.width, height: output.height }).catch(() => false)) {
      codec = candidate
      break
    }
  }
  if (!codec)
    throw new Error(`This browser can't encode ${format.toUpperCase()} at ${output.width} × ${output.height}.`)

  const renderer = await createRenderer({ layout, output, ratio, theme })
  const head: ImageBitmap[] = []
  let media: InstanceType<typeof Output> | null = null
  let finished = false
  try {
    onProgress?.({ phase: "loading", progress: 0 })
    await renderer.load(entry.id, props, signal)

    const frameMs = 1000 / fps
    await advance(renderer, start, frameMs, signal, (progress) => onProgress?.({ phase: "warming", progress }))

    const total = Math.max(1, Math.round(duration * fps))
    const budget = Math.floor(HEAD_BUDGET / (output.width * output.height * 4))
    // A seamless loop keeps the first second of frames and fades them in over the last second.
    const blend = loop ? Math.max(0, Math.min(fps, Math.floor(total / 3), budget)) : 0

    const target = new BufferTarget()
    media = new Output({
      format: format === "webm" ? new WebMOutputFormat() : new Mp4OutputFormat({ fastStart: "in-memory" }),
      target,
    })
    const source = new CanvasSource(renderer.canvas, {
      codec,
      quality: new Quality({ bitrate: bitrateFor(quality, output, fps, codec) }),
      keyFrameInterval: 2,
    })
    media.addVideoTrack(source, { frameRate: fps })
    await media.start()

    const started = performance.now()
    let written = 0
    const frames = total + blend

    for (let index = 0; index < frames; index += 1) {
      guard(signal)
      renderer.step(frameMs)
      renderer.draw(fill)

      if (index < blend) {
        head.push(await createImageBitmap(renderer.canvas))
      } else {
        if (index >= total) {
          const slot = index - total
          renderer.context.save()
          renderer.context.globalAlpha = smooth((slot + 1) / (blend + 1))
          renderer.context.drawImage(head[slot], 0, 0, output.width, output.height)
          renderer.context.restore()
          head[slot].close()
        }
        await source.add(written / fps, 1 / fps)
        written += 1
      }

      const elapsed = performance.now() - started
      const done = index + 1
      onProgress?.({
        phase: "rendering",
        progress: done / frames,
        frame: done,
        frames,
        remaining: done > 4 ? ((frames - done) * elapsed) / done / 1000 : null,
      })
      await nextTask()
    }

    guard(signal)
    onProgress?.({ phase: "finishing", progress: 1 })
    source.close()
    await media.finalize()
    finished = true
    if (!target.buffer) throw new Error("The encoder produced no data.")
    return new Blob([target.buffer], { type: format === "webm" ? "video/webm" : "video/mp4" })
  } finally {
    head.forEach((bitmap) => bitmap.close?.())
    if (media && !finished) await media.cancel().catch(() => {})
    renderer.destroy()
  }
}

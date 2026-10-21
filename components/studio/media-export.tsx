"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Copy, Download, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import { ColorPicker, Select, Slider, Switch, TextInput } from "./controls"
import { canvasToBlob, downloadBlob } from "./download"
import type { StudioState } from "./hooks/use-studio-state"
import {
  estimateVideoBytes,
  renderImage,
  renderVideo,
  videoSupport,
  type VideoFormat,
  type VideoProgress,
  type VideoQuality,
} from "./render"
import {
  even,
  fitOutput,
  MAX_IMAGE_SIDE,
  MAX_VIDEO_SIDE,
  resolveLayout,
  SIZE_PRESETS,
  sizeLabel,
  type Layout,
} from "./sizes"
import { pageFill } from "./theme"
import { brandButtonClass, Spinner, toolClass, Track, type TrackOption } from "./ui"

export type MediaKind = "image" | "video"

const PREVIEW_BOX = { width: 560, height: 360 }

type ImageFormat = "png" | "jpeg" | "webp"
const IMAGE_FORMATS: { value: ImageFormat; label: string; mime: string }[] = [
  { value: "png", label: "PNG", mime: "image/png" },
  { value: "jpeg", label: "JPEG", mime: "image/jpeg" },
  { value: "webp", label: "WebP", mime: "image/webp" },
]

type Fill = "page" | "transparent" | "custom"
const FILLS: TrackOption<Fill>[] = [
  { value: "page", label: "Page" },
  { value: "transparent", label: "None" },
  { value: "custom", label: "Color" },
]

const RATES: TrackOption<number>[] = [24, 30, 60].map((value) => ({ value, label: String(value) }))

const QUALITIES: TrackOption<VideoQuality>[] = [
  { value: "standard", label: "Standard" },
  { value: "high", label: "High" },
  { value: "max", label: "Max" },
]

const SIZE_OPTIONS = SIZE_PRESETS.map((preset) => ({ value: preset.value, label: sizeLabel(preset) }))

type ImageOptions = { size: string; scale: number; format: ImageFormat; fill: Fill; color: string; moment: number }
type VideoOptions = {
  size: string
  scale: number
  format: VideoFormat
  fill: Fill
  color: string
  duration: number
  fps: number
  quality: VideoQuality
  loop: boolean
  start: number
}

/** Settings survive closing the dialog, but not a reload. */
const remembered = {
  image: { size: "desktop", scale: 2, format: "png", fill: "page", color: "#0b0c12", moment: 2 } as ImageOptions,
  video: {
    size: "desktop",
    scale: 1,
    format: "mp4",
    fill: "page",
    color: "#0b0c12",
    duration: 10,
    fps: 30,
    quality: "standard",
    loop: true,
    start: 2,
  } as VideoOptions,
  custom: { width: 1600, height: 900 } as Layout,
}

const formatBytes = (bytes: number) =>
  bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

const formatSeconds = (seconds: number | null | undefined) => {
  if (seconds == null || !Number.isFinite(seconds)) return ""
  if (seconds < 60) return `about ${Math.max(1, Math.round(seconds))}s left`
  return `about ${Math.round(seconds / 60)} min left`
}

const PHASES: Record<VideoProgress["phase"], string> = {
  loading: "Starting the background",
  warming: "Skipping ahead",
  rendering: "Rendering",
  finishing: "Finishing the file",
}

function Choice<T extends string | number>({
  title,
  value,
  options,
  onChange,
}: {
  title: string
  value: T
  options: TrackOption<T>[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 py-1">
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-muted-foreground">{title}</span>
      <Track
        label={title}
        value={value}
        options={options}
        onChange={onChange}
        className="h-8 w-fit p-0.5 [&>button]:h-7 [&>span]:top-0.5 [&>span]:bottom-0.5"
      />
    </div>
  )
}

type Result = { url: string; size: number; name: string; blob: Blob }

export function MediaExport({
  kind,
  state,
  stageSize,
  onBusyChange,
}: {
  kind: MediaKind
  state: StudioState
  stageSize: Layout | null
  onBusyChange?: (busy: boolean) => void
}) {
  const { entry, props: renderProps, light } = state
  const video = kind === "video"
  const [image, setImage] = useState<ImageOptions>(() => ({ ...remembered.image }))
  const [clip, setClip] = useState<VideoOptions>(() => ({ ...remembered.video }))
  const [custom, setCustom] = useState<Layout>(() => ({ ...remembered.custom }))
  const [support, setSupport] = useState<Record<VideoFormat, boolean> | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [job, setJob] = useState<VideoProgress | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const jobRef = useRef<AbortController | null>(null)
  const previewRef = useRef<AbortController | null>(null)
  const theme = light ? "light" : "dark"

  useEffect(() => {
    remembered.image = image
    remembered.video = clip
    remembered.custom = custom
  }, [image, clip, custom])

  const setCustomSide = (name: keyof Layout, raw: string) => {
    const value = Number(String(raw).replace(/[^0-9]/g, ""))
    setCustom((previous) => ({ ...previous, [name]: value }))
  }

  const options = video ? clip : image
  const layout = useMemo(() => resolveLayout(options.size, custom, stageSize), [options.size, custom, stageSize])
  const output = useMemo(
    () => fitOutput(layout, options.scale, video ? MAX_VIDEO_SIDE : MAX_IMAGE_SIDE, video ? even : Math.round),
    [layout, options.scale, video],
  )

  const imageFormat = IMAGE_FORMATS.find((item) => item.value === image.format) ?? IMAGE_FORMATS[0]
  const transparent = !video && image.fill === "transparent" && imageFormat.value !== "jpeg"
  const fill = transparent ? null : options.fill === "custom" ? options.color : pageFill(light)

  useEffect(() => {
    if (!video) return
    let alive = true
    videoSupport().then((found) => {
      if (!alive) return
      setSupport(found)
      setClip((previous) => {
        if (found[previous.format] || !(found.mp4 || found.webm)) return previous
        return { ...previous, format: found.mp4 ? "mp4" : "webm" }
      })
    })
    return () => {
      alive = false
    }
  }, [video])

  useEffect(() => {
    onBusyChange?.(Boolean(job))
  }, [job, onBusyChange])

  useEffect(
    () => () => {
      jobRef.current?.abort()
      previewRef.current?.abort()
    },
    [],
  )

  useEffect(() => () => void (result?.url && URL.revokeObjectURL(result.url)), [result])

  const moment = video ? clip.start : image.moment

  // A small preview of the exact frame that will be exported, re-rendered a beat after any change.
  useEffect(() => {
    if (job) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      previewRef.current?.abort()
      previewRef.current = controller
      setPreviewing(true)
      try {
        const ratio = Math.min(PREVIEW_BOX.width / layout.width, PREVIEW_BOX.height / layout.height) * 2
        const canvas = await renderImage({
          entry,
          props: renderProps,
          theme,
          layout,
          output: { width: Math.round(layout.width * ratio), height: Math.round(layout.height * ratio) },
          ratio,
          moment,
          fill,
          signal: controller.signal,
        })
        if (!controller.signal.aborted) setPreview(canvas.toDataURL("image/png"))
      } catch {
        if (!controller.signal.aborted) setPreview(null)
      } finally {
        if (previewRef.current === controller) setPreviewing(false)
      }
    }, 420)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [entry, renderProps, theme, layout, moment, fill, job])

  const exportImage = useCallback(
    async (mode: "copy" | "download") => {
      const controller = new AbortController()
      jobRef.current = controller
      setError(null)
      setJob({ phase: "loading", progress: 0 })
      try {
        const canvas = await renderImage({
          entry,
          props: renderProps,
          theme,
          layout,
          output,
          ratio: output.ratio,
          moment: image.moment,
          fill,
          signal: controller.signal,
        })
        if (mode === "copy") {
          const blob = await canvasToBlob(canvas, "image/png")
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        } else {
          const blob = await canvasToBlob(canvas, imageFormat.mime, 0.92)
          const extension = imageFormat.value === "jpeg" ? "jpg" : imageFormat.value
          downloadBlob(blob, `${entry.id}-${output.width}x${output.height}.${extension}`)
        }
      } catch (problem) {
        if ((problem as Error)?.name !== "AbortError") {
          setError(
            mode === "copy" ? "Copying images is blocked here. Download it instead." : (problem as Error).message,
          )
        }
      } finally {
        jobRef.current = null
        setJob(null)
      }
    },
    [entry, renderProps, theme, layout, output, image.moment, fill, imageFormat],
  )

  const exportVideo = useCallback(async () => {
    const controller = new AbortController()
    jobRef.current = controller
    setError(null)
    setResult(null)
    setJob({ phase: "loading", progress: 0 })
    try {
      const blob = await renderVideo({
        entry,
        props: renderProps,
        theme,
        layout,
        output,
        ratio: output.ratio,
        fps: clip.fps,
        duration: clip.duration,
        start: clip.start,
        loop: clip.loop,
        format: clip.format,
        quality: clip.quality,
        fill,
        signal: controller.signal,
        onProgress: (update) => setJob(update),
      })
      const name = `${entry.id}-${output.width}x${output.height}-${clip.duration}s.${clip.format}`
      downloadBlob(blob, name)
      setResult({ url: URL.createObjectURL(blob), size: blob.size, name, blob })
    } catch (problem) {
      if ((problem as Error)?.name !== "AbortError")
        setError((problem as Error).message || "The video could not be rendered.")
    } finally {
      jobRef.current = null
      setJob(null)
    }
  }, [entry, renderProps, theme, layout, output, clip, fill])

  const cancel = () => jobRef.current?.abort()

  const unsupported = video && support !== null && !support.mp4 && !support.webm
  const videoFormats: TrackOption<VideoFormat>[] = [
    { value: "mp4", label: "MP4", disabled: support ? !support.mp4 : false },
    { value: "webm", label: "WebM", disabled: support ? !support.webm : false },
  ]
  const imageFormats: TrackOption<ImageFormat>[] = IMAGE_FORMATS.map(({ value, label }) => ({ value, label }))

  const estimate = video
    ? estimateVideoBytes({ quality: clip.quality, output, fps: clip.fps, duration: clip.duration, format: clip.format })
    : 0
  const meta = video
    ? `${output.width} × ${output.height} · ${clip.fps} fps · ${clip.duration}s · ${clip.format.toUpperCase()}`
    : `${output.width} × ${output.height} · ${imageFormat.label}`

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_296px]">
      <div className="relative flex min-h-[clamp(260px,52vh,440px)] items-center justify-center overflow-hidden rounded-2xl border bg-background p-4">
        <div
          className={cn(
            "relative grid w-full place-items-center overflow-hidden rounded-lg ring-1 ring-border",
            transparent &&
              "bg-[conic-gradient(var(--accent)_25%,transparent_0_50%,var(--accent)_0_75%,transparent_0)] bg-[length:16px_16px]",
          )}
          style={{
            aspectRatio: `${layout.width} / ${layout.height}`,
            maxWidth: `calc((clamp(260px,52vh,440px) - 2rem) * ${layout.width / layout.height})`,
          }}
        >
          {result?.url ? (
            <video
              src={result.url}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 size-full object-contain"
            />
          ) : preview ? (
            // The preview is a data URL drawn moments ago; next/image has nothing to optimise here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" draggable={false} className="absolute inset-0 size-full object-contain" />
          ) : null}
          {(previewing || !preview) && !job && !result ? <Spinner className="relative" /> : null}
        </div>
        {job ? (
          <div
            role="status"
            className="absolute inset-x-4 bottom-4 grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 rounded-xl border bg-background/85 px-3.5 py-3 text-xs tabular-nums backdrop-blur"
          >
            <span className="font-medium">
              {PHASES[job.phase] ?? "Working"}
              {job.phase === "rendering" && job.frames ? ` ${job.frame} of ${job.frames}` : ""}
            </span>
            <span className="text-right text-muted-foreground">
              {job.phase === "rendering" ? formatSeconds(job.remaining) : ""}
            </span>
            <span className="col-span-2 h-1 overflow-hidden rounded-full bg-accent">
              <i
                className="block h-full origin-left rounded-full bg-foreground transition-transform duration-200 ease-linear"
                style={{
                  transform: `scaleX(${job.phase === "rendering" ? job.progress : job.phase === "finishing" ? 1 : 0.02})`,
                }}
              />
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-0.5 rounded-xl border bg-background/40 p-1.5">
          <Select
            label="Size"
            value={options.size}
            options={SIZE_OPTIONS}
            onChange={(value) => (video ? setClip({ ...clip, size: value }) : setImage({ ...image, size: value }))}
          />
          {options.size === "custom" ? (
            <>
              <TextInput
                label="Width"
                value={String(custom.width || "")}
                onChange={(value) => setCustomSide("width", value)}
              />
              <TextInput
                label="Height"
                value={String(custom.height || "")}
                onChange={(value) => setCustomSide("height", value)}
              />
            </>
          ) : null}
          <Choice
            title="Scale"
            value={options.scale}
            options={[1, 2, 3].map((value) => ({ value, label: `${value}x` }))}
            onChange={(value) => (video ? setClip({ ...clip, scale: value }) : setImage({ ...image, scale: value }))}
          />
          {video ? (
            <>
              <Choice
                title="Format"
                value={clip.format}
                options={videoFormats}
                onChange={(value) => setClip({ ...clip, format: value })}
              />
              <Slider
                label="Length"
                min={2}
                max={60}
                step={1}
                value={clip.duration}
                unit="s"
                onChange={(value) => setClip({ ...clip, duration: value })}
              />
              <Choice
                title="Frame rate"
                value={clip.fps}
                options={RATES}
                onChange={(value) => setClip({ ...clip, fps: value })}
              />
              <Choice
                title="Quality"
                value={clip.quality}
                options={QUALITIES}
                onChange={(value) => setClip({ ...clip, quality: value })}
              />
              <Slider
                label="Start at"
                min={0}
                max={20}
                step={0.5}
                value={clip.start}
                unit="s"
                onChange={(value) => setClip({ ...clip, start: value })}
              />
              <Switch
                label="Seamless loop"
                checked={clip.loop}
                onChange={(value) => setClip({ ...clip, loop: value })}
              />
            </>
          ) : (
            <>
              <Choice
                title="Format"
                value={image.format}
                options={imageFormats}
                onChange={(value) => setImage({ ...image, format: value })}
              />
              <Choice
                title="Background"
                value={imageFormat.value === "jpeg" && image.fill === "transparent" ? "page" : image.fill}
                options={FILLS.map((item) => ({
                  ...item,
                  disabled: item.value === "transparent" && imageFormat.value === "jpeg",
                }))}
                onChange={(value) => setImage({ ...image, fill: value })}
              />
              {image.fill === "custom" ? (
                <ColorPicker
                  label="Color"
                  value={image.color}
                  onChange={(value) => setImage({ ...image, color: value })}
                />
              ) : null}
              <Slider
                label="Capture at"
                min={0}
                max={20}
                step={0.1}
                value={image.moment}
                unit="s"
                onChange={(value) => setImage({ ...image, moment: value })}
              />
            </>
          )}
        </div>

        {error ? <p className="px-1 text-xs leading-relaxed text-destructive">{error}</p> : null}
        {unsupported ? (
          <p className="px-1 text-xs leading-relaxed text-destructive">
            Video export needs a recent Chrome, Edge, Safari or Firefox.
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2.5">
          <p className="px-1 text-xs text-muted-foreground tabular-nums">
            {meta}
            {result ? ` · ${formatBytes(result.size)}` : video ? ` · about ${formatBytes(estimate)}` : ""}
          </p>
          <div className="flex gap-2">
            {job ? (
              <button type="button" className={cn(toolClass, "h-10 flex-1")} onClick={cancel}>
                Cancel
              </button>
            ) : video ? (
              <>
                {result ? (
                  <button
                    type="button"
                    aria-label="Save again"
                    title="Save again"
                    className={cn(toolClass, "h-10 w-10 px-0")}
                    onClick={() => downloadBlob(result.blob, result.name)}
                  >
                    <Download aria-hidden />
                  </button>
                ) : null}
                <button
                  type="button"
                  className={cn(brandButtonClass, "h-10 flex-1")}
                  onClick={exportVideo}
                  disabled={unsupported}
                >
                  <Video aria-hidden />
                  Render video
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Copy image"
                  title="Copy image"
                  className={cn(toolClass, "h-10 w-10 px-0")}
                  onClick={() => exportImage("copy")}
                >
                  <Copy aria-hidden />
                </button>
                <button
                  type="button"
                  className={cn(brandButtonClass, "h-10 flex-1")}
                  onClick={() => exportImage("download")}
                >
                  <Download aria-hidden />
                  Download
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

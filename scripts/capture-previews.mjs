#!/usr/bin/env node
/*
 * Films every catalog item for its card on /docs/components: a poster and a hover clip, dark and light.
 *
 *   npm run dev                                   # or: npm run build && npx next start
 *   node scripts/capture-previews.mjs             # every item in registry.json
 *   node scripts/capture-previews.mjs dot-grid tabs
 *   THEMES=dark BASE=http://localhost:3001 node scripts/capture-previews.mjs ...
 *
 * Writes public/previews/<name>-<theme>.webp (poster), .webm (VP9) and .mp4 (H.264).
 * Each item is filmed from /preview/<name>, framed as lib/preview-framing.ts describes, at 960 × 540 layout
 * pixels and two-thirds device scale, so every file is 640 × 360. What the clip does (replay an entrance,
 * sweep the pointer, scroll the demo's box) is the item's recipe below; a new item films with the default.
 *
 * Needs `playwright-core` (a dev dependency), a Chromium it can find (the cached Playwright build, or
 * CHROME=/path/to/chrome) and an ffmpeg with libwebp, libvpx-vp9 and libx264 on the PATH.
 */
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright-core"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const OUT = path.join(ROOT, "public", "previews")
const BASE = process.env.BASE || "http://localhost:3000"
const THEMES = (process.env.THEMES || "dark,light").split(",")
const VIEWPORT = { width: 960, height: 540 }
const SCALE = 2 / 3
const FPS = 30
const CLIP_SECONDS = 4

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ---------------------------------------------------------------- what each clip does

/** Sweeps the pointer across the frame on a slow figure of eight. */
async function sweep(page, ms, { x = 480, y = 270, rx = 330, ry = 150 } = {}) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    const t = (Date.now() - start) / 1000
    await page.mouse.move(x + rx * Math.sin(t * 2.2), y + ry * Math.sin(t * 3.1))
    await sleep(16)
  }
}

const replay = (page) => page.evaluate(() => window.__mewoPreview?.replay())

/** Scrolls the demo's own scroll box to `fraction` of its range. */
const scrollTo = (page, fraction) =>
  page.evaluate((fraction) => {
    const box = window.__mewoPreview?.scroller()
    if (box) box.scrollTop = fraction * (box.scrollHeight - box.clientHeight)
  }, fraction)

/** Scrolls the demo's box from one fraction of its range to another over `ms`, eased. */
const scrollSweep = (page, from, to, ms) =>
  page.evaluate(
    ({ from, to, ms }) =>
      new Promise((resolve) => {
        const box = window.__mewoPreview?.scroller()
        if (!box) return resolve()
        const range = box.scrollHeight - box.clientHeight
        const start = performance.now()
        const step = (now) => {
          const t = Math.min(1, (now - start) / ms)
          const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
          box.scrollTop = (from + (to - from) * eased) * range
          if (t < 1) requestAnimationFrame(step)
          else resolve()
        }
        requestAnimationFrame(step)
      }),
    { from, to, ms }
  )

/** Scrolls so the first `selector` element's top sits `at` of the way down the box. */
const scrollElementTo = (page, selector, at) =>
  page.evaluate(
    ({ selector, at }) => {
      const box = window.__mewoPreview?.scroller()
      const element = box?.querySelector(selector)
      if (!box || !element) return
      // Under CSS zoom, rectangles are in screen pixels and scrollTop in the box's own; convert to the box's.
      const zoom = box.getBoundingClientRect().height / box.offsetHeight || 1
      const top = (element.getBoundingClientRect().top - box.getBoundingClientRect().top) / zoom + box.scrollTop
      box.scrollTop = top - at * box.clientHeight
    },
    { selector, at }
  )

/** The scroll-mask demo stacks six variants, each two box-heights tall; this is the iris, the first. */
const irisAt = (page, progress) =>
  page.evaluate((progress) => {
    const box = window.__mewoPreview?.scroller()
    if (box) box.scrollTop = progress * box.clientHeight
  }, progress)

const RECIPES = {
  "split-text": { clip: (page) => replay(page) },
  "scroll-reveal": { clip: (page) => replay(page) },
  "hero-aurora": { clip: (page) => replay(page) },
  "features-spotlight": {
    clip: async (page) => {
      await replay(page)
      await sleep(900)
      await sweep(page, 2800, { y: 300, ry: 60 })
    },
  },
  "spotlight-card": {
    poster: (page) => page.mouse.move(400, 250),
    clip: (page) => sweep(page, CLIP_SECONDS * 1000 - 200, { rx: 220, ry: 90 }),
  },
  // Tendrils only reach out for a pointer near the word: the poster catches them closing on one.
  venom: {
    poster: async (page) => {
      await page.mouse.move(700, 110)
      await sleep(1600)
    },
    clip: (page) => sweep(page, CLIP_SECONDS * 1000 - 200, { rx: 380, ry: 190 }),
  },
  "pattern-waves": { settle: 3000, clip: (page) => sweep(page, CLIP_SECONDS * 1000 - 200) },
  grainient: {
    clip: async (page) => {
      await sweep(page, 2200)
      await page.mouse.down()
      await page.mouse.up()
      await sweep(page, 1500)
    },
  },
  "dot-grid": {
    settle: 2500,
    poster: async (page) => {
      await page.mouse.move(480, 270)
      await page.mouse.down()
      await page.mouse.up()
      await sleep(320)
    },
    clip: async (page) => {
      await sweep(page, 1800)
      await page.mouse.move(480, 270)
      await page.mouse.down()
      await page.mouse.up()
      await sweep(page, 1800, { rx: 200, ry: 100 })
    },
  },
  "gradient-carousel": {
    settle: 4000,
    clip: async (page) => {
      await sleep(400)
      await page.mouse.move(640, 270)
      await page.mouse.down()
      for (let i = 1; i <= 12; i++) {
        await page.mouse.move(640 - i * 28, 270)
        await sleep(16)
      }
      await page.mouse.up()
      await sleep(2600)
    },
  },
  tabs: {
    clip: async (page) => {
      for (const name of ["Password", "Team", "Activity", "Account", "Overview"]) {
        await sleep(560)
        await page.getByRole("tab", { name }).click()
      }
    },
  },
  collapsible: {
    poster: async (page) => {
      await page.getByRole("button").first().click()
      await sleep(700)
    },
    clip: async (page) => {
      await sleep(600)
      await page.getByRole("button").first().click()
      await sleep(1400)
      await page.getByRole("button").first().click()
    },
  },
  "scroll-mask": {
    poster: async (page) => {
      await irisAt(page, 0.44)
      await sleep(1200)
    },
    clip: async (page) => {
      await irisAt(page, 0)
      await sleep(500)
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            const box = window.__mewoPreview?.scroller()
            if (!box) return resolve()
            const start = performance.now()
            const step = (now) => {
              const t = Math.min(1, (now - start) / 2800)
              box.scrollTop = t * t * (3 - 2 * t) * box.clientHeight
              if (t < 1) requestAnimationFrame(step)
              else resolve()
            }
            requestAnimationFrame(step)
          })
      )
    },
  },
  "scroll-portal": {
    poster: async (page) => {
      await scrollTo(page, 0.42)
      await sleep(1400)
    },
    clip: async (page) => {
      await scrollTo(page, 0)
      await sleep(400)
      await scrollSweep(page, 0, 0.75, 3200)
    },
  },
  "tile-reveal": {
    poster: async (page) => {
      await scrollTo(page, 0.38)
      await sleep(1200)
    },
    clip: async (page) => {
      await scrollTo(page, 0)
      await sleep(300)
      await scrollSweep(page, 0, 0.92, 3400)
    },
  },
  "text-scroll-highlight": {
    poster: async (page) => {
      await scrollElementTo(page, '[data-slot="text-scroll-highlight"]', 0.42)
      await sleep(1200)
    },
    clip: async (page) => {
      await scrollElementTo(page, '[data-slot="text-scroll-highlight"]', 0.95)
      await sleep(300)
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            const box = window.__mewoPreview?.scroller()
            if (!box) return resolve()
            const from = box.scrollTop
            const distance = box.clientHeight * 0.7
            const start = performance.now()
            const step = (now) => {
              const t = Math.min(1, (now - start) / 3000)
              box.scrollTop = from + distance * t
              if (t < 1) requestAnimationFrame(step)
              else resolve()
            }
            requestAnimationFrame(step)
          })
      )
    },
  },
}

// ---------------------------------------------------------------- filming

function cachedChromium() {
  const root = path.join(os.homedir(), ".cache/ms-playwright")
  if (!fs.existsSync(root)) return undefined
  const dirs = fs
    .readdirSync(root)
    .filter((dir) => /^chromium-\d+$/.test(dir))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
  for (const dir of dirs) {
    for (const candidate of ["chrome-linux64/chrome", "chrome-linux/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium"]) {
      const file = path.join(root, dir, candidate)
      if (fs.existsSync(file)) return file
    }
  }
  return undefined
}

async function launch() {
  const args = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--hide-scrollbars"]
  try {
    return await chromium.launch({ headless: true, args, executablePath: process.env.CHROME })
  } catch (error) {
    const fallback = cachedChromium()
    if (!fallback) throw error
    return chromium.launch({ headless: true, args, executablePath: fallback })
  }
}

function ffmpeg(args) {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { encoding: "utf8" })
  if (result.status !== 0) throw new Error(`ffmpeg ${args.join(" ")}\n${result.stderr}`)
}

/** Runs `actions` for `seconds` while Chrome streams frames, then resamples them to a steady FPS. */
async function record(page, cdp, seconds, actions) {
  const frames = []
  const onFrame = ({ data, metadata, sessionId }) => {
    frames.push({ data: Buffer.from(data, "base64"), time: metadata.timestamp })
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {})
  }
  // The screencast only sends a frame when something changes, so the opening frame is taken by hand.
  const first = await page.screenshot({ type: "jpeg", quality: 92 })
  const start = Date.now() / 1000
  frames.push({ data: first, time: start })
  cdp.on("Page.screencastFrame", onFrame)
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1 })
  await Promise.race([actions().catch(() => {}), sleep(seconds * 1000)])
  const elapsed = Date.now() / 1000 - start
  if (elapsed < seconds) await sleep((seconds - elapsed) * 1000)
  await cdp.send("Page.stopScreencast")
  cdp.off("Page.screencastFrame", onFrame)

  const timeline = []
  let index = 0
  for (let i = 0; i < seconds * FPS; i++) {
    const at = start + i / FPS
    while (index + 1 < frames.length && frames[index + 1].time <= at) index++
    timeline.push(frames[index].data)
  }
  return timeline
}

async function film(browser, item, theme) {
  const recipe = RECIPES[item.name] ?? {}
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    colorScheme: theme,
    reducedMotion: "no-preference",
  })
  await context.addInitScript((theme) => {
    try {
      localStorage.setItem("theme", theme)
    } catch {}
    // The development overlay is not part of any component.
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "nextjs-portal{display:none!important}"
      document.head.append(style)
    })
  }, theme)
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  try {
    await page.goto(`${BASE}/preview/${item.name}`, { waitUntil: "load", timeout: 90000 })
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
    await page.evaluate(async () => {
      const stage = document.querySelector("[data-preview-stage]")
      const zoom = stage?.getAttribute("data-capture-zoom")
      if (stage && zoom) stage.style.zoom = zoom
      await document.fonts.ready
    })
    await page.mouse.move(2, 2)
    await sleep(recipe.settle ?? 2200)
    if (recipe.poster) await recipe.poster(page)

    const stem = path.join(OUT, `${item.name}-${theme}`)
    const png = await page.screenshot({ type: "png" })
    const posterSource = `${stem}.poster.png`
    fs.writeFileSync(posterSource, png)
    ffmpeg(["-i", posterSource, "-c:v", "libwebp", "-quality", "82", "-compression_level", "6", `${stem}.webp`])
    fs.rmSync(posterSource)

    const frames = await record(page, cdp, recipe.seconds ?? CLIP_SECONDS, () => (recipe.clip ?? (() => sleep(CLIP_SECONDS * 1000)))(page))
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `mewo-${item.name}-`))
    frames.forEach((data, i) => fs.writeFileSync(path.join(dir, `f${String(i).padStart(4, "0")}.jpg`), data))
    const input = ["-framerate", String(FPS), "-i", path.join(dir, "f%04d.jpg")]
    const even = ["-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-pix_fmt", "yuv420p", "-an"]
    ffmpeg([...input, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "38", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", ...even, `${stem}.webm`])
    // The MP4 is the fallback for browsers without VP9; a ceiling keeps grain and noise from bloating it.
    ffmpeg([...input, "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-maxrate", "1200k", "-bufsize", "2400k", "-movflags", "+faststart", ...even, `${stem}.mp4`])
    fs.rmSync(dir, { recursive: true, force: true })
  } finally {
    await context.close()
  }
}

;(async () => {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "registry.json"), "utf8"))
  const names = process.argv.slice(2)
  const items = registry.items.filter((item) => names.length === 0 || names.includes(item.name))
  if (items.length === 0) {
    console.error(`No items match: ${names.join(", ")}`)
    process.exit(1)
  }
  if (spawnSync("ffmpeg", ["-version"]).status !== 0) {
    console.error("ffmpeg is not on the PATH")
    process.exit(1)
  }
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await launch()
  for (const item of items) {
    for (const theme of THEMES) {
      const started = Date.now()
      try {
        await film(browser, item, theme)
        const size = ["webp", "webm", "mp4"].map((ext) => {
          const file = path.join(OUT, `${item.name}-${theme}.${ext}`)
          return `${ext} ${Math.round(fs.statSync(file).size / 1024)}KB`
        })
        console.log(`${item.name.padEnd(22)} ${theme.padEnd(5)} ${size.join("  ")}  (${((Date.now() - started) / 1000).toFixed(1)}s)`)
      } catch (error) {
        console.log(`${item.name.padEnd(22)} ${theme.padEnd(5)} FAILED ${error.message.split("\n")[0]}`)
      }
    }
  }
  await browser.close()
})().catch((error) => {
  console.error(error)
  process.exit(1)
})

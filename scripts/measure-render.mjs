#!/usr/bin/env node
/*
 * Measures what a mewo item costs at runtime, in a real (headless) Chromium.
 *
 *   npm run dev                              # in another terminal, port 3000
 *   node scripts/measure-render.mjs          # every item in registry.json
 *   node scripts/measure-render.mjs aurora-background scroll-mask
 *   BASE=http://localhost:3001 GPU=1 node scripts/measure-render.mjs ...
 *
 * For each item it opens the docs preview (or the full-page preview for a section) and reports:
 *   canvas     canvases the item created and the contexts it asked for
 *   nodes      DOM nodes inside the preview
 *   raf idle   requestAnimationFrame callbacks per second with nothing happening
 *   raf hover  the same while the pointer moves over the preview
 *   raf away   the same after the preview is scrolled out of view
 *   cpu idle   JavaScript CPU seconds per second while idle (from Chrome's TaskDuration)
 *   layout/s   layouts and style recalcs per second while idle; a steady stream means per-frame DOM writes
 *
 * CSS animations do not show up in `raf` or `layout`. A continuously repainting CSS effect (an animated
 * background-position, an animated filter) has to be judged by reading the code; see the skill's checklist.
 *
 * Needs `playwright-core` (a dev dependency) and a Chromium it can find: the cached Playwright build that
 * matches the installed version, or CHROME=/path/to/chrome.
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright-core"

const ROOT = fileURLToPath(new URL("..", import.meta.url))

const BASE = process.env.BASE || "http://localhost:3000"
const GPU = process.env.GPU === "1"
const names = process.argv.slice(2)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const HOOK = `
  window.__ctx = []
  const orig = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const ctx = orig.call(this, type, ...rest)
    if (!this.__seen) { this.__seen = true; window.__ctx.push(type) }
    return ctx
  }
  window.__raf = 0
  const oraf = window.requestAnimationFrame
  window.requestAnimationFrame = (cb) => { window.__raf++; return oraf.call(window, cb) }
`

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
  const args = GPU
    ? ["--use-gl=angle", "--use-angle=vulkan", "--ignore-gpu-blocklist"]
    : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
  const executablePath = process.env.CHROME
  try {
    return await chromium.launch({ headless: true, args, executablePath })
  } catch (error) {
    const fallback = cachedChromium()
    if (!fallback) throw error
    return chromium.launch({ headless: true, args, executablePath: fallback })
  }
}

const metric = (list, name) => list.metrics.find((entry) => entry.name === name)?.value ?? 0

async function sampleRaf(page, ms) {
  const before = await page.evaluate(() => window.__raf)
  await sleep(ms)
  const after = await page.evaluate(() => window.__raf)
  return Math.round(((after - before) * 1000) / ms)
}

async function sampleCpu(cdp, ms) {
  const before = await cdp.send("Performance.getMetrics")
  await sleep(ms)
  const after = await cdp.send("Performance.getMetrics")
  const seconds = ms / 1000
  return {
    cpu: (metric(after, "TaskDuration") - metric(before, "TaskDuration")) / seconds,
    layouts: Math.round((metric(after, "LayoutCount") - metric(before, "LayoutCount")) / seconds),
    styles: Math.round((metric(after, "RecalcStyleCount") - metric(before, "RecalcStyleCount")) / seconds),
  }
}

async function measure(page, cdp, name, isBlock) {
  const url = isBlock ? `${BASE}/preview/${name}` : `${BASE}/docs/${name}`
  await page.goto(url, { waitUntil: "load", timeout: 60000 })
  await sleep(3000)

  const preview = await page.evaluate((block) => {
    const stage = block ? document.body : document.querySelector('[data-slot="tabs-content"] > div') || document.body
    const rect = stage.getBoundingClientRect()
    return {
      nodes: stage.querySelectorAll("*").length,
      canvases: stage.querySelectorAll("canvas").length,
      contexts: window.__ctx.join("+") || "-",
      box: { x: rect.left, y: rect.top + window.scrollY, width: rect.width, height: rect.height },
    }
  }, isBlock)

  await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 80)), preview.box.y)
  await sleep(800)
  const idleRaf = await sampleRaf(page, 2000)
  const idle = await sampleCpu(cdp, 3000)

  // Hover: sweep the pointer across the preview.
  const cx = preview.box.x + preview.box.width / 2
  const cy = Math.min(900, preview.box.height / 2 + 80)
  const hoverStart = await page.evaluate(() => window.__raf)
  const hoverT0 = Date.now()
  while (Date.now() - hoverT0 < 2000) {
    const t = (Date.now() - hoverT0) / 2000
    await page.mouse.move(cx + Math.cos(t * Math.PI * 4) * preview.box.width * 0.35, cy + Math.sin(t * Math.PI * 6) * 120)
    await sleep(16)
  }
  const hoverRaf = Math.round(((await page.evaluate(() => window.__raf)) - hoverStart) / 2)
  await page.mouse.move(5, 5)

  // Away: scroll the preview out of view entirely.
  await page.evaluate((y) => window.scrollTo(0, y + 4000), preview.box.y)
  await sleep(1200)
  const awayRaf = await sampleRaf(page, 2000)
  const away = await sampleCpu(cdp, 2000)

  return { name, ...preview, idleRaf, hoverRaf, awayRaf, idleCpu: idle.cpu, awayCpu: away.cpu, layouts: idle.layouts, styles: idle.styles }
}

;(async () => {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "registry.json"), "utf8"))
  const items = registry.items.filter((item) => names.length === 0 || names.includes(item.name))
  if (items.length === 0) {
    console.error(`No items match: ${names.join(", ")}`)
    process.exit(1)
  }
  const browser = await launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "dark" })
  await context.addInitScript(HOOK)
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send("Performance.enable")
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))

  const rows = []
  for (const item of items) {
    try {
      rows.push(await measure(page, cdp, item.name, item.type === "registry:block"))
    } catch (error) {
      rows.push({ name: item.name, error: error.message.slice(0, 80) })
    }
  }
  await browser.close()

  const pad = (value, width, right = false) => (right ? String(value).padStart(width) : String(value).padEnd(width))
  console.log(
    [pad("item", 24), pad("canvas", 18), pad("nodes", 6, true), pad("raf idle", 9, true), pad("raf hover", 10, true), pad("raf away", 9, true), pad("cpu idle", 9, true), pad("cpu away", 9, true), pad("layout/s", 9, true), pad("style/s", 8, true)].join(" ")
  )
  for (const row of rows) {
    if (row.error) {
      console.log(`${pad(row.name, 24)} ERROR ${row.error}`)
      continue
    }
    console.log(
      [
        pad(row.name, 24),
        pad(`${row.canvases}×(${row.contexts})`, 18),
        pad(row.nodes, 6, true),
        pad(row.idleRaf, 9, true),
        pad(row.hoverRaf, 10, true),
        pad(row.awayRaf, 9, true),
        pad(row.idleCpu.toFixed(3), 9, true),
        pad(row.awayCpu.toFixed(3), 9, true),
        pad(row.layouts, 9, true),
        pad(row.styles, 8, true),
      ].join(" ")
    )
  }
  if (errors.length) console.log(`\nPage errors:\n${[...new Set(errors)].join("\n")}`)
  console.log("\nraf = requestAnimationFrame callbacks per second; cpu = JavaScript seconds per second (0.05 = 5% of a core).")
  console.log("A canvas item should show raf away = 0 and cpu away ≈ 0. CSS animations do not register here; judge those by reading the code.")
})().catch((error) => {
  console.error(error)
  process.exit(1)
})

#!/usr/bin/env node
/*
 * Measures what a mewo item costs at runtime, in a real (headless) Chromium.
 *
 *   npm run dev                              # in another terminal, port 3000
 *   node scripts/measure-render.mjs          # every item in registry.json
 *   node scripts/measure-render.mjs aurora-background scroll-mask
 *   BASE=http://localhost:3001 GPU=1 JSON=out.json node scripts/measure-render.mjs ...
 *
 * For each item it opens the docs preview (or the full-page preview for a section) and reports:
 *   canvas       canvases the item created and the contexts it asked for
 *   raf          requestAnimationFrame callbacks per second: idle, under a moving pointer, scrolled away
 *   paint        main-thread Paint events per second, from a performance trace: idle, scrolled away,
 *                and while the item's scroll container is scrolled through. A CSS animation that is not
 *                composited shows up here and in style, and nowhere else.
 *   cpu          main-thread seconds per second (0.05 = 5% of a core): idle, scrolled away
 *   style        style recalculations per second: idle, and while scrolling
 *
 * Needs `playwright-core` (a dev dependency) and a Chromium it can find: the cached Playwright build that
 * matches the installed version, or CHROME=/path/to/chrome. GPU=1 renders WebGL on the machine's GPU
 * through ANGLE Vulkan instead of SwiftShader.
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

/** Samples everything over `ms`, optionally while `during` runs. Paints are counted from a trace. */
async function sample(page, cdp, browser, ms, during) {
  await browser.startTracing(page, { categories: ["devtools.timeline"] })
  const before = await cdp.send("Performance.getMetrics")
  const raf0 = await page.evaluate(() => window.__raf)
  await (during ? during() : sleep(ms))
  const after = await cdp.send("Performance.getMetrics")
  const raf1 = await page.evaluate(() => window.__raf)
  const trace = JSON.parse((await browser.stopTracing()).toString("utf8"))
  const paints = (trace.traceEvents ?? trace).filter((event) => event.name === "Paint").length
  const seconds = ms / 1000
  return {
    raf: Math.round((raf1 - raf0) / seconds),
    paint: Math.round(paints / seconds),
    cpu: (metric(after, "TaskDuration") - metric(before, "TaskDuration")) / seconds,
    style: Math.round((metric(after, "RecalcStyleCount") - metric(before, "RecalcStyleCount")) / seconds),
    layout: Math.round((metric(after, "LayoutCount") - metric(before, "LayoutCount")) / seconds),
  }
}

async function measure(page, cdp, browser, item) {
  const isBlock = item.type === "registry:block"
  const url = isBlock ? `${BASE}/preview/${item.name}` : `${BASE}/docs/${item.name}`
  await page.goto(url, { waitUntil: "load", timeout: 60000 })
  await sleep(3000)

  const preview = await page.evaluate((block) => {
    const stage = block ? document.body : document.querySelector('[data-slot="tabs-content"] > div') || document.body
    const rect = stage.getBoundingClientRect()
    // The scroll-driven demos scroll inside a box of their own; mark it so the scroll phase can find it.
    const scroller = [...stage.querySelectorAll("*")].find((el) => {
      const { overflowY } = getComputedStyle(el)
      return (overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight + 40
    })
    if (scroller) scroller.setAttribute("data-measure-scroller", "")
    return {
      nodes: stage.querySelectorAll("*").length,
      canvases: stage.querySelectorAll("canvas").length,
      contexts: window.__ctx.join("+") || "-",
      scroller: Boolean(scroller),
      box: { x: rect.left, y: rect.top + window.scrollY, width: rect.width, height: rect.height },
    }
  }, isBlock)

  await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 80)), preview.box.y)
  await sleep(1000)
  const idle = await sample(page, cdp, browser, 3000)

  // Hover: sweep the pointer across the preview.
  const cx = preview.box.x + preview.box.width / 2
  const cy = Math.min(800, preview.box.height / 2 + 80)
  const hover = await sample(page, cdp, browser, 2000, async () => {
    const t0 = Date.now()
    while (Date.now() - t0 < 2000) {
      const t = (Date.now() - t0) / 2000
      await page.mouse.move(cx + Math.cos(t * Math.PI * 4) * preview.box.width * 0.35, cy + Math.sin(t * Math.PI * 6) * 120)
      await sleep(16)
    }
  })
  await page.mouse.move(5, 5)

  // Scroll: run the item's own scroll container top to bottom, or the page across the preview.
  const scroll = await sample(page, cdp, browser, 3000, () =>
    page.evaluate(
      ({ ms, box }) =>
        new Promise((resolve) => {
          const el = document.querySelector("[data-measure-scroller]")
          const t0 = performance.now()
          const from = el ? 0 : Math.max(0, box.y - 200)
          const span = el ? el.scrollHeight - el.clientHeight : box.height + 400
          const step = (now) => {
            const t = Math.min(1, (now - t0) / ms)
            const y = from + span * t
            if (el) el.scrollTop = y
            else window.scrollTo(0, y)
            if (t < 1) requestAnimationFrame(step)
            else resolve()
          }
          requestAnimationFrame(step)
        }),
      { ms: 3000, box: preview.box }
    )
  )

  // Away: scroll the preview out of view entirely.
  await page.evaluate((y) => window.scrollTo(0, y + 4000), preview.box.y)
  await sleep(1500)
  const away = await sample(page, cdp, browser, 2500)

  return { name: item.name, ...preview, idle, hover, scroll, away }
}

const pad = (value, width, right = true) => (right ? String(value).padStart(width) : String(value).padEnd(width))

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
      rows.push(await measure(page, cdp, browser, item))
    } catch (error) {
      rows.push({ name: item.name, error: error.message.slice(0, 100) })
    }
  }
  await browser.close()

  if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify(rows, null, 2))

  console.log(
    [
      pad("item", 22, false),
      pad("canvas", 16, false),
      pad("raf idle/hover/away", 20),
      pad("paint idle/away", 16),
      pad("paint scroll", 13),
      pad("cpu idle/away", 14),
      pad("style idle/scroll", 18),
    ].join(" ")
  )
  for (const row of rows) {
    if (row.error) {
      console.log(`${pad(row.name, 22, false)} ERROR ${row.error}`)
      continue
    }
    console.log(
      [
        pad(row.name, 22, false),
        pad(`${row.canvases}×${row.contexts}`.slice(0, 16), 16, false),
        pad(`${row.idle.raf}/${row.hover.raf}/${row.away.raf}`, 20),
        pad(`${row.idle.paint}/${row.away.paint}`, 16),
        pad(row.scroll.paint, 13),
        pad(`${row.idle.cpu.toFixed(3)}/${row.away.cpu.toFixed(3)}`, 14),
        pad(`${row.idle.style}/${row.scroll.style}`, 18),
      ].join(" ")
    )
  }
  if (errors.length) console.log(`\nPage errors:\n${[...new Set(errors)].join("\n")}`)
  console.log("\nPer second. A component at rest should show raf, paint and style at 0 when idle and when away.")
  console.log("paint scroll counts repaints while the demo's scroll container (or the page) scrolls through it.")
})().catch((error) => {
  console.error(error)
  process.exit(1)
})

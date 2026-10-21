# mewo — Background Studio and three WebGL backgrounds

**Date:** 2026-10-21
**Status:** built in one pass from the request; the calls below were made without a review round
**Author:** xmustafa5
**Follows:** `docs/superpowers/specs/2026-09-17-mewo-ui-v0.2-design.md`

## 1. What this is

A port of React Bits' Background Studio into mewo, plus the three backgrounds that prove it works:
`pattern-waves` (WebGL 2 through `ogl`), `grainient` (raw WebGL 2) and `dot-grid` (raw WebGL 2, instanced).
The user asked for "the same React Bits background studio in mewo", a Markdown write-up of why those
backgrounds are fast, and three backgrounds to test it with.

## 2. Goals, non-goals

**Goals.** Same feature set as the original: a searchable list, live controls built from a prop schema,
presets, undo/redo, the URL as the document, sample content over the preview, pause/replay/snapshot/fullscreen,
and export as code, image or video. Same performance architecture: the background runs in an iframe on a
clock the studio owns. Everything inside mewo's registry rules (one file per item, import allowlist, demo and
test per item, `"use client"` first).

**Non-goals.** Thumbnails rendered ahead of time (the list uses colour swatches instead); the "copy for AI"
menu; code highlighting in the export dialog (plain `<pre>`); backgrounds that depend on `three`.

## 3. Calls made on the user's behalf

- **Which three.** Pattern Waves (the flagship, every control type, `ogl`), Grainient (a `colorArray` prop,
  raw WebGL, the component whose perf history prompted the question) and Dot Grid (instanced rendering, a
  spring simulation, raw WebGL). All three in their TypeScript + Tailwind form from React Bits.
- **`ogl` joins the shipped-file allowlist.** It is small, typed, and the only way to ship Pattern Waves.
  `three` stays banned.
- **`mediabunny` is a site dependency** for video export. It is loaded on demand inside the export dialog and
  never ships to consumers.
- **Routes.** `/studio` (under `app/studio/(tool)/`, header but no footer, fills the viewport) and
  `/studio/frame` (bare, `noindex`). The frame uses the site's root layout rather than a second root layout,
  which would have forced the home route into a route group.
- **URL writes use `window.history.replaceState`**, which Next's router integrates with, rather than
  `router.replace`, which would re-render the server tree on every slider tick.
- **Lint.** The project's React lint rules (compiler-backed `react-hooks/*`) forbid ref reads and writes in
  render and synchronous `setState` in effects. The ported components sync props into their ref in an effect;
  the studio keeps frame state in a small external store read through `useSyncExternalStore`.
- **Docs.** `docs/background-studio.md` is the write-up the user asked for. The README's table and a short
  section link to it. The docs site gets no new page: the three backgrounds have ordinary item pages.
- **Theme.** The frame toggles its own `dark` class; the snapshot's page fill is read from the live page
  colour so it matches the site's own tokens.

## 4. What is left to the builder

Nothing; it is built. Open questions for the owner:

- Whether to list the three backgrounds in the home-page gallery (deliberately not done: three WebGL contexts
  on the landing page).
- Whether prerendered thumbnails are worth a build step.

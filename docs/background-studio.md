# Backgrounds and the Background Studio

mewo ships animated backgrounds (`pattern-waves`, `grainient`, `dot-grid`, with more to come) and a tool that
tunes them live: [mewo-ui.com/studio](https://www.mewo-ui.com/studio). This document covers three things:

1. Why a mewo background costs almost nothing when it is not changing.
2. How the studio runs a background without the editor paying for it, and how export works.
3. What to do to add a background to the registry and to the studio.

The design is ported from React Bits' Background Studio. The ideas are theirs; the code here is mewo's,
in TypeScript, on Next.js, inside the registry's rules.

## 1. Why the backgrounds are fast

Every background follows the same six rules. Read `registry/mewo/ui/pattern-waves.tsx` with this list next
to it and you will find each one.

**The GPU draws the pixels, not the DOM.** A background is one `<canvas>` and a fragment shader. There are no
per-dot elements, no SVG nodes, and React never re-renders per frame. Pattern Waves evaluates its noise once
per grid cell into a tiny texture, then a second pass reads that texture to draw the marks, so the expensive
maths runs per cell rather than per screen pixel. Dot Grid draws every dot in one instanced draw call.

**The WebGL context is created once.** The setup effect has an empty dependency list. Props flow into a ref
(`settingsRef`) that the frame loop reads; a prop change updates the ref and wakes the loop. Tearing the
pipeline down for a colour tweak is the single most common way to make a background slow, which is why
every file carries a comment at the ref saying so.

**The loop stops when nothing moves.** The last line of each `frame()` only schedules another frame when
something is animating: the surface is moving, an intro is playing, a pointer effect is live, or a prop just
changed. A background with `speed={0}` renders exactly once and then costs nothing.

**It stops when it cannot be seen.** An `IntersectionObserver` turns the loop off when the element scrolls
out of view and a `visibilitychange` listener resumes it when the tab comes back. A background below the
fold is free.

**There is a pixel budget.** The device pixel ratio is capped, and in Pattern Waves it is also lowered until
the canvas stays under about 4.5 million fragments, so a 5K display pays about what a laptop does. The
ripple simulation runs at one eighth of the canvas size.

**It leaves the way it came.** Teardown deletes every framebuffer and texture, calls
`WEBGL_lose_context.loseContext()` and removes the canvas. Browsers allow only a handful of live contexts per
page; a background that leaks one on every route change eventually blacks out the whole site.

Two smaller habits matter too. The time step is clamped (`dt` between 1/240 s and 50 ms) so a tab switch does
not jump the animation, and `prefers-reduced-motion` freezes anything that moves on its own while keeping the
first frame.

### Checklist for a new background

- `"use client"` is the first line; the file imports only from `react`, `@/lib/utils` and its one rendering
  dependency, if any (`ogl` is allowed; `three` is not, it is too heavy to copy into a project).
- One `useEffect(() => { ... }, [])` owns the context. Props reach it through a ref that is written in an
  effect, never during render: the project's React lint rules reject reading or writing refs in render.
- Create the `<canvas>` inside the setup effect and remove it in the cleanup, rather than rendering it in JSX.
  React Strict Mode runs effects twice in development; a context lost by the first cleanup would be handed
  straight back by `getContext()` on the second run, and the background would show a blank white box in
  every `next dev` session. A fresh element gets a fresh context.
- Probe for a context before handing the canvas to a library that throws without one. jsdom has no WebGL and
  the tests render every component there.
- The root element accepts `className`, merges it with `cn(...)`, spreads the rest of its props, carries a
  `data-slot`, and fills its parent (`relative h-full w-full overflow-hidden`). The consumer gives it a size.
- Pointer listeners are `passive` and on `window`, and write into a plain object, never into React state.
- Any simulation (ripples, fluid) runs in a small render target, and only while the pointer is active.

## 2. How the studio works

The studio is `components/studio/`, mounted at `/studio`. The part that matters is that the background does
not run in the studio page at all.

### The frame

`/studio/frame` is a second, deliberately bare page. The studio shows it in an `<iframe>` and talks to it
through a small object the frame page puts on its own `window`, `window.__mewoStudio` (typed in
`components/studio/frame/bridge.ts`):

| Call | What it does |
|---|---|
| `load(id, props)` | Lazily imports the registry component for `id` and mounts it. Returns `false` if a newer `load` overtook it. |
| `update(props)` | Pushes new props into the mounted component. The component's own ref pattern makes this cheap. |
| `restart()` | Remounts the component, which replays its intro. |
| `setTheme("light" \| "dark")` | Toggles the `dark` class on the frame's document so the page colour matches the site. |
| `clock` | The frame's clock, below. |
| `stage()` | The element the background is mounted in, for captures. |
| `onError(listener)` | Errors caught by the frame's error boundary. The studio shows them; the editor keeps working. |

Why an iframe rather than a component in the page:

- **Isolation.** The background's `requestAnimationFrame` loop, its event listeners and its WebGL context live
  in another document. The studio's React tree re-renders for a slider drag; the frame does not notice.
- **A clean kill.** Swapping backgrounds is a React remount inside the frame; closing the studio unloads the
  whole document, contexts and all. Nothing can leak into the rest of the site.
- **Errors stop at the boundary.** A shader that fails to compile shows a "Try again" overlay. It cannot take
  down the controls.
- **The clock.** This is the real reason.

### The clock

`components/studio/frame/clock.ts` runs before any background code and replaces, on the frame's window only,
`requestAnimationFrame`, `cancelAnimationFrame`, `performance.now` and `Date.now`. Every background uses those
APIs and nothing else to animate, so the studio now owns time inside the frame:

- **Pause** stops dispatching frames and freezes `performance.now()`. The GPU goes idle, the picture holds,
  and input events are swallowed so a cursor ripple does not queue up and burst on resume.
- **Refresh** runs exactly one frame while paused, so a prop change still shows.
- **Manual mode** (`?clock=manual`) only moves time when `clock.step(ms)` is called. Timers set with
  `setTimeout` and `setInterval` become virtual too, and CSS animations are advanced by hand.

Never install this clock on a page that has other work to do. It is safe here only because the frame page
has one job.

### Captures and exports

A snapshot (`S`) composes the frame's `<canvas>` elements into a new canvas, honouring each one's CSS
opacity, blend mode and filter (`compose.ts`). Nothing in the DOM is captured, so the sample content laid
over the preview never ends up in the file.

An image or video export opens a *second*, hidden frame with `clock=manual`, a fixed seed, and the requested
device pixel ratio (`render.ts`). The renderer loads the background, steps the clock until it has drawn and its
assets are in, skips ahead to the chosen moment, then steps and draws one frame at a time. Because time is
virtual, a 4K, 60 fps render is exact on any machine; it is just slower. Video goes through WebCodecs by way
of `mediabunny`, with a seamless loop made by holding the first second of frames and fading them in over the
last.

### The document

The URL is the document: `/studio?bg=pattern-waves&preset=ocean&color=ff0000&spacing=12`. Only the props
that differ from the resolved base (defaults, then the theme overrides, then the preset) are written, hex
colours lose their `#`, and the URL is rewritten with `replaceState` a beat after the last change. Undo and
redo keep a history of eighty documents; edits to the same prop within 700 ms share one step, so a slider drag
is one undo.

### Shortcuts

| Key | Action |
|---|---|
| `Space` | Pause or resume |
| `R` | Replay the intro |
| `S` | Save a snapshot |
| `F` | Fullscreen |
| `E` | Export |
| `←` `→` | Previous or next background |
| `⌘Z` / `⇧⌘Z` | Undo / redo |

They work from inside the frame too: the frame forwards its key presses.

## 3. Adding a background to the studio

1. Write the component at `registry/mewo/ui/<name>.tsx` following the checklist in section 1, describe it in
   `registry.json` under `"categories": ["background"]`, add its demo and test as for any item.
2. Add an entry to `ENTRIES` in `components/studio/catalog.ts`:
   - `id` is the registry name; the title and description are read from `registry.json`.
   - `swatch` is two or more colours for the list thumbnail, darkest first.
   - `load` lazily imports the component. Keep it lazy: the frame should only download the one it shows.
   - `props` is the schema that builds the controls. Types are `number` (with `min`, `max`, `step`),
     `boolean`, `color`, `colorArray` (with `minItems`, `maxItems`), `select` (with `options`) and `text`.
     Every default must match the component's own default, so the generated code only lists what changed.
   - `presets`, optionally, each a label and the props it sets.
   - `darkProps` and `lightProps` are overrides so the background reads on the site's page colour in either
     theme, typically a background colour and a `lightMode` flag.
3. `npm test` checks the entry against `registry.json` and the schema against itself
   (`tests/studio/catalog.test.ts`).

Nothing else to edit. The list, the picker, the controls, the URL, the code export and the renderers all
read the catalog.

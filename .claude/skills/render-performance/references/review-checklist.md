# Review checklist

Answer every line for the component under review. A "no" on a **must** line is a finding; a "no" on a
**should** line is a note. Quote the line of code for each finding.

## Classification

- What is the effect a function of? Scroll position, pointer, time, nothing (one-shot entrance)?
- Which renderer is it in now: CSS, Motion/GSAP, Canvas 2D, WebGL?
- Is the effect per pixel every frame (gradient, noise, lighting, distortion, blur, thousands of particles)?
  If yes and it is not WebGL, that is the headline finding.
- Is it a layout or text animation that happens to be in a canvas? If yes, it should probably be DOM.

## Any component

- **must** Reduced motion freezes self-running motion and keeps the first frame.
- **must** Everything the effect adds (listeners, observers, timers, contexts, canvases) is removed in cleanup.
- **must** No `setInterval`, no `setTimeout` loops for animation.
- **must** `className` merged with `cn()`, rest props spread, `data-slot` on the root.
- **should** Pointer listeners are `passive`, attached to `window` or the root, and write to a plain object.
- **should** `dt` is clamped so a tab switch or a hitch does not jump the animation.

## CSS and Motion components

- **must** Per-frame or keyframe-animated properties are only `transform` and `opacity`.
  Repainting properties to look for: `background-position`, `background-size`, `filter`, `backdrop-filter`,
  `mask-image`, `clip-path` with a gradient, `border-radius`, `box-shadow`, `width`, `height`, `left`, `top`.
- **must** No continuous animation on a viewport-sized element that also carries `filter: blur()`.
- **should** Scroll handlers only measure; style writes happen in `requestAnimationFrame`; the loop stops
  when the eased value reaches the target.
- **should** Components far from the viewport do no work per scroll event (gate with `IntersectionObserver`).
- **should** `will-change` only on the moving elements, and not on many large ones.
- **should** Motion's `whileInView` / GSAP ScrollTrigger handle visibility; no hand-rolled observer on top.

## Canvas 2D and WebGL components

- **must** The canvas is created inside the setup effect and removed in cleanup; it is not in JSX.
- **must** The setup effect has `[]` dependencies; props reach the loop through a ref written in an effect.
- **must** The frame loop only re-schedules while something moves (`moving || intro || pointerLive || dirty`).
- **must** `IntersectionObserver` stops the loop off-screen; `visibilitychange` resumes it.
- **must** `devicePixelRatio` capped at 2; full-area effects also capped by a fragment budget.
- **must** Cleanup deletes GPU objects, calls `WEBGL_lose_context.loseContext()`, removes the canvas.
- **must** (`ogl`) A `getContext("webgl2", attrs)` probe with the same attributes runs before `new Renderer()`.
- **must** Simulations (ripples, fluid, backdrop) run in a render target a fraction of the canvas size.
- **should** The loop runs once and stops for `speed={0}` or `paused`.
- **should** No per-frame allocations in the loop (typed arrays and uniform arrays are reused).
- **should** Context attributes are the cheapest that work: `antialias: false`, `depth: false`,
  `premultipliedAlpha: true` when alpha is on.

## Measurements to record

From `node scripts/measure-render.mjs <name>` (dev server up):

| Column | Pass |
|---|---|
| `raf away` | 0 for every component |
| `cpu away` | below 0.005 |
| `raf idle` | 0 for a DOM component; 0 for a canvas component with `speed={0}`; otherwise the frame rate |
| `layout/s` while idle | 0 for anything that is not scroll-driven and being scrolled |
| `canvas` | the contexts you expect, nothing extra (a stray `2d` is often a colour probe left on every render) |

Note what the tool cannot see: a CSS animation that repaints. Read the keyframes for those.

## Verdict

One of **keep**, **fix in place**, **move to Canvas 2D**, **move to WebGL**, with the user-visible symptom
it removes and an estimate of the work (lines, new dependency, new tests).

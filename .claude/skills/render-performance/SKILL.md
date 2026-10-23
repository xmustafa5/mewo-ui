---
name: render-performance
description: Use before adding, porting or reviewing ANY mewo component, and whenever a component animates, draws, follows the pointer or reacts to scroll. Decides whether it belongs in CSS, Motion/GSAP, Canvas 2D or WebGL, and holds the rules a canvas or WebGL component must follow so it costs nothing while idle. Triggers on "add a component", "port from React Bits", "is this slow", "should this be WebGL", "review performance", "canvas", "shader", "background", "cursor effect", "gallery", "carousel".
---

# Render performance

mewo copies its source into the user's project. A component that burns a core while it sits below the fold
is a bug the user ships to everyone. This skill is the review React Bits and React Bits Pro apply in
practice, written down: pick the cheapest renderer that can do the effect, and if that renderer is a canvas,
make it idle for free.

Read `references/review-checklist.md` for the questions to ask and `references/component-template.tsx`
for the shape every canvas component takes. Measure with `node scripts/measure-render.mjs <name>` against
`npm run dev`; put the numbers in the PR.

## 1. Choose the renderer

Work down this list and stop at the first row that can do the effect. Each step down costs more code,
more bundle, and more rules.

| Renderer | Use it for | Never for |
|---|---|---|
| **CSS only** (`transform`, `opacity`, keyframes) | Shimmers, marquees, hover states, entrance fades, anything the compositor can move as one layer | Anything that changes `background-position`, `filter`, `mask-image`, `box-shadow`, `width` or `height` every frame on a large element: those repaint, they do not composite |
| **Motion / GSAP** (DOM) | Entrance and scroll-linked motion, layout animation, staggered text, springs. The library owns one ticker and stops it when idle | Hundreds of animated nodes, per-pixel effects, anything that needs a texture or a blur per frame |
| **Canvas 2D** | Up to a few thousand simple shapes, text rasterisation, colour sampling, a backdrop drawn at a fraction of the size | Full-screen gradients or noise per frame, blur, lighting, anything per pixel: that is a shader's job |
| **WebGL 2** (raw or `ogl`) | Full-area per-pixel effects: gradients, noise, lighting, distortion, particles in the thousands, 3D | A text block or a card that CSS could move. Do not reach for WebGL to make a layout animation "faster" |

The tell for the last row: the effect is a function of **every pixel every frame** (a gradient that flows,
a surface that is lit, an image that is distorted, dots on springs). React Bits puts those under
Backgrounds; React Bits Pro gives them a whole category, "3D & Shaders", and ships Album Rail, Gravity
Letters, the galleries and the image effects there as `three.js` scenes. Both sites keep text animations,
cards and lists in the DOM, with CSS 3D transforms where depth is wanted. Follow the same line.

Dependencies: raw WebGL 2 first, `ogl` when the effect needs render targets or more than one program
(it is small and typed, and already on the registry's import allowlist). `three` is not on the allowlist;
it is 600 KB of source copied into every consumer project. Ask the owner before adding it, with the size
and the reason.

## 2. Rules for a canvas or WebGL component

These are the six rules every React Bits background follows and the ones that were missing from its
non-background canvas components. All six are mandatory here. The template implements them; keep its
structure.

1. **Draw on the GPU, keep React out of the frame.** One canvas, one effect, no per-item DOM. Props flow
   into a ref that the frame loop reads; React never re-renders per frame. Expensive maths runs per cell
   or per particle into a small texture, not per screen pixel.
2. **Create the context once.** One `useEffect(() => {...}, [])` owns the context. A prop change only
   updates the ref and wakes the loop. Tearing the pipeline down on a colour tweak is the most common way
   to make a canvas component slow.
3. **Stop when nothing moves.** The last line of `frame()` only schedules the next frame when something is
   animating: speed > 0, an intro is running, a pointer effect is live, or a prop just changed. A static
   configuration renders once and then costs nothing. No `setInterval`, ever.
4. **Stop when unseen.** An `IntersectionObserver` turns the loop off below the fold; a `visibilitychange`
   listener resumes it when the tab returns. Measure: `raf away` and `cpu away` must be 0.
5. **Cap the pixels.** Cap `devicePixelRatio` at 2, and for full-area effects also at a fragment budget
   (about 4.5 million) so a 5K display costs what a laptop does. Run any simulation (ripples, fluid, a
   blurred backdrop) in a small render target.
6. **Leave the way you came.** Delete framebuffers, textures and programs, call
   `WEBGL_lose_context.loseContext()`, remove the canvas. Browsers allow about sixteen live contexts; a leak
   per route change blacks out the site.

Plus three that are specific to this codebase:

- **Create the `<canvas>` inside the effect**, append it to the root, remove it on cleanup. Never render it
  in JSX. Next runs React Strict Mode in development, effects run twice, and a context lost by the first
  cleanup is handed straight back by `getContext()` on the same element: the component shows a white box
  in every `next dev` session. Pattern Waves, Grainient and Dot Grid all do this.
- **Probe before `ogl`.** `new Renderer()` throws when no context can be made (jsdom, GPU-less CI). Call
  `canvas.getContext("webgl2", SAME_ATTRIBUTES)` first and bail out quietly; the second call inside `ogl`
  returns that same context.
- **Write refs in effects, not in render.** The project's React lint rules (`react-hooks/refs`,
  `react-hooks/set-state-in-effect`) reject `settingsRef.current = settings` during render and synchronous
  `setState` inside an effect. Sync props into the ref in a dependency-less effect declared after the setup
  effect, and keep frame state in plain variables or an external store.

Always: honour `prefers-reduced-motion` (freeze self-running motion, keep the first frame), use passive
`window` pointer listeners that write to a plain object, clamp `dt` between 1/240 s and 50 ms, accept
`className` merged with `cn()`, spread the rest of the props, set `data-slot`, and fill the parent with
`relative h-full w-full overflow-hidden`. The consumer gives it a size.

## 3. Rules for a DOM component

CSS and Motion components are cheap by default and expensive by accident. Check:

- Per-frame writes touch only `transform` and `opacity`. `mask-image`, `filter`, `background-position`,
  `border-radius`, `box-shadow` and sizes repaint the layer every frame; on a viewport-sized element that
  is a full repaint at 60 fps, and with a `blur()` on top it is the most expensive thing on the page.
- A continuous CSS animation on a large blurred layer should animate a `transform` of a wider layer, not
  the gradient's `background-position`: the blur is then rasterised once and the compositor slides it.
- Scroll-driven work reads layout in the scroll handler and writes styles in `requestAnimationFrame`, and
  the loop ends when the eased value reaches its target. Do not measure on every scroll event for an
  element that is far away: gate with an `IntersectionObserver`.
- `will-change-transform` only on the elements that move, and never on dozens of large ones at once: each
  is a GPU texture.
- A blur on a card is fine; a blur on a full-section element that also animates is not. If the design
  needs a soft, moving, full-area gradient, that is a shader (Grainient already is one).

## 4. Review an existing component

1. Classify it with the table in section 1 and say which row it is in and which row it should be in.
2. Run `node scripts/measure-render.mjs <name>` with `npm run dev` up. Record `raf idle`, `raf away`,
   `cpu idle`, `cpu away`, `layout/s`. For CSS animations the tool shows nothing; read the keyframes and
   name the property they animate and the size of the element.
3. Walk `references/review-checklist.md`. Write the verdict as one of: **keep**, **fix in place** (name
   the property or listener), **move to Canvas 2D**, **move to WebGL**. State the user-visible symptom the
   change removes (fan noise below the fold, dropped frames while scrolling), not a theory.
4. Put the verdicts in `docs/render-performance-review.md` so the next review starts from them.

## 5. When adding or porting a component

- Decide the renderer before writing code, and say so in the PR: "DOM, Motion" or "WebGL 2, raw".
- Porting from React Bits: their TypeScript + Tailwind variant is the starting point. Check the file
  against section 2 before anything else; roughly a third of their non-background canvas components lack
  the visibility rules, and most of their JSX-canvas ones will hit the Strict Mode trap here.
- Add the registry entry, demo, props table and tests as `README.md` describes. A canvas component's
  tests mock `HTMLCanvasElement.prototype.getContext` to return `null` and assert the root still renders
  with the merged `className` and no canvas.
- Measure before you ask for review. A canvas component must show `raf away` 0 and `cpu away` ≈ 0. A
  configuration with `speed={0}` must show `raf idle` 0.

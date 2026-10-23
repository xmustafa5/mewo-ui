# Render performance review

**Date:** 2026-10-23
**Scope:** every item in `registry.json` (15 existing, 3 new backgrounds), plus what React Bits and
React Bits Pro do, measured rather than assumed.
**Tool:** `node scripts/measure-render.mjs` against `npm run dev`, headless Chromium with software WebGL.
**Rules applied:** `.claude/skills/render-performance/SKILL.md`.

## 1. What React Bits and React Bits Pro actually do

The question behind this review was whether "the WebGL treatment" is reserved for backgrounds or is a
general rule. Probing both sites gives a clear answer: **the renderer follows the effect, not the
category.**

**React Bits (open source, 218 components).** All 64 backgrounds draw on a canvas. Outside Backgrounds,
60 of 154 components are canvas-based too: 27 of 38 Animations, 19 of 48 Components, 8 of 33 Text
Animations, 6 of 35 Micro. Those are the per-pixel or many-particle effects (fluid cursors, metaballs,
pixel transitions, ASCII text, particle text, 3D carousels, glass surfaces). Text, cards, lists and
micro-interactions stay in the DOM on GSAP, Motion or plain CSS. The six idle-cost rules are near
universal in Backgrounds and uneven elsewhere: 14 canvas components outside Backgrounds have neither an
intersection observer nor a visibility listener, and only a handful release their WebGL context.

**React Bits Pro (230 components).** The catalogue is split as Text 34, Backgrounds 98, **3D & Shaders
49**, Cursor Effects 21, UI & Cards 28. "3D & Shaders" is the explicit home for WebGL that is not a
background. Album Rail, the component that prompted the question, is a `three.js` r181 scene on a WebGL 2
canvas: a fan of album sleeves is exactly the kind of lit, 3D, image-textured effect the DOM cannot do.
Gravity Letters, filed under Text, is also a `three.js` scene. Cipher Reveal, also under Text, is plain
DOM spans. 3D Letter Swap is DOM with CSS 3D transforms. So in Pro, as in the free library, the choice is
per component: WebGL whenever the effect is per pixel or truly 3D, DOM for everything else.

**Previews.** Neither site uses the Background Studio's isolated frame for its docs. React Bits renders
every demo inline. Pro renders its newer components into a same-origin, script-less iframe: the
component's React tree is portalled into the iframe document, and its animation loop runs in the parent
window. That buys CSS and viewport isolation for the desktop, tablet and mobile width presets, nothing
more. The clock-owning frame exists only in the two tools, Background Studio and Shape Magic, where exact
pause and deterministic export matter.

The rule for mewo follows from this: choose the cheapest renderer that can do the effect (section 1 of
the skill), and when the answer is a canvas, make it idle for free (section 2).

## 2. Measurements

Headless Chromium, 1280×900, dark theme, software GL. `raf` is `requestAnimationFrame` callbacks per
second; `cpu` is main-thread seconds per second (0.05 means 5% of a core); `style/s` is style recalcs per
second while idle. "away" is with the preview scrolled 4000 px out of view. The tool cannot see GPU paint
cost, so a CSS animation that repaints shows up only as `style/s` and `cpu`.

| Item | Renderer | raf idle | raf hover | raf away | cpu idle | cpu away | style/s |
|---|---|---|---|---|---|---|---|
| text-shimmer | CSS | 0 | 0 | 0 | 0.040 | 0.061 | 60 |
| marquee | CSS | 0 | 0 | 0 | 0.001 | 0.000 | 0 |
| split-text | GSAP | 64 | 65 | 64 | 0.025 | 0.013 | 0 |
| spotlight-card | Motion | 0 | 14 | 0 | 0.000 | 0.000 | 0 |
| gradient-carousel | DOM + Canvas 2D | 61 | 61 | 0 | 0.028 | 0.000 | 0 |
| scroll-reveal | Motion | 0 | 0 | 0 | 0.000 | 0.000 | 0 |
| scroll-portal | DOM | 0 | 0 | 0 | 0.000 | 0.000 | 0 |
| tile-reveal | DOM | 0 | 0 | 0 | 0.000 | 0.000 | 0 |
| scroll-mask | DOM | 0 | 0 | 0 | 0.000 | 0.000 | 0 |
| text-scroll-highlight | DOM | 0 | 0 | 0 | 0.001 | 0.014 | 0 |
| aurora-background | CSS + Motion | 0 | 0 | 0 | 0.056 | 0.085 | 60 |
| pattern-waves | WebGL 2 (ogl) | 60 | 61 | 0 | 0.020 | 0.016 | 0 |
| grainient | WebGL 2 | 60 | 61 | 0 | 0.022 | 0.000 | 0 |
| dot-grid | WebGL 2 | 0 | 62 | 0 | 0.000 | 0.016 | 0 |
| hero-aurora | section | 67 | 27 | 27 | 0.009 | 0.008 | 23 |
| features-spotlight | section | 0 | 0 | 0 | 0.185 | 0.058 | 52 |
| tabs | Motion | 0 | 0 | 0 | 0.000 | 0.000 | 0 |
| collapsible | Motion | 0 | 0 | 0 | 0.000 | 0.000 | 0 |

Three numbers matter most. `aurora-background` and `text-shimmer` do main-thread work sixty times a
second and keep doing it off-screen. `split-text` keeps a 60 fps loop alive forever, on and off screen.
Everything scroll-driven and everything on WebGL is free when it is not being looked at.

## 3. Verdicts

**aurora-background: move to WebGL.** A 120%-of-section element with `blur(40px)` whose
`background-position` is animated. Animating that property repaints the element every frame, the blur is
re-applied to the repaint, and CSS animations do not stop off-screen: 60 style recalcs a second and
6 to 9% of a core in a headless run, before counting the GPU. This is the single most expensive thing in
the library and it sits in the hero. The effect it wants, a soft, slowly moving colour field, is what
Grainient already is on the GPU for roughly nothing (`raf away` 0, `cpu away` 0). Build it as a shader
(an `aurora` preset on Grainient, or a small dedicated `aurora` WebGL component) and keep the Motion
fade-in for the content. Stopgap if the rewrite waits: animate a `transform` on a 300%-wide gradient
layer instead of `background-position`, so the blur is rasterised once and the compositor slides it.

**text-shimmer: fix in place.** Same mechanism in miniature: a `background-position` keyframe on
`bg-clip-text` text repaints the glyphs every frame, 60 style recalcs a second, and it never stops. Keep
CSS, but sweep a `transform` instead: an absolutely positioned highlight layer, masked by the text,
translated across. Expected result: 0 style recalcs, compositor only.

**split-text: fix in place (same renderer, different library).** GSAP's ticker runs at 60 fps for as long
as ScrollTrigger is registered, even after a `once` animation has played and even off-screen: 64 rAF a
second and 2.5% of a core, forever, from one heading. Motion's loop sleeps when nothing animates
(`scroll-reveal` measures 0). Rewrite the entrance with Motion's `whileInView` and `staggerChildren`; the
registry item drops `gsap` and `@gsap/react` as dependencies. The same ticker is why `hero-aurora`
measures 67 rAF a second.

**scroll-mask: move iris, wipe, curtain and type off animated masks; keep slats and grid.** (Done in the DOM rather than WebGL; see section 6.) Slats and grid animate
`transform` and `opacity` per piece, which composites. The other four rebuild a 15-stop gradient
`mask-image` on a viewport-sized image layer every frame, which repaints the whole frame each frame. The
tool shows 0 at idle because the work only happens while scrolling, and that is precisely when frames
are scarce. A shader samples the image once and evaluates the mask per pixel for free. Keep the public
props; add a WebGL path behind the four variants.

**gradient-carousel: fix in place, then consider WebGL for the backdrop.** The loop runs at 60 fps the
whole time the carousel is on screen because the backdrop drifts with time, and each frame pays a
`blur(24px)` filter on the backdrop canvas plus `filter: blur()` on the edge cards. Stop the loop when
velocity is 0 (let the drift be a slow CSS `transform` animation on the canvas element), and draw the
colour pools in a shader at full resolution so no CSS blur is needed.

**scroll-portal: keep, one note.** Per-frame writes to `borderRadius` and `borderWidth` repaint a frame's
layer during the short edge-fade window; the rest is `transform` and `opacity`. Acceptable; revisit if
scenes carry large images.

**tile-reveal: keep.** Transforms and opacity only. Each tile is a composited layer with an image; keep the
demo at twelve tiles or fewer.

**text-scroll-highlight: keep, one note.** It measures on every scroll event even when far away
(`cpu away` 0.014). Gate `measure()` with an intersection observer with a generous root margin.

**marquee, spotlight-card, scroll-reveal, tabs, collapsible: keep.** Zero idle cost; hover and layout
animations are compositor work.

**pattern-waves, grainient, dot-grid: keep.** All three show `raf away` 0 and release their context. Two
notes: Pattern Waves creates a 2D probe canvas for every colour parse on every render (the `2d+2d+2d+2d`
in the context column); cache one module-level probe. The doubled `webgl2` on all three is React Strict
Mode mounting twice in development and is expected.

**hero-aurora, features-spotlight: inherit.** `hero-aurora` carries both `aurora-background` and
`split-text`; `features-spotlight` carries `text-shimmer` (its 52 style recalcs a second) and four marquee
copies. Both sections fall into line once their parts are fixed; re-measure them afterwards.

## 4. Action list

| Priority | Item | Change | Removes |
|---|---|---|---|
| 1 | aurora-background | WebGL shader (Grainient preset or `aurora` component); interim `transform` sweep | 60 Hz full-section repaint and blur, on and off screen, in the hero |
| 2 | text-shimmer | `transform` sweep on a masked layer | 60 Hz text repaint, off-screen too, in every eyebrow |
| 3 | split-text | Motion instead of GSAP ScrollTrigger | A permanent 60 fps ticker from one heading; two dependencies |
| 4 | scroll-mask | WebGL path for iris, wipe, curtain, type | Full-frame repaint per frame while scrolling |
| 5 | gradient-carousel | Idle stop; backdrop drift via transform or shader | 60 fps loop plus two blur filters while on screen |
| 6 | pattern-waves, text-scroll-highlight | Cache the colour probe; gate measure() | Minor allocations and far-away scroll work |

Nothing in the list changes a public prop. Each change is measured with the same command before and
after, and the before and after rows go in the PR.

## 5. Blind spots of the measurement

Headless software GL means WebGL frame times are much slower than on real hardware, so `cpu idle` for the
three backgrounds overstates them; only their `away` columns are comparable. GPU paint and compositor
cost are invisible to the tool: a CSS animation that repaints a blurred layer shows up as `style/s` and
`cpu`, but its GPU cost does not. For those, the keyframe property and the element size are the
evidence, and they are quoted above. Pass `GPU=1` to run on this machine's Intel GPU through ANGLE
Vulkan when relative WebGL numbers matter.

## 6. Results

Done on 2026-10-23, on branch `feat/background-studio`. Each cell reads: rAF idle / paints idle / rAF away /
paints away / paints while scrolling (per second) / CPU idle / CPU away (cores). Paints are Chrome's `Paint`
trace events; the first version of the tool could not see them, which is why section 2 has no paint column.

| Item | Before | After |
|---|---|---|
| aurora-background | 0 / 120 / 0 / 121 / 123 / 0.065 / 0.090 | 60 / 0 / 0 / 0 / 0 / 0.039 / 0.001 |
| text-shimmer | 0 / 121 / 0 / 121 / 107 / 0.091 / 0.081 | 0 / 0 / 0 / 0 / 0 / 0.003 / 0.004 |
| split-text | 64 / 0 / 64 / 0 / 0 / 0.023 / 0.020 | 0 / 0 / 0 / 0 / 0 / 0.001 / 0.000 |
| scroll-mask | 0 / 0 / 0 / 0 / 90 / 0.000 / 0.000 | 0 / 0 / 0 / 0 / 14 / 0.001 / 0.000 |
| gradient-carousel | 60 / 0 / 0 / 0 / 0 / 0.029 / 0.000 | 0 / 0 / 0 / 0 / 0 / 0.001 / 0.000 |
| text-scroll-highlight | 0 / 0 / 0 / 0 / 161 / 0.001 / 0.000 | 0 / 0 / 0 / 0 / 161 / 0.001 / 0.001 |
| pattern-waves | 60 / 0 / 0 / 0 / 0 / 0.023 / 0.013 | 60 / 0 / 0 / 0 / 0 / 0.025 / 0.001 |
| features-spotlight | 0 / 97 / 0 / 121 / 119 / 0.249 / 0.054 | 0 / 0 / 0 / 0 / 0 / 0.004 / 0.006 |
| hero-aurora | 39 / 55 / 25 / 42 / 44 / 0.013 / 0.010 | 60 / 0 / 60 / 0 / 0 / 0.040 / 0.028 |
| marquee | 0 / 0 / 0 / 0 / 0 / 0.002 / 0.001 | 0 / 0 / 0 / 0 / 0 / 0.002 / 0.000 |

**What changed, item by item.**

- **aurora-background** is a WebGL 2 shader that reproduces the CSS gradient's stops, angle, drift speed
  and radial mask, drawn at a quarter of the resolution. The blurred CSS gradient stays as the first paint
  and as the fallback for reduced motion, no WebGL, and a lost context. Repaints went from 120 a second to
  none; the GPU loop stops off-screen. Public props unchanged.
- **text-shimmer** slides a soft-edged window over a copy of the text that slides back the same distance,
  so only `transform` animates and the compositor runs it. The copy is generated content, so the string
  is in the DOM once. The light band is half the text's width against about 60% before. Repaints went
  from 120 a second to none, CPU from 9% of a core to 0.3%.
- **split-text** runs on Motion with one viewport observer for the whole string. The permanent 64 rAF a
  second is gone, and the item no longer depends on `gsap` or `@gsap/react`. When `once` is off, leaving
  the viewport now sends every unit back together instead of reversing the stagger.
- **scroll-mask** did not move to WebGL. A WebGL texture cannot be made from a cross-origin image served
  without CORS headers, so a WebGL path would always have needed the current DOM path as a fallback.
  Instead every mask variant now uses panes with a mask painted once, moved by a transform, with the image
  counter-transformed so it holds still (`maskPanes`, `maskPoses`, unit-tested). Over the demo's full
  scroll, paints fell from 280 to 42 in 2.5 s, and the remaining ones are one-time first paints and page
  layers. Wipe, curtain and type match the old frames almost exactly; the iris's soft edge now scales with
  the circle, with the scale chosen so the circle reads the same size throughout.
  Two Chrome facts came out of this, both now rules in the skill: an element with a multi-layer background
  repaints on every change to its own transform, and a stale `app/registry.css` makes measurements of
  edited keyframes meaningless.
- **gradient-carousel** stops its loop when the cards stop. The backdrop drifts only while the cards move.
- **pattern-waves** keeps one colour-probe canvas instead of making one per parse.
- **text-scroll-highlight** no longer measures on scroll while it is more than half a viewport away.

**New finding.** `text-scroll-highlight` repaints its paragraph about 160 times a second while it is being
scrolled, because each word's `opacity` is written and the words are inline. It costs nothing at rest
or off-screen. Making each word its own layer would trade the repaint for one GPU texture per word, which
is worse for long text. Left as is, noted for the next review.

**Not comparable.** `hero-aurora`'s preview page is only as tall as the hero, so it can never scroll out of
view and its "away" columns measure it on screen. The `style while scrolling` column (not shown) is
dominated by the docs page itself: `marquee`, which does nothing on scroll, shows 60 a second.

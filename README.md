# mewo

Animated React components and page sections, distributed as a [shadcn registry](https://ui.shadcn.com/docs/registry). Install an item and its source code is copied into your project — you own it.

**Site & docs:** https://www.mewo-ui.com

## Install

Requires a project with shadcn initialised (`npx shadcn@latest init`) and Tailwind CSS v4.

mewo is listed in the shadcn registry directory as `@mewo`, so installing needs no configuration:

```bash
npx shadcn@latest add @mewo/names-duel
```

Single components can also be installed straight from their URL:

```bash
npx shadcn@latest add https://www.mewo-ui.com/r/text-shimmer.json
```

Sections such as `names-duel` install other mewo components, which they list as
`@mewo/<name>`. The CLI resolves that name through the registry directory; on older CLI versions
that predate the directory, add the namespace to your `components.json` first:

```json
{
  "registries": {
    "@mewo": "https://www.mewo-ui.com/r/{name}.json"
  }
}
```

## What's inside

| Item | Kind | Needs |
|---|---|---|
| `text-shimmer` | component | — |
| `marquee` | component | — |
| `split-text` | component | motion |
| `venom` | component | — |
| `spotlight-card` | component | motion |
| `gradient-carousel` | component | — |
| `scroll-reveal` | component | motion |
| `scroll-portal` | component | — |
| `tile-reveal` | component | — |
| `scroll-mask` | component | — |
| `text-scroll-highlight` | component | — |
| `aurora-background` | component | motion |
| `pattern-waves` | component | ogl |
| `grainient` | component | — |
| `dot-grid` | component | — |

Every item respects `prefers-reduced-motion`. Each installs only the dependency it uses.

## Background Studio

[mewo-ui.com/studio](https://www.mewo-ui.com/studio) tunes any background live, lays sample content over it,
and exports the code, an image or a video. Every background runs in its own iframe on a clock the studio
controls, so pausing is exact and exports render frame by frame at any size.

## Development

```bash
npm install
npm run dev            # generates public/r and app/registry.css, then starts Next.js
npm test               # vitest
npm run lint && npm run typecheck
npm run verify:install # installs every item into a fresh Next app from a local server, then runs tsc
```

### Adding a component

1. Write it at `registry/mewo/ui/<name>.tsx` (starts with `"use client"`, accepts `className`, honours reduced motion). Sections go in `registry/mewo/blocks/` and import components as `@/registry/mewo/ui/<name>`.
2. Describe it in `registry.json` — `dependencies` for npm packages, `registryDependencies` for other items (`@mewo/<name>`) or shadcn core items (`button`), `css` for any `@keyframes`, and `"meta": { "added": "YYYY-MM-DD" }`. Items added within 14 days of the latest release get the New badge. A simple piece that ships with a site built with mewo can add `"unlisted": true` to `meta`: it keeps its page at `/docs/<name>` and installs like any item, but the catalog, the sidebar, search and the counts leave it out.
3. Add `components/demos/<name>-demo.tsx` (default export = demo, `props` = props table) and register it in `components/demos/index.ts`.
4. Give it a Customize panel: `components/customize/<name>.tsx`, registered in `components/customize/index.ts`. It is a client component that exports `DEFAULTS` (one key per control), `DEMO_ONLY` (the keys that are not props of the piece: the demo's own content or size) and a default component that calls `useCustomize(DEFAULTS)` and renders `<CustomizeFrame>` with the piece as `preview`, its `usage` (the component's name, the item's name, `changedProps(...)` and its children) and one row per control (`Slider`, `Select`, `Switch`, `Input`, `Color`, `ColorList`). The values live in the address, so a customised look is a link; a value equal to its default leaves it. A control whose change only shows from the start (an entrance, a stagger) passes `{ replay: true }` to `set`, which remounts the preview; everything else updates live. `npm test` checks that every key is a documented prop or in `DEMO_ONLY`, with the documented default. A section's preview runs in a frame of its own: its file also exports `Framed` (the section rendered from `useFramedValues(DEFAULTS)`), its default component passes `<FramedPreview name=… values=… run=… />` as the preview, and its name goes in `components/customize/sections.ts`, which serves `/preview/<name>/customize`.
5. Add a test under `tests/`. `npm test` also checks the catalog invariants.
6. `npm run verify:install`.

The docs site, sidebar and preview route are generated from `registry.json` — nothing else to edit.

### Adding a site

`/sites` lists whole sites built with mewo pieces; `/sites/<slug>` frames one and lists the pieces it is built from, split into the components (in the catalog) and the simple pieces (unlisted). Each site is one file, `content/sites/<slug>.json`:

```json
{ "slug": "my-site", "title": "My Site", "blurb": "What it is.", "url": "https://my-site.example.com", "embed": true, "pieces": ["zoom-picture", "glass-panel"] }
```

- `pieces` are registry names, in the order to show them. Their fate (listed or unlisted) is read from `registry.json`.
- `public/sites/<slug>.webp` is the card's poster (16:9, 1280 × 720).
- `embed: true` means the site answers the viewer, which then frames it with `?embed=1` and offers Inspect. The site must allow framing from this origin (`Content-Security-Policy: frame-ancestors`) and speak the viewer's protocol over `postMessage`, every message carrying `source: "<slug>"` (or the manifest's `source`): the viewer sends `hello` and `inspect { on, pieces: [{ name, label, tag? }] }`; the site sends `ready`, `select { name }` (a click on an outlined piece), `open { name }` (a double-click) and `escape`. The site draws the outlines itself. Without `embed`, the site is framed as it is and the list stays.

## Registry directory

mewo is listed in the [shadcn registry directory](https://ui.shadcn.com/docs/registry/directory)
as `@mewo` (added in [shadcn-ui/ui#11924](https://github.com/shadcn-ui/ui/pull/11924)).

## License

MIT © xmustafa5

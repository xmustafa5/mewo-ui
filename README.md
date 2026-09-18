# mewo

Animated React components and page sections, distributed as a [shadcn registry](https://ui.shadcn.com/docs/registry). Install an item and its source code is copied into your project — you own it.

**Site & docs:** https://www.mewo-ui.com

## Install

Requires a project with shadcn initialised (`npx shadcn@latest init`) and Tailwind CSS v4.

mewo is listed in the shadcn registry directory as `@mewo`, so installing needs no configuration:

```bash
npx shadcn@latest add @mewo/hero-aurora
```

Single components can also be installed straight from their URL:

```bash
npx shadcn@latest add https://www.mewo-ui.com/r/text-shimmer.json
```

Sections (`hero-aurora`, `features-spotlight`) install other mewo components, which they list as
`@mewo/<name>`. The CLI resolves that name through the registry directory; on older CLI versions
that predate the directory, add the namespace to your `components.json` first:

```json
{
  "registries": {
    "@mewo": "https://www.mewo-ui.com/r/{name}.json"
  }
}
```

## What's inside (v0.1)

| Item | Kind | Needs |
|---|---|---|
| `text-shimmer` | component | — |
| `marquee` | component | — |
| `split-text` | component | gsap, @gsap/react |
| `spotlight-card` | component | motion |
| `scroll-reveal` | component | motion |
| `aurora-background` | component | motion |
| `hero-aurora` | section | aurora-background, split-text, button |
| `features-spotlight` | section | text-shimmer, scroll-reveal, spotlight-card, marquee, lucide-react |

Every item respects `prefers-reduced-motion`. Each installs only the dependency it uses.

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
2. Describe it in `registry.json` — `dependencies` for npm packages, `registryDependencies` for other items (`@mewo/<name>`) or shadcn core items (`button`), `css` for any `@keyframes`.
3. Add `components/demos/<name>-demo.tsx` (default export = demo, `props` = props table) and register it in `components/demos/index.ts`.
4. Add a test under `tests/`. `npm test` also checks the catalog invariants.
5. `npm run verify:install`.

The docs site, sidebar and preview route are generated from `registry.json` — nothing else to edit.

## Registry directory

mewo is listed in the [shadcn registry directory](https://ui.shadcn.com/docs/registry/directory)
as `@mewo` (added in [shadcn-ui/ui#11924](https://github.com/shadcn-ui/ui/pull/11924)).

## License

MIT © xmustafa5

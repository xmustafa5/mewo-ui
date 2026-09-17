# mewo

Animated React components and page sections, distributed as a [shadcn registry](https://ui.shadcn.com/docs/registry). Install an item and its source code is copied into your project — you own it.

**Site & docs:** https://mewo-ui.vercel.app

## Install

Requires a project with shadcn initialised (`npx shadcn@latest init`) and Tailwind CSS v4.

```bash
npx shadcn@latest add @mewo/hero-aurora
```

Until mewo is listed in the shadcn registry directory, add the namespace to your `components.json` first:

```json
{
  "registries": {
    "@mewo": "https://mewo-ui.vercel.app/r/{name}.json"
  }
}
```

Single components can also be installed straight from their URL with no configuration:

```bash
npx shadcn@latest add https://mewo-ui.vercel.app/r/text-shimmer.json
```

Sections (`hero-aurora`, `features-spotlight`) install other mewo components, which they list as
`@mewo/<name>`. The CLI resolves that name only from a configured registry, so sections need the
`registries` entry above — the URL form fails for them with `Unknown registry "@mewo"`.

## What's inside

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
| `tabs` | drop-in | motion, @base-ui/react, class-variance-authority |
| `collapsible` | drop-in | motion, @base-ui/react |

Every item respects `prefers-reduced-motion`. Each installs only the dependency it uses.

## Drop-in replacements

Some mewo items replace a shadcn component of the same name. Installing one **overwrites**
`components/ui/<name>.tsx` in your project:

```bash
npx shadcn@latest add @mewo/tabs
```

Your imports, props and JSX keep working — the exports and prop types are identical to
shadcn's. The only change is that things move:

- **tabs** — shadcn's highlight jumps between tabs. mewo's slides.
- **collapsible** — shadcn's collapsible ships with no animation at all; the panel appears at
  full height instantly. mewo's animates the height and fades the content in. mewo's root and
  trigger ship unstyled — no base classes, exactly like shadcn's — so installing it cannot move
  an existing layout; only the panel carries classes, and those are what make the height
  animate.

Verified against **shadcn CLI 4.21.0**. If shadcn changes these components' API, a mewo drop-in
installed over the new version may diverge — check this line before upgrading.

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

## Registry directory checklist

After the site is deployed and green:

1. Fork [shadcn-ui/ui](https://github.com/shadcn-ui/ui) and add to `apps/v4/registry/directory.json`:
   ```json
   { "name": "@mewo", "homepage": "https://mewo-ui.vercel.app", "url": "https://mewo-ui.vercel.app/r/{name}.json", "description": "Animated React components and sections powered by Motion and GSAP." }
   ```
2. Run `pnpm validate:registries` in that repo.
3. Open the PR. Once merged, `npx shadcn@latest add @mewo/<name>` works everywhere with no configuration.

## License

MIT © xmustafa5

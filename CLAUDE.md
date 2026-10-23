@AGENTS.md

# Commit rules

- Every commit message starts with `mewo : ` followed by the message.
  Example: `mewo : add text-shimmer component`
- Commits and PRs are authored by xmustafa5 only. Never add `Co-Authored-By`,
  "Generated with Claude Code", or any other AI attribution line to a commit
  message or PR description.

# Rendering performance

- Before adding, porting or reviewing any component, use the `render-performance` skill in
  `.claude/skills/render-performance/`. It decides whether a component belongs in CSS, Motion/GSAP,
  Canvas 2D or WebGL, and lists the rules a canvas-based component must follow.
- Measure before and after with `node scripts/measure-render.mjs <item-name>` against `npm run dev`.

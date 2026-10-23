import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
  ScrollMask,
  maskEdge,
  maskPanes,
  maskPoses,
  multiply,
  type MaskGeometry,
  type Matrix,
} from "@/registry/mewo/ui/scroll-mask"

const root = () => screen.getByTestId("m")
const pieces = () => root().querySelectorAll('[data-slot="scroll-mask-piece"]')
const layer = () => root().querySelector('[data-slot="scroll-mask-layer"]')

describe("maskEdge", () => {
  // Starting only one feather out would leave the soft edge showing before any scroll.
  it("starts two feathers out of sight and ends at the far side of the frame", () => {
    expect(maskEdge(0, 14)).toBe(-28)
    expect(maskEdge(0.5, 14)).toBe(36)
    expect(maskEdge(1, 14)).toBe(100)
  })

  it("spans exactly the frame when the edge is hard", () => {
    expect(maskEdge(0, 0)).toBe(0)
    expect(maskEdge(1, 0)).toBe(100)
  })
})

const geometry = (variant: MaskGeometry["variant"], extra: Partial<MaskGeometry> = {}): MaskGeometry => ({
  variant,
  width: 800,
  height: 500,
  feather: 14,
  originX: 50,
  originY: 50,
  angle: 108,
  word: "SCROLL",
  ...extra,
})

const apply = (m: Matrix, x: number, y: number) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]

describe("maskPoses", () => {
  // The panes move and the image inside moves back, so on screen the picture only ever zooms.
  it("keeps the image exactly where the zoom alone puts it, for every pane of every variant", () => {
    for (const variant of ["iris", "wipe", "curtain", "type"] as const) {
      for (const extra of [{}, { originX: 20, originY: 80, angle: 30 }]) {
        const g = geometry(variant, extra)
        const panes = maskPanes(g)
        for (const eased of [0.3, 0.6, 1]) {
          const scale = 1.14 - 0.14 * eased
          const [cx, cy] =
            variant === "type" ? [(g.originX / 100) * g.width, (g.originY / 100) * g.height] : [g.width / 2, g.height / 2]
          maskPoses(g, eased, scale).forEach((pose, i) => {
            if (!pose.visible) return
            const screen = multiply(pose.pane, pose.image)
            for (const [x, y] of [[0, 0], [g.width, 0], [123, 456]]) {
              const [sx, sy] = apply(screen, x, y)
              expect(sx + panes[i].clip.left).toBeCloseTo(cx + (x - cx) * scale, 6)
              expect(sy).toBeCloseTo(cy + (y - cy) * scale, 6)
            }
          })
        }
      }
    }
  })

  it("starts with nothing showing and ends with the frame open", () => {
    for (const variant of ["iris", "wipe", "curtain"] as const) {
      expect(maskPoses(geometry(variant), 0, 1.14).every((pose) => !pose.visible)).toBe(true)
    }
    // At the end the iris mask is opaque out to the farthest corner.
    const g = geometry("iris", { originX: 10, originY: 10 })
    const [pane] = maskPanes(g)
    const [pose] = maskPoses(g, 1, 1)
    const opaqueRadius = (pose.pane[0] * pane.box.width) / 2 / (1 + g.feather / 100)
    expect(opaqueRadius).toBeCloseTo(Math.hypot(0.9 * g.width, 0.9 * g.height), 6)
  })

  it("splits the curtain at the origin and fades a plain pane in over the word", () => {
    const curtain = maskPanes(geometry("curtain", { originX: 25 }))
    expect(curtain.map((pane) => pane.clip)).toEqual([
      { left: 0, width: 200.5 },
      { left: 199.5, width: 600.5 },
    ])
    const [word, plain] = maskPoses(geometry("type"), 0.9, 1)
    expect(word.visible).toBe(true)
    expect(plain.opacity).toBeCloseTo((0.9 - 0.54) / 0.46, 6)
    expect(maskPoses(geometry("type"), 1, 1)[0].visible).toBe(false)
  })
})

describe("ScrollMask", () => {
  it("reveals a single masked layer by default", () => {
    render(<ScrollMask data-testid="m" />)
    expect(root()).toHaveAttribute("data-slot", "scroll-mask")
    expect(layer()).not.toBeNull()
    expect(pieces()).toHaveLength(0)
  })

  it("names the picture for assistive tech only when given alt text", () => {
    const { rerender } = render(<ScrollMask alt="A valley at dusk" data-testid="m" />)
    expect(screen.getByRole("img", { name: "A valley at dusk" })).toBeInTheDocument()
    rerender(<ScrollMask data-testid="m" />)
    expect(screen.queryByRole("img")).toBeNull()
  })

  it("builds one pane per moving part, and a still picture for when no script runs", () => {
    const { rerender } = render(<ScrollMask data-testid="m" />)
    const panes = () => root().querySelectorAll('[data-slot="scroll-mask-layer"]')
    expect(panes()).toHaveLength(1)
    expect(root().querySelector('[data-slot="scroll-mask-static"]')).not.toBeNull()
    rerender(<ScrollMask variant="curtain" data-testid="m" />)
    expect(panes()).toHaveLength(2)
    rerender(<ScrollMask variant="type" data-testid="m" />)
    expect(panes()).toHaveLength(2)
  })

  it("cuts the picture into one strip per column for slats", () => {
    render(<ScrollMask variant="slats" columns={5} alt="A valley at dusk" data-testid="m" />)
    expect(layer()).toBeNull()
    expect(pieces()).toHaveLength(5)
    // The strips are one picture, so it is named once, on their container.
    expect(screen.getAllByRole("img")).toHaveLength(1)
  })

  it("cuts the picture into a grid of cells", () => {
    render(<ScrollMask variant="grid" columns={4} data-testid="m" />)
    // Until the frame is measured the grid is assumed square.
    expect(pieces()).toHaveLength(16)
  })

  it("layers children over the frame, hidden until the reveal unless told otherwise", () => {
    const { rerender } = render(
      <ScrollMask data-testid="m">
        <h3>Caption</h3>
      </ScrollMask>
    )
    const content = () => root().querySelector('[data-slot="scroll-mask-content"]') as HTMLElement
    expect(content()).toContainElement(screen.getByText("Caption"))
    expect(content()).toHaveClass("opacity-0")
    rerender(
      <ScrollMask revealContent={false} data-testid="m">
        <h3>Caption</h3>
      </ScrollMask>
    )
    expect(content()).not.toHaveClass("opacity-0")
  })

  it("sizes the scroll runway to scrollLength viewports beyond the pinned one", () => {
    render(<ScrollMask scrollLength={2} data-testid="m" />)
    expect(root().getAttribute("style")).toContain("--mewo-length: 3")
  })

  it("forwards className and keeps the root ref for the consumer", () => {
    const ref = React.createRef<HTMLElement>()
    render(<ScrollMask ref={ref} className="bg-muted" data-testid="m" />)
    expect(root()).toHaveClass("bg-muted")
    expect(ref.current).toBe(root())
  })
})

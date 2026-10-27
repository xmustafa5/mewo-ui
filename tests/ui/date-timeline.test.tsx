import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DateTimeline } from "@/registry/mewo/ui/date-timeline"

describe("DateTimeline", () => {
  it("renders its root with data-slot and the merged className, and every date", () => {
    const { container } = render(<DateTimeline className="custom" dates={["1850s", "1930s"]} />)
    const root = container.querySelector('[data-slot="date-timeline"]')!
    expect(root).toHaveClass("contents", "custom")
    expect(root).toHaveTextContent("1850s1930s")
    expect(container.querySelector("[data-track]")).toBeNull()
  })

  it("names its parts for a ScrollStage when given a track prefix", () => {
    const { container } = render(<DateTimeline track="a1" dates={["1850s", "1930s"]} />)
    const tracks = [...container.querySelectorAll("[data-track]")].map((el) => el.getAttribute("data-track"))
    expect(tracks).toEqual(["a1.timeline", "a1.timelineLine", "a1.year0", "a1.year1"])
    expect(container.querySelector('[data-track="a1.timelineLine"]')).toHaveAttribute("data-track-rel", "1")
  })
})

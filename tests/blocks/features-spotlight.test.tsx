import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { FeaturesSpotlight } from "@/registry/mewo/blocks/features-spotlight"

describe("FeaturesSpotlight", () => {
  it("renders three features and the eyebrow by default", () => {
    render(<FeaturesSpotlight />)
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3)
    expect(screen.getByText("Why mewo")).toBeInTheDocument()
  })

  it("renders supplied features and title", () => {
    render(
      <FeaturesSpotlight
        title="Custom title"
        features={[
          { title: "One", description: "1" },
          { title: "Two", description: "2" },
        ]}
      />
    )
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Custom title")
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["One", "Two"])
  })

  it("forwards className to the section", () => {
    render(<FeaturesSpotlight className="bg-muted" data-testid="f" />)
    expect(screen.getByTestId("f").tagName).toBe("SECTION")
    expect(screen.getByTestId("f")).toHaveClass("bg-muted")
  })
})

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ComponentPreview } from "@/components/site/component-preview"

describe("ComponentPreview", () => {
  it("offers Preview and Code tabs and shows the preview first", () => {
    render(
      <ComponentPreview code={<pre>source</pre>}>
        <p>demo</p>
      </ComponentPreview>
    )
    expect(screen.getByRole("tab", { name: "Preview" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Code" })).toBeInTheDocument()
    expect(screen.getByText("demo")).toBeVisible()
  })
})

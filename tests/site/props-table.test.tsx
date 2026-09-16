import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PropsTable } from "@/components/site/props-table"

describe("PropsTable", () => {
  it("renders one row per prop and a dash for a missing default", () => {
    render(
      <PropsTable
        props={[
          { name: "speed", type: "number", default: "30", description: "Seconds per loop." },
          { name: "className", type: "string", description: "Merged onto the root." },
        ]}
      />
    )
    expect(screen.getAllByRole("row")).toHaveLength(3)
    expect(screen.getByText("30")).toBeInTheDocument()
    expect(screen.getByText("—")).toBeInTheDocument()
  })
})

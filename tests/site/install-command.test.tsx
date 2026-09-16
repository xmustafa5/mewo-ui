import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { InstallCommand } from "@/components/site/install-command"

describe("InstallCommand", () => {
  it("shows the namespaced command and the raw-URL fallback", () => {
    render(<InstallCommand name="marquee" />)
    expect(screen.getByText("npx shadcn@latest add @mewo/marquee")).toBeInTheDocument()
    expect(screen.getByText(/\/r\/marquee\.json$/)).toBeInTheDocument()
  })

  it("copies the command to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<InstallCommand name="marquee" />)
    fireEvent.click(screen.getByRole("button", { name: /copy/i }))
    expect(writeText).toHaveBeenCalledWith("npx shadcn@latest add @mewo/marquee")
    expect(await screen.findByText("Copied")).toBeInTheDocument()
  })
})

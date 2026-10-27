import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { GlassPanel, GlassPanelContent, GlassPanelFooter, GlassPanelTitle, GlassPanelTrigger } from "@/registry/mewo/ui/glass-panel"

function Panel(props: React.ComponentProps<typeof GlassPanel>) {
  return (
    <GlassPanel className="custom" {...props}>
      <GlassPanelTrigger>About</GlassPanelTrigger>
      <GlassPanelContent closeLabel="Close panel">
        <GlassPanelTitle>About this story</GlassPanelTitle>
        <p>Lead</p>
        <GlassPanelFooter>Atlas</GlassPanelFooter>
      </GlassPanelContent>
    </GlassPanel>
  )
}

describe("GlassPanel", () => {
  it("renders its root with data-slot and the merged className, closed", () => {
    const { container } = render(<Panel />)
    const root = container.querySelector('[data-slot="glass-panel"]')
    expect(root).toHaveClass("contents", "custom")
    expect(screen.getByRole("button", { name: "About" })).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens from its trigger, beside it, named by its title, and closes from its close button", async () => {
    const { container } = render(<Panel />)
    const trigger = screen.getByRole("button", { name: "About" })
    fireEvent.click(trigger)
    const dialog = await screen.findByRole("dialog", { name: "About this story" })
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(container.querySelector('[data-slot="glass-panel"]')).toContainElement(dialog)
    expect(dialog).toHaveAttribute("data-slot", "glass-panel-content")
    fireEvent.click(screen.getByRole("button", { name: "Close panel" }))
    expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("follows open when the page controls it, and reports Escape", async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(<Panel open={false} onOpenChange={onOpenChange} />)
    fireEvent.click(screen.getByRole("button", { name: "About" }))
    expect(onOpenChange).toHaveBeenLastCalledWith(true, expect.anything())
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    rerender(<Panel open onOpenChange={onOpenChange} />)
    const dialog = await screen.findByRole("dialog")
    fireEvent.keyDown(dialog, { key: "Escape" })
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: "escape-key" }))
  })
})

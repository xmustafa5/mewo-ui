import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DownloadNote } from "@/components/site/download-note"

describe("DownloadNote", () => {
  it("offers each file for download at the path it goes to", () => {
    render(<DownloadNote files={["models/mewo.glb"]} />)
    const link = screen.getByRole("link", { name: /public\/models\/mewo\.glb/ })
    expect(link).toHaveAttribute("href", "/models/mewo.glb")
    expect(link).toHaveAttribute("download")
    expect(screen.getByRole("note")).toHaveTextContent("The install brings the code only")
  })

  it("speaks of several files, and renders nothing for none", () => {
    const { rerender, container } = render(<DownloadNote files={["a.bin", "b.bin"]} className="mt-2" />)
    expect(screen.getByRole("note")).toHaveTextContent("It needs a few more files.")
    expect(screen.getByRole("note")).toHaveClass("mt-2")
    expect(screen.getAllByRole("link")).toHaveLength(2)
    rerender(<DownloadNote files={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

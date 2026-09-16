import { describe, expect, it } from "vitest"
import { displaySource } from "@/lib/source"

describe("displaySource", () => {
  it("rewrites registry ui imports to the path the CLI installs to", () => {
    const src = 'import { Foo } from "@/registry/mewo/ui/foo"\nimport { cn } from "@/lib/utils"\n'
    expect(displaySource(src)).toBe('import { Foo } from "@/components/ui/foo"\nimport { cn } from "@/lib/utils"\n')
  })

  it("leaves everything else untouched", () => {
    const src = 'import { buttonVariants } from "@/components/ui/button"\n'
    expect(displaySource(src)).toBe(src)
  })
})

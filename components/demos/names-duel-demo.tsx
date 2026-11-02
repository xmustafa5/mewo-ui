import { NAMES_DUEL_CATS } from "./cat-pictures"
import { NamesDuel } from "@/registry/mewo/blocks/names-duel"
import type { PropDoc } from "./types"

const credit = (title: string, by: string) => ({ title, by, line: "A museum somewhere. Placeholder photograph.", href: "#" })

export default function NamesDuelDemo() {
  // the stage pins to its nearest scroll container, so the duels scroll inside this box: one picture, then two
  return (
    <div className="h-[70vh] w-full overflow-y-auto rounded-xl border bg-background [container-type:inline-size]">
      <NamesDuel top="First ruler" bottom="Second ruler" pictures={[{ ...NAMES_DUEL_CATS[0], credit: credit("A carved disc", "c. 2300 BCE") }]} />
      <NamesDuel
        top="Builder"
        bottom="Conqueror"
        pictures={[
          { ...NAMES_DUEL_CATS[1], credit: credit("A law stone", "c. 1750 BCE") },
          { ...NAMES_DUEL_CATS[2], credit: credit("A city gate", "c. 575 BCE") },
        ]}
      />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "top", type: "string", default: '"First ruler"', description: "The name that rises first, rests at the top, then shrinks away." },
  { name: "bottom", type: "string", default: '"Second ruler"', description: "The name that follows it, small, and grows into its place." },
  { name: "pictures", type: "{ src; ratio; alt?; credit? }[]", default: "one placeholder", description: "One picture, or two side by side as layers (a third is left out), each with an optional credit under it." },
  { name: "length", type: "number", default: "3.1", description: "Viewport heights of scroll the duel plays over once its stage is pinned." },
  { name: "className", type: "string", description: "Merged onto the section." },
]

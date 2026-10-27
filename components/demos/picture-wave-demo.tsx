import { PictureWaveCycle } from "./picture-wave-cycle"
import type { PropDoc } from "./types"

export default function PictureWaveDemo() {
  return (
    <div className="h-[min(70vh,560px)] w-full overflow-hidden rounded-xl border bg-background">
      <PictureWaveCycle />
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "images", type: "{ src: string; aspect: number }[]", default: "72 picsum photos", description: "The pictures on the cards, with their proportions (width ÷ height), served with CORS; each depth layer of the field cycles through them in its own order (up to 100)." },
  { name: "words", type: "string[]", default: '["Between", "Rivers"]', description: "The two words riding the wave's ends; an empty list leaves them out." },
  { name: "state", type: '"wave" | "field"', default: '"field"', description: "\"wave\": the cards fly in and hold one period of a sine between the words. \"field\": the wave then bursts into a field over the whole box. Back to \"wave\", it gathers again." },
  { name: "orientation", type: '"auto" | "horizontal" | "vertical"', default: '"auto"', description: "The wave's long axis. \"auto\" lays it across, and stands it up in a box narrower than 900px, as on a phone." },
  { name: "lean", type: "number", default: "1", description: "How far the field's cards lean away from the pointer, the nearer ones more: 0 holds them still." },
  { name: "float", type: "boolean", default: "true", description: "The field's slow idle drift. Off, nothing moves once the cards settle and the pointer rests." },
  { name: "onPick", type: "(index: number) => void", description: "Called with a picture's index in images when its card in the field is clicked." },
  { name: "controlsRef", type: "Ref<{ replay() }>", description: "replay() flies the wave in again." },
  { name: "dpr", type: "number", description: "Overrides the device pixel ratio, which is capped at 2." },
  { name: "className", type: "string", description: "Merged onto the root, which fills its parent: give the parent a size." },
]

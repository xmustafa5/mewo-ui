import { RichText } from "@/registry/mewo/ui/rich-text"
import type { PropDoc } from "./types"

export default function RichTextDemo() {
  return <RichText className="max-w-xl font-heading text-3xl" text="Copy with *italic* words and a [linked phrase] that opens in a new tab." href="https://example.com" />
}

export const props: PropDoc[] = [
  { name: "text", type: "string", default: '"Story copy with *italic* words and a [linked phrase]."', description: "Copy with *italic* and [linked words] markup." },
  { name: "href", type: "string", default: '"#"', description: "Where the linked words point." },
  { name: "className", type: "string", description: "Merged onto the paragraph." },
]

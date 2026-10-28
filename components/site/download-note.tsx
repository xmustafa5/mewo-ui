import { Download } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Some items load a file that no install can carry (a 3D model). The page offers each one for download and says
 * where it goes: under the project's `public/`, at the same path the item reads it from.
 */
export function DownloadNote({ files, className }: { files: string[]; className?: string }) {
  if (!files.length) return null
  return (
    <div role="note" data-slot="download-note" className={cn("rounded-lg border bg-card/60 px-4 py-3 text-sm", className)}>
      <p className="font-medium">{files.length === 1 ? "It needs one more file." : "It needs a few more files."}</p>
      <p className="mt-1 text-muted-foreground">
        The install brings the code only. Download {files.length === 1 ? "this file" : "these files"} and put{" "}
        {files.length === 1 ? "it" : "them"} in your project&apos;s <code className="font-mono text-foreground">public/</code> folder, at the
        same path:
      </p>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {files.map((file) => (
          <li key={file}>
            <a
              href={`/${file}`}
              download
              className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-2.5 font-mono text-xs transition-colors hover:bg-accent"
            >
              <Download className="size-3.5" aria-hidden />
              public/{file}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

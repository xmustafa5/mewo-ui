import { codeToHtml } from "shiki"
import { cn } from "@/lib/utils"

export async function CodeBlock({ code, lang = "tsx", className }: { code: string; lang?: string; className?: string }) {
  const html = await codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  })
  return (
    <div
      className={cn(
        "max-h-160 overflow-auto rounded-2xl border bg-card/60 text-[13px] leading-relaxed scrollbar-thin [&_pre]:w-fit [&_pre]:min-w-full [&_pre]:p-5",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

import { codeToHtml } from "shiki"

export async function CodeBlock({ code, lang = "tsx" }: { code: string; lang?: string }) {
  const html = await codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  })
  return (
    <div
      className="overflow-x-auto rounded-lg border bg-muted/40 text-sm [&_pre]:p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

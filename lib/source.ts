/** For display only: show imports the way the shadcn CLI writes them into a consumer project. */
export function displaySource(source: string): string {
  return source.replace(/@\/registry\/mewo\/ui\//g, "@/components/ui/")
}

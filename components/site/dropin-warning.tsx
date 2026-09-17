import { SHADCN_VERSION } from "@/lib/site"

/**
 * Drop-ins are the one kind of item whose install is destructive: the shadcn CLI writes the file
 * straight over `components/ui/<name>.tsx` in the consumer's working app. This sits immediately
 * above the install command so nobody copies it without having read this first.
 */
export function DropInWarning({ name }: { name: string }) {
  return (
    <div
      role="note"
      data-slot="dropin-warning"
      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
    >
      <p className="font-medium">This replaces shadcn&apos;s {name}.</p>
      <p className="mt-1 text-muted-foreground">
        Installing <strong className="font-medium text-foreground">overwrites</strong>{" "}
        <code className="font-mono">components/ui/{name}.tsx</code> in your project. The exports and prop types are
        identical, so your imports and JSX keep working — verified against{" "}
        <strong className="font-medium text-foreground">shadcn CLI {SHADCN_VERSION}</strong>. Commit your work first,
        and re-check this page before upgrading shadcn.
      </p>
    </div>
  )
}

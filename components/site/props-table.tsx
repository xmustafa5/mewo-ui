import type { PropDoc } from "@/components/demos/types"

export function PropsTable({ props }: { props: PropDoc[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card/40">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-card/60 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Prop</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Default</th>
            <th className="px-4 py-3 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-t first:border-t-0">
              <td className="px-4 py-3 align-top">
                <code className="rounded-md bg-accent px-1.5 py-0.5 font-mono text-xs text-brand-text">{prop.name}</code>
              </td>
              <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">{prop.type}</td>
              <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">{prop.default ?? "—"}</td>
              <td className="px-4 py-3 align-top text-muted-foreground">{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

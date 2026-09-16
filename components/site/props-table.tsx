import type { PropDoc } from "@/components/demos/types"

export function PropsTable({ props }: { props: PropDoc[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Prop</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Default</th>
            <th className="px-4 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-t">
              <td className="px-4 py-2 font-mono text-xs">{prop.name}</td>
              <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{prop.type}</td>
              <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{prop.default ?? "—"}</td>
              <td className="px-4 py-2">{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

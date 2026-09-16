"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export type SidebarGroup = {
  group: string
  label: string
  items: { name: string; title: string }[]
}

export function Sidebar({ groups }: { groups: SidebarGroup[] }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Documentation" className="space-y-6 text-sm">
      <Link
        href="/docs"
        aria-current={pathname === "/docs" ? "page" : undefined}
        className={cn("block font-medium", pathname === "/docs" ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
      >
        Introduction
      </Link>
      {groups.map((group) => (
        <div key={group.group}>
          <p className="mb-2 font-medium">{group.label}</p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const href = `/docs/${item.name}`
              const active = pathname === href
              return (
                <li key={item.name}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-2 py-1",
                      active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

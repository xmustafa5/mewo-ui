import Link from "next/link"
import { MewoCat } from "@/components/site/mewo-cat"

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center">
      <MewoCat className="h-24 w-auto" />
      <p className="mt-4 font-mono text-sm text-brand-text">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">This page wandered off.</h1>
      <p className="text-muted-foreground">That page or component does not exist.</p>
      <Link
        href="/"
        className="mt-2 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-[filter] hover:brightness-110"
      >
        Back home
      </Link>
    </div>
  )
}

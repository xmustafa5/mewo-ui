import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Not found</h1>
      <p className="text-muted-foreground">That page or component does not exist.</p>
      <Link href="/" className="underline underline-offset-4">
        Back home
      </Link>
    </div>
  )
}

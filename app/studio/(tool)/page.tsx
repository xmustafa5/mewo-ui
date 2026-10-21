import type { Metadata } from "next"
import { Suspense } from "react"
import { BackgroundStudio } from "@/components/studio/background-studio"
import { Spinner } from "@/components/studio/ui"

export const metadata: Metadata = {
  title: "Background Studio",
  description: "Tune a mewo background live, drop sample content over it, then export the code, an image or a video.",
}

function StudioFallback() {
  return (
    <div className="grid min-h-0 flex-1 place-items-center rounded-2xl border bg-card/50">
      <Spinner />
    </div>
  )
}

export default function StudioPage() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-360 flex-col px-4 py-4 sm:px-6">
      {/* The studio reads the URL on the client, so it renders behind a boundary and the shell is static. */}
      <Suspense fallback={<StudioFallback />}>
        <BackgroundStudio />
      </Suspense>
    </div>
  )
}

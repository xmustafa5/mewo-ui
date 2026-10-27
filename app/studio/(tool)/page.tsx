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
    // the whole window under the header (4rem and its border): the stage is as wide as the window allows
    <div className="flex h-[calc(100dvh-4rem-1px)] w-full flex-col px-4 py-4 sm:px-6">
      {/* The studio reads the URL on the client, so it renders behind a boundary and the shell is static. */}
      <Suspense fallback={<StudioFallback />}>
        <BackgroundStudio />
      </Suspense>
    </div>
  )
}

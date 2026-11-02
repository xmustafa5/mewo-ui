"use client"

import * as React from "react"
import { optimized, optimizedAll, optimizedOne } from "@/components/demos/cat-pictures"
import { ZoomPanelScroll } from "@/components/demos/zoom-panel-scroll"
import { DEFAULT_FIRST, DEFAULT_SECOND, DEFAULT_SKETCHES, PortraitPair } from "@/registry/mewo/blocks/portrait-pair"
import { AlbumRail, DEFAULT_ALBUMS } from "@/registry/mewo/ui/album-rail"
import { ConcaveCarousel, DEFAULT_ITEMS as CONCAVE_DEFAULTS } from "@/registry/mewo/ui/concave-carousel"
import { DEFAULT_IMAGE as DEPTH_CARD_DEFAULT, DepthCard } from "@/registry/mewo/ui/depth-card"
import { DEFAULT_IMAGES as PARALLAX_DEFAULTS, ParallaxCarousel } from "@/registry/mewo/ui/parallax-carousel"
import { PICTURES as ORBIT_DEFAULTS, PictureOrbit } from "@/registry/mewo/ui/picture-orbit"
import { DEFAULT_IMAGE as TRAIL_DEFAULT, PictureTrail } from "@/registry/mewo/ui/picture-trail"
import { PICTURES as WAVE_DEFAULTS } from "@/registry/mewo/ui/picture-wave"
import { DEFAULT_ITEMS as PRISM_DEFAULTS, PrismCarousel } from "@/registry/mewo/ui/prism-carousel"
import { DEFAULT_SRC as SCROLL_MASK_DEFAULT, ScrollMask } from "@/registry/mewo/ui/scroll-mask"
import { DEFAULT_ITEMS as SKEWED_DEFAULTS, SkewedCarousel } from "@/registry/mewo/ui/skewed-carousel"
import { DEFAULT_IMAGES as TILTED_DEFAULTS, TiltedTiles } from "@/registry/mewo/ui/tilted-tiles"
import { DEFAULT_SRC as ZOOM_PANEL_DEFAULT } from "@/registry/mewo/ui/zoom-panel"
import { DEFAULT_SRC as ZOOM_PICTURE_DEFAULT, ZoomPicture } from "@/registry/mewo/ui/zoom-picture"

/*
 * Every piece's default pictures, as the site shows them: the same cats the registry files name, through the image
 * optimizer at the width each slot draws. A registry file is a client module, so a demo (rendered on the server)
 * cannot read its defaults; these wrappers do, and the Customize panels import the lists.
 */

export const PARALLAX_IMAGES = PARALLAX_DEFAULTS.map((src) => optimized(src, 1200))
export const PRISM_ITEMS = optimizedAll(PRISM_DEFAULTS, 1200)
export const CONCAVE_ITEMS = optimizedAll(CONCAVE_DEFAULTS, 1200)
export const SKEWED_ITEMS = SKEWED_DEFAULTS.map((item) => ({ ...item, image: optimized(item.image, 640) }))
export const ALBUMS = DEFAULT_ALBUMS.map((album) => ({ ...album, cover: optimized(album.cover, 640) }))
export const TILTED_IMAGES = TILTED_DEFAULTS.map((src) => optimized(src, 640))
export const DEPTH_CARD_IMAGE = optimized(DEPTH_CARD_DEFAULT, 640)
export const SCROLL_MASK_SRC = optimized(SCROLL_MASK_DEFAULT, 1200)
export const ZOOM_PANEL_SRC = optimized(ZOOM_PANEL_DEFAULT, 1200)
export const ZOOM_PICTURE_SRC = optimized(ZOOM_PICTURE_DEFAULT, 1200)
export const TRAIL_IMAGE = optimizedOne(TRAIL_DEFAULT, 1200)
export const WAVE_PICTURES = optimizedAll(WAVE_DEFAULTS, 256)
export const ORBIT_PICTURES = optimizedAll(ORBIT_DEFAULTS, 256)
export const PORTRAIT_FIRST = optimizedOne(DEFAULT_FIRST, 1200)
export const PORTRAIT_SECOND = optimizedOne(DEFAULT_SECOND, 1200)
export const PORTRAIT_SKETCHES = optimizedAll(DEFAULT_SKETCHES, 256)

export const ParallaxCarouselCats = (props: Omit<React.ComponentProps<typeof ParallaxCarousel>, "images">) => <ParallaxCarousel images={PARALLAX_IMAGES} {...props} />
export const PrismCarouselCats = (props: Omit<React.ComponentProps<typeof PrismCarousel>, "items">) => <PrismCarousel items={PRISM_ITEMS} {...props} />
export const ConcaveCarouselCats = (props: Omit<React.ComponentProps<typeof ConcaveCarousel>, "items">) => <ConcaveCarousel items={CONCAVE_ITEMS} {...props} />
export const SkewedCarouselCats = (props: Omit<React.ComponentProps<typeof SkewedCarousel>, "items">) => <SkewedCarousel items={SKEWED_ITEMS} {...props} />
export const AlbumRailCats = (props: Omit<React.ComponentProps<typeof AlbumRail>, "albums">) => <AlbumRail albums={ALBUMS} {...props} />
export const TiltedTilesCats = (props: Omit<React.ComponentProps<typeof TiltedTiles>, "images">) => <TiltedTiles images={TILTED_IMAGES} {...props} />
export const DepthCardCats = (props: Omit<React.ComponentProps<typeof DepthCard>, "image">) => <DepthCard image={DEPTH_CARD_IMAGE} {...props} />
export const ScrollMaskCats = (props: Omit<React.ComponentProps<typeof ScrollMask>, "src">) => <ScrollMask src={SCROLL_MASK_SRC} {...props} />
export const ZoomPanelScrollCats = (props: Omit<React.ComponentProps<typeof ZoomPanelScroll>, "src">) => <ZoomPanelScroll src={ZOOM_PANEL_SRC} {...props} />
export const ZoomPictureCats = (props: Omit<React.ComponentProps<typeof ZoomPicture>, "src">) => <ZoomPicture src={ZOOM_PICTURE_SRC} {...props} />
export const PictureTrailCats = (props: Omit<React.ComponentProps<typeof PictureTrail>, "image">) => <PictureTrail image={TRAIL_IMAGE} {...props} />
export const PictureOrbitCats = (props: Omit<React.ComponentProps<typeof PictureOrbit>, "images">) => <PictureOrbit images={ORBIT_PICTURES} {...props} />
export const PortraitPairCats = (props: Omit<React.ComponentProps<typeof PortraitPair>, "first" | "second" | "sketches">) => (
  <PortraitPair first={PORTRAIT_FIRST} second={PORTRAIT_SECOND} sketches={PORTRAIT_SKETCHES} {...props} />
)

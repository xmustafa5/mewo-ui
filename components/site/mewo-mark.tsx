import { cn } from "@/lib/utils"

/** The mark's own drawing box: the cat and its pixel steps, cropped tight. */
export const MARK_VIEWBOX = { x: 437, y: 185, width: 810, height: 549 } as const

/** The two stepped squares at the cat's back — the pixel motif the site borrows. */
export const PIXEL_PATHS = ["M1191 676L1135 676L1135 620L1191 620Z", "M1247 732L1191 732L1191 676L1247 676Z"]

export const BODY_PATH =
  "M583 383L624 214C624 214 628 196 642 196C656 195 664 197 666 198C668 200 789 336 808 357C827 378 832 385 858 352C885 319 970 215 989 205C1007 195 1033 185 1039 213C1044 240 1068 342 1069 354C1070 365 1074 385 1074 385C1074 385 1078 392 1086 400C1095 408 1133 447 1151 481C1169 514 1184 557 1184 557C1184 557 1190 569 1180 568C1169 567 1136 568 1136 568L1135 620L1083 620C1083 620 1081 623 1081 631C1081 638 1079 676 1079 676L1135 676L1135 730C1135 730 1136 734 1127 734C1118 734 513 732 513 732C513 732 469 721 459 698C448 675 437 660 459 592C481 525 515 448 548 417C582 386 583 383 583 383"

export const EYE_PATHS = [
  "M665 446L806 446C806 446 813 456 810 465C806 474 785 498 753 500C722 501 686 494 676 482C666 470 661 469 665 446",
  "M853 446L994 446C994 446 1001 456 998 465C994 474 973 498 941 500C910 501 874 494 864 482C854 470 849 469 853 446",
]

/** Pupil centres. They sit on the lid line, so only their lower half shows — the cat's sleepy look. */
export const PUPILS = [
  { cx: 735, cy: 451, r: 17.5 },
  { cx: 925, cy: 451, r: 17.5 },
] as const

const viewBox = `${MARK_VIEWBOX.x} ${MARK_VIEWBOX.y} ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`

/**
 * The static mewo cat, for the header, footer and anywhere the mark stands in for the name.
 * The cat takes `currentColor`; `eyes` colours the eye whites, for the inverted cat on a brand fill.
 */
export function MewoMark({ className, eyes = "#fff", ...props }: React.ComponentProps<"svg"> & { eyes?: string }) {
  return (
    <svg
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("text-brand", className)}
      {...props}
    >
      <path fill="currentColor" d={BODY_PATH} />
      {PIXEL_PATHS.map((d) => (
        <path key={d} fill="currentColor" d={d} />
      ))}
      {EYE_PATHS.map((d) => (
        <path key={d} fill={eyes} d={d} />
      ))}
      {PUPILS.map((pupil) => (
        <circle key={pupil.cx} fill="currentColor" {...pupil} />
      ))}
    </svg>
  )
}

/** The stepped-square motif on its own: three cells on a diagonal, like the cat's back. */
export function PixelSteps({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 3 3" aria-hidden className={cn("text-brand", className)} {...props}>
      <rect x="0" y="0" width="1" height="1" fill="currentColor" />
      <rect x="1" y="1" width="1" height="1" fill="currentColor" />
      <rect x="2" y="2" width="1" height="1" fill="currentColor" />
    </svg>
  )
}

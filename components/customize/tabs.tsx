"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/mewo/ui/tabs"
import { Select } from "./controls"
import { CustomizeFrame } from "./frame"
import type { CustomizeProps } from "./types"
import { changedProps } from "./usage"
import { useCustomize } from "./use-customize"

type Orientation = "horizontal" | "vertical"
type Variant = "default" | "line"

export const DEFAULTS = { orientation: "horizontal" as Orientation, variant: "default" as Variant }
// `variant` is a prop of TabsList, not of the root: the usage prints it on the list, inside the children
export const DEMO_ONLY = ["variant"] as const

const ORIENTATIONS = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
] as const
const VARIANTS = [
  { value: "default", label: "Default" },
  { value: "line", label: "Line" },
] as const
const PANELS = [
  { value: "account", label: "Account", text: "Your account details." },
  { value: "password", label: "Password", text: "Change your password here." },
  { value: "team", label: "Team", text: "Invite your team." },
]

export default function TabsCustomize({ code }: CustomizeProps) {
  const { values, defaults, changed, run, set, reset, replay } = useCustomize(DEFAULTS)
  const list = values.variant === DEFAULTS.variant ? "<TabsList>" : `<TabsList variant="${values.variant}">`
  const children = [
    list,
    ...PANELS.map((panel) => `  <TabsTrigger value="${panel.value}">${panel.label}</TabsTrigger>`),
    "</TabsList>",
    ...PANELS.map((panel) => `<TabsContent value="${panel.value}">${panel.text}</TabsContent>`),
  ].join("\n")
  return (
    <CustomizeFrame
      code={code}
      run={run}
      onReplay={replay}
      changed={changed}
      onReset={reset}
      usage={{ name: "Tabs", item: "tabs", props: changedProps(values, defaults, DEMO_ONLY, { defaultValue: PANELS[0].value }), children }}
      preview={
        <div className="w-full max-w-md">
          {/* a new layout mounts fresh, so the indicator does not spring across from the old one */}
          <Tabs key={values.orientation} defaultValue={PANELS[0].value} orientation={values.orientation}>
            <TabsList variant={values.variant}>
              {PANELS.map((panel) => (
                <TabsTrigger key={panel.value} value={panel.value}>
                  {panel.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {PANELS.map((panel) => (
              <TabsContent key={panel.value} value={panel.value}>
                {panel.text}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      }
    >
      <Select label="Variant" options={VARIANTS} value={values.variant} onChange={(value) => set("variant", value)} />
      <Select label="Orientation" options={ORIENTATIONS} value={values.orientation} onChange={(value) => set("orientation", value)} />
    </CustomizeFrame>
  )
}

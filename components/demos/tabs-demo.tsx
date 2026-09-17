import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/registry/mewo/ui/tabs"
import type { PropDoc } from "./types"

export default function TabsDemo() {
  return (
    <div className="grid w-full max-w-md gap-8">
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Your account details.</TabsContent>
        <TabsContent value="password">Change your password here.</TabsContent>
        <TabsContent value="team">Invite your team.</TabsContent>
      </Tabs>

      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">The line variant slides too.</TabsContent>
        <TabsContent value="activity">Recent activity.</TabsContent>
      </Tabs>
    </div>
  )
}

export const props: PropDoc[] = [
  { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Layout direction. On Tabs." },
  { name: "variant", type: '"default" | "line"', default: '"default"', description: "Highlight style. On TabsList." },
  { name: "value", type: "string", description: "Identifies a trigger and its panel. On TabsTrigger and TabsContent." },
  { name: "className", type: "string", description: "Merged onto any part." },
]

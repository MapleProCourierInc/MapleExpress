import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminDriversPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Drivers</h1>
          <p className="text-muted-foreground">Manage driver onboarding and account readiness from one place.</p>
        </div>
        <Button disabled>Invite Driver (Coming soon)</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invite new drivers</CardTitle>
            <CardDescription>Start onboarding by inviting drivers into the MapleXpress platform.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Driver invitations and account bootstrap actions will be available in the next release.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provisioning status</CardTitle>
            <CardDescription>Track profile completion and onboarding progress for invited drivers.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            More tools coming soon for operational visibility and follow-up workflows.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import Link from "next/link"
import { AlertCircle, Plus } from "lucide-react"
import { ServiceZonesOverview } from "@/components/admin/service-zones-overview"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { listServiceZones } from "@/lib/admin-service-zones-service"

export default async function AdminServiceZonesPage() {
  const { data, error } = await listServiceZones()

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Zones</h1>
          <p className="text-muted-foreground">View mapped zones, focus coverage areas, and manage active status.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/service-zones/new">
            <Plus className="mr-1 h-4 w-4" />
            Add Service Zone
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error.message || "Failed to load service zones"}</AlertTitle>
          <AlertDescription>Please refresh and try again.</AlertDescription>
        </Alert>
      )}

      <ServiceZonesOverview initialZones={data?.serviceZones || []} />
    </div>
  )
}

import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { DriversFilters } from "@/components/admin/drivers-filters"
import { DriversGrid } from "@/components/admin/drivers-grid"
import { InviteDriverDialog } from "@/components/admin/invite-driver-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminDrivers } from "@/lib/admin-drivers-service"

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 20

function normalizeNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export default async function AdminDriversPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = (await searchParams) ?? {}
  const getValue = (key: string) => {
    const value = resolved[key]
    if (Array.isArray(value)) return value[0] || ""
    return value || ""
  }

  const filters = {
    email: getValue("email").trim(),
    name: getValue("name").trim(),
    station: getValue("station").trim(),
    companyName: getValue("companyName").trim(),
    profileStatus: getValue("profileStatus").trim(),
    page: normalizeNumber(getValue("page"), DEFAULT_PAGE),
    size: normalizeNumber(getValue("size"), DEFAULT_SIZE) || DEFAULT_SIZE,
  }

  const { data, error } = await getAdminDrivers(filters)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Drivers</h1>
          <p className="text-muted-foreground">Search, review, and track driver onboarding records.</p>
        </div>
        <InviteDriverDialog />
      </div>

      <DriversFilters
        initialFilters={{
          email: filters.email,
          name: filters.name,
          station: filters.station,
          companyName: filters.companyName,
          profileStatus: filters.profileStatus,
          size: filters.size,
        }}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error.message || "Failed to load drivers"}</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              {error.errors?.length ? (
                <ul className="list-disc pl-4">
                  {error.errors.map((entry, idx) => (
                    <li key={`${entry.field}-${idx}`}>
                      {entry.field ? `${entry.field}: ` : ""}
                      {entry.message || "Invalid value"}
                    </li>
                  ))}
                </ul>
              ) : null}
              {error.errorDetails?.errorType || error.errorDetails?.errorCode ? (
                <p className="text-xs opacity-90">
                  Details: {error.errorDetails?.errorType || "Unknown"}
                  {error.errorDetails?.errorCode !== undefined ? ` (#${error.errorDetails.errorCode})` : ""}
                </p>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!error && data && data.items.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No drivers found</CardTitle>
            <CardDescription>Try adjusting your filters and applying the search again.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!error && data && data.items.length > 0 && <DriversGrid data={data} filters={filters} />}

      {!error && !data && (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load drivers</CardTitle>
            <CardDescription>Please try again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/drivers?page=0&size=20">Retry</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { DriversFilters } from "@/components/admin/drivers-filters"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAdminDrivers } from "@/lib/admin-drivers-service"

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 20

function normalizeNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function formatDate(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

function statusVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "APPROVED":
      return "default"
    case "REJECTED":
      return "destructive"
    case "DRIVER_LICENSE_MISSING":
      return "secondary"
    default:
      return "outline"
  }
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

  const buildHref = (page: number) => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(filters.size))

    if (filters.email) params.set("email", filters.email)
    if (filters.name) params.set("name", filters.name)
    if (filters.station) params.set("station", filters.station)
    if (filters.companyName) params.set("companyName", filters.companyName)
    if (filters.profileStatus) params.set("profileStatus", filters.profileStatus)

    return `/admin/drivers?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Drivers</h1>
          <p className="text-muted-foreground">Search, review, and track driver onboarding records.</p>
        </div>
        <Button disabled>Invite Driver (Coming soon)</Button>
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

      {!error && data && data.items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Profile Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => {
                  const name = `${item.firstName || ""} ${item.lastName || ""}`.trim() || "—"
                  return (
                    <TableRow key={item.driverId}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{item.email || "—"}</TableCell>
                      <TableCell>{item.phone || "—"}</TableCell>
                      <TableCell>{item.station || "—"}</TableCell>
                      <TableCell>{item.companyName || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(item.profileStatus)}>{item.profileStatus || "UNKNOWN"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isVerified ? "default" : "secondary"}>{item.isVerified ? "Yes" : "No"}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(item.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" disabled>
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Showing {data.items.length} of {data.totalElements} driver records
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Page {data.totalPages === 0 ? 0 : data.page + 1} of {data.totalPages}
                </span>
                <Pagination className="w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      {data.page > 0 ? (
                        <PaginationPrevious href={buildHref(data.page - 1)} />
                      ) : (
                        <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Previous</span>
                      )}
                    </PaginationItem>
                    <PaginationItem>
                      {data.page + 1 < data.totalPages ? (
                        <PaginationNext href={buildHref(data.page + 1)} />
                      ) : (
                        <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Next</span>
                      )}
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!error && !data && (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load drivers</CardTitle>
            <CardDescription>Please try again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/drivers?page=0&size=20">Retry</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

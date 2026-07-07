import {
  Activity,
  Mail,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  RadioTower,
  Truck,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type {
  ActiveDriverSessionsResponse,
  DriverManagementApiError,
  DriverSession,
} from "@/types/admin-driver-sessions"

type ActiveDriverSessionsPanelProps = {
  data: ActiveDriverSessionsResponse | null
  error?: DriverManagementApiError | null
  textError?: string | null
}

function field(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-"
  return String(value)
}

function humanize(value?: string | null) {
  if (!value) return "Unknown"
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatDateTime(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

function formatKm(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-"
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`
}

function statusBadgeClass(status?: string | null) {
  const normalized = String(status || "").toUpperCase()

  if (["IDLE", "ACTIVE", "ONLINE"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
  }
  if (["EN_ROUTE", "BUSY"].includes(normalized)) {
    return "border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200"
  }
  if (["ON_BREAK", "STALE"].includes(normalized)) {
    return "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
  }
  if (["OFFLINE", "ENDED", "CANCELLED"].includes(normalized)) {
    return "border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
  }

  return "border-muted bg-muted text-foreground"
}

function getCoordinates(session: DriverSession) {
  const coordinates = session.lastKnownLocation?.coordinates?.coordinates
  if (!coordinates || coordinates.length < 2) return null

  const [longitude, latitude] = coordinates
  if (typeof latitude !== "number" || typeof longitude !== "number") return null
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return { latitude, longitude }
}

function formatLocation(session: DriverSession) {
  const coords = getCoordinates(session)
  if (!coords) return "No location"
  return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
}

function orderCount(session: DriverSession) {
  return session.orders?.length || 0
}

function driverDisplayId(session: DriverSession) {
  return session.driverId || "Driver ID unavailable"
}

function sortSessions(sessions: DriverSession[]) {
  return [...sessions].sort((left, right) => {
    const leftOnline = String(left.connectivityStatus || "").toUpperCase() === "ONLINE" ? 0 : 1
    const rightOnline = String(right.connectivityStatus || "").toUpperCase() === "ONLINE" ? 0 : 1
    if (leftOnline !== rightOnline) return leftOnline - rightOnline
    return orderCount(left) - orderCount(right)
  })
}

function ActiveDriverCard({ session }: { session: DriverSession }) {
  const activeOrderCount = orderCount(session)
  const heartbeat = session.lastHeartbeatAt || session.lastKnownLocation?.serverReceivedAt

  return (
    <article className="rounded-md border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{field(session.driverNameSnapshot)}</p>
          <p className="truncate text-xs text-muted-foreground">{driverDisplayId(session)}</p>
        </div>
        <Badge variant="outline" className={statusBadgeClass(session.currentStatus)}>
          {humanize(session.currentStatus)}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border bg-muted/30 p-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Truck className="h-3.5 w-3.5" />
            Assigned
          </div>
          <p className="mt-1 text-sm font-semibold">{activeOrderCount}</p>
        </div>
        <div className="rounded-md border bg-muted/30 p-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PackageCheck className="h-3.5 w-3.5" />
            Delivered
          </div>
          <p className="mt-1 text-sm font-semibold">{field(session.totalDeliveries)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline" className={statusBadgeClass(session.connectivityStatus)}>
          {humanize(session.connectivityStatus)}
        </Badge>
        <Badge variant="outline" className={statusBadgeClass(session.sessionStatus)}>
          {humanize(session.sessionStatus)}
        </Badge>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
        {session.phone ? (
          <div className="flex min-w-0 items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{session.phone}</span>
          </div>
        ) : null}
        {session.email ? (
          <div className="flex min-w-0 items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{session.email}</span>
          </div>
        ) : null}
        <div className="flex min-w-0 items-center gap-2">
          <Navigation className="h-3.5 w-3.5 shrink-0" />
          <span>{formatKm(session.totalDistanceTravelledKm)} travelled</span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{formatLocation(session)}</span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <RadioTower className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Heartbeat {formatDateTime(heartbeat)}</span>
        </div>
      </div>

      {session.orders?.length ? (
        <>
          <Separator className="my-3" />
          <div className="space-y-2">
            {session.orders.slice(0, 3).map((order, index) => (
              <div key={order.orderFulfillmentId || `${session.sessionId}-order-${index}`} className="rounded-md bg-muted/40 p-2 text-xs">
                <p className="truncate font-medium">{field(order.trackingNumber || order.orderFulfillmentId)}</p>
                <p className="text-muted-foreground">
                  {humanize(order.taskStatus)} / {humanize(order.fulfillmentStatus)}
                </p>
              </div>
            ))}
            {session.orders.length > 3 ? (
              <p className="text-xs text-muted-foreground">+{session.orders.length - 3} more assigned orders</p>
            ) : null}
          </div>
        </>
      ) : null}
    </article>
  )
}

export function ActiveDriverSessionsPanel({ data, error, textError }: ActiveDriverSessionsPanelProps) {
  const sessions = sortSessions(data?.items || [])

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="border-b pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Active Drivers</CardTitle>
            <CardDescription>Online sessions for assignment decisions.</CardDescription>
          </div>
          <Badge variant="secondary">{sessions.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="max-h-[calc(100vh-12rem)] space-y-3 overflow-y-auto p-3">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>{error.message || "Unable to load active drivers"}</AlertTitle>
            <AlertDescription>
              {textError || `Driver management returned status ${error.status || "unknown"}.`}
            </AlertDescription>
          </Alert>
        ) : null}

        {!error && sessions.length === 0 ? (
          <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
            No active driver sessions found.
          </div>
        ) : null}

        {!error && sessions.length ? (
          <>
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Drivers are sorted by online status and current assigned order count.
            </div>
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <ActiveDriverCard key={session.sessionId || session.driverId || `driver-session-${index}`} session={session} />
              ))}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

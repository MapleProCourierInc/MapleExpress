"use client"

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CircleOff,
  Loader2,
  Mail,
  Map as MapIcon,
  MapPin,
  Navigation,
  Package,
  Phone,
  RadioTower,
  Route,
  SlidersHorizontal,
  Truck,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useScript } from "@/hooks/use-script"
import { apiFetch } from "@/lib/client-api"
import { GOOGLE_MAPS_API_KEY } from "@/lib/config"
import type {
  ActiveDriverSessionsResponse,
  DriverManagementApiError,
  DriverSession,
} from "@/types/admin-driver-sessions"
import {
  ADMIN_ATTENTION_FULFILLMENT_STATUSES,
  type FulfillmentAddress,
  type FulfillmentStopDetails,
  type OrderFulfillment,
  type OrderFulfillmentQuery,
  type OrderFulfillmentsResponse,
} from "@/types/admin-order-fulfillments"

type DispatchBoardProps = {
  data: OrderFulfillmentsResponse
  filters: OrderFulfillmentQuery
  driverSessionsData: ActiveDriverSessionsResponse | null
  driverSessionsError?: DriverManagementApiError | null
  driverSessionsTextError?: string | null
}

type LatLngLiteral = {
  lat: number
  lng: number
}

type ResolvedStops = {
  pickup: LatLngLiteral | null
  dropoff: LatLngLiteral | null
  resolving: boolean
}

type DriverDistance = {
  distanceMeters: number | null
  distanceText: string
  durationText: string | null
  source: "google" | "straight-line" | "unavailable" | "loading"
}

type ShippingOrderGroup = {
  key: string
  shippingOrderId: string
  orders: OrderFulfillment[]
}

type DriverAssignmentAction = "assign" | "assigned" | "reassign" | "select"
type DriverAssignmentPlan = {
  action: DriverAssignmentAction
  ordersToAssign: OrderFulfillment[]
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

function formatDistanceKm(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  const kilometers = value / 1000
  if (kilometers > 0 && kilometers < 0.01) return "<0.01 km"
  return `${kilometers.toLocaleString(undefined, { maximumFractionDigits: 2 })} km`
}

function formatAddress(address?: FulfillmentAddress | null) {
  if (!address) return "-"
  const line = [address.streetAddress, address.addressLine2].filter(Boolean).join(", ")
  const city = [address.city, address.province, address.postalCode].filter(Boolean).join(", ")
  return [line, city].filter(Boolean).join(" | ") || field(address.fullName)
}

function orderKey(item: OrderFulfillment) {
  return item.id || item.trackingNumber || item.shippingOrderId || item.sourceOrderId || ""
}

function shippingOrderGroupKey(item: OrderFulfillment) {
  return item.shippingOrderId ? `shipping-order:${item.shippingOrderId}` : `fulfillment:${orderKey(item)}`
}

function groupOrderFulfillments(orders: OrderFulfillment[]): ShippingOrderGroup[] {
  const groups = new Map<string, ShippingOrderGroup>()

  orders.forEach((order) => {
    const key = shippingOrderGroupKey(order)
    const existing = groups.get(key)
    if (existing) {
      existing.orders.push(order)
      return
    }

    groups.set(key, {
      key,
      shippingOrderId: order.shippingOrderId || "No shipping order",
      orders: [order],
    })
  })

  return Array.from(groups.values())
}

function isFulfillmentAssigned(order: OrderFulfillment) {
  return Boolean(order.assignedDriverUserId || order.assignedDriverName)
}

function normalizeComparable(value?: string | null) {
  return String(value || "").trim().toLowerCase()
}

function isAssignedToDriver(order: OrderFulfillment, session: DriverSession) {
  const assignedUserId = normalizeComparable(order.assignedDriverUserId)
  const sessionUserId = normalizeComparable(session.userId)
  if (assignedUserId && sessionUserId && assignedUserId === sessionUserId) return true

  const assignedName = normalizeComparable(order.assignedDriverName)
  const sessionName = normalizeComparable(session.driverNameSnapshot)
  return Boolean(assignedName && sessionName && assignedName === sessionName)
}

function stopCoordinates(stop?: FulfillmentStopDetails | null): LatLngLiteral | null {
  const lat = stop?.coordinates?.latitude
  const lng = stop?.coordinates?.longitude
  if (typeof lat !== "number" || typeof lng !== "number") return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function driverCoordinates(session: DriverSession): LatLngLiteral | null {
  const coordinates = session.lastKnownLocation?.coordinates?.coordinates
  if (!coordinates || coordinates.length < 2) return null

  const [lng, lat] = coordinates
  if (typeof lat !== "number" || typeof lng !== "number") return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function orderCount(session: DriverSession) {
  return session.orders?.length || 0
}

function driverKey(session: DriverSession, index = 0) {
  return session.sessionId || session.driverId || session.userId || `driver-${index}`
}

function driverDisplayId(session: DriverSession) {
  return session.driverId || "Driver ID unavailable"
}

function statusBadgeClass(status?: string | null) {
  const normalized = String(status || "").toUpperCase()

  if (["IDLE", "ACTIVE", "ONLINE", "DELIVERED"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
  }
  if (["EN_ROUTE", "BUSY", "PICKED_UP", "IN_TRANSIT", "IN_PROGRESS", "END_OF_DAY"].includes(normalized)) {
    return "border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200"
  }
  if (["ON_BREAK", "STALE", "ASSIGNED", "CREATED", "CONFIRMED", "SCHEDULED", "PENDING"].includes(normalized)) {
    return "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
  }
  if (["OFFLINE", "ENDED", "CANCELLED", "FAILED", "PICKUP_FAILED", "DROP_OFF_FAILED", "RETURNED"].includes(normalized)) {
    return "border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
  }

  return "border-muted bg-muted text-foreground"
}

function packageSummary(item: OrderFulfillment) {
  const dims = item.packageDimensions
  const dimensionText =
    dims?.length || dims?.width || dims?.height
      ? [dims.length, dims.width, dims.height].map((value) => (value === null || value === undefined ? "-" : value)).join(" x ")
      : null

  return [item.itemDescription, dimensionText].filter(Boolean).join(" | ") || "-"
}

function haversineMeters(origin: LatLngLiteral, destination: LatLngLiteral) {
  const toRadians = (value: number) => (value * Math.PI) / 180
  const earthRadiusMeters = 6371000
  const dLat = toRadians(destination.lat - origin.lat)
  const dLng = toRadians(destination.lng - origin.lng)
  const lat1 = toRadians(origin.lat)
  const lat2 = toRadians(destination.lat)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusMeters * c
}

function metersToText(value: number) {
  if (value < 1000) return `${Math.round(value)} m`
  return `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`
}

function useResolvedStops(order: OrderFulfillment | null, scriptStatus: string): ResolvedStops {
  const [resolved, setResolved] = useState<ResolvedStops>({ pickup: null, dropoff: null, resolving: false })

  useEffect(() => {
    if (!order) {
      setResolved({ pickup: null, dropoff: null, resolving: false })
      return
    }

    const existingPickup = stopCoordinates(order.pickup)
    const existingDropoff = stopCoordinates(order.dropoff)

    if (existingPickup && existingDropoff) {
      setResolved({ pickup: existingPickup, dropoff: existingDropoff, resolving: false })
      return
    }

    if (scriptStatus !== "ready") {
      setResolved({ pickup: existingPickup, dropoff: existingDropoff, resolving: Boolean(!existingPickup || !existingDropoff) })
      return
    }

    const googleMaps = (window as any).google?.maps
    if (!googleMaps?.Geocoder) {
      setResolved({ pickup: existingPickup, dropoff: existingDropoff, resolving: false })
      return
    }

    let cancelled = false
    const geocoder = new googleMaps.Geocoder()

    const geocodeAddress = (address: string) =>
      new Promise<LatLngLiteral | null>((resolve) => {
        if (!address || address === "-") {
          resolve(null)
          return
        }

        geocoder.geocode({ address }, (results: any[], status: string) => {
          if (status !== "OK" || !results?.[0]?.geometry?.location) {
            resolve(null)
            return
          }

          const location = results[0].geometry.location
          resolve({ lat: location.lat(), lng: location.lng() })
        })
      })

    setResolved((current) => ({ ...current, resolving: true }))

    Promise.all([
      existingPickup ? Promise.resolve(existingPickup) : geocodeAddress(formatAddress(order.pickup?.address)),
      existingDropoff ? Promise.resolve(existingDropoff) : geocodeAddress(formatAddress(order.dropoff?.address)),
    ]).then(([pickup, dropoff]) => {
      if (cancelled) return
      setResolved({ pickup, dropoff, resolving: false })
    })

    return () => {
      cancelled = true
    }
  }, [order, scriptStatus])

  return resolved
}

function useDriverDistances(
  sessions: DriverSession[],
  pickup: LatLngLiteral | null,
  scriptStatus: string,
): Record<string, DriverDistance> {
  const [distances, setDistances] = useState<Record<string, DriverDistance>>({})

  useEffect(() => {
    if (!pickup) {
      setDistances({})
      return
    }

    const keyedSessions = sessions.map((session, index) => ({
      key: session.sessionId || session.driverId || session.userId || `driver-${index}`,
      session,
      coordinates: driverCoordinates(session),
    }))

    const next: Record<string, DriverDistance> = {}
    keyedSessions.forEach(({ key, coordinates }) => {
      next[key] = coordinates
        ? { distanceMeters: null, distanceText: "Calculating", durationText: null, source: "loading" }
        : { distanceMeters: null, distanceText: "No driver location", durationText: null, source: "unavailable" }
    })
    setDistances(next)

    const withCoordinates = keyedSessions.filter((entry) => entry.coordinates).slice(0, 25)
    if (!withCoordinates.length) return

    const setFallbackDistances = () => {
      setDistances((current) => {
        const fallback = { ...current }
        withCoordinates.forEach(({ key, coordinates }) => {
          if (!coordinates) return
          const meters = haversineMeters(coordinates, pickup)
          fallback[key] = {
            distanceMeters: meters,
            distanceText: metersToText(meters),
            durationText: null,
            source: "straight-line",
          }
        })
        return fallback
      })
    }

    if (scriptStatus !== "ready") {
      setFallbackDistances()
      return
    }

    const googleMaps = (window as any).google?.maps
    if (!googleMaps?.DistanceMatrixService) {
      setFallbackDistances()
      return
    }

    const service = new googleMaps.DistanceMatrixService()
    service.getDistanceMatrix(
      {
        origins: withCoordinates.map((entry) => entry.coordinates),
        destinations: [pickup],
        travelMode: googleMaps.TravelMode.DRIVING,
        unitSystem: googleMaps.UnitSystem.METRIC,
      },
      (response: any, status: string) => {
        if (status !== "OK" || !response?.rows) {
          setFallbackDistances()
          return
        }

        setDistances((current) => {
          const nextDistances = { ...current }
          response.rows.forEach((row: any, index: number) => {
            const entry = withCoordinates[index]
            const element = row?.elements?.[0]

            if (!entry || element?.status !== "OK") {
              if (entry?.coordinates) {
                const meters = haversineMeters(entry.coordinates, pickup)
                nextDistances[entry.key] = {
                  distanceMeters: meters,
                  distanceText: metersToText(meters),
                  durationText: null,
                  source: "straight-line",
                }
              }
              return
            }

            nextDistances[entry.key] = {
              distanceMeters: element.distance?.value ?? null,
              distanceText: element.distance?.text || "-",
              durationText: element.duration?.text || null,
              source: "google",
            }
          })
          return nextDistances
        })
      },
    )
  }, [pickup, scriptStatus, sessions])

  return distances
}

function buildPageHref(page: number, filters: OrderFulfillmentQuery) {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("size", String(filters.size))
  params.set("sortBy", filters.sortBy || "createdAt")
  params.set("sortDir", filters.sortDir || "asc")

  if (filters.trackingNumber) params.set("trackingNumber", filters.trackingNumber)
  if (filters.shippingOrderId) params.set("shippingOrderId", filters.shippingOrderId)
  if (filters.status) params.set("status", filters.status)
  if (filters.assignedDriverUserId) params.set("assignedDriverUserId", filters.assignedDriverUserId)
  if (filters.assignedDriverName) params.set("assignedDriverName", filters.assignedDriverName)

  return `/admin/order-fulfillments?${params.toString()}`
}

function OrderQueueCard({
  group,
  selectedKeys,
  mappedOrderKey,
  onToggleGroup,
  onTogglePackage,
  onFocusMap,
}: {
  group: ShippingOrderGroup
  selectedKeys: Set<string>
  mappedOrderKey: string
  onToggleGroup: () => void
  onTogglePackage: (order: OrderFulfillment) => void
  onFocusMap: (order: OrderFulfillment) => void
}) {
  const selectedCount = group.orders.filter((order) => selectedKeys.has(orderKey(order))).length
  const assignedCount = group.orders.filter(isFulfillmentAssigned).length
  const allSelected = selectedCount === group.orders.length
  const primaryOrder = group.orders[0]

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    onToggleGroup()
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onToggleGroup}
      onKeyDown={handleKeyDown}
      className={`w-full rounded-md border p-3 text-left transition-colors ${
        selectedCount ? "border-primary bg-primary/5 shadow-sm" : "bg-background hover:bg-muted/40"
      }`}
    >
      <div className="grid grid-cols-[112px_28px_minmax(0,1fr)] gap-0">
        <div className="flex min-w-0 flex-col justify-between rounded-md border bg-background p-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Shipping Order</p>
            <p className="mt-1 break-words font-mono text-xs font-semibold leading-snug">{field(group.shippingOrderId)}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant={allSelected ? "default" : "outline"} className="rounded-md text-[11px]">
              {selectedCount}/{group.orders.length}
            </Badge>
            {assignedCount ? (
              <Badge variant="secondary" className="rounded-md text-[11px]">
                {assignedCount} assigned
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="relative flex justify-center py-4">
          <span className="h-full w-px rounded-full bg-gradient-to-b from-transparent via-primary/45 to-transparent" />
          <span className="absolute left-1/2 top-6 h-px w-4 -translate-x-0 bg-primary/45" />
          <span className="absolute bottom-6 left-1/2 h-px w-4 -translate-x-0 bg-primary/45" />
        </div>

        <div className="space-y-2">
          {group.orders.map((order) => {
            const key = orderKey(order)
            const selected = selectedKeys.has(key)
            const assigned = isFulfillmentAssigned(order)

            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation()
                  onTogglePackage(order)
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return
                  event.preventDefault()
                  event.stopPropagation()
                  onTogglePackage(order)
                }}
                className={`relative w-full rounded-md border p-3 text-left transition-colors ${
                  selected ? "border-primary bg-primary/10" : "bg-background hover:bg-muted/50"
                }`}
              >
                <span className="absolute -left-7 top-1/2 h-px w-7 bg-primary/35" />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold">{field(order.trackingNumber)}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{packageSummary(order)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {selected ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
                    <Button
                      type="button"
                      size="sm"
                      variant={mappedOrderKey === key ? "default" : "outline"}
                      className="h-8 px-2 text-xs"
                      onClick={(event) => {
                        event.stopPropagation()
                        onFocusMap(order)
                      }}
                    >
                      <MapIcon className="h-3.5 w-3.5" />
                      Map
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={statusBadgeClass(order.status)}>
                    {humanize(order.status)}
                  </Badge>
                  <Badge variant={assigned ? "secondary" : "outline"} className="rounded-md">
                    {assigned ? field(order.assignedDriverName || order.assignedDriverUserId) : "Unassigned"}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
        <div className="flex gap-2">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="line-clamp-2">{formatAddress(primaryOrder?.pickup?.address)}</p>
        </div>
        <div className="flex gap-2">
          <Route className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="line-clamp-2">{formatAddress(primaryOrder?.dropoff?.address)}</p>
        </div>
      </div>
    </article>
  )
}

function DispatchMap({
  selectedOrder,
  stops,
  sessions,
  scriptStatus,
}: {
  selectedOrder: OrderFulfillment | null
  stops: ResolvedStops
  sessions: DriverSession[]
  scriptStatus: string
}) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const directionsRendererRef = useRef<any>(null)
  const polylineRef = useRef<any>(null)

  useEffect(() => {
    if (scriptStatus !== "ready" || !mapRef.current || mapInstanceRef.current) return
    const googleMaps = (window as any).google?.maps
    if (!googleMaps) return

    mapInstanceRef.current = new googleMaps.Map(mapRef.current, {
      center: { lat: 44.6488, lng: -63.5752 },
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      clickableIcons: false,
    })

    directionsRendererRef.current = new googleMaps.DirectionsRenderer({
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: "#0f766e",
        strokeOpacity: 0.9,
        strokeWeight: 5,
      },
    })
    directionsRendererRef.current.setMap(mapInstanceRef.current)
  }, [scriptStatus])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || scriptStatus !== "ready") return

    const googleMaps = (window as any).google?.maps
    if (!googleMaps) return

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []
    if (polylineRef.current) {
      polylineRef.current.setMap(null)
      polylineRef.current = null
    }
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
      directionsRendererRef.current = new googleMaps.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: {
          strokeColor: "#0f766e",
          strokeOpacity: 0.9,
          strokeWeight: 5,
        },
      })
      directionsRendererRef.current.setMap(map)
    }

    const bounds = new googleMaps.LatLngBounds()

    if (stops.pickup) {
      const marker = new googleMaps.Marker({
        position: stops.pickup,
        map,
        label: "P",
        title: "Pickup",
      })
      markersRef.current.push(marker)
      bounds.extend(stops.pickup)
    }

    if (stops.dropoff) {
      const marker = new googleMaps.Marker({
        position: stops.dropoff,
        map,
        label: "D",
        title: "Dropoff",
      })
      markersRef.current.push(marker)
      bounds.extend(stops.dropoff)
    }

    sessions.forEach((session) => {
      const position = driverCoordinates(session)
      if (!position) return
      const marker = new googleMaps.Marker({
        position,
        map,
        label: {
          text: "V",
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "700",
        },
        title: session.driverNameSnapshot || "Driver",
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })
      markersRef.current.push(marker)
      bounds.extend(position)
    })

    if (stops.pickup && stops.dropoff && googleMaps.DirectionsService && directionsRendererRef.current) {
      const directionsService = new googleMaps.DirectionsService()
      directionsService.route(
        {
          origin: stops.pickup,
          destination: stops.dropoff,
          travelMode: googleMaps.TravelMode.DRIVING,
        },
        (result: any, status: string) => {
          if (status === "OK" && result) {
            directionsRendererRef.current.setDirections(result)
            return
          }

          polylineRef.current = new googleMaps.Polyline({
            path: [stops.pickup, stops.dropoff],
            map,
            strokeColor: "#0f766e",
            strokeOpacity: 0.85,
            strokeWeight: 4,
          })
        },
      )
    }

    if (!bounds.isEmpty()) map.fitBounds(bounds, 72)
  }, [scriptStatus, selectedOrder, sessions, stops.dropoff, stops.pickup])

  return (
    <div className="relative h-full min-h-[520px] bg-muted/30">
      {scriptStatus === "loading" ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/70 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading map
        </div>
      ) : null}
      {scriptStatus === "error" ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-destructive">
          Unable to load Google Maps. Verify API key and browser connectivity.
        </div>
      ) : null}
      <div ref={mapRef} className="h-full min-h-[520px] w-full" />
      <div className="absolute left-4 top-4 max-w-[320px] rounded-md border bg-background/95 p-4 shadow-lg backdrop-blur">
        <p className="text-xs font-semibold uppercase text-primary">Route Details</p>
        <h2 className="mt-1 truncate text-lg font-semibold">{field(selectedOrder?.trackingNumber)}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Distance</p>
            <p className="font-semibold">{formatDistanceKm(selectedOrder?.distanceToDelivery) || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Status</p>
            <p className="font-semibold">{humanize(selectedOrder?.status)}</p>
          </div>
        </div>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <p className="line-clamp-2">
            <span className="font-medium text-foreground">Pickup:</span> {formatAddress(selectedOrder?.pickup?.address)}
          </p>
          <p className="line-clamp-2">
            <span className="font-medium text-foreground">Dropoff:</span> {formatAddress(selectedOrder?.dropoff?.address)}
          </p>
        </div>
        {stops.resolving ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Resolving stop coordinates
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DriverCard({
  session,
  distance,
  action,
  actionCount,
  isAssigning,
  onAssign,
  onReassign,
}: {
  session: DriverSession
  distance?: DriverDistance
  action: DriverAssignmentAction
  actionCount: number
  isAssigning: boolean
  onAssign: () => void
  onReassign: () => void
}) {
  const activeOrderCount = orderCount(session)
  const heartbeat = session.lastHeartbeatAt || session.lastKnownLocation?.serverReceivedAt
  const actionLabel =
    action === "assigned"
      ? "Already assigned"
      : action === "reassign"
        ? "Reassign selected here"
        : action === "select"
          ? "Select packages"
          : actionCount > 1
            ? `Assign ${actionCount} packages`
            : "Assign package"

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
          <p className="text-xs text-muted-foreground">To mapped pickup</p>
          <p className="mt-1 text-sm font-semibold">{distance?.distanceText || "Select map"}</p>
          {distance?.durationText ? <p className="text-xs text-muted-foreground">{distance.durationText}</p> : null}
        </div>
        <div className="rounded-md border bg-muted/30 p-2">
          <p className="text-xs text-muted-foreground">Assigned</p>
          <p className="mt-1 text-sm font-semibold">{activeOrderCount}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline" className={statusBadgeClass(session.connectivityStatus)}>
          {humanize(session.connectivityStatus)}
        </Badge>
        {distance?.source === "straight-line" ? <Badge variant="outline">Approx.</Badge> : null}
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
          <span>{field(session.totalDistanceTravelledKm)} km travelled</span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <RadioTower className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Heartbeat {formatDateTime(heartbeat)}</span>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant={action === "reassign" || action === "assigned" ? "outline" : "default"}
        className="mt-3 w-full"
        disabled={action === "select" || action === "assigned" || isAssigning}
        onClick={action === "reassign" ? onReassign : onAssign}
      >
        {isAssigning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Assigning
          </>
        ) : action === "assigned" ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {actionLabel}
          </>
        ) : (
          actionLabel
        )}
      </Button>
    </article>
  )
}

export function OrderFulfillmentDispatchBoard({
  data,
  filters,
  driverSessionsData,
  driverSessionsError,
  driverSessionsTextError,
}: DispatchBoardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const orders = data.items
  const drivers = driverSessionsData?.items || []
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => {
    const initialOrder = orders.find((item) => !item.assignedDriverUserId) || orders[0]
    return initialOrder ? new Set([orderKey(initialOrder)]) : new Set()
  })
  const [mappedOrderKey, setMappedOrderKey] = useState(() => orderKey(orders.find((item) => !item.assignedDriverUserId) || orders[0]))
  const [assigningDriverKey, setAssigningDriverKey] = useState<string | null>(null)
  const [assignmentError, setAssignmentError] = useState<string | null>(null)
  const scriptStatus = useScript(`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`)

  useEffect(() => {
    if (!orders.length) {
      setSelectedKeys(new Set())
      return
    }

    setSelectedKeys((current) => {
      const availableKeys = new Set(orders.map(orderKey))
      const next = new Set(Array.from(current).filter((key) => availableKeys.has(key)))
      if (next.size) return next

      const initialOrder = orders.find((item) => !item.assignedDriverUserId) || orders[0]
      return initialOrder ? new Set([orderKey(initialOrder)]) : new Set()
    })
  }, [orders])

  useEffect(() => {
    if (!orders.length) {
      setMappedOrderKey("")
      return
    }

    if (!orders.some((order) => orderKey(order) === mappedOrderKey)) {
      setMappedOrderKey(orderKey(orders.find((item) => !item.assignedDriverUserId) || orders[0]))
    }
  }, [mappedOrderKey, orders])

  const groupedOrders = useMemo(() => groupOrderFulfillments(orders), [orders])

  const selectedOrders = useMemo(() => {
    return orders.filter((order) => selectedKeys.has(orderKey(order)))
  }, [orders, selectedKeys])

  const mappedOrder = useMemo(() => {
    return orders.find((order) => orderKey(order) === mappedOrderKey) || orders[0] || null
  }, [mappedOrderKey, orders])
  const stops = useResolvedStops(mappedOrder, scriptStatus)
  const driverDistances = useDriverDistances(drivers, stops.pickup, scriptStatus)

  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((left, right) => {
      const leftKey = left.sessionId || left.driverId || left.userId || ""
      const rightKey = right.sessionId || right.driverId || right.userId || ""
      const leftDistance = driverDistances[leftKey]?.distanceMeters
      const rightDistance = driverDistances[rightKey]?.distanceMeters
      if (leftDistance !== null && leftDistance !== undefined && rightDistance !== null && rightDistance !== undefined) {
        return leftDistance - rightDistance
      }
      if (leftDistance !== null && leftDistance !== undefined) return -1
      if (rightDistance !== null && rightDistance !== undefined) return 1
      return orderCount(left) - orderCount(right)
    })
  }, [drivers, driverDistances])

  const statusFilter = filters.status || ADMIN_ATTENTION_FULFILLMENT_STATUSES.join(",")
  const statusParts = statusFilter.split(",").filter(Boolean)
  const statusSet = new Set(statusParts)
  const isDefaultAttention =
    statusFilter !== "ALL" &&
    statusParts.length === ADMIN_ATTENTION_FULFILLMENT_STATUSES.length &&
    ADMIN_ATTENTION_FULFILLMENT_STATUSES.every((status) => statusSet.has(status))
  const statusScope = statusFilter === "ALL" ? "All statuses" : isDefaultAttention ? "Admin attention" : statusFilter

  const selectedAssignedCount = selectedOrders.filter(isFulfillmentAssigned).length
  const selectedUnassignedCount = selectedOrders.length - selectedAssignedCount

  const togglePackage = (order: OrderFulfillment) => {
    const key = orderKey(order)
    if (!key) return
    setAssignmentError(null)
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleGroup = (group: ShippingOrderGroup) => {
    setAssignmentError(null)
    setSelectedKeys((current) => {
      const keys = group.orders.map(orderKey).filter(Boolean)
      const allSelected = keys.every((key) => current.has(key))
      const next = new Set(current)
      keys.forEach((key) => {
        if (allSelected) next.delete(key)
        else next.add(key)
      })
      return next
    })
  }

  const focusMap = (order: OrderFulfillment) => {
    const key = orderKey(order)
    if (!key) return
    setMappedOrderKey(key)
  }

  const driverAssignmentPlan = (session: DriverSession): DriverAssignmentPlan => {
    if (!selectedOrders.length) return { action: "select", ordersToAssign: [] }

    const assignedToAnotherDriver = selectedOrders.some((order) => {
      return isFulfillmentAssigned(order) && !isAssignedToDriver(order, session)
    })

    if (assignedToAnotherDriver) {
      return { action: "reassign", ordersToAssign: [] }
    }

    const ordersToAssign = selectedOrders.filter((order) => !isFulfillmentAssigned(order))
    if (ordersToAssign.length) return { action: "assign", ordersToAssign }

    return { action: "assigned", ordersToAssign: [] }
  }

  const assignDriver = async (session: DriverSession, sessionIndex: number, ordersToAssign: OrderFulfillment[]) => {
    const orderIdsToAssign = ordersToAssign.map((order) => order.id).filter((id): id is string => Boolean(id))
    if (!orderIdsToAssign.length || !session.userId) {
      setAssignmentError("Select at least one unassigned package with assignment data.")
      return
    }
    if (orderIdsToAssign.length !== ordersToAssign.length) {
      setAssignmentError("One or more selected packages are missing fulfilment IDs.")
      return
    }

    const currentDriverKey = driverKey(session, sessionIndex)
    const driverName = session.driverNameSnapshot || session.driverId || "Unknown Driver"
    setAssigningDriverKey(currentDriverKey)
    setAssignmentError(null)

    try {
      const response = await apiFetch("/api/admin/order-fulfillments/assign-orders", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listOfOrderFulfilmentIds: orderIdsToAssign,
          driverUserId: session.userId,
          driverName,
        }),
      })

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || ""
        const payload = contentType.includes("application/json") ? await response.json().catch(() => null) : null
        const text = payload ? "" : await response.text().catch(() => "")
        const message = payload?.message || text || "Unable to assign driver."
        setAssignmentError(message)
        toast({ title: "Assignment failed", description: message, variant: "destructive" })
        return
      }

      toast({
        title: orderIdsToAssign.length > 1 ? "Packages assigned" : "Package assigned",
        description: `${orderIdsToAssign.length} package${orderIdsToAssign.length === 1 ? "" : "s"} assigned to ${field(session.driverNameSnapshot)}.`,
      })
      router.refresh()
    } catch {
      const message = "Unexpected error while assigning driver."
      setAssignmentError(message)
      toast({ title: "Assignment failed", description: message, variant: "destructive" })
    } finally {
      setAssigningDriverKey(null)
    }
  }

  const showReassignPlaceholder = (session: DriverSession) => {
    toast({
      title: "Reassignment not wired yet",
      description: `Reassigning selected packages to ${field(session.driverNameSnapshot)} needs the backend flow first.`,
    })
  }

  const clearSelection = () => {
    setAssignmentError(null)
    setSelectedKeys(new Set())
  }

  return (
    <section className="overflow-hidden rounded-md border bg-card shadow-sm">
      <div className="grid min-h-[720px] xl:h-[calc(100vh-235px)] xl:min-h-[680px] xl:grid-cols-[470px_minmax(420px,1fr)_360px]">
        <aside className="flex min-h-[420px] flex-col border-b xl:border-b-0 xl:border-r">
          <div className="border-b p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Shipping Orders</h2>
                <p className="text-sm text-muted-foreground">
                  {groupedOrders.length} groups / {data.totalElements} packages
                </p>
              </div>
              <Badge variant="secondary">{statusScope}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge variant={selectedOrders.length ? "default" : "outline"}>{selectedOrders.length} selected</Badge>
              <Badge variant="outline">{selectedUnassignedCount} unassigned</Badge>
              <Badge variant="outline">{selectedAssignedCount} assigned</Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={!selectedOrders.length}
                onClick={clearSelection}
              >
                <CircleOff className="h-3.5 w-3.5" />
                Unselect all
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {groupedOrders.map((group) => (
              <OrderQueueCard
                key={group.key}
                group={group}
                selectedKeys={selectedKeys}
                mappedOrderKey={mappedOrderKey}
                onToggleGroup={() => toggleGroup(group)}
                onTogglePackage={togglePackage}
                onFocusMap={focusMap}
              />
            ))}
          </div>

          <div className="border-t p-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Page {data.totalPages === 0 ? 0 : data.page + 1} of {data.totalPages}
            </div>
            <Pagination className="mx-0 w-full justify-between">
              <PaginationContent className="w-full justify-between">
                <PaginationItem>
                  {data.page > 0 ? (
                    <PaginationPrevious href={buildPageHref(data.page - 1, filters)} />
                  ) : (
                    <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Previous</span>
                  )}
                </PaginationItem>
                <PaginationItem>
                  {data.page + 1 < data.totalPages ? (
                    <PaginationNext href={buildPageHref(data.page + 1, filters)} />
                  ) : (
                    <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Next</span>
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </aside>

        <main className="relative min-h-[520px] border-b xl:border-b-0">
          <DispatchMap selectedOrder={mappedOrder} stops={stops} sessions={drivers} scriptStatus={scriptStatus} />
          <div className="absolute bottom-4 left-4 right-4 rounded-md border bg-background/95 p-3 shadow-lg backdrop-blur md:right-auto md:w-[520px]">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Pickup
                </div>
                <p className="mt-1 truncate text-sm font-semibold">
                  {formatDateTime(mappedOrder?.pickup?.scheduledTime || mappedOrder?.pickup?.pickupTime)}
                </p>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  Driver
                </div>
                <p className="mt-1 truncate text-sm font-semibold">{field(mappedOrder?.assignedDriverName)}</p>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  Mapped
                </div>
                <p className="mt-1 truncate font-mono text-sm font-semibold">{field(mappedOrder?.trackingNumber)}</p>
              </div>
            </div>
          </div>
        </main>

        <aside className="flex min-h-[420px] flex-col xl:border-l">
          <div className="border-b p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Available Drivers</h2>
                <p className="text-sm text-muted-foreground">Distance to mapped pickup</p>
              </div>
              <Badge variant="secondary">{drivers.length}</Badge>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {assignmentError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Assignment failed</AlertTitle>
                <AlertDescription>{assignmentError}</AlertDescription>
              </Alert>
            ) : null}

            {driverSessionsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{driverSessionsError.message || "Unable to load active drivers"}</AlertTitle>
                <AlertDescription>
                  {driverSessionsTextError || `Driver management returned status ${driverSessionsError.status || "unknown"}.`}
                </AlertDescription>
              </Alert>
            ) : null}

            {!driverSessionsError && !drivers.length ? (
              <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
                No active driver sessions found.
              </div>
            ) : null}

            {!driverSessionsError &&
              sortedDrivers.map((session, index) => {
                const key = driverKey(session, index)
                const assignmentPlan = driverAssignmentPlan(session)
                return (
                  <DriverCard
                    key={key}
                    session={session}
                    distance={driverDistances[key]}
                    action={assignmentPlan.action}
                    actionCount={assignmentPlan.ordersToAssign.length}
                    isAssigning={assigningDriverKey === key}
                    onAssign={() => assignDriver(session, index, assignmentPlan.ordersToAssign)}
                    onReassign={() => showReassignPlaceholder(session)}
                  />
                )
              })}
          </div>
        </aside>
      </div>
    </section>
  )
}

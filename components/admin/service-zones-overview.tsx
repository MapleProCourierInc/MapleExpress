"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2, LocateFixed } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useScript } from "@/hooks/use-script"
import { GOOGLE_MAPS_API_KEY } from "@/lib/config"
import type { ServiceZone, ToggleServiceZoneActiveResponse } from "@/types/admin-service-zones"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiFetch } from "@/lib/client-api"

type Props = {
  initialZones: ServiceZone[]
}

function statusClass(active: boolean) {
  return active
    ? "border-emerald-200 bg-emerald-100 text-emerald-900"
    : "border-rose-200 bg-rose-100 text-rose-900"
}

function formatDate(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

export function ServiceZonesOverview({ initialZones }: Props) {
  const [zones, setZones] = useState(initialZones)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(initialZones[0]?.id || null)
  const [pendingZoneId, setPendingZoneId] = useState<string | null>(null)
  const { toast } = useToast()

  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const polygonRefs = useRef<Map<string, any>>(new Map())

  const scriptStatus = useScript(`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`)
  const mapError = scriptStatus === "error"

  const zonesById = useMemo(() => new Map(zones.map((zone) => [zone.id, zone])), [zones])

  useEffect(() => {
    if (scriptStatus !== "ready" || !mapRef.current || mapInstanceRef.current) return
    const googleMaps = (window as any).google?.maps
    if (!googleMaps) return

    mapInstanceRef.current = new googleMaps.Map(mapRef.current, {
      center: { lat: 56.1304, lng: -106.3468 },
      zoom: 4,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })
  }, [scriptStatus])

  useEffect(() => {
    if (!mapInstanceRef.current || scriptStatus !== "ready") return
    const googleMaps = (window as any).google?.maps
    if (!googleMaps) return

    polygonRefs.current.forEach((polygon) => polygon.setMap(null))
    polygonRefs.current.clear()

    zones.forEach((zone) => {
      const ring = zone.polygon?.coordinates?.[0] || []
      if (!ring.length) return
      const path = ring.map(([lng, lat]) => ({ lat, lng }))

      const activeColor = zone.active ? "#16a34a" : "#dc2626"
      const polygon = new googleMaps.Polygon({
        paths: path,
        strokeColor: activeColor,
        strokeOpacity: 1,
        strokeWeight: selectedZoneId === zone.id ? 3 : 2,
        fillColor: activeColor,
        fillOpacity: selectedZoneId === zone.id ? 0.35 : 0.22,
      })
      polygon.setMap(mapInstanceRef.current)
      polygonRefs.current.set(zone.id, polygon)
    })
  }, [zones, scriptStatus, selectedZoneId])

  const focusZone = (zoneId: string) => {
    setSelectedZoneId(zoneId)
    const zone = zonesById.get(zoneId)
    if (!zone || !mapInstanceRef.current || scriptStatus !== "ready") return

    const googleMaps = (window as any).google?.maps
    const ring = zone.polygon?.coordinates?.[0] || []
    if (!googleMaps || !ring.length) return

    const bounds = new googleMaps.LatLngBounds()
    ring.forEach(([lng, lat]) => bounds.extend({ lat, lng }))
    mapInstanceRef.current.fitBounds(bounds, 80)
  }

  const toggleActive = async (zone: ServiceZone) => {
    try {
      setPendingZoneId(zone.id)
      const response = await apiFetch(`/api/admin/service-zones/${zone.id}/active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ active: !zone.active }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        toast({ title: "Unable to update service zone", description: payload?.message || "Please try again.", variant: "destructive" })
        return
      }

      const payload = (await response.json()) as ToggleServiceZoneActiveResponse
      setZones((prev) => prev.map((entry) => (entry.id === zone.id ? payload.serviceZone : entry)))
      toast({
        title: payload.serviceZone.active ? "Service zone activated" : "Service zone deactivated",
        description: payload.serviceZone.zoneName,
      })
    } catch {
      toast({ title: "Unable to update service zone", description: "Unexpected error occurred.", variant: "destructive" })
    } finally {
      setPendingZoneId(null)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Coverage Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-[520px] overflow-hidden rounded-md border bg-muted/20">
            {scriptStatus === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading map...
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-destructive">
                Unable to load Google Maps. Verify API key and browser connectivity.
              </div>
            )}
            <div ref={mapRef} className="h-full w-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Zone List ({zones.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No service zones found.</p>
          ) : (
            <div className="max-h-[520px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow key={zone.id} className={selectedZoneId === zone.id ? "bg-muted/40" : ""}>
                      <TableCell>
                        <p className="font-medium">{zone.zoneName}</p>
                        <p className="text-xs text-muted-foreground">{zone.city} • {zone.station}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={statusClass(zone.active)}>{zone.active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell>{zone.priority}</TableCell>
                      <TableCell>{formatDate(zone.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => focusZone(zone.id)}>
                            <LocateFixed className="mr-1 h-3.5 w-3.5" /> Focus
                          </Button>
                          <Button size="sm" variant={zone.active ? "destructive" : "default"} onClick={() => toggleActive(zone)} disabled={pendingZoneId === zone.id}>
                            {pendingZoneId === zone.id ? "Saving..." : zone.active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

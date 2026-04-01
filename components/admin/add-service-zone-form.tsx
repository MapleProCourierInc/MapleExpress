"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useScript } from "@/hooks/use-script"
import { GOOGLE_MAPS_API_KEY } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CreateServiceZoneResponse } from "@/types/admin-service-zones"
import { apiFetch } from "@/lib/client-api"

type FormState = {
  zoneName: string
  city: string
  station: string
  active: boolean
  priority: string
}

const initialForm: FormState = {
  zoneName: "",
  city: "",
  station: "",
  active: true,
  priority: "1",
}

export function AddServiceZoneForm() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [polygonCoordinates, setPolygonCoordinates] = useState<number[][]>([])
  const [drawingReady, setDrawingReady] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const drawingManagerRef = useRef<any>(null)
  const polygonRef = useRef<any>(null)

  const scriptStatus = useScript(`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing`)
  const mapError = scriptStatus === "error"

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

    drawingManagerRef.current = new googleMaps.drawing.DrawingManager({
      drawingMode: googleMaps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: googleMaps.ControlPosition.TOP_CENTER,
        drawingModes: [googleMaps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        editable: true,
        draggable: false,
        strokeColor: "#16a34a",
        fillColor: "#22c55e",
        fillOpacity: 0.25,
      },
    })

    drawingManagerRef.current.setMap(mapInstanceRef.current)
    setDrawingReady(true)

    googleMaps.event.addListener(drawingManagerRef.current, "overlaycomplete", (event: any) => {
      if (event.type !== googleMaps.drawing.OverlayType.POLYGON) return

      if (polygonRef.current) polygonRef.current.setMap(null)
      polygonRef.current = event.overlay
      drawingManagerRef.current.setDrawingMode(null)

      const path = event.overlay.getPath()
      const coords: number[][] = []
      for (let i = 0; i < path.getLength(); i += 1) {
        const point = path.getAt(i)
        coords.push([point.lng(), point.lat()])
      }

      if (coords.length > 2) {
        const [firstLng, firstLat] = coords[0]
        const [lastLng, lastLat] = coords[coords.length - 1]
        if (firstLng !== lastLng || firstLat !== lastLat) coords.push([firstLng, firstLat])
      }

      setPolygonCoordinates(coords)
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.polygon
        return next
      })
    })
  }, [scriptStatus])

  const updateField = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const clearPolygon = () => {
    if (polygonRef.current) polygonRef.current.setMap(null)
    polygonRef.current = null
    setPolygonCoordinates([])
    if (drawingManagerRef.current) {
      const googleMaps = (window as any).google?.maps
      drawingManagerRef.current.setDrawingMode(googleMaps?.drawing?.OverlayType?.POLYGON || null)
    }
  }

  const canSubmit = useMemo(() => {
    return form.zoneName.trim() && form.city.trim() && form.station.trim() && form.priority.trim() && polygonCoordinates.length >= 4
  }, [form, polygonCoordinates])

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.zoneName.trim()) errors.zoneName = "Required"
    if (!form.city.trim()) errors.city = "Required"
    if (!form.station.trim()) errors.station = "Required"

    const priority = Number(form.priority)
    if (!form.priority.trim()) errors.priority = "Required"
    else if (!Number.isFinite(priority)) errors.priority = "Must be a valid number"

    if (polygonCoordinates.length < 4) errors.polygon = "Draw a polygon with at least 3 points"

    setFieldErrors(errors)
    return { valid: Object.keys(errors).length === 0, priority }
  }

  const submit = async () => {
    const { valid, priority } = validate()
    if (!valid) return

    try {
      setIsSubmitting(true)
      const response = await apiFetch("/api/admin/service-zones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          zoneName: form.zoneName.trim(),
          city: form.city.trim(),
          station: form.station.trim(),
          active: form.active,
          priority,
          polygon: {
            type: "Polygon",
            coordinates: [polygonCoordinates],
          },
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string; errors?: Array<{ field?: string; message?: string }> } | null
        if (payload?.errors?.length) {
          const nextErrors: Record<string, string> = {}
          payload.errors.forEach((entry) => {
            if (entry.field && entry.message) nextErrors[entry.field] = entry.message
          })
          setFieldErrors((prev) => ({ ...prev, ...nextErrors }))
        }
        toast({ title: "Unable to create service zone", description: payload?.message || "Please review form values.", variant: "destructive" })
        return
      }

      const payload = (await response.json()) as CreateServiceZoneResponse
      toast({ title: "Service zone created", description: payload.serviceZone.zoneName })
      router.push("/admin/service-zones")
      router.refresh()
    } catch {
      toast({ title: "Unable to create service zone", description: "Unexpected error occurred.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Add Service Zone</h1>
          <p className="text-muted-foreground">Draw one polygon on the map, complete zone details, then save.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/service-zones">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Polygon Drawing</CardTitle>
            <CardDescription>Use map drawing controls to create a single polygon.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="relative h-[520px] overflow-hidden rounded-md border bg-muted/20">
              {scriptStatus === "loading" && <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading map...</div>}
              {mapError && <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-destructive">Unable to load Google Maps. Verify API key and browser connectivity.</div>}
              <div ref={mapRef} className="h-full w-full" />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{polygonCoordinates.length >= 4 ? `${polygonCoordinates.length - 1} points selected` : "Polygon not drawn"}</p>
              <Button type="button" variant="outline" size="sm" onClick={clearPolygon} disabled={!drawingReady || polygonCoordinates.length === 0}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear polygon
              </Button>
            </div>
            {fieldErrors.polygon ? <p className="text-xs text-destructive">{fieldErrors.polygon}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zone Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="zone-name">Zone name</Label>
              <Input id="zone-name" value={form.zoneName} onChange={(e) => updateField("zoneName", e.target.value)} />
              {fieldErrors.zoneName ? <p className="text-xs text-destructive">{fieldErrors.zoneName}</p> : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="zone-city">City</Label>
              <Input id="zone-city" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
              {fieldErrors.city ? <p className="text-xs text-destructive">{fieldErrors.city}</p> : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="zone-station">Station</Label>
              <Input id="zone-station" value={form.station} onChange={(e) => updateField("station", e.target.value)} />
              {fieldErrors.station ? <p className="text-xs text-destructive">{fieldErrors.station}</p> : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="zone-priority">Priority</Label>
              <Input id="zone-priority" value={form.priority} onChange={(e) => updateField("priority", e.target.value)} inputMode="numeric" />
              {fieldErrors.priority ? <p className="text-xs text-destructive">{fieldErrors.priority}</p> : null}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => updateField("active", e.target.checked)} />
              Active on create
            </label>
            <Button type="button" className="w-full" onClick={submit} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Saving..." : "Create Service Zone"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

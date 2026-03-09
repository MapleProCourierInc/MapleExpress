import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createServiceZone } from "@/lib/admin-service-zones-service"
import type { CreateServiceZoneRequest } from "@/types/admin-service-zones"

function normalizePayload(body: Record<string, unknown>): CreateServiceZoneRequest {
  return {
    zoneName: String(body.zoneName || "").trim(),
    city: String(body.city || "").trim(),
    station: String(body.station || "").trim(),
    active: Boolean(body.active),
    priority: Number(body.priority),
    polygon: {
      type: "Polygon",
      coordinates: Array.isArray((body.polygon as Record<string, unknown> | undefined)?.coordinates)
        ? (((body.polygon as Record<string, unknown>).coordinates as unknown) as number[][][])
        : [],
    },
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const payload = normalizePayload(body)

  const errors: Array<{ field: string; message: string }> = []
  if (!payload.zoneName) errors.push({ field: "zoneName", message: "Required" })
  if (!payload.city) errors.push({ field: "city", message: "Required" })
  if (!payload.station) errors.push({ field: "station", message: "Required" })
  if (!Number.isFinite(payload.priority)) errors.push({ field: "priority", message: "Must be a valid number" })

  const ring = payload.polygon.coordinates?.[0] || []
  if (!ring.length || ring.length < 4) {
    errors.push({ field: "polygon", message: "Polygon must include at least 4 coordinate pairs." })
  }

  if (errors.length) {
    return NextResponse.json({ message: "Please review the form values.", errors }, { status: 400 })
  }

  const result = await createServiceZone(payload)
  if (!result.data) {
    return NextResponse.json(result.error ?? { message: "Failed to create service zone" }, { status: Number(result.error?.status) || 400 })
  }

  revalidatePath("/admin/service-zones")
  return NextResponse.json(result.data)
}

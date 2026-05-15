import type { TrackingEvent } from "@/lib/tracking-types"

export async function getTrackingEvents(trackingNumber: string): Promise<TrackingEvent[]> {
  const response = await fetch(`/api/public/track/${encodeURIComponent(trackingNumber)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Tracking service unavailable")
  }

  return (await response.json()) as TrackingEvent[]
}

export type { TrackingEvent }

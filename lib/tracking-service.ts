import "server-only"

import { ORDER_FULFILMENT_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import type { TrackingEvent } from "@/lib/tracking-types"

export async function getTrackingEvents(trackingNumber: string): Promise<TrackingEvent[]> {
  const endpoint = getEndpointUrl(
    ORDER_FULFILMENT_SERVICE_URL,
    `/public/track/${encodeURIComponent(trackingNumber)}`,
  )

  const res = await fetch(endpoint, {
    headers: { Accept: 'application/json' },
    method: 'GET',
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Failed to fetch tracking information')
  }

  return (await res.json()) as TrackingEvent[]
}

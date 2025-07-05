import { ORDER_FULFILMENT_SERVICE_URL, getEndpointUrl } from './config'

export interface TrackingEvent {
  status: string
  timestamp: string
  location?: {
    latitude: number
    longitude: number
  } | null
  statusMessage: string
  driverComments: string | null
  photographUrls: string[]
}

export async function getTrackingEvents(trackingNumber: string): Promise<TrackingEvent[]> {
  const endpoint = getEndpointUrl(
    ORDER_FULFILMENT_SERVICE_URL,
    `v1/track/${trackingNumber}`
  )

  const res = await fetch(endpoint, {
    headers: { Accept: 'application/json' },
    method: 'GET'
  })

  if (!res.ok) {
    throw new Error('Failed to fetch tracking information')
  }

  return res.json()
}

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

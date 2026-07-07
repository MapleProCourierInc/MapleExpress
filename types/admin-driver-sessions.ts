export type DriverActivityStatus = "IDLE" | "EN_ROUTE" | "BUSY" | "ON_BREAK" | string
export type DriverSessionStatus = "ACTIVE" | "ENDED" | "CANCELLED" | string
export type DriverConnectivityStatus = "ONLINE" | "STALE" | "OFFLINE" | string

export type GeoJsonPoint = {
  type?: "Point" | string | null
  coordinates?: number[] | null
}

export type DriverLocationSnapshot = {
  coordinates?: GeoJsonPoint | null
  accuracyMeters?: number | null
  speedKph?: number | null
  heading?: number | null
  recordedAt?: string | null
  serverReceivedAt?: string | null
}

export type DriverSessionOrderActivity = {
  orderFulfillmentId?: string | null
  shippingOrderId?: string | null
  trackingNumber?: string | null
  assignedAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
  distanceToDelivery?: number | null
  taskStatus?: string | null
  fulfillmentStatus?: string | null
}

export type DriverSession = {
  sessionId?: string | null
  userId?: string | null
  driverId?: string | null
  driverNameSnapshot?: string | null
  phone?: string | null
  email?: string | null
  startedAt?: string | null
  endedAt?: string | null
  lastUpdatedAt?: string | null
  lastHeartbeatAt?: string | null
  lastOnlineAt?: string | null
  offlineSince?: string | null
  lastSyncAt?: string | null
  sessionStatus?: DriverSessionStatus | null
  currentStatus?: DriverActivityStatus | null
  connectivityStatus?: DriverConnectivityStatus | null
  lastKnownLocation?: DriverLocationSnapshot | null
  orders?: DriverSessionOrderActivity[] | null
  totalDeliveries?: number | null
  totalDistanceTravelledKm?: number | null
}

export type ActiveDriverSessionsResponse = {
  items: DriverSession[]
}

export type DriverManagementApiError = {
  status?: string
  message?: string
  errors?: Array<{
    field?: string
    message?: string
  }>
  errorDetails?: {
    errorCode?: number
    errorType?: string
    characteristics?: Record<string, string>
  }
}

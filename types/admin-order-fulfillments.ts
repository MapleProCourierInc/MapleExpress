export const FULFILLMENT_STATUS_OPTIONS = [
  "DRAFT",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "PENDING",
  "LABEL_CREATED",
  "SCHEDULED",
  "CREATED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "PICKUP_FAILED",
  "DROP_OFF_FAILED",
  "RETURNED",
  "FAILED",
  "CANCELLED",
  "END_OF_DAY",
  "IN_PROGRESS",
] as const

export type FulfillmentStatus = (typeof FULFILLMENT_STATUS_OPTIONS)[number]

export const ADMIN_ATTENTION_FULFILLMENT_STATUSES: FulfillmentStatus[] = [
  "ASSIGNED",
  "CREATED",
  "CONFIRMED",
  "SCHEDULED",
  "PICKED_UP",
  "IN_TRANSIT",
  "PICKUP_FAILED",
  "DROP_OFF_FAILED",
  "FAILED",
  "END_OF_DAY",
  "IN_PROGRESS",
]

export type SortDirection = "asc" | "desc"

export type OrderFulfillmentQuery = {
  trackingNumber?: string
  shippingOrderId?: string
  status?: string
  assignedDriverUserId?: string
  assignedDriverName?: string
  page: number
  size: number
  sortBy: "createdAt"
  sortDir: SortDirection
}

export type FulfillmentAddress = {
  fullName?: string | null
  company?: string | null
  streetAddress?: string | null
  addressLine2?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  country?: string | null
  phoneNumber?: string | null
  deliveryInstructions?: string | null
}

export type FulfillmentLocation = {
  latitude?: number | null
  longitude?: number | null
}

export type FulfillmentImage = {
  imageUrl?: string | null
  timestamp?: string | null
}

export type FulfillmentStopDetails = {
  address?: FulfillmentAddress | null
  coordinates?: FulfillmentLocation | null
  scheduledTime?: string | null
  driverNotes?: string | null
  pickupInstructions?: string | null
  dropoffInstructions?: string | null
  pickupTime?: string | null
  dropoffTime?: string | null
  images?: FulfillmentImage[] | null
}

export type PackageDimensions = {
  length?: number | null
  width?: number | null
  height?: number | null
}

export type CustomerContact = {
  name?: string | null
  phone?: string | null
  email?: string | null
}

export type SignatureDetails = {
  signedByName?: string | null
  signedByRelationship?: string | null
  signatureImageUrl?: string | null
  signatureImageObjectKey?: string | null
  signedAt?: string | null
  capturedByDriverId?: string | null
  note?: string | null
}

export type TrackingEvent = {
  status?: FulfillmentStatus | string | null
  timestamp?: string | null
  location?: FulfillmentLocation | null
  statusMessage?: string | null
  driverComments?: string | null
  photographUrls?: string[] | null
}

export type OrderFulfillment = {
  id?: string | null
  trackingNumber?: string | null
  sourceOrderId?: string | null
  shippingOrderId?: string | null
  customerContact?: CustomerContact | null
  itemDescription?: string | null
  packageDimensions?: PackageDimensions | null
  pickup?: FulfillmentStopDetails | null
  dropoff?: FulfillmentStopDetails | null
  distanceToDelivery?: number | null
  status?: FulfillmentStatus | string | null
  assignedDriverUserId?: string | null
  assignedDriverName?: string | null
  shippingLabelURL?: string | null
  createdAt?: string | null
  dispatchedAt?: string | null
  deliveredAt?: string | null
  receivedBy?: string | null
  signature?: SignatureDetails | null
  signatureRequired?: boolean | null
  signatureStatus?: string | null
  trackingEvents?: TrackingEvent[] | null
}

export type OrderFulfillmentsResponse = {
  items: OrderFulfillment[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type AssignDriverRequest = {
  orderFulfilmentId: string
  driverUserId: string
  driverName: string
}

export type AssignOrdersRequest = {
  listOfOrderFulfilmentIds: string[]
  driverUserId: string
  driverName: string
}

export type OrderFulfillmentApiError = {
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

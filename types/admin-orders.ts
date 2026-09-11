export const ADMIN_ORDER_STATUS_OPTIONS = [
  "DRAFT",
  "PAYMENT_PENDING",
  "MANUAL_QUOTE_PAYMENT_PENDING",
  "CONFIRMED",
  "PENDING",
  "LABEL_CREATED",
  "SCHEDULED",
  "CREATED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "IN_PROGRESS",
  "END_OF_DAY",
  "DELIVERED",
  "PICKUP_FAILED",
  "DROP_OFF_FAILED",
  "RETURNED",
  "FAILED",
  "CANCELLED",
] as const

export const ADMIN_ORDER_PAYMENT_STATUS_OPTIONS = [
  "PENDING",
  "PAYMENT_PENDING",
  "PENDING_USER_ACTION",
  "PAID",
  "SUCCESS",
  "SUCCESSFUL",
  "COMPLETED",
  "CAPTURED",
  "POSTED_TO_BILLING_ACCOUNT",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const

export const ADMIN_ORDER_CLIENT_TYPE_OPTIONS = ["client_individual", "client_organization"] as const

export type AdminOrderSortDirection = "asc" | "desc"
export type AdminOrderSortBy = "createdAt" | "updatedAt"

export type AdminOrdersFilters = {
  shippingOrderId?: string
  orderStatuses?: string[]
  userId?: string
  clientUserId?: string
  clientType?: string
  paymentStatus?: string
  trackingId?: string
  priorityDelivery?: string
  createdFrom?: string
  createdTo?: string
  updatedFrom?: string
  updatedTo?: string
  page: number
  size: number
  sortBy: AdminOrderSortBy
  sortDir: AdminOrderSortDirection
}

export type AdminOrderAddress = {
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

export type AdminOrderCoordinates = {
  latitude?: number | null
  longitude?: number | null
}

export type AdminOrderStop = {
  address?: AdminOrderAddress | null
  coordinates?: AdminOrderCoordinates | null
  time?: string | null
  notes?: string | null
  images?: Array<{ imageUrl?: string | null; timestamp?: string | null }> | null
}

export type AdminOrderPricing = {
  pricingModelId?: string | null
  pricingModelVersion?: number | null
  pricingTypeApplied?: string | null
  ownerIdApplied?: string | null
  zoneCode?: string | null
  currency?: string | null
  customQuoteRequired?: boolean | null
  customQuoteReasons?: string[] | null
  customQuoteReason?: string | null
  charges?: Record<string, number> | null
  totalAmount?: number | null
}

export type AdminOrderItem = {
  orderItemId?: string | null
  trackingId?: string | null
  pickup?: AdminOrderStop | null
  dropoff?: AdminOrderStop | null
  distanceToDelivery?: number | null
  packageDetails?: {
    weight?: number | null
    dimensions?: {
      length?: number | null
      width?: number | null
      height?: number | null
    } | null
    type?: string | null
    value?: number | null
    images?: Array<{ imageUrl?: string | null; timestamp?: string | null }> | null
  } | null
  pricing?: AdminOrderPricing | null
  itemStatus?: string | null
  description?: string | null
  assignedDriverId?: string | null
  isFragile?: boolean | null
  signatureRequired?: boolean | null
  signatureStatus?: string | null
  estimatedDeliveryTime?: string | null
  deliveredAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  specialIncidents?: unknown[] | null
}

export type AdminOrderNote = {
  changedAt?: string | null
  changedByUserId?: string | null
  changedByRoles?: string[] | null
  previousStatus?: string | null
  newStatus?: string | null
  source?: string | null
  message?: string | null
}

export type AdminOrder = {
  shippingOrderId: string
  userId?: string | null
  clientUserId?: string | null
  clientType?: string | null
  customerContact?: {
    name?: string | null
    phone?: string | null
    email?: string | null
    taxId?: string | null
  } | null
  priorityDelivery?: boolean | null
  pickupWindowStartDateTime?: string | null
  pickupWindowEndDateTime?: string | null
  needsAdminAttention?: boolean | null
  orderStatus?: string | null
  assignedDriverId?: string | null
  paymentStatus?: string | null
  paymentId?: string | null
  confirmedAt?: string | null
  completedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  aggregatedPricing?: AdminOrderPricing | null
  notes?: AdminOrderNote[] | null
  orderItems?: AdminOrderItem[] | null
}

export type AdminOrdersPage = {
  orders: AdminOrder[]
  pagination: {
    page: number
    size: number
    totalElements: number
    totalPages: number
    sortBy: string
    sortDir: AdminOrderSortDirection
  }
}

export type AdminOrdersApiError = {
  status?: string | number
  message?: string
  errors?: Array<{ field?: string; message?: string }>
  errorDetails?: Record<string, unknown> | null
}

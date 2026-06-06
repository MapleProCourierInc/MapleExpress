import type { ShippingOrder } from "@/lib/order-service"

export const ADMIN_MANUAL_QUOTE_TICKET_STATUSES = [
  "OPEN",
  "WAITING_FOR_ADMIN",
  "WAITING_FOR_CUSTOMER",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
] as const

export const ADMIN_MANUAL_QUOTE_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const

export const ADMIN_MANUAL_QUOTE_STATUSES = [
  "OFFERED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "WITHDRAWN",
  "SUPERSEDED",
] as const

export const ADMIN_MANUAL_QUOTE_REASONS = [
  "WEIGHT_EXCEEDS_LIMIT",
  "DIMENSIONS_EXCEED_LIMIT",
  "DISTANCE_EXCEEDS_SERVICE_AREA",
  "NO_MATCHING_PACKAGE_SLAB",
  "NO_MATCHING_DISTANCE_SLAB",
  "SPECIAL_HANDLING_REQUIRED",
  "OTHER",
] as const

export type AdminManualQuoteTicketStatus = (typeof ADMIN_MANUAL_QUOTE_TICKET_STATUSES)[number]
export type AdminManualQuotePriority = (typeof ADMIN_MANUAL_QUOTE_PRIORITIES)[number]
export type AdminManualQuoteStatus = (typeof ADMIN_MANUAL_QUOTE_STATUSES)[number]
export type AdminManualQuoteReason = (typeof ADMIN_MANUAL_QUOTE_REASONS)[number]
export type ManualQuoteMessageSenderType = "CUSTOMER" | "ADMIN" | "SYSTEM"
export type ManualQuoteVisibility = "PUBLIC" | "INTERNAL"

export type AdminManualQuoteApiError = {
  status?: string
  message?: string
  errors?: Array<{ field?: string; message?: string }>
  errorDetails?: {
    errorCode?: number
    errorType?: string
    characteristics?: Record<string, string>
  }
}

export type ManualQuoteAttachmentRequest = {
  fileName: string
  contentType: string
  sizeBytes?: number | null
  storageKey: string
}

export type ManualQuoteAttachment = {
  attachmentId?: string | null
  fileName?: string | null
  contentType?: string | null
  sizeBytes?: number | null
  storageKey?: string | null
  downloadUrl?: string | null
  uploadedByUserId?: string | null
  uploadedAt?: string | null
}

export type ManualQuoteRelatedResource = {
  type?: string | null
  shippingOrderId?: string | null
  orderItemId?: string | null
  fulfilmentId?: string | null
  driverUserId?: string | null
  billingAccountId?: string | null
  invoiceId?: string | null
  paymentId?: string | null
  displayLabel?: string | null
}

export type ManualQuoteClientSnapshot = {
  fullName?: string | null
  email?: string | null
  phoneNumber?: string | null
  organizationName?: string | null
}

export type ManualQuoteMessage = {
  messageId?: string | null
  senderType?: ManualQuoteMessageSenderType | null
  senderUserId?: string | null
  senderDisplayName?: string | null
  message?: string | null
  internalNote?: boolean | null
  attachments?: ManualQuoteAttachment[]
  createdAt?: string | null
}

export type ManualQuoteItemLine = {
  orderItemId?: string | null
  itemDisplayName?: string | null
  customQuoteReason?: string | null
  quoteReasonDescription?: string | null
  charges?: Record<string, number> | null
  subtotal?: number | null
  taxAmount?: number | null
  totalAmount?: number | null
  calculationContext?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

export type ManualQuoteOrderPricingPreview = {
  subtotal?: number | null
  taxes?: Record<string, number> | null
  total?: number | null
  currency?: string | null
}

export type ManualQuoteOffer = {
  quoteId?: string | null
  shippingOrderId?: string | null
  status?: AdminManualQuoteStatus | null
  title?: string | null
  description?: string | null
  itemLines?: ManualQuoteItemLine[]
  orderPricingPreview?: ManualQuoteOrderPricingPreview | null
  currency?: string | null
  pricingModelId?: string | null
  pricingModelVersion?: number | null
  pricingTypeApplied?: string | null
  ownerIdApplied?: string | null
  zoneCode?: string | null
  calculationContext?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  quotedByAdminUserId?: string | null
  quotedAt?: string | null
  expiresAt?: string | null
  customerDecisionByUserId?: string | null
  customerDecisionAt?: string | null
  customerRejectionReason?: string | null
  relatedMessageId?: string | null
}

export type AdminManualQuoteSummary = {
  ticketId: string
  ticketNumber?: string | null
  clientUserId?: string | null
  organizationId?: string | null
  clientSnapshot?: ManualQuoteClientSnapshot | null
  category?: "MANUAL_QUOTE_REQUEST" | string | null
  status?: AdminManualQuoteTicketStatus | null
  priority?: AdminManualQuotePriority | null
  visibility?: ManualQuoteVisibility | null
  subject?: string | null
  latestMessagePreview?: string | null
  relatedResource?: ManualQuoteRelatedResource | null
  assignedAdminUserId?: string | null
  customerUnread?: boolean | null
  adminUnread?: boolean | null
  lastCustomerMessageAt?: string | null
  lastAdminMessageAt?: string | null
  lastSystemMessageAt?: string | null
  resolvedAt?: string | null
  closedAt?: string | null
  archived?: boolean | null
  createdAt?: string | null
  updatedAt?: string | null
  manualQuoteOffers?: ManualQuoteOffer[]
  shippingOrder?: ShippingOrder | null
  orderStatus?: string | null
}

export type AdminManualQuoteDetail = AdminManualQuoteSummary & {
  messages?: ManualQuoteMessage[]
  resolvedByAdminUserId?: string | null
  resolutionSummary?: string | null
  closedByUserId?: string | null
  archivedAt?: string | null
  archivedByUserId?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
}

export type AdminManualQuotePagination = {
  page: number
  size: number
  totalElements: number
  totalPages: number
  sortBy: string
  sortDir: "asc" | "desc"
}

export type PagedAdminManualQuoteSummaryResponse = {
  tickets: AdminManualQuoteSummary[]
  pagination: AdminManualQuotePagination
}

export type AdminManualQuoteCombinedDetailResponse = {
  ticket?: AdminManualQuoteDetail | null
  shippingOrder?: ShippingOrder | null
  message?: string | null
}

export type ManualQuoteActionResponse = AdminManualQuoteCombinedDetailResponse

export type AdminManualQuoteFilters = {
  status?: string
  quoteStatus?: string
  priority?: string
  clientUserId?: string
  organizationId?: string
  assignedAdminUserId?: string
  shippingOrderId?: string
  fromDate?: string
  toDate?: string
  archived?: string
  page: number
  size: number
  sort?: string
}

export type AdminManualQuoteMessageRequest = {
  message: string
  attachments?: ManualQuoteAttachmentRequest[]
}

export type AdminManualQuoteInternalNoteRequest = AdminManualQuoteMessageRequest

export type AdminCreateManualQuoteItemLineRequest = {
  orderItemId: string
  itemDisplayName?: string
  customQuoteReason?: string
  quoteReasonDescription?: string
  charges?: Record<string, number>
  subtotal: number
  taxAmount?: number | null
  totalAmount: number
  calculationContext?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export type AdminCreateManualQuoteOfferRequest = {
  title?: string
  description?: string
  shippingOrderId?: string | null
  itemLines: AdminCreateManualQuoteItemLineRequest[]
  currency?: string
  pricingModelId?: string | null
  pricingModelVersion?: number | null
  pricingTypeApplied?: string
  ownerIdApplied?: string | null
  zoneCode?: string | null
  calculationContext?: Record<string, unknown>
  metadata?: Record<string, unknown>
  expiresAt?: string | null
  messageToCustomer?: string | null
}

export type AdminUpdateManualQuoteOfferRequest = {
  title?: string
  description?: string
  status?: "WITHDRAWN" | "EXPIRED"
  expiresAt?: string | null
  metadata?: Record<string, unknown>
  messageToCustomer?: string | null
}

export type AdminAssignManualQuoteRequest = {
  assignedAdminUserId?: string | null
}

export type AdminUpdateManualQuoteTicketRequest = {
  status?: AdminManualQuoteTicketStatus
  priority?: AdminManualQuotePriority
  assignedAdminUserId?: string | null
}

export type AdminCloseManualQuoteRequest = {
  reason?: string | null
}

export type AdminArchiveManualQuoteRequest = {
  reason?: string | null
}

export type ManualQuoteChargeRow = {
  id: string
  name: string
  amount: string
}

export type ManualQuoteTaxRow = {
  id: string
  name: string
  rate: string
  amount?: number
}

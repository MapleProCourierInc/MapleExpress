export const SUPPORT_TICKET_CATEGORIES = [
  "GENERAL_QUERY",
  "ORDER_QUERY",
  "DELIVERY_ISSUE",
  "DRIVER_COMPLAINT",
  "DAMAGED_PACKAGE",
  "MISSED_PICKUP",
  "LATE_DELIVERY",
  "BILLING_QUERY",
  "PAYMENT_QUERY",
  "INVOICE_DISPUTE",
  "ACCOUNT_QUERY",
  "TECHNICAL_ISSUE",
  "OTHER",
] as const

export const SUPPORT_TICKET_STATUSES = [
  "OPEN",
  "WAITING_FOR_ADMIN",
  "WAITING_FOR_CUSTOMER",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
] as const

export const SUPPORT_TICKET_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const

export const RELATED_RESOURCE_TYPES = [
  "NONE",
  "SHIPPING_ORDER",
  "ORDER_ITEM",
  "FULFILMENT",
  "DRIVER",
  "BILLING_ACCOUNT",
  "INVOICE",
  "PAYMENT",
] as const

export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number]
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number]
export type SupportTicketPriority = (typeof SUPPORT_TICKET_PRIORITIES)[number]
export type RelatedResourceType = (typeof RELATED_RESOURCE_TYPES)[number]
export type SupportMessageSenderType = "CUSTOMER" | "ADMIN" | "SYSTEM"
export type SupportTicketVisibility = "PUBLIC" | "INTERNAL"

export type SupportTicketApiError = {
  status?: string
  message?: string
  errors?: Array<{ field?: string; message?: string }>
  errorDetails?: {
    errorCode?: number
    errorType?: string
    characteristics?: Record<string, string>
  }
}

export type SupportTicketAttachment = {
  attachmentId?: string | null
  fileName?: string | null
  contentType?: string | null
  sizeBytes?: number | null
  storageKey?: string | null
  downloadUrl?: string | null
  uploadedByUserId?: string | null
  uploadedAt?: string | null
}

export type SupportTicketAttachmentRequest = {
  fileName: string
  contentType: string
  sizeBytes?: number | null
  storageKey: string
}

export type RelatedResourceRef = {
  type?: RelatedResourceType | null
  shippingOrderId?: string | null
  orderItemId?: string | null
  fulfilmentId?: string | null
  driverUserId?: string | null
  billingAccountId?: string | null
  invoiceId?: string | null
  paymentId?: string | null
  displayLabel?: string | null
}

export type SupportTicketClientSnapshot = {
  fullName?: string | null
  email?: string | null
  phoneNumber?: string | null
  organizationName?: string | null
}

export type SupportTicketMessage = {
  messageId?: string | null
  senderType?: SupportMessageSenderType | null
  senderUserId?: string | null
  senderDisplayName?: string | null
  message?: string | null
  internalNote?: boolean | null
  attachments?: SupportTicketAttachment[]
  createdAt?: string | null
}

export type SupportTicketSummary = {
  ticketId: string
  ticketNumber?: string | null
  clientUserId?: string | null
  organizationId?: string | null
  clientSnapshot?: SupportTicketClientSnapshot | null
  category?: SupportTicketCategory | null
  status?: SupportTicketStatus | null
  priority?: SupportTicketPriority | null
  visibility?: SupportTicketVisibility | null
  subject?: string | null
  latestMessagePreview?: string | null
  relatedResource?: RelatedResourceRef | null
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
}

export type SupportTicketDetail = SupportTicketSummary & {
  messages?: SupportTicketMessage[]
  resolvedByAdminUserId?: string | null
  resolutionSummary?: string | null
  closedByUserId?: string | null
  archivedAt?: string | null
  archivedByUserId?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
}

export type SupportTicketPagination = {
  page: number
  size: number
  totalElements: number
  totalPages: number
  sortBy: string
  sortDir: "asc" | "desc"
}

export type PagedSupportTicketSummaryResponse = {
  tickets: SupportTicketSummary[]
  pagination: SupportTicketPagination
}

export type AdminSupportTicketFilters = {
  status?: string
  category?: string
  priority?: string
  clientUserId?: string
  organizationId?: string
  assignedAdminUserId?: string
  shippingOrderId?: string
  orderItemId?: string
  fulfilmentId?: string
  driverUserId?: string
  billingAccountId?: string
  invoiceId?: string
  paymentId?: string
  fromDate?: string
  toDate?: string
  archived?: string
  page: number
  size: number
  sort?: string
}

export type AdminSupportTicketReplyRequest = {
  message: string
  attachments?: SupportTicketAttachmentRequest[]
}

export type AdminInternalNoteRequest = AdminSupportTicketReplyRequest

export type AdminAssignTicketRequest = {
  assignedAdminUserId?: string | null
}

export type AdminUpdateTicketRequest = {
  status?: SupportTicketStatus
  priority?: SupportTicketPriority
  category?: SupportTicketCategory
  assignedAdminUserId?: string | null
}

export type AdminResolveTicketRequest = {
  resolutionSummary?: string | null
  messageToCustomer?: string | null
}

export type AdminCloseTicketRequest = {
  reason?: string | null
}

export type AdminArchiveTicketRequest = {
  reason?: string | null
}

export type GenericSupportTicketActionResponse = {
  ticketId?: string | null
  status?: SupportTicketStatus | null
  message?: string | null
}

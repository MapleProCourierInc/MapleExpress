import { apiFetch } from "@/lib/client-api"
import type { ShippingOrder } from "@/lib/order-service"

export const MANUAL_QUOTE_TICKET_STATUSES = [
  "OPEN",
  "WAITING_FOR_ADMIN",
  "WAITING_FOR_CUSTOMER",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
] as const

export const MANUAL_QUOTE_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const
export const MANUAL_QUOTE_OFFER_STATUSES = [
  "OFFERED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "WITHDRAWN",
  "SUPERSEDED",
] as const

export type ManualQuoteTicketStatus = (typeof MANUAL_QUOTE_TICKET_STATUSES)[number]
export type ManualQuotePriority = (typeof MANUAL_QUOTE_PRIORITIES)[number]
export type ManualQuoteOfferStatus = (typeof MANUAL_QUOTE_OFFER_STATUSES)[number]
export type ManualQuoteSenderType = "CUSTOMER" | "ADMIN" | "SYSTEM"
export type ManualQuoteVisibility = "PUBLIC" | "INTERNAL"
export type ManualQuotePaymentMode = "PREPAID" | "POSTPAID"
export type ManualQuoteNextAction = "CONTINUE_TO_PAYMENT" | "ORDER_SUBMITTED"

export interface ManualQuoteAttachmentRequest {
  fileName: string
  contentType: string
  sizeBytes?: number | null
  storageKey: string
}

export interface ManualQuoteAttachment {
  attachmentId?: string | null
  fileName?: string | null
  contentType?: string | null
  sizeBytes?: number | null
  storageKey?: string | null
  downloadUrl?: string | null
  uploadedByUserId?: string | null
  uploadedAt?: string | null
}

export interface ManualQuoteRelatedResource {
  type?: string | null
  shippingOrderId?: string | null
  orderItemId?: string | null
  displayLabel?: string | null
  fulfilmentId?: string | null
  driverUserId?: string | null
  billingAccountId?: string | null
  invoiceId?: string | null
  paymentId?: string | null
}

export interface ManualQuoteClientSnapshot {
  fullName?: string | null
  email?: string | null
  phoneNumber?: string | null
  organizationName?: string | null
}

export interface ManualQuoteMessage {
  messageId?: string | null
  senderType?: ManualQuoteSenderType | null
  senderUserId?: string | null
  senderDisplayName?: string | null
  message?: string | null
  internalNote?: boolean | null
  attachments?: ManualQuoteAttachment[]
  createdAt?: string | null
}

export interface ManualQuoteItemLine {
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

export interface ManualQuoteOrderPricingPreview {
  subtotal?: number | null
  taxes?: Record<string, number> | null
  total?: number | null
  currency?: string | null
}

export interface ManualQuoteOffer {
  quoteId?: string | null
  shippingOrderId?: string | null
  status?: ManualQuoteOfferStatus | null
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

export interface ManualQuoteTicketSummary {
  ticketId: string
  ticketNumber?: string | null
  clientUserId?: string | null
  organizationId?: string | null
  clientSnapshot?: ManualQuoteClientSnapshot | null
  category?: "MANUAL_QUOTE_REQUEST" | string | null
  status?: ManualQuoteTicketStatus | null
  priority?: ManualQuotePriority | null
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

export interface ManualQuoteTicketDetail extends ManualQuoteTicketSummary {
  messages?: ManualQuoteMessage[]
  resolvedByAdminUserId?: string | null
  resolutionSummary?: string | null
  closedByUserId?: string | null
  archivedAt?: string | null
  archivedByUserId?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
}

export interface ManualQuotePagination {
  page: number
  size: number
  totalElements: number
  totalPages: number
  sortBy: string
  sortDir: "asc" | "desc"
}

export interface PagedManualQuoteTicketSummaryResponse {
  tickets: ManualQuoteTicketSummary[]
  pagination: ManualQuotePagination
}

export interface ManualQuoteCombinedDetailResponse {
  ticket?: ManualQuoteTicketDetail | null
  shippingOrder?: ShippingOrder | null
  message?: string | null
}

export interface CreateManualQuoteRequestResponse extends ManualQuoteCombinedDetailResponse {}

export interface ManualQuoteActionResponse extends ManualQuoteCombinedDetailResponse {}

export interface ManualQuoteAcceptResponse extends ManualQuoteCombinedDetailResponse {
  acceptedQuoteId?: string | null
  paymentRequired?: boolean | null
  paymentMode?: ManualQuotePaymentMode | null
  nextAction?: ManualQuoteNextAction | null
}

export interface SendManualQuoteMessageRequest {
  message: string
  attachments?: ManualQuoteAttachmentRequest[]
}

export interface AcceptManualQuoteOfferRequest {
  acceptanceNote?: string | null
}

export interface RejectManualQuoteOfferRequest {
  reason?: string | null
}

export interface ManualQuoteFilters {
  status?: ManualQuoteTicketStatus
  quoteStatus?: ManualQuoteOfferStatus
  shippingOrderId?: string
  archived?: boolean
  page?: number
  size?: number
  sort?: string
}

const TICKET_STATUS_LABELS: Record<ManualQuoteTicketStatus, string> = {
  OPEN: "Open",
  WAITING_FOR_ADMIN: "Waiting for support",
  WAITING_FOR_CUSTOMER: "Waiting for your response",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
}

const OFFER_STATUS_LABELS: Record<ManualQuoteOfferStatus, string> = {
  OFFERED: "Quote offered",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  WITHDRAWN: "Withdrawn",
  SUPERSEDED: "Replaced by newer quote",
}

const PRIORITY_LABELS: Record<ManualQuotePriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object"
}

function backendMessage(data: unknown, fallback: string) {
  return isRecord(data) && typeof data.message === "string" && data.message.trim()
    ? data.message
    : fallback
}

async function readJson(response: Response) {
  return response.json().catch(() => null)
}

function manualQuoteParams(filters: ManualQuoteFilters = {}) {
  const params = new URLSearchParams()

  if (filters.status) params.set("status", filters.status)
  if (filters.quoteStatus) params.set("quoteStatus", filters.quoteStatus)
  if (filters.shippingOrderId) params.set("shippingOrderId", filters.shippingOrderId)
  if (typeof filters.archived === "boolean") params.set("archived", String(filters.archived))

  params.set("page", String(filters.page ?? 0))
  params.set("size", String(filters.size ?? 20))
  params.set("sort", filters.sort ?? "updatedAt,desc")

  return params.toString()
}

function normalizePagination(data: unknown, filters: ManualQuoteFilters): ManualQuotePagination {
  const record = isRecord(data) ? data : {}
  const nested = isRecord(record.pagination) ? record.pagination : record

  return {
    page: typeof nested.page === "number" ? nested.page : filters.page ?? 0,
    size: typeof nested.size === "number" ? nested.size : filters.size ?? 20,
    totalElements: typeof nested.totalElements === "number" ? nested.totalElements : 0,
    totalPages: typeof nested.totalPages === "number" ? nested.totalPages : 0,
    sortBy: typeof nested.sortBy === "string" ? nested.sortBy : "updatedAt",
    sortDir: nested.sortDir === "asc" ? "asc" : "desc",
  }
}

function normalizeTicketPage(data: unknown, filters: ManualQuoteFilters): PagedManualQuoteTicketSummaryResponse {
  const record = isRecord(data) ? data : {}
  const tickets = Array.isArray(record.tickets)
    ? record.tickets
    : Array.isArray(record.content)
      ? record.content
      : []

  return {
    tickets: tickets as ManualQuoteTicketSummary[],
    pagination: normalizePagination(record, filters),
  }
}

export async function listManualQuotes(
  filters: ManualQuoteFilters = {},
): Promise<PagedManualQuoteTicketSummaryResponse> {
  const response = await apiFetch(`/api/manual-quotes?${manualQuoteParams(filters)}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(backendMessage(data, "We could not load your quotes. Please try again."))
  }

  return normalizeTicketPage(data, filters)
}

export async function getManualQuoteDetail(ticketId: string): Promise<ManualQuoteCombinedDetailResponse> {
  const response = await apiFetch(`/api/manual-quotes/${encodeURIComponent(ticketId)}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(backendMessage(data, "We could not load this quote request."))
  }

  return data as ManualQuoteCombinedDetailResponse
}

export async function createManualQuoteRequest(
  shippingOrderId: string,
): Promise<CreateManualQuoteRequestResponse> {
  const response = await apiFetch(
    `/api/shipping-orders/${encodeURIComponent(shippingOrderId)}/manual-quote-request`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    },
  )
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(backendMessage(data, "Failed to request a manual quote."))
  }

  return data as CreateManualQuoteRequestResponse
}

export async function sendManualQuoteMessage(
  ticketId: string,
  payload: SendManualQuoteMessageRequest,
): Promise<ManualQuoteActionResponse> {
  const response = await apiFetch(`/api/manual-quotes/${encodeURIComponent(ticketId)}/messages`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(backendMessage(data, "We could not send your message. Please try again."))
  }

  return data as ManualQuoteActionResponse
}

export async function acceptManualQuoteOffer(
  ticketId: string,
  quoteId: string,
  payload: AcceptManualQuoteOfferRequest = {},
): Promise<ManualQuoteAcceptResponse> {
  const response = await apiFetch(
    `/api/manual-quotes/${encodeURIComponent(ticketId)}/quote-offers/${encodeURIComponent(quoteId)}/accept`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  )
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(backendMessage(data, "We could not accept this quote. It may have expired or changed. Please refresh and try again."))
  }

  return data as ManualQuoteAcceptResponse
}

export async function rejectManualQuoteOffer(
  ticketId: string,
  quoteId: string,
  payload: RejectManualQuoteOfferRequest = {},
): Promise<ManualQuoteActionResponse> {
  const response = await apiFetch(
    `/api/manual-quotes/${encodeURIComponent(ticketId)}/quote-offers/${encodeURIComponent(quoteId)}/reject`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  )
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(backendMessage(data, "We could not reject this quote. Please try again."))
  }

  return data as ManualQuoteActionResponse
}

export async function markManualQuoteRead(ticketId: string): Promise<ManualQuoteActionResponse> {
  const response = await apiFetch(`/api/manual-quotes/${encodeURIComponent(ticketId)}/mark-read`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
    },
  })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(backendMessage(data, "Failed to mark quote as read."))
  }

  return data as ManualQuoteActionResponse
}

export function formatManualQuoteTicketStatus(status?: string | null) {
  return status && status in TICKET_STATUS_LABELS
    ? TICKET_STATUS_LABELS[status as ManualQuoteTicketStatus]
    : "Unknown"
}

export function formatManualQuoteOfferStatus(status?: string | null) {
  return status && status in OFFER_STATUS_LABELS
    ? OFFER_STATUS_LABELS[status as ManualQuoteOfferStatus]
    : "No quote yet"
}

export function formatManualQuotePriority(priority?: string | null) {
  return priority && priority in PRIORITY_LABELS ? PRIORITY_LABELS[priority as ManualQuotePriority] : "Normal"
}

export function canCustomerReplyToManualQuote(
  ticket?: Pick<ManualQuoteTicketSummary, "status" | "archived"> | null,
) {
  if (!ticket || ticket.archived) return false
  if (!ticket.status || !MANUAL_QUOTE_TICKET_STATUSES.includes(ticket.status)) return false
  return !["RESOLVED", "CLOSED", "CANCELLED"].includes(ticket.status)
}

export function isManualQuoteClosed(ticket?: Pick<ManualQuoteTicketSummary, "status" | "archived"> | null) {
  return Boolean(ticket?.archived || ticket?.status === "CLOSED" || ticket?.status === "CANCELLED")
}

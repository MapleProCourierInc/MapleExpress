import { apiFetch } from "@/lib/client-api"

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

export const SUPPORT_TICKET_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const

export const SUPPORT_TICKET_STATUSES = [
  "OPEN",
  "WAITING_FOR_ADMIN",
  "WAITING_FOR_CUSTOMER",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
] as const

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
export type SupportTicketPriority = (typeof SUPPORT_TICKET_PRIORITIES)[number]
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number]
export type RelatedResourceType = (typeof RELATED_RESOURCE_TYPES)[number]
export type SupportMessageSenderType = "CUSTOMER" | "ADMIN" | "SYSTEM"
export type SupportTicketVisibility = "PUBLIC" | "INTERNAL"

export interface SupportTicketAttachmentRequest {
  fileName: string
  contentType: string
  sizeBytes?: number | null
  storageKey: string
}

export interface SupportTicketAttachmentResponse {
  attachmentId?: string | null
  fileName?: string | null
  contentType?: string | null
  sizeBytes?: number | null
  storageKey?: string | null
  downloadUrl?: string | null
  uploadedByUserId?: string | null
  uploadedAt?: string | null
}

export interface RelatedResourceRef {
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

export interface CreateSupportTicketRequest {
  category: SupportTicketCategory
  priority?: SupportTicketPriority
  subject: string
  message: string
  relatedResource?: RelatedResourceRef | null
  attachments?: SupportTicketAttachmentRequest[]
}

export interface AddSupportTicketMessageRequest {
  message: string
  attachments?: SupportTicketAttachmentRequest[]
}

export interface SupportTicketClientSnapshot {
  fullName?: string | null
  email?: string | null
  phoneNumber?: string | null
  organizationName?: string | null
}

export interface SupportTicketMessage {
  messageId?: string | null
  senderType?: SupportMessageSenderType | null
  senderUserId?: string | null
  senderDisplayName?: string | null
  message?: string | null
  internalNote?: boolean | null
  attachments?: SupportTicketAttachmentResponse[]
  createdAt?: string | null
}

export interface SupportTicketSummary {
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

export interface SupportTicketDetail extends SupportTicketSummary {
  messages?: SupportTicketMessage[]
  resolvedByAdminUserId?: string | null
  resolutionSummary?: string | null
  closedByUserId?: string | null
  archivedAt?: string | null
  archivedByUserId?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
}

export interface SupportTicketPagination {
  page: number
  size: number
  totalElements: number
  totalPages: number
  sortBy: string
  sortDir: "asc" | "desc"
}

export interface PagedSupportTicketSummaryResponse {
  tickets: SupportTicketSummary[]
  pagination: SupportTicketPagination
}

export interface SupportTicketFilters {
  status?: SupportTicketStatus
  category?: SupportTicketCategory
  relatedResourceType?: RelatedResourceType
  shippingOrderId?: string
  orderItemId?: string
  page?: number
  size?: number
  sort?: string
}

export interface SupportTicketActionResponse {
  ticketId?: string | null
  status?: SupportTicketStatus | null
  message?: string | null
}

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  OPEN: "Open",
  WAITING_FOR_ADMIN: "Waiting for support",
  WAITING_FOR_CUSTOMER: "Waiting for your response",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
}

const PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
}

const CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  GENERAL_QUERY: "General query",
  ORDER_QUERY: "Order question",
  DELIVERY_ISSUE: "Delivery issue",
  DRIVER_COMPLAINT: "Driver complaint",
  DAMAGED_PACKAGE: "Damaged package",
  MISSED_PICKUP: "Missed pickup",
  LATE_DELIVERY: "Late delivery",
  BILLING_QUERY: "Billing question",
  PAYMENT_QUERY: "Payment question",
  INVOICE_DISPUTE: "Invoice dispute",
  ACCOUNT_QUERY: "Account question",
  TECHNICAL_ISSUE: "Technical issue",
  OTHER: "Other",
}

const RELATED_RESOURCE_LABELS: Record<RelatedResourceType, string> = {
  NONE: "None",
  SHIPPING_ORDER: "Shipping order",
  ORDER_ITEM: "Order item",
  FULFILMENT: "Fulfilment",
  DRIVER: "Driver",
  BILLING_ACCOUNT: "Billing account",
  INVOICE: "Invoice",
  PAYMENT: "Payment",
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

function supportTicketParams(filters: SupportTicketFilters = {}) {
  const params = new URLSearchParams()

  if (filters.status) params.set("status", filters.status)
  if (filters.category) params.set("category", filters.category)
  if (filters.relatedResourceType) {
    params.set("relatedResourceType", filters.relatedResourceType)
  }
  if (filters.shippingOrderId) params.set("shippingOrderId", filters.shippingOrderId)
  if (filters.orderItemId) params.set("orderItemId", filters.orderItemId)

  params.set("page", String(filters.page ?? 0))
  params.set("size", String(filters.size ?? 20))
  params.set("sort", filters.sort ?? "updatedAt,desc")

  return params.toString()
}

function normalizePagination(data: unknown, filters: SupportTicketFilters): SupportTicketPagination {
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

function normalizeTicketPage(data: unknown, filters: SupportTicketFilters): PagedSupportTicketSummaryResponse {
  const record = isRecord(data) ? data : {}
  const tickets = Array.isArray(record.tickets)
    ? record.tickets
    : Array.isArray(record.content)
      ? record.content
      : []

  return {
    tickets: tickets as SupportTicketSummary[],
    pagination: normalizePagination(record, filters),
  }
}

export async function getSupportTickets(
  filters: SupportTicketFilters = {},
): Promise<PagedSupportTicketSummaryResponse> {
  const response = await apiFetch(`/api/support-tickets?${supportTicketParams(filters)}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(backendMessage(data, "We could not load your support tickets. Please try again."))
  }

  return normalizeTicketPage(data, filters)
}

export async function createSupportTicket(payload: CreateSupportTicketRequest): Promise<SupportTicketDetail> {
  const response = await apiFetch("/api/support-tickets", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(backendMessage(data, "Failed to create support ticket."))
  }

  return data as SupportTicketDetail
}

export async function getSupportTicketDetail(ticketId: string): Promise<SupportTicketDetail> {
  const response = await apiFetch(`/api/support-tickets/${encodeURIComponent(ticketId)}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(backendMessage(data, "We could not load this support ticket. Please try again."))
  }

  return data as SupportTicketDetail
}

export async function addSupportTicketMessage(
  ticketId: string,
  payload: AddSupportTicketMessageRequest,
): Promise<SupportTicketDetail> {
  const response = await apiFetch(`/api/support-tickets/${encodeURIComponent(ticketId)}/messages`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(backendMessage(data, "Failed to send your reply."))
  }

  return data as SupportTicketDetail
}

export async function markSupportTicketRead(ticketId: string): Promise<SupportTicketActionResponse> {
  const response = await apiFetch(`/api/support-tickets/${encodeURIComponent(ticketId)}/mark-read`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
    },
  })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(backendMessage(data, "Failed to mark ticket as read."))
  }

  return data as SupportTicketActionResponse
}

export async function cancelSupportTicket(ticketId: string, reason?: string): Promise<SupportTicketActionResponse> {
  const trimmedReason = reason?.trim()
  const response = await apiFetch(`/api/support-tickets/${encodeURIComponent(ticketId)}/cancel`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(trimmedReason ? { reason: trimmedReason } : {}),
  })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(backendMessage(data, "Failed to cancel support ticket."))
  }

  return data as SupportTicketActionResponse
}

export function formatTicketStatus(status?: string | null) {
  return status && status in STATUS_LABELS ? STATUS_LABELS[status as SupportTicketStatus] : "Unknown"
}

export function formatTicketPriority(priority?: string | null) {
  return priority && priority in PRIORITY_LABELS ? PRIORITY_LABELS[priority as SupportTicketPriority] : "Normal"
}

export function formatTicketCategory(category?: string | null) {
  return category && category in CATEGORY_LABELS ? CATEGORY_LABELS[category as SupportTicketCategory] : "Other"
}

export function formatRelatedResourceType(type?: string | null) {
  return type && type in RELATED_RESOURCE_LABELS ? RELATED_RESOURCE_LABELS[type as RelatedResourceType] : "None"
}

export function canCustomerReply(ticket?: Pick<SupportTicketSummary, "status" | "archived"> | null) {
  if (!ticket || ticket.archived) return false
  if (!ticket.status || !SUPPORT_TICKET_STATUSES.includes(ticket.status)) return false
  return !["RESOLVED", "CLOSED", "CANCELLED"].includes(ticket.status || "")
}

export function canCustomerCancel(ticket?: Pick<SupportTicketSummary, "status" | "archived"> | null) {
  if (!ticket || ticket.archived) return false
  if (!ticket.status || !SUPPORT_TICKET_STATUSES.includes(ticket.status)) return false
  return !["RESOLVED", "CLOSED", "CANCELLED"].includes(ticket.status || "")
}

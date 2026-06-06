import "server-only"

import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { authenticatedServerFetch } from "@/lib/server-auth"
import type {
  AdminArchiveTicketRequest,
  AdminAssignTicketRequest,
  AdminCloseTicketRequest,
  AdminInternalNoteRequest,
  AdminResolveTicketRequest,
  AdminSupportTicketFilters,
  AdminSupportTicketReplyRequest,
  AdminUpdateTicketRequest,
  GenericSupportTicketActionResponse,
  PagedSupportTicketSummaryResponse,
  SupportTicketApiError,
  SupportTicketDetail,
} from "@/types/admin-support-tickets"

export type AdminSupportServiceResult<T> = {
  data: T | null
  error: SupportTicketApiError | null
  textError?: string | null
}

function withJsonHeaders(headers?: HeadersInit) {
  return {
    ...(headers || {}),
    Accept: "application/json",
    "Content-Type": "application/json",
  }
}

async function parseError(response: Response): Promise<{ error: SupportTicketApiError; textError: string | null }> {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as SupportTicketApiError | null
    return {
      error: payload ?? { status: String(response.status), message: "Request failed" },
      textError: null,
    }
  }

  const text = await response.text().catch(() => "")
  return {
    error: { status: String(response.status), message: "Request failed" },
    textError: text || null,
  }
}

async function supportFetch<T>(endpoint: string, init: RequestInit): Promise<AdminSupportServiceResult<T>> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(ORDER_SERVICE_URL, endpoint),
    init,
    { includeIdToken: true },
  )

  if (!response) {
    return { data: null, error: { status: "401", message: "Unauthorized" }, textError: null }
  }

  if (!response.ok) {
    return { data: null, ...(await parseError(response)) }
  }

  return { data: (await response.json().catch(() => null)) as T, error: null, textError: null }
}

export function adminSupportTicketSearchParams(filters: AdminSupportTicketFilters) {
  const params = new URLSearchParams()

  const entries: Array<[keyof AdminSupportTicketFilters, string | number | undefined]> = [
    ["status", filters.status],
    ["category", filters.category],
    ["priority", filters.priority],
    ["clientUserId", filters.clientUserId],
    ["organizationId", filters.organizationId],
    ["assignedAdminUserId", filters.assignedAdminUserId],
    ["shippingOrderId", filters.shippingOrderId],
    ["orderItemId", filters.orderItemId],
    ["fulfilmentId", filters.fulfilmentId],
    ["driverUserId", filters.driverUserId],
    ["billingAccountId", filters.billingAccountId],
    ["invoiceId", filters.invoiceId],
    ["paymentId", filters.paymentId],
    ["fromDate", filters.fromDate],
    ["toDate", filters.toDate],
    ["archived", filters.archived],
    ["sort", filters.sort],
    ["page", filters.page],
    ["size", filters.size],
  ]

  for (const [key, value] of entries) {
    const stringValue = String(value ?? "").trim()
    if (stringValue) params.set(key, stringValue)
  }

  return params.toString()
}

export function normalizeAdminSupportTicketPage(
  data: PagedSupportTicketSummaryResponse | null,
  filters: AdminSupportTicketFilters,
): PagedSupportTicketSummaryResponse {
  return {
    tickets: Array.isArray(data?.tickets) ? data.tickets : [],
    pagination: {
      page: data?.pagination?.page ?? filters.page,
      size: data?.pagination?.size ?? filters.size,
      totalElements: data?.pagination?.totalElements ?? 0,
      totalPages: data?.pagination?.totalPages ?? 0,
      sortBy: data?.pagination?.sortBy ?? "updatedAt",
      sortDir: data?.pagination?.sortDir === "asc" ? "asc" : "desc",
    },
  }
}

export async function adminListSupportTickets(
  filters: AdminSupportTicketFilters,
): Promise<AdminSupportServiceResult<PagedSupportTicketSummaryResponse>> {
  const search = adminSupportTicketSearchParams(filters)
  return supportFetch<PagedSupportTicketSummaryResponse>(
    `/api/v1/admin/support-tickets${search ? `?${search}` : ""}`,
    {
      method: "GET",
      headers: withJsonHeaders(),
    },
  )
}

export async function adminGetSupportTicket(ticketId: string): Promise<AdminSupportServiceResult<SupportTicketDetail>> {
  return supportFetch<SupportTicketDetail>(
    `/api/v1/admin/support-tickets/${encodeURIComponent(ticketId)}`,
    {
      method: "GET",
      headers: withJsonHeaders(),
    },
  )
}

export async function adminReplySupportTicket(
  ticketId: string,
  payload: AdminSupportTicketReplyRequest,
): Promise<AdminSupportServiceResult<SupportTicketDetail>> {
  return supportFetch<SupportTicketDetail>(
    `/api/v1/admin/support-tickets/${encodeURIComponent(ticketId)}/messages`,
    {
      method: "POST",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function adminAddSupportTicketInternalNote(
  ticketId: string,
  payload: AdminInternalNoteRequest,
): Promise<AdminSupportServiceResult<SupportTicketDetail>> {
  return supportFetch<SupportTicketDetail>(
    `/api/v1/admin/support-tickets/${encodeURIComponent(ticketId)}/internal-notes`,
    {
      method: "POST",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function adminAssignSupportTicket(
  ticketId: string,
  payload: AdminAssignTicketRequest,
): Promise<AdminSupportServiceResult<GenericSupportTicketActionResponse>> {
  return supportFetch<GenericSupportTicketActionResponse>(
    `/api/v1/admin/support-tickets/${encodeURIComponent(ticketId)}/assign`,
    {
      method: "PATCH",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function adminUpdateSupportTicket(
  ticketId: string,
  payload: AdminUpdateTicketRequest,
): Promise<AdminSupportServiceResult<GenericSupportTicketActionResponse>> {
  return supportFetch<GenericSupportTicketActionResponse>(
    `/api/v1/admin/support-tickets/${encodeURIComponent(ticketId)}`,
    {
      method: "PATCH",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function adminResolveSupportTicket(
  ticketId: string,
  payload: AdminResolveTicketRequest,
): Promise<AdminSupportServiceResult<GenericSupportTicketActionResponse>> {
  return supportFetch<GenericSupportTicketActionResponse>(
    `/api/v1/admin/support-tickets/${encodeURIComponent(ticketId)}/resolve`,
    {
      method: "PATCH",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function adminCloseSupportTicket(
  ticketId: string,
  payload: AdminCloseTicketRequest,
): Promise<AdminSupportServiceResult<GenericSupportTicketActionResponse>> {
  return supportFetch<GenericSupportTicketActionResponse>(
    `/api/v1/admin/support-tickets/${encodeURIComponent(ticketId)}/close`,
    {
      method: "PATCH",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function adminArchiveSupportTicket(
  ticketId: string,
  payload: AdminArchiveTicketRequest,
): Promise<AdminSupportServiceResult<GenericSupportTicketActionResponse>> {
  return supportFetch<GenericSupportTicketActionResponse>(
    `/api/v1/admin/support-tickets/${encodeURIComponent(ticketId)}/archive`,
    {
      method: "PATCH",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

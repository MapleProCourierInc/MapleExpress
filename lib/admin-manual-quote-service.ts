import "server-only"

import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { authenticatedServerFetch } from "@/lib/server-auth"
import type {
  AdminArchiveManualQuoteRequest,
  AdminAssignManualQuoteRequest,
  AdminCloseManualQuoteRequest,
  AdminCreateManualQuoteOfferRequest,
  AdminManualQuoteApiError,
  AdminManualQuoteCombinedDetailResponse,
  AdminManualQuoteFilters,
  AdminManualQuoteInternalNoteRequest,
  AdminManualQuoteMessageRequest,
  AdminUpdateManualQuoteOfferRequest,
  AdminUpdateManualQuoteTicketRequest,
  ManualQuoteActionResponse,
  PagedAdminManualQuoteSummaryResponse,
} from "@/types/admin-manual-quotes"

export type AdminManualQuoteServiceResult<T> = {
  data: T | null
  error: AdminManualQuoteApiError | null
  textError?: string | null
}

function withJsonHeaders(headers?: HeadersInit) {
  return {
    ...(headers || {}),
    Accept: "application/json",
    "Content-Type": "application/json",
  }
}

async function parseError(response: Response): Promise<{ error: AdminManualQuoteApiError; textError: string | null }> {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as AdminManualQuoteApiError | null
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

async function manualQuoteFetch<T>(endpoint: string, init: RequestInit): Promise<AdminManualQuoteServiceResult<T>> {
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

export function adminManualQuoteSearchParams(filters: AdminManualQuoteFilters) {
  const params = new URLSearchParams()

  const entries: Array<[keyof AdminManualQuoteFilters, string | number | undefined]> = [
    ["status", filters.status],
    ["quoteStatus", filters.quoteStatus],
    ["priority", filters.priority],
    ["clientUserId", filters.clientUserId],
    ["organizationId", filters.organizationId],
    ["assignedAdminUserId", filters.assignedAdminUserId],
    ["shippingOrderId", filters.shippingOrderId],
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

export function normalizeAdminManualQuotePage(
  data: PagedAdminManualQuoteSummaryResponse | null,
  filters: AdminManualQuoteFilters,
): PagedAdminManualQuoteSummaryResponse {
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

export async function adminListManualQuotes(
  filters: AdminManualQuoteFilters,
): Promise<AdminManualQuoteServiceResult<PagedAdminManualQuoteSummaryResponse>> {
  const search = adminManualQuoteSearchParams(filters)
  return manualQuoteFetch<PagedAdminManualQuoteSummaryResponse>(
    `/api/v1/admin/manual-quotes${search ? `?${search}` : ""}`,
    {
      method: "GET",
      headers: withJsonHeaders(),
    },
  )
}

export async function adminGetManualQuoteDetail(
  ticketId: string,
): Promise<AdminManualQuoteServiceResult<AdminManualQuoteCombinedDetailResponse>> {
  return manualQuoteFetch<AdminManualQuoteCombinedDetailResponse>(
    `/api/v1/admin/manual-quotes/${encodeURIComponent(ticketId)}`,
    {
      method: "GET",
      headers: withJsonHeaders(),
    },
  )
}

export async function adminSendManualQuoteMessage(
  ticketId: string,
  payload: AdminManualQuoteMessageRequest,
): Promise<AdminManualQuoteServiceResult<ManualQuoteActionResponse>> {
  return manualQuoteFetch<ManualQuoteActionResponse>(
    `/api/v1/admin/manual-quotes/${encodeURIComponent(ticketId)}/messages`,
    {
      method: "POST",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function adminAddManualQuoteInternalNote(
  ticketId: string,
  payload: AdminManualQuoteInternalNoteRequest,
): Promise<AdminManualQuoteServiceResult<ManualQuoteActionResponse>> {
  return manualQuoteFetch<ManualQuoteActionResponse>(
    `/api/v1/admin/manual-quotes/${encodeURIComponent(ticketId)}/internal-notes`,
    {
      method: "POST",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function adminCreateManualQuoteOffer(
  ticketId: string,
  payload: AdminCreateManualQuoteOfferRequest,
): Promise<AdminManualQuoteServiceResult<ManualQuoteActionResponse>> {
  return manualQuoteFetch<ManualQuoteActionResponse>(
    `/api/v1/admin/manual-quotes/${encodeURIComponent(ticketId)}/quote-offers`,
    {
      method: "POST",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function adminUpdateManualQuoteOffer(
  ticketId: string,
  quoteId: string,
  payload: AdminUpdateManualQuoteOfferRequest,
): Promise<AdminManualQuoteServiceResult<ManualQuoteActionResponse>> {
  return manualQuoteFetch<ManualQuoteActionResponse>(
    `/api/v1/admin/manual-quotes/${encodeURIComponent(ticketId)}/quote-offers/${encodeURIComponent(quoteId)}`,
    {
      method: "PATCH",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function adminAssignManualQuote(
  ticketId: string,
  payload: AdminAssignManualQuoteRequest,
): Promise<AdminManualQuoteServiceResult<ManualQuoteActionResponse>> {
  return manualQuoteFetch<ManualQuoteActionResponse>(
    `/api/v1/admin/manual-quotes/${encodeURIComponent(ticketId)}/assign`,
    {
      method: "PATCH",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function adminUpdateManualQuoteTicket(
  ticketId: string,
  payload: AdminUpdateManualQuoteTicketRequest,
): Promise<AdminManualQuoteServiceResult<ManualQuoteActionResponse>> {
  return manualQuoteFetch<ManualQuoteActionResponse>(
    `/api/v1/admin/manual-quotes/${encodeURIComponent(ticketId)}`,
    {
      method: "PATCH",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function adminCloseManualQuote(
  ticketId: string,
  payload: AdminCloseManualQuoteRequest,
): Promise<AdminManualQuoteServiceResult<ManualQuoteActionResponse>> {
  return manualQuoteFetch<ManualQuoteActionResponse>(
    `/api/v1/admin/manual-quotes/${encodeURIComponent(ticketId)}/close`,
    {
      method: "PATCH",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function adminArchiveManualQuote(
  ticketId: string,
  payload: AdminArchiveManualQuoteRequest,
): Promise<AdminManualQuoteServiceResult<ManualQuoteActionResponse>> {
  return manualQuoteFetch<ManualQuoteActionResponse>(
    `/api/v1/admin/manual-quotes/${encodeURIComponent(ticketId)}/archive`,
    {
      method: "PATCH",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

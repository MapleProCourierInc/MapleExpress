import "server-only"

import { PRICING_PAYMENT_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { authenticatedServerFetch } from "@/lib/server-auth"
import type {
  AdminRefundApiError,
  AdminRefundFilters,
  BatchActionResponse,
  BatchApprovalRequest,
  BatchRejectionRequest,
  ManualRefundRequest,
  RefundActionResult,
  RefundDetailResponse,
  RefundSearchResponse,
} from "@/types/admin-refunds"

export type AdminRefundServiceResult<T> = {
  data: T | null
  error: AdminRefundApiError | null
  textError?: string | null
}

function withJsonHeaders(headers?: HeadersInit) {
  return {
    ...(headers || {}),
    Accept: "application/json",
    "Content-Type": "application/json",
  }
}

async function parseError(response: Response): Promise<{ error: AdminRefundApiError; textError: string | null }> {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as AdminRefundApiError | null
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

async function refundFetch<T>(endpoint: string, init: RequestInit): Promise<AdminRefundServiceResult<T>> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(PRICING_PAYMENT_SERVICE_URL, endpoint),
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

export function adminRefundSearchParams(filters: AdminRefundFilters) {
  const params = new URLSearchParams()

  const entries: Array<[keyof AdminRefundFilters, string | number | undefined]> = [
    ["refundId", filters.refundId],
    ["paymentId", filters.paymentId],
    ["shippingOrderId", filters.shippingOrderId],
    ["trackingNumber", filters.trackingNumber],
    ["payerUserId", filters.payerUserId],
    ["status", filters.status],
    ["workflowType", filters.workflowType],
    ["reasonCode", filters.reasonCode],
    ["destination", filters.destination],
    ["paymentMethodType", filters.paymentMethodType],
    ["paymentProvider", filters.paymentProvider],
    ["paymentStatus", filters.paymentStatus],
    ["currency", filters.currency],
    ["pricingId", filters.pricingId],
    ["requestedFrom", filters.requestedFrom],
    ["requestedTo", filters.requestedTo],
    ["reviewedFrom", filters.reviewedFrom],
    ["reviewedTo", filters.reviewedTo],
    ["processedFrom", filters.processedFrom],
    ["processedTo", filters.processedTo],
    ["minProposedAmount", filters.minProposedAmount],
    ["maxProposedAmount", filters.maxProposedAmount],
    ["minApprovedAmount", filters.minApprovedAmount],
    ["maxApprovedAmount", filters.maxApprovedAmount],
    ["requestingActorType", filters.requestingActorType],
    ["reviewingAdminId", filters.reviewingAdminId],
    ["policyCode", filters.policyCode],
    ["policyVersion", filters.policyVersion],
    ["gatewayExecutionBlocked", filters.gatewayExecutionBlocked],
    ["search", filters.search],
    ["page", filters.page],
    ["size", filters.size],
    ["sortBy", filters.sortBy],
    ["sortDirection", filters.sortDirection],
  ]

  for (const [key, value] of entries) {
    const stringValue = String(value ?? "").trim()
    if (stringValue) params.set(key, stringValue)
  }

  return params.toString()
}

export function normalizeAdminRefundPage(
  data: RefundSearchResponse | null,
  filters: AdminRefundFilters,
): RefundSearchResponse {
  const sortDirection = data?.sortDirection === "ASC" ? "ASC" : "DESC"

  return {
    content: Array.isArray(data?.content) ? data.content : [],
    page: data?.page ?? filters.page,
    size: data?.size ?? filters.size,
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    sortBy: data?.sortBy ?? filters.sortBy,
    sortDirection,
  }
}

export async function adminListRefunds(
  filters: AdminRefundFilters,
): Promise<AdminRefundServiceResult<RefundSearchResponse>> {
  const search = adminRefundSearchParams(filters)

  return refundFetch<RefundSearchResponse>(`/api/v2/admin/refunds${search ? `?${search}` : ""}`, {
    method: "GET",
    headers: withJsonHeaders(),
  })
}

export async function adminGetRefund(
  paymentId: string,
  refundId: string,
): Promise<AdminRefundServiceResult<RefundDetailResponse>> {
  return refundFetch<RefundDetailResponse>(
    `/api/v2/admin/refunds/${encodeURIComponent(paymentId)}/${encodeURIComponent(refundId)}`,
    {
      method: "GET",
      headers: withJsonHeaders(),
    },
  )
}

export async function adminApproveRefunds(
  payload: BatchApprovalRequest,
): Promise<AdminRefundServiceResult<BatchActionResponse>> {
  return refundFetch<BatchActionResponse>("/api/v2/admin/refunds/approvals", {
    method: "POST",
    headers: withJsonHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function adminRejectRefunds(
  payload: BatchRejectionRequest,
): Promise<AdminRefundServiceResult<BatchActionResponse>> {
  return refundFetch<BatchActionResponse>("/api/v2/admin/refunds/rejections", {
    method: "POST",
    headers: withJsonHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function adminCreateManualRefund(
  payload: ManualRefundRequest,
  idempotencyKey?: string | null,
): Promise<AdminRefundServiceResult<RefundActionResult>> {
  const headers = withJsonHeaders(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined)

  return refundFetch<RefundActionResult>("/api/v2/admin/refunds/manual", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })
}

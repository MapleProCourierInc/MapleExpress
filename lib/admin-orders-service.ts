import "server-only"

import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config.server"
import { atlanticLocalDateTime } from "@/lib/halifax-datetime"
import { authenticatedServerFetch } from "@/lib/server-auth"
import type {
  AdminOrdersApiError,
  AdminOrdersFilters,
  AdminOrdersPage,
} from "@/types/admin-orders"

export type AdminOrdersServiceResult<T> = {
  data: T | null
  error: AdminOrdersApiError | null
  textError?: string | null
}

function isDirtyTextResponse(text: string) {
  return /<!doctype|<html|<head|<body|<\/|nginx|temporarily unavailable/i.test(text)
}

async function parseError(response: Response): Promise<{ error: AdminOrdersApiError; textError: string | null }> {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as AdminOrdersApiError | null
    return {
      error: payload ?? { status: String(response.status), message: "Request failed" },
      textError: null,
    }
  }

  const text = await response.text().catch(() => "")
  const dirty = isDirtyTextResponse(text)
  return {
    error: {
      status: String(response.status),
      message: [502, 503, 504].includes(response.status)
        ? "Order management service is temporarily unavailable"
        : "Request failed",
    },
    textError: text && !dirty ? text : null,
  }
}

function dateTimeBoundary(value: string | undefined, endOfDay: boolean) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (trimmed.includes("T")) return trimmed

  try {
    return atlanticLocalDateTime(trimmed, endOfDay ? "23:59:59" : "00:00:00")
  } catch {
    return null
  }
}

export function adminOrdersSearchParams(filters: AdminOrdersFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    size: String(filters.size),
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  })

  const directFilters: Array<[string, string | undefined]> = [
    ["shippingOrderId", filters.shippingOrderId],
    ["userId", filters.userId],
    ["clientUserId", filters.clientUserId],
    ["clientType", filters.clientType],
    ["paymentStatus", filters.paymentStatus],
    ["trackingId", filters.trackingId],
    ["priorityDelivery", filters.priorityDelivery],
  ]

  for (const [key, value] of directFilters) {
    const normalized = value?.trim()
    if (normalized) params.set(key, normalized)
  }

  for (const status of filters.orderStatuses || []) {
    const normalized = status.trim()
    if (normalized) params.append("orderStatus", normalized)
  }

  const createdFrom = dateTimeBoundary(filters.createdFrom, false)
  const createdTo = dateTimeBoundary(filters.createdTo, true)
  const updatedFrom = dateTimeBoundary(filters.updatedFrom, false)
  const updatedTo = dateTimeBoundary(filters.updatedTo, true)
  if (createdFrom) params.set("createdFrom", createdFrom)
  if (createdTo) params.set("createdTo", createdTo)
  if (updatedFrom) params.set("updatedFrom", updatedFrom)
  if (updatedTo) params.set("updatedTo", updatedTo)

  return params.toString()
}

export function normalizeAdminOrdersPage(
  data: AdminOrdersPage | null,
  filters: AdminOrdersFilters,
): AdminOrdersPage {
  return {
    orders: Array.isArray(data?.orders) ? data.orders : [],
    pagination: {
      page: data?.pagination?.page ?? filters.page,
      size: data?.pagination?.size ?? filters.size,
      totalElements: data?.pagination?.totalElements ?? 0,
      totalPages: data?.pagination?.totalPages ?? 0,
      sortBy: data?.pagination?.sortBy ?? filters.sortBy,
      sortDir: data?.pagination?.sortDir === "asc" ? "asc" : "desc",
    },
  }
}

export async function getAdminOrders(
  filters: AdminOrdersFilters,
): Promise<AdminOrdersServiceResult<AdminOrdersPage>> {
  if (!ORDER_SERVICE_URL) {
    return {
      data: null,
      error: { status: "500", message: "ORDER_MANAGEMENT_SERVICE_BASE_URL is not configured" },
      textError: null,
    }
  }

  const query = adminOrdersSearchParams(filters)
  const response = await authenticatedServerFetch(
    `${getEndpointUrl(ORDER_SERVICE_URL, "/orders")}?${query}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
    { includeIdToken: true },
  )

  if (!response) {
    return { data: null, error: { status: "401", message: "Unauthorized" }, textError: null }
  }

  if (!response.ok) {
    return { data: null, ...(await parseError(response)) }
  }

  return {
    data: (await response.json().catch(() => null)) as AdminOrdersPage | null,
    error: null,
    textError: null,
  }
}

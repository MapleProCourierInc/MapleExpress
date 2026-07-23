import "server-only"

import { ORDER_FULFILMENT_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { authenticatedServerFetch } from "@/lib/server-auth"
import type {
  AssignDriverRequest,
  AssignOrdersRequest,
  OrderFulfillment,
  OrderFulfillmentApiError,
  OrderFulfillmentQuery,
  OrderFulfillmentsResponse,
} from "@/types/admin-order-fulfillments"

type ServiceResult<T> = {
  data: T | null
  error: OrderFulfillmentApiError | null
  textError?: string | null
}

function isDirtyTextResponse(text: string) {
  return /<!doctype|<html|<head|<body|<\/|nginx|temporarily unavailable/i.test(text)
}

function friendlyError(response: Response, text?: string): OrderFulfillmentApiError {
  if ([502, 503, 504].includes(response.status) || (text && isDirtyTextResponse(text))) {
    return {
      status: String(response.status),
      message: "Fulfilment service is temporarily unavailable",
    }
  }

  return { status: String(response.status), message: "Request failed" }
}

async function parseError(response: Response): Promise<{ error: OrderFulfillmentApiError | null; textError: string | null }> {
  const contentType = response.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    const errorPayload = (await response.json().catch(() => null)) as OrderFulfillmentApiError | null
    return {
      error: errorPayload ?? { status: String(response.status), message: "Request failed" },
      textError: null,
    }
  }

  const text = await response.text().catch(() => "")
  const dirty = isDirtyTextResponse(text)
  return {
    error: friendlyError(response, text),
    textError: text && !dirty ? text : null,
  }
}

export async function getAdminOrderFulfillments(
  query: OrderFulfillmentQuery,
): Promise<ServiceResult<OrderFulfillmentsResponse>> {
  const params = new URLSearchParams({
    page: String(query.page),
    size: String(query.size),
    sortBy: query.sortBy || "createdAt",
    sortDir: query.sortDir || "asc",
  })

  if (query.trackingNumber) params.set("trackingNumber", query.trackingNumber)
  if (query.shippingOrderId) params.set("shippingOrderId", query.shippingOrderId)
  if (query.status && query.status !== "ALL") params.set("status", query.status)
  if (query.assignedDriverUserId) params.set("assignedDriverUserId", query.assignedDriverUserId)
  if (query.assignedDriverName) params.set("assignedDriverName", query.assignedDriverName)

  const response = await authenticatedServerFetch(
    `${getEndpointUrl(ORDER_FULFILMENT_SERVICE_URL, "/v1/orderFulfillments")}?${params.toString()}`,
    { method: "GET" },
    { includeIdToken: true },
  )

  if (!response) {
    return { data: null, error: { status: "401", message: "Unauthorized" }, textError: null }
  }

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as OrderFulfillmentsResponse, error: null, textError: null }
}

export async function assignDriverToOrderFulfillment(
  payload: AssignDriverRequest,
): Promise<ServiceResult<OrderFulfillment>> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(ORDER_FULFILMENT_SERVICE_URL, "/v1/assignDriver"),
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    { includeIdToken: true },
  )

  if (!response) {
    return { data: null, error: { status: "401", message: "Unauthorized" }, textError: null }
  }

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as OrderFulfillment, error: null, textError: null }
}

export async function assignDriverToOrderFulfillments(
  payload: AssignOrdersRequest,
): Promise<ServiceResult<OrderFulfillment[]>> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(ORDER_FULFILMENT_SERVICE_URL, "/v1/assignOrders"),
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    { includeIdToken: true },
  )

  if (!response) {
    return { data: null, error: { status: "401", message: "Unauthorized" }, textError: null }
  }

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as OrderFulfillment[], error: null, textError: null }
}

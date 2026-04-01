import "server-only"

import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { authenticatedServerFetch } from "@/lib/server-auth"
import type {
  CreateServiceZoneRequest,
  CreateServiceZoneResponse,
  ListServiceZonesResponse,
  ServiceZoneApiError,
  ToggleServiceZoneActiveRequest,
  ToggleServiceZoneActiveResponse,
} from "@/types/admin-service-zones"

type ServiceResult<T> = {
  data: T | null
  error: ServiceZoneApiError | null
  textError?: string | null
}

type ZoneFilters = {
  active?: boolean
  city?: string
  station?: string
}

function withJsonHeaders(headers?: HeadersInit) {
  return {
    ...(headers || {}),
    Accept: "application/json",
    "Content-Type": "application/json",
  }
}

async function parseError(response: Response): Promise<{ error: ServiceZoneApiError | null; textError: string | null }> {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const errorPayload = (await response.json().catch(() => null)) as ServiceZoneApiError | null
    return {
      error: errorPayload ?? { status: String(response.status), message: "Request failed" },
      textError: null,
    }
  }

  const text = await response.text().catch(() => "")
  return {
    error: { status: String(response.status), message: "Request failed" },
    textError: text || null,
  }
}

export async function listServiceZones(filters: ZoneFilters = {}): Promise<ServiceResult<ListServiceZonesResponse>> {
  const params = new URLSearchParams()
  if (typeof filters.active === "boolean") params.set("active", String(filters.active))
  if (filters.city) params.set("city", filters.city)
  if (filters.station) params.set("station", filters.station)

  const suffix = params.toString() ? `?${params.toString()}` : ""
  const response = await authenticatedServerFetch(
    getEndpointUrl(ORDER_SERVICE_URL, `/service-zones${suffix}`),
    {
      method: "GET",
      headers: withJsonHeaders(),
    },
    { includeIdToken: true },
  )

  if (!response) return { data: null, error: { status: "401", message: "Unauthorized" } }

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as ListServiceZonesResponse, error: null, textError: null }
}

export async function createServiceZone(payload: CreateServiceZoneRequest): Promise<ServiceResult<CreateServiceZoneResponse>> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(ORDER_SERVICE_URL, "/service-zones"),
    {
      method: "POST",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
    { includeIdToken: true },
  )

  if (!response) return { data: null, error: { status: "401", message: "Unauthorized" } }

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as CreateServiceZoneResponse, error: null, textError: null }
}

export async function toggleServiceZoneActive(
  id: string,
  payload: ToggleServiceZoneActiveRequest,
): Promise<ServiceResult<ToggleServiceZoneActiveResponse>> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(ORDER_SERVICE_URL, `/service-zones/${id}/active`),
    {
      method: "PATCH",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
    { includeIdToken: true },
  )

  if (!response) return { data: null, error: { status: "401", message: "Unauthorized" } }

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as ToggleServiceZoneActiveResponse, error: null, textError: null }
}

import "server-only"

import { cookies } from "next/headers"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
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

async function getAuthHeaders() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("maplexpress_access_token")?.value || cookieStore.get("accessToken")?.value
  const idToken = cookieStore.get("maplexpress_id_token")?.value

  if (!accessToken || !idToken) return null
  return {
    Authorization: `Bearer ${accessToken}`,
    "X-Id-Token": idToken,
  }
}

function withJsonHeaders(headers: Record<string, string>) {
  return {
    ...headers,
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
  const headers = await getAuthHeaders()
  if (!headers) return { data: null, error: { status: "401", message: "Unauthorized" } }

  const params = new URLSearchParams()
  if (typeof filters.active === "boolean") params.set("active", String(filters.active))
  if (filters.city) params.set("city", filters.city)
  if (filters.station) params.set("station", filters.station)

  const suffix = params.toString() ? `?${params.toString()}` : ""
  const response = await fetch(getEndpointUrl(ORDER_SERVICE_URL, `/service-zones${suffix}`), {
    method: "GET",
    headers: withJsonHeaders(headers),
    cache: "no-store",
  })

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as ListServiceZonesResponse, error: null, textError: null }
}

export async function createServiceZone(payload: CreateServiceZoneRequest): Promise<ServiceResult<CreateServiceZoneResponse>> {
  const headers = await getAuthHeaders()
  if (!headers) return { data: null, error: { status: "401", message: "Unauthorized" } }

  const response = await fetch(getEndpointUrl(ORDER_SERVICE_URL, "/service-zones"), {
    method: "POST",
    headers: withJsonHeaders(headers),
    body: JSON.stringify(payload),
    cache: "no-store",
  })

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
  const headers = await getAuthHeaders()
  if (!headers) return { data: null, error: { status: "401", message: "Unauthorized" } }

  const response = await fetch(getEndpointUrl(ORDER_SERVICE_URL, `/service-zones/${id}/active`), {
    method: "PATCH",
    headers: withJsonHeaders(headers),
    body: JSON.stringify(payload),
    cache: "no-store",
  })

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as ToggleServiceZoneActiveResponse, error: null, textError: null }
}

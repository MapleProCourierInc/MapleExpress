import "server-only"

import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { getServerAuthHeaders } from "@/lib/server-auth"
import type {
  AdminCustomerProfileListFilters,
  AdminEnablePayLaterRequest,
  AdminUpdatePostpayStatusRequest,
  ApiErrorResponse,
  IndividualProfile,
  OrganizationProfile,
  PageResponse,
  ProfileBillingConfigurationResponse,
} from "@/types/admin-customer-billing"

type ServiceResult<T> = {
  data: T | null
  error: ApiErrorResponse | null
  textError?: string | null
}

function withJsonHeaders(headers: Record<string, string>) {
  return {
    ...headers,
    Accept: "application/json",
    "Content-Type": "application/json",
  }
}

async function parseError(response: Response): Promise<{ error: ApiErrorResponse | null; textError: string | null }> {
  const contentType = response.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    const errorPayload = (await response.json().catch(() => null)) as ApiErrorResponse | null
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

function normalizePageResponse<T>(payload: unknown, fallbackPage: number, fallbackSize: number): PageResponse<T> {
  if (Array.isArray(payload)) {
    return {
      items: payload as T[],
      page: fallbackPage,
      size: fallbackSize,
      totalElements: payload.length,
      totalPages: payload.length > 0 ? 1 : 0,
    }
  }

  const candidate = payload as Partial<PageResponse<T>> | null
  return {
    items: Array.isArray(candidate?.items) ? candidate.items : [],
    page: typeof candidate?.page === "number" ? candidate.page : fallbackPage,
    size: typeof candidate?.size === "number" ? candidate.size : fallbackSize,
    totalElements: typeof candidate?.totalElements === "number" ? candidate.totalElements : 0,
    totalPages: typeof candidate?.totalPages === "number" ? candidate.totalPages : 0,
  }
}

export async function listIndividualProfiles(
  filters: Omit<AdminCustomerProfileListFilters, "ownerType">,
): Promise<ServiceResult<PageResponse<IndividualProfile>>> {
  const headers = await getServerAuthHeaders({ includeIdToken: true })
  if (!headers) return { data: null, error: { status: "401", message: "Unauthorized" } }

  const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size) })
  if (filters.email) params.set("email", filters.email)
  if (filters.userId) params.set("userId", filters.userId)
  if (filters.type) params.set("type", filters.type)

  const endpoint = `${getEndpointUrl(PROFILE_SERVICE_URL, "/profile/individual")}?${params.toString()}`
  const response = await fetch(endpoint, { method: "GET", headers: withJsonHeaders(headers), cache: "no-store" })

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  const payload = (await response.json()) as unknown
  return { data: normalizePageResponse<IndividualProfile>(payload, filters.page, filters.size), error: null, textError: null }
}

export async function getIndividualProfileById(id: string): Promise<ServiceResult<IndividualProfile>> {
  const headers = await getServerAuthHeaders({ includeIdToken: true })
  if (!headers) return { data: null, error: { status: "401", message: "Unauthorized" } }

  const response = await fetch(getEndpointUrl(PROFILE_SERVICE_URL, `/profile/individual/${id}`), {
    method: "GET",
    headers: withJsonHeaders(headers),
    cache: "no-store",
  })

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as IndividualProfile, error: null, textError: null }
}

export async function listOrganizationProfiles(
  filters: Omit<AdminCustomerProfileListFilters, "ownerType">,
): Promise<ServiceResult<PageResponse<OrganizationProfile>>> {
  const headers = await getServerAuthHeaders({ includeIdToken: true })
  if (!headers) return { data: null, error: { status: "401", message: "Unauthorized" } }

  const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size) })
  if (filters.userId) params.set("userId", filters.userId)
  if (filters.email) params.set("email", filters.email)
  if (filters.name) params.set("name", filters.name)
  if (filters.industry) params.set("industry", filters.industry)

  const endpoint = `${getEndpointUrl(PROFILE_SERVICE_URL, "/profile/organization")}?${params.toString()}`

  const response = await fetch(endpoint, { method: "GET", headers: withJsonHeaders(headers), cache: "no-store" })

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  const payload = (await response.json()) as unknown
  return {
    data: normalizePageResponse<OrganizationProfile>(payload, filters.page, filters.size),
    error: null,
    textError: null,
  }
}

export async function getOrganizationProfileById(id: string): Promise<ServiceResult<OrganizationProfile>> {
  const headers = await getServerAuthHeaders({ includeIdToken: true })
  if (!headers) return { data: null, error: { status: "401", message: "Unauthorized" } }

  const response = await fetch(getEndpointUrl(PROFILE_SERVICE_URL, `/profile/organization/${id}`), {
    method: "GET",
    headers: withJsonHeaders(headers),
    cache: "no-store",
  })

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as OrganizationProfile, error: null, textError: null }
}

export async function enablePayLater(
  payload: AdminEnablePayLaterRequest,
): Promise<ServiceResult<ProfileBillingConfigurationResponse>> {
  const headers = await getServerAuthHeaders({ includeIdToken: true })
  if (!headers) return { data: null, error: { status: "401", message: "Unauthorized" } }

  const response = await fetch(getEndpointUrl(PROFILE_SERVICE_URL, "/admin/profile/billing/pay-later/enable"), {
    method: "POST",
    headers: withJsonHeaders(headers),
    body: JSON.stringify(payload),
    cache: "no-store",
  })

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as ProfileBillingConfigurationResponse, error: null, textError: null }
}


export async function updatePostpayStatus(
  payload: AdminUpdatePostpayStatusRequest,
): Promise<ServiceResult<ProfileBillingConfigurationResponse>> {
  const headers = await getServerAuthHeaders({ includeIdToken: true })
  if (!headers) return { data: null, error: { status: "401", message: "Unauthorized" } }

  const response = await fetch(getEndpointUrl(PROFILE_SERVICE_URL, "/admin/profile/billing/postpay/status"), {
    method: "PATCH",
    headers: withJsonHeaders(headers),
    body: JSON.stringify(payload),
    cache: "no-store",
  })

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as ProfileBillingConfigurationResponse, error: null, textError: null }
}

import "server-only"

import { cookies } from "next/headers"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import type {
  AdminCustomerProfileListFilters,
  AdminEnablePayLaterRequest,
  ApiErrorResponse,
  IndividualProfile,
  OrganizationProfile,
  ProfileBillingConfigurationResponse,
} from "@/types/admin-customer-billing"

type ServiceResult<T> = {
  data: T | null
  error: ApiErrorResponse | null
  textError?: string | null
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

export async function listIndividualProfiles(
  filters: Omit<AdminCustomerProfileListFilters, "ownerType">,
): Promise<ServiceResult<IndividualProfile[]>> {
  const headers = await getAuthHeaders()
  if (!headers) return { data: null, error: { status: "401", message: "Unauthorized" } }

  const params = new URLSearchParams()
  if (filters.email) params.set("email", filters.email)
  if (filters.userId) params.set("userId", filters.userId)
  if (filters.type) params.set("type", filters.type)

  const endpoint = `${getEndpointUrl(PROFILE_SERVICE_URL, "/profile/individual")}${params.toString() ? `?${params.toString()}` : ""}`
  const response = await fetch(endpoint, { method: "GET", headers: withJsonHeaders(headers), cache: "no-store" })

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as IndividualProfile[], error: null, textError: null }
}

export async function getIndividualProfileByUserId(userId: string): Promise<ServiceResult<IndividualProfile>> {
  const headers = await getAuthHeaders()
  if (!headers) return { data: null, error: { status: "401", message: "Unauthorized" } }

  const response = await fetch(getEndpointUrl(PROFILE_SERVICE_URL, `/profile/individual/user/${encodeURIComponent(userId)}`), {
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
): Promise<ServiceResult<OrganizationProfile[]>> {
  const headers = await getAuthHeaders()
  if (!headers) return { data: null, error: { status: "401", message: "Unauthorized" } }

  const params = new URLSearchParams()
  if (filters.userId) params.set("userId", filters.userId)
  if (filters.email) params.set("email", filters.email)
  if (filters.name) params.set("name", filters.name)
  if (filters.industry) params.set("industry", filters.industry)

  const endpoint = `${getEndpointUrl(PROFILE_SERVICE_URL, "/profile/organization")}${params.toString() ? `?${params.toString()}` : ""}`

  const response = await fetch(endpoint, { method: "GET", headers: withJsonHeaders(headers), cache: "no-store" })

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as OrganizationProfile[], error: null, textError: null }
}

export async function getOrganizationProfileByUserId(userId: string): Promise<ServiceResult<OrganizationProfile>> {
  const headers = await getAuthHeaders()
  if (!headers) return { data: null, error: { status: "401", message: "Unauthorized" } }

  const response = await fetch(getEndpointUrl(PROFILE_SERVICE_URL, `/profile/organization/user/${encodeURIComponent(userId)}`), {
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
  const headers = await getAuthHeaders()
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

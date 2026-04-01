import "server-only"

import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { authenticatedServerFetch } from "@/lib/server-auth"
import type {
  AdminDriversQuery,
  AdminDriversResponse,
  ApiErrorResponse,
  DriverActionRequestDto,
  DriverActionResponseDto,
  DriverDetailsDto,
  AdminInviteDriverRequest,
  AdminInviteDriverResponse,
  DriverLicenseApprovalRequestDto,
  DriverWorkEligibilityApprovalRequestDto,
} from "@/types/admin-drivers"

type ServiceResult<T> = {
  data: T | null
  error: ApiErrorResponse | null
  textError?: string | null
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

export async function getAdminDrivers(query: AdminDriversQuery): Promise<ServiceResult<AdminDriversResponse>> {
  const params = new URLSearchParams({ page: String(query.page), size: String(query.size) })
  if (query.email) params.set("email", query.email)
  if (query.name) params.set("name", query.name)
  if (query.station) params.set("station", query.station)
  if (query.companyName) params.set("companyName", query.companyName)
  if (query.profileStatus) params.set("profileStatus", query.profileStatus)

  const response = await authenticatedServerFetch(
    `${getEndpointUrl(PROFILE_SERVICE_URL, "/admin/drivers")}?${params.toString()}`,
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

  return { data: (await response.json()) as AdminDriversResponse, error: null, textError: null }
}

export async function getAdminDriverDetails(driverId: string): Promise<ServiceResult<DriverDetailsDto>> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(PROFILE_SERVICE_URL, `/admin/drivers/${driverId}`),
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

  return { data: (await response.json()) as DriverDetailsDto, error: null, textError: null }
}

export async function postAdminDriverAction(
  driverId: string,
  action: "approve" | "reject" | "suspend" | "unsuspend" | "terminate",
  payload: DriverActionRequestDto,
): Promise<ServiceResult<DriverActionResponseDto>> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(PROFILE_SERVICE_URL, `/admin/drivers/${driverId}/${action}`),
    {
      method: "POST",
      headers: {
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

  return { data: (await response.json()) as DriverActionResponseDto, error: null, textError: null }
}

export async function approveDriverLicense(
  driverId: string,
  payload: DriverLicenseApprovalRequestDto,
): Promise<ServiceResult<Record<string, unknown>>> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(PROFILE_SERVICE_URL, `/admin/drivers/${driverId}/driving-license/approve`),
    {
      method: "POST",
      headers: {
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

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
  return { data, error: null, textError: null }
}

export async function approveDriverWorkEligibilityDocument(
  driverId: string,
  payload: DriverWorkEligibilityApprovalRequestDto,
): Promise<ServiceResult<Record<string, unknown>>> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(PROFILE_SERVICE_URL, `/admin/drivers/${driverId}/work-eligibility-documents/approve`),
    {
      method: "POST",
      headers: {
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

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
  return { data, error: null, textError: null }
}

export async function inviteAdminDriver(payload: AdminInviteDriverRequest): Promise<ServiceResult<AdminInviteDriverResponse>> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(PROFILE_SERVICE_URL, "/admin/drivers"),
    {
      method: "POST",
      headers: {
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

  return { data: (await response.json()) as AdminInviteDriverResponse, error: null, textError: null }
}

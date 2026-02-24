import "server-only"

import { cookies } from "next/headers"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import type { AdminDriversQuery, AdminDriversResponse, ApiErrorResponse } from "@/types/admin-drivers"

export async function getAdminDrivers(query: AdminDriversQuery): Promise<{
  data: AdminDriversResponse | null
  error: ApiErrorResponse | null
}> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("maplexpress_access_token")?.value || cookieStore.get("accessToken")?.value
  const idToken = cookieStore.get("maplexpress_id_token")?.value

  if (!accessToken || !idToken) {
    return {
      data: null,
      error: { status: "401", message: "Unauthorized" },
    }
  }

  const params = new URLSearchParams({
    page: String(query.page),
    size: String(query.size),
  })

  if (query.email) params.set("email", query.email)
  if (query.name) params.set("name", query.name)
  if (query.station) params.set("station", query.station)
  if (query.companyName) params.set("companyName", query.companyName)
  if (query.profileStatus) params.set("profileStatus", query.profileStatus)

  const url = `${getEndpointUrl(PROFILE_SERVICE_URL, "/admin/drivers")}?${params.toString()}`
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Id-Token": idToken,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as ApiErrorResponse | null
    return {
      data: null,
      error: errorPayload ?? { status: String(response.status), message: "Failed to load drivers" },
    }
  }

  const payload = (await response.json()) as AdminDriversResponse
  return { data: payload, error: null }
}

import "server-only"

import { DRIVER_MANAGEMENT_SERVICE_BASE_URL, getEndpointUrl } from "@/lib/config"
import { authenticatedServerFetch } from "@/lib/server-auth"
import type {
  ActiveDriverSessionsResponse,
  DriverManagementApiError,
  DriverSession,
} from "@/types/admin-driver-sessions"

type ServiceResult<T> = {
  data: T | null
  error: DriverManagementApiError | null
  textError?: string | null
}

const ACTIVE_DRIVER_SESSIONS_ENDPOINT = "/api/v1/admin/drivers/sessions/active"

function logDriverSessionRequest(message: string, details?: string | number) {
  if (process.env.NODE_ENV === "production") return
  console.info(`[admin-driver-sessions] ${message}`, details ?? "")
}

async function parseError(response: Response): Promise<{ error: DriverManagementApiError | null; textError: string | null }> {
  const contentType = response.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    const errorPayload = (await response.json().catch(() => null)) as DriverManagementApiError | null
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

function normalizeActiveSessions(payload: unknown): DriverSession[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload as DriverSession[]

  if (typeof payload === "object") {
    const record = payload as {
      data?: unknown
      content?: unknown
      items?: unknown
      results?: unknown
      sessions?: unknown
      activeSessions?: unknown
      drivers?: unknown
      sessionId?: unknown
    }

    if (Array.isArray(record.data)) return record.data as DriverSession[]
    if (Array.isArray(record.content)) return record.content as DriverSession[]
    if (Array.isArray(record.items)) return record.items as DriverSession[]
    if (Array.isArray(record.results)) return record.results as DriverSession[]
    if (Array.isArray(record.sessions)) return record.sessions as DriverSession[]
    if (Array.isArray(record.activeSessions)) return record.activeSessions as DriverSession[]
    if (Array.isArray(record.drivers)) return record.drivers as DriverSession[]
    if (record.data && typeof record.data === "object") return normalizeActiveSessions(record.data)
    if (record.sessionId) return [payload as DriverSession]
  }

  return []
}

export async function getActiveDriverSessions(): Promise<ServiceResult<ActiveDriverSessionsResponse>> {
  const url = getEndpointUrl(DRIVER_MANAGEMENT_SERVICE_BASE_URL, ACTIVE_DRIVER_SESSIONS_ENDPOINT)
  logDriverSessionRequest("GET", url)

  let response: Response | null
  try {
    response = await authenticatedServerFetch(
      url,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
      { includeIdToken: true },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Driver management request failed"
    logDriverSessionRequest("network error", message)
    return { data: null, error: { status: "NETWORK_ERROR", message }, textError: null }
  }

  if (!response) {
    logDriverSessionRequest("skipped", "missing auth token")
    return { data: null, error: { status: "401", message: "Unauthorized" }, textError: null }
  }

  logDriverSessionRequest("response", response.status)

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  const payload = await response.json().catch(() => undefined)
  if (payload === undefined) {
    logDriverSessionRequest("invalid json", response.headers.get("content-type") || "unknown content-type")
    return {
      data: null,
      error: { status: String(response.status), message: "Driver management returned invalid JSON" },
      textError: null,
    }
  }

  const items = normalizeActiveSessions(payload)
  logDriverSessionRequest("normalized sessions", items.length)
  return { data: { items }, error: null, textError: null }
}

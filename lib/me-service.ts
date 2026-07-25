import { apiFetch } from "@/lib/client-api"

const ME_REQUEST_TIMEOUT_MS = 15_000

export type MeResponse = {
  authenticated: boolean
  sub: string
  groups: string[]
  status: "ONBOARDING_REQUIRED" | "ACTIVE" | string
  displayName?: string | null
}

export class MeRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "MeRequestError"
    this.status = status
  }
}

export async function getMe(): Promise<MeResponse> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), ME_REQUEST_TIMEOUT_MS)

  try {
    const response = await apiFetch("/api/profile/me", {
      method: "GET",
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new MeRequestError("Failed to fetch /me", response.status)
    }

    return (await response.json()) as MeResponse
  } finally {
    window.clearTimeout(timeout)
  }
}

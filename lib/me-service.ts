import { apiFetch } from "@/lib/client-api"
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
  const response = await apiFetch("/api/profile/me", {
    method: "GET",
  })

  if (!response.ok) {
    throw new MeRequestError("Failed to fetch /me", response.status)
  }

  return (await response.json()) as MeResponse
}

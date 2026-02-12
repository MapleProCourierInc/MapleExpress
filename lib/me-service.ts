import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"

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

export async function getMe(accessToken: string, idToken: string): Promise<MeResponse> {
  if (!accessToken || !idToken) {
    throw new MeRequestError("Missing required tokens for /me", 401)
  }

  const response = await fetch(getEndpointUrl(PROFILE_SERVICE_URL, "/me"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Id-Token": idToken,
    },
  })

  if (!response.ok) {
    throw new MeRequestError("Failed to fetch /me", response.status)
  }

  return (await response.json()) as MeResponse
}

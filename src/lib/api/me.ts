import { authedFetch } from "@/src/lib/api/authedFetch"

export type MeResponse = {
  sub: string
  email: string
  groups: string[]
}

export async function getMe(): Promise<MeResponse> {
  const apiBaseUrl = process.env.API_BASE_URL

  if (!apiBaseUrl) {
    throw new Error("Missing API_BASE_URL")
  }

  const response = await authedFetch(`${apiBaseUrl}/me`)

  if (!response.ok) {
    throw new Error("Unable to load /me")
  }

  return response.json()
}

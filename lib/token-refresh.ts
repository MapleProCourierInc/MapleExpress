import { cleanupLegacyTokenStorage } from "@/lib/client-api"

/**
 * Legacy-compatible refresh helper.
 * Tokens are now stored in httpOnly cookies only.
 */
export async function refreshAccessToken() {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to refresh token")
    }

    cleanupLegacyTokenStorage()
    return true
  } catch (error) {
    cleanupLegacyTokenStorage()
    console.error("Token refresh failed:", error)
    return false
  }
}

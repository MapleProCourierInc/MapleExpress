"use client"

let refreshPromise: Promise<boolean> | null = null

const clearLegacyAuthStorage = () => {
  localStorage.removeItem("maplexpress_access_token")
  localStorage.removeItem("maplexpress_refresh_token")
  sessionStorage.removeItem("maplexpress_access_token")
  sessionStorage.removeItem("maplexpress_refresh_token")
}

const refreshSession = async (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        })

        if (!response.ok) {
          clearLegacyAuthStorage()
          return false
        }

        clearLegacyAuthStorage()
        return true
      } catch {
        clearLegacyAuthStorage()
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}, retry = true): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    cache: init.cache ?? "no-store",
  })

  if (response.status !== 401 || !retry) {
    return response
  }

  const refreshed = await refreshSession()
  if (!refreshed) {
    return response
  }

  return apiFetch(input, init, false)
}

export function cleanupLegacyTokenStorage() {
  if (typeof window === "undefined") return
  clearLegacyAuthStorage()
}

export async function initSessionRefresh() {
  if (typeof window === "undefined") return
  await refreshSession()
}

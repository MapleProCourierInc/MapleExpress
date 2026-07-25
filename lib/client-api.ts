"use client"

let refreshPromise: Promise<boolean> | null = null

const AUTH_INVALID_EVENT = "maplexpress:auth-invalid"
const AUTH_REQUEST_TIMEOUT_MS = 15_000

const dispatchAuthInvalidEvent = () => {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(AUTH_INVALID_EVENT))
}

const clearLegacyAuthStorage = () => {
  localStorage.removeItem("maplexpress_access_token")
  localStorage.removeItem("maplexpress_refresh_token")
  sessionStorage.removeItem("maplexpress_access_token")
  sessionStorage.removeItem("maplexpress_refresh_token")
}

const refreshSession = async (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS)

      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          clearLegacyAuthStorage()
          if (response.status === 400 || response.status === 401) {
            dispatchAuthInvalidEvent()
          }
          return false
        }

        clearLegacyAuthStorage()
        return true
      } catch {
        clearLegacyAuthStorage()
        return false
      } finally {
        window.clearTimeout(timeout)
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

  const retriedResponse = await apiFetch(input, init, false)
  if (retriedResponse.status === 401) {
    dispatchAuthInvalidEvent()
  }

  return retriedResponse
}

export function cleanupLegacyTokenStorage() {
  if (typeof window === "undefined") return
  clearLegacyAuthStorage()
}

export async function initSessionRefresh() {
  if (typeof window === "undefined") return false
  return refreshSession()
}

export { AUTH_INVALID_EVENT }

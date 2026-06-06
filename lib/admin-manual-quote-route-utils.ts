import "server-only"

import type { AdminManualQuoteApiError } from "@/types/admin-manual-quotes"

export function statusFromManualQuoteError(error: AdminManualQuoteApiError | null) {
  return Number(error?.status) || 400
}

export function cleanOptionalString(value: unknown) {
  if (value === null) return null
  const text = String(value ?? "").trim()
  return text || undefined
}

export function cleanNullableString(value: unknown) {
  return cleanOptionalString(value) ?? null
}

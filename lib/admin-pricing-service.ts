import "server-only"

import { PRICING_PAYMENT_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { getServerAuthHeaders } from "@/lib/server-auth"
import type { CreatePricingModelRequest, PricingApiError, PricingModel } from "@/types/pricing"

type ServiceResult<T> = {
  data: T | null
  error: PricingApiError | null
  textError?: string | null
}

async function parseError(response: Response): Promise<{ error: PricingApiError | null; textError: string | null }> {
  const contentType = response.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as PricingApiError | null
    return {
      error: payload ?? { status: String(response.status), message: "Request failed" },
      textError: null,
    }
  }

  const text = await response.text().catch(() => "")
  return {
    error: { status: String(response.status), message: "Request failed" },
    textError: text || null,
  }
}

export async function getAdminPricingModels(): Promise<ServiceResult<PricingModel[]>> {
  const headers = await getServerAuthHeaders({ includeIdToken: true, includeJsonContentType: true })

  if (!headers) {
    return { data: null, error: { status: "401", message: "Unauthorized" }, textError: null }
  }

  const response = await fetch(getEndpointUrl(PRICING_PAYMENT_SERVICE_URL, "/pricing"), {
    method: "GET",
    headers: { ...headers, Accept: "application/json" },
    cache: "no-store",
  })

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as PricingModel[], error: null, textError: null }
}

export async function createAdminPricingModel(payload: CreatePricingModelRequest): Promise<ServiceResult<PricingModel>> {
  const headers = await getServerAuthHeaders({ includeIdToken: true, includeJsonContentType: true })

  if (!headers) {
    return { data: null, error: { status: "401", message: "Unauthorized" }, textError: null }
  }

  const response = await fetch(getEndpointUrl(PRICING_PAYMENT_SERVICE_URL, "/pricing"), {
    method: "POST",
    headers: {
      ...headers,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  })

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  return { data: (await response.json()) as PricingModel, error: null, textError: null }
}

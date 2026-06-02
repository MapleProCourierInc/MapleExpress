import "server-only"

import { PRICING_PAYMENT_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { authenticatedServerFetch } from "@/lib/server-auth"
import type { CreatePricingV2Request, PricingApiError, PricingV2Model, PricingV2Page } from "@/types/pricing"

type ServiceResult<T> = { data: T | null; error: PricingApiError | null; textError?: string | null }

async function parseError(response: Response): Promise<{ error: PricingApiError; textError: string | null }> {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as PricingApiError | null
    return { error: payload ?? { status: String(response.status), message: "Request failed" }, textError: null }
  }
  const text = await response.text().catch(() => "")
  return { error: { status: String(response.status), message: "Request failed" }, textError: text || null }
}

async function pricingFetch<T>(endpoint: string, init: RequestInit): Promise<ServiceResult<T>> {
  const response = await authenticatedServerFetch(getEndpointUrl(PRICING_PAYMENT_SERVICE_URL, endpoint), init, { includeIdToken: true })
  if (!response) return { data: null, error: { status: "401", message: "Unauthorized" }, textError: null }
  if (!response.ok) return { data: null, ...(await parseError(response)) }
  return { data: (await response.json()) as T, error: null, textError: null }
}

export async function getAdminPricingModels(searchParams = ""): Promise<ServiceResult<PricingV2Page>> {
  return pricingFetch<PricingV2Page>(`/api/v2/pricing${searchParams ? `?${searchParams}` : ""}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  })
}

export async function createAdminPricingModel(payload: CreatePricingV2Request): Promise<ServiceResult<PricingV2Model>> {
  return pricingFetch<PricingV2Model>("/api/v2/pricing", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function activateAdminPricingModel(pricingId: string): Promise<ServiceResult<PricingV2Model>> {
  return pricingFetch<PricingV2Model>(`/api/v2/pricing/${encodeURIComponent(pricingId)}/activate`, {
    method: "POST",
    headers: { Accept: "application/json" },
  })
}

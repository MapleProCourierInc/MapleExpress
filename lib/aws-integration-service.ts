import "server-only"

import { AWS_INTEGRATION_INTERNAL_SERVICE_SECRET, AWS_INTEGRATION_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { authenticatedServerFetch } from "@/lib/server-auth"
import type {
  AwsIntegrationApiError,
  PresignV2Request,
  PresignV2Response,
  PresignViewItem,
  PresignViewResponse,
} from "@/types/aws-s3"

type ServiceResult<T> = {
  data: T | null
  error: AwsIntegrationApiError | null
  textError?: string | null
}

async function parseError(response: Response): Promise<{ error: AwsIntegrationApiError | null; textError: string | null }> {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as AwsIntegrationApiError | null
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

export async function presignUpload(payload: PresignV2Request): Promise<ServiceResult<PresignV2Response>> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(AWS_INTEGRATION_SERVICE_URL, "/v2/s3/presign"),
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  )

  if (!response) return { data: null, error: { status: "401", message: "Unauthorized" }, textError: null }
  if (!response.ok) return { data: null, ...(await parseError(response)) }

  return { data: (await response.json()) as PresignV2Response, error: null, textError: null }
}

export async function presignView(keys: string[]): Promise<Record<string, PresignViewItem>> {
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)))
  if (!uniqueKeys.length) return {}

  const response = await authenticatedServerFetch(
    getEndpointUrl(AWS_INTEGRATION_SERVICE_URL, "/v2/s3/presign/view"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keys: uniqueKeys }),
    },
  )

  if (!response || !response.ok) return {}

  const payload = (await response.json().catch(() => ({}))) as PresignViewResponse
  const map: Record<string, PresignViewItem> = {}

  for (const item of payload.items || []) {
    if (item?.key && item?.presignedGetUrl) {
      map[item.key] = item
    }
  }

  return map
}

export async function presignInternalView(keys: string[]): Promise<Record<string, PresignViewItem>> {
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)))
  if (!uniqueKeys.length || !AWS_INTEGRATION_INTERNAL_SERVICE_SECRET) return {}

  const response = await fetch(getEndpointUrl(AWS_INTEGRATION_SERVICE_URL, "/internal/presign/view"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Internal-Service-Secret": AWS_INTEGRATION_INTERNAL_SERVICE_SECRET,
    },
    body: JSON.stringify({ keys: uniqueKeys }),
    cache: "no-store",
  })

  if (!response.ok) return {}

  const payload = (await response.json().catch(() => ({}))) as PresignViewResponse
  const map: Record<string, PresignViewItem> = {}

  for (const item of payload.items || []) {
    if (item?.key && item?.presignedGetUrl) {
      map[item.key] = item
    }
  }

  return map
}

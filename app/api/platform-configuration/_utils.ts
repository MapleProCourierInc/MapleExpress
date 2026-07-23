import { NextResponse } from "next/server"
import type { PublicPlatformConfigurationApiError } from "@/types/platform-configuration"

type FailedServiceResult = {
  error: PublicPlatformConfigurationApiError | null
  textError?: string | null
}

function responseStatus(error: PublicPlatformConfigurationApiError | null) {
  const status = Number(error?.status)
  return Number.isInteger(status) && status >= 400 ? status : 400
}

export function publicPlatformConfigErrorResponse(result: FailedServiceResult, fallback: string) {
  if (result.textError) {
    return new NextResponse(result.textError, {
      status: responseStatus(result.error),
      headers: { "Content-Type": "text/plain" },
    })
  }

  return NextResponse.json(result.error ?? { message: fallback }, { status: responseStatus(result.error) })
}

import { NextResponse } from "next/server"
import type { PlatformConfigurationApiError } from "@/types/admin-platform-configuration"

type FailedServiceResult = {
  error: PlatformConfigurationApiError | null
  textError?: string | null
}

function responseStatus(error: PlatformConfigurationApiError | null) {
  const status = Number(error?.status)
  return Number.isInteger(status) && status >= 400 ? status : 400
}

export function platformConfigErrorResponse(result: FailedServiceResult, fallback: string) {
  if (result.textError) {
    return new NextResponse(result.textError, {
      status: responseStatus(result.error),
      headers: { "Content-Type": "text/plain" },
    })
  }

  return NextResponse.json(result.error ?? { message: fallback }, { status: responseStatus(result.error) })
}

export function validationError(message: string, errors: Array<{ field: string; message: string }>) {
  return NextResponse.json({ message, errors }, { status: 400 })
}

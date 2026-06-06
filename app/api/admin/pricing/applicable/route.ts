import { NextRequest, NextResponse } from "next/server"

import { getApplicablePricingModel } from "@/lib/admin-pricing-service"
import type { PricingApiError } from "@/types/pricing"

function errorResponse(error: PricingApiError | null, fallback: string) {
  return NextResponse.json(error ?? { message: fallback }, { status: Number(error?.status) || 400 })
}

export async function GET(request: NextRequest) {
  const userId = String(request.nextUrl.searchParams.get("userId") || "").trim()
  const zoneCode = String(request.nextUrl.searchParams.get("zoneCode") || "GLOBAL").trim() || "GLOBAL"

  if (!userId) {
    return NextResponse.json({ message: "Customer user ID is required to load applicable pricing." }, { status: 400 })
  }

  const result = await getApplicablePricingModel(userId, zoneCode)
  return result.data ? NextResponse.json(result.data) : errorResponse(result.error, "Failed to fetch applicable pricing")
}

import { type NextRequest, NextResponse } from "next/server"
import { BILLING_MANAGEMENT_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.search

    return await proxyWithAuthRetry(request, {
      method: "GET",
      url: getEndpointUrl(BILLING_MANAGEMENT_SERVICE_URL, `/client/credit-balance-ledger${search}`),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Get credit balance ledger error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

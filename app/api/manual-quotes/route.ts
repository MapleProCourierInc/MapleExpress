import { type NextRequest, NextResponse } from "next/server"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.search

    return await proxyWithAuthRetry(request, {
      method: "GET",
      url: getEndpointUrl(ORDER_SERVICE_URL, `/api/v1/manual-quotes${search}`),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("List manual quotes error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

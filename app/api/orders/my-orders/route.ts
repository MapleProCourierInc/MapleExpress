import { type NextRequest, NextResponse } from "next/server"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.search

    return await proxyWithAuthRetry(request, {
      method: "GET",
      url: getEndpointUrl(ORDER_SERVICE_URL, `/orders/my-orders${search}`),
    })
  } catch (error) {
    console.error("Get customer orders error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

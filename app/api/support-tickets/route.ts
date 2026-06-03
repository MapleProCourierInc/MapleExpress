import { type NextRequest, NextResponse } from "next/server"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.search

    return await proxyWithAuthRetry(request, {
      method: "GET",
      url: getEndpointUrl(ORDER_SERVICE_URL, `/api/v1/support-tickets${search}`),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Get support tickets error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: getEndpointUrl(ORDER_SERVICE_URL, "/api/v1/support-tickets"),
      body: JSON.stringify(body),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Create support ticket error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

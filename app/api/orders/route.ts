import { type NextRequest, NextResponse } from "next/server"
import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.search
    return await proxyWithAuthRetry(request, {
      method: "GET",
      url: getEndpointUrl(ORDER_SERVICE_URL, `orders${search}`),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const proxiedBody = JSON.stringify(body)

    console.log("[api/orders] POST body forwarded to order-ms:", JSON.stringify(body, null, 2))

    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: getEndpointUrl(ORDER_SERVICE_URL, "orders"),
      body: proxiedBody,
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const proxiedBody = JSON.stringify(body)

    console.log("[api/orders] PUT body forwarded to order-ms:", JSON.stringify(body, null, 2))

    return await proxyWithAuthRetry(request, {
      method: "PUT",
      url: getEndpointUrl(ORDER_SERVICE_URL, "orders"),
      body: proxiedBody,
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Update order error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

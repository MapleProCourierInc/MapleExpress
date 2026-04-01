import { type NextRequest, NextResponse } from "next/server"
import { MONERIS_API_CONFIG } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: `${MONERIS_API_CONFIG.baseUrl}finalize`,
      body: JSON.stringify(body),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Finalize payment error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

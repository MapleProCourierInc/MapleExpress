import { type NextRequest, NextResponse } from "next/server"
import { MONERIS_API_CONFIG } from "@/lib/config"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const billingAccountId = typeof body?.billingAccountId === "string" ? body.billingAccountId.trim() : ""

    if (!billingAccountId) {
      return NextResponse.json({ message: "billingAccountId is required" }, { status: 400 })
    }

    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: `${MONERIS_API_CONFIG.baseUrl}initiate`,
      body: JSON.stringify({
        ...body,
        billingAccountId,
      }),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Initiate billing balance payment error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

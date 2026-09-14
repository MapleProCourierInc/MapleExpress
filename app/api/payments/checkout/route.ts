import { type NextRequest, NextResponse } from "next/server"
import { PRICING_PAYMENT_SERVICE_URL, getEndpointUrl } from "@/lib/config.server"
import { proxyWithAuthRetry } from "@/lib/authenticated-proxy"
import { isValidPhoneNumber, PHONE_NUMBER_VALIDATION_MESSAGE } from "@/lib/phone-validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!isValidPhoneNumber(body?.billingAddress?.phoneNumber)) {
      return NextResponse.json({ message: PHONE_NUMBER_VALIDATION_MESSAGE }, { status: 400 })
    }
    return await proxyWithAuthRetry(request, {
      method: "POST",
      url: getEndpointUrl(PRICING_PAYMENT_SERVICE_URL, "payments/checkout"),
      body: JSON.stringify(body),
      contentTypeJson: true,
    })
  } catch (error) {
    console.error("Checkout payment error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

import type { OrderResponse } from "@/lib/order-service"

export interface BillingAddress {
  fullName: string
  company?: string
  streetAddress: string
  addressLine2?: string
  city: string
  province: string
  postalCode: string
  country: string
  phoneNumber: string
}

export interface PaymentCheckoutRequest {
  shippingOrderId: string
  amount: number
  currency: string
  billingAddress: BillingAddress
  description?: string | null
  idempotencyKey?: string | null
}

export type CheckoutFlow = "MONERIS" | "POSTPAY_BILLING_ACCOUNT"

export interface PaymentCheckoutResponse {
  paymentId: string
  shippingOrderId: string
  checkoutFlow: CheckoutFlow
  status: string
  paymentMethodType: string
  paymentProvider?: string | null
  ticketId?: string | null
  billingAccountId?: string | null
  amount: number
  currency: string
  message?: string
}

export function buildCheckoutBillingAddress(orderData: OrderResponse): BillingAddress {
  const pickupAddress = orderData.orderItems[0]?.pickup?.address

  if (!pickupAddress) {
    return {
      fullName: "Shipping Customer",
      streetAddress: "Address not provided",
      city: "Unknown",
      province: "Unknown",
      postalCode: "Unknown",
      country: "CA",
      phoneNumber: "Unknown",
    }
  }

  return {
    fullName: pickupAddress.fullName || "Shipping Customer",
    company: pickupAddress.company || "",
    streetAddress: pickupAddress.streetAddress || "Address not provided",
    addressLine2: pickupAddress.addressLine2 || "",
    city: pickupAddress.city || "Unknown",
    province: pickupAddress.province || "Unknown",
    postalCode: pickupAddress.postalCode || "Unknown",
    country: pickupAddress.country || "CA",
    phoneNumber: pickupAddress.phoneNumber || "Unknown",
  }
}

export async function checkoutPayment(payload: PaymentCheckoutRequest): Promise<PaymentCheckoutResponse> {
  const accessToken = localStorage.getItem("maplexpress_access_token") || ""

  if (!accessToken) {
    throw new Error("Authentication token not found")
  }

  const response = await fetch("/api/payments/checkout", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  const responseBody = await response.json().catch(() => null)

  if (!response.ok) {
    const backendMessage =
      responseBody && typeof responseBody === "object" && "message" in responseBody
        ? (responseBody as { message?: string }).message
        : null

    throw new Error(backendMessage || "Failed to start payment checkout")
  }

  return responseBody as PaymentCheckoutResponse
}

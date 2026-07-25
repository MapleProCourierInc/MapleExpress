import { apiFetch } from "@/lib/client-api"
import type { ProfileBillingAddress } from "@/types/profile-billing-address"

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

export function toCheckoutBillingAddress(billingAddress: ProfileBillingAddress): BillingAddress {
  return {
    fullName: billingAddress.fullName,
    company: billingAddress.company || "",
    streetAddress: billingAddress.streetAddress,
    addressLine2: billingAddress.addressLine2 || "",
    city: billingAddress.city,
    province: billingAddress.province,
    postalCode: billingAddress.postalCode,
    country: billingAddress.country,
    phoneNumber: billingAddress.phoneNumber,
  }
}

export async function checkoutPayment(payload: PaymentCheckoutRequest): Promise<PaymentCheckoutResponse> {
  const response = await apiFetch("/api/payments/checkout", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
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

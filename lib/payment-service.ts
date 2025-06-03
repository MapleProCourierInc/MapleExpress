import type { Address } from "@/components/ship-now/ship-now-form"
import { PRICING_PAYMENT_SERVICE_URL, getEndpointUrl } from "./config"

// Define the billing address type
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

// Define the payment request type
export interface PaymentRequest {
    orderId: string
    customerId: string
    billingAddress: BillingAddress
}

// Define the payment response type
export interface PaymentResponse {
    paymentId: string
    status: string
    redirectUrl?: string
    message?: string
}

// Function to initiate payment
export async function initiatePayment(
    orderId: string,
    customerId: string,
    billingAddress: BillingAddress,
): Promise<PaymentResponse> {
    try {
        // Get the auth token from localStorage
        const accessToken = localStorage.getItem("maplexpress_access_token") || ""

        if (!accessToken) {
            throw new Error("Authentication token not found")
        }

        // Format the request body
        const requestBody: PaymentRequest = {
            orderId,
            customerId,
            billingAddress,
        }

        // Make the API call
        const response = await fetch(getEndpointUrl(PRICING_PAYMENT_SERVICE_URL, 'payment/initiatePayment'), {
            method: "POST",
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
            throw new Error(`Failed to initiate payment: ${response.statusText}`)
        }

        // Parse the response
        const data = await response.json()
        return data
    } catch (error) {
        console.error("Error initiating payment:", error)
        throw error
    }
}

// Helper function to convert Address to BillingAddress
export function convertToBillingAddress(address: Address): BillingAddress {
    return {
        fullName: address.fullName,
        company: address.company,
        streetAddress: address.streetAddress,
        addressLine2: address.addressLine2,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
        country: address.country,
        phoneNumber: address.phoneNumber,
    }
}

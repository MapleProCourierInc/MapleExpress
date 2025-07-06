import type { ShippingOrder, Address } from "@/components/ship-now/ship-now-form"
import { ORDER_SERVICE_URL, getEndpointUrl } from "./config"

// Define the API response types based on the actual response format
export interface OrderResponse {
    shippingOrderId: string
    customerId: string
    customerContact: {
        name: string
        phone: string
        email: string
    }
    priorityDelivery: boolean
    orderStatus: string
    paymentStatus: string
    createdAt: string
    updatedAt: string
    aggregatedPricing: {
        basePrice: number
        distanceCharge: number
        weightCharge: number
        dimensionalWeightCharge: number
        prioritySurcharge: number
        discount: number
        taxes: {
            amount: number
            taxType: string
        }[]
        totalAmount: number
        pricingId: string | null
    }
    orderItems: OrderItemResponse[]
}

export interface OrderItemResponse {
    orderItemId: string
    pickup: {
        address: AddressResponse
        coordinates?: {
            latitude: number
            longitude: number
        }
        time: string
        notes: string
        images: any[]
    }
    dropoff: {
        address: AddressResponse
        coordinates?: {
            latitude: number
            longitude: number
        }
        time: string
        notes: string
        images: any[]
    }
    distanceToDelivery: number
    packageDetails: {
        weight: number
        dimensions: {
            length: number
            width: number
            height: number
        }
        type: string | null
        value: number | null
        images: {
            imageUrl: string
            timestamp: string
        }[]
    }
    pricing: {
        basePrice: number
        distanceCharge: number
        weightCharge: number
        prioritySurcharge: number
        taxes: {
            amount: number
            taxType: string
        }[]
        totalAmount: number
        pricingId: string
    }
    itemStatus: string
    trackingNumber: string | null
    estimatedDeliveryTime: string | null
    specialIncidents: any[]
}

interface AddressResponse {
    fullName: string
    company: string
    streetAddress: string
    addressLine2: string
    city: string
    province: string
    postalCode: string
    country: string
    phoneNumber: string
    deliveryInstructions: string
}

// Function to create or update a draft order
export async function createDraftOrder(
    order: ShippingOrder,
    userId: string,
    priorityDelivery = false,
    existingOrderId?: string,
): Promise<OrderResponse> {
    try {
        // Get the auth token from localStorage
        const accessToken = localStorage.getItem("maplexpress_access_token") || ""

        if (!accessToken) {
            throw new Error("Authentication token not found")
        }

        if (!userId) {
            throw new Error("User ID not found")
        }

        // Format the request body according to the API requirements
        const requestBody = formatOrderRequest(order, userId, priorityDelivery, existingOrderId)

        // Make the API call - use PUT if existingOrderId is provided, otherwise use POST
        const response = await fetch(getEndpointUrl(ORDER_SERVICE_URL, 'orders'), {
            method: existingOrderId ? "PUT" : "POST",
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
            throw new Error(`Failed to ${existingOrderId ? "update" : "create"} order: ${response.statusText}`)
        }

        // Parse the response and extract the shippingOrder object
        const data = await response.json()

        // Return the shippingOrder object from the response
        return data.shippingOrder
    } catch (error) {
        console.error(`Error ${existingOrderId ? "updating" : "creating"} draft order:`, error)
        throw error
    }
}

// Helper function to format the order request
function formatOrderRequest(order: ShippingOrder, userId: string, priorityDelivery: boolean, existingOrderId?: string) {
    // Format the order items
    const orderItems = order.packages.map((pkg) => {
        return {
            pickup: {
                address: formatAddress(order.pickupAddress),
                time: new Date().toISOString(), // Default to current time
                notes: order.pickupAddress?.deliveryInstructions || "",
            },
            dropoff: {
                address: formatAddress(pkg.dropoffAddress),
                time: new Date(new Date().getTime() + 4 * 60 * 60 * 1000).toISOString(), // Default to 4 hours later
                notes: pkg.dropoffAddress?.deliveryInstructions || "",
            },
            packageDetails: {
                weight: pkg.weight,
                dimensions: {
                    length: pkg.length,
                    width: pkg.width,
                    height: pkg.height,
                },
            },
        }
    })

    const requestBody: any = {
        customerId: userId,
        priorityDelivery,
        orderItems,
    }

    // If updating an existing order, include the shippingOrderId
    if (existingOrderId) {
        requestBody.shippingOrderId = existingOrderId
    }

    return requestBody
}

// Helper function to format address
function formatAddress(address: Address | null) {
    if (!address) return null

    return {
        fullName: address.fullName,
        company: address.company || "",
        streetAddress: address.streetAddress,
        addressLine2: address.addressLine2 || "",
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
        country: address.country,
        phoneNumber: address.phoneNumber,
        deliveryInstructions: address.deliveryInstructions || "",
    }
}

// Fetch paid orders for a customer
export async function getPaidOrdersByCustomer(customerId: string): Promise<OrderResponse[]> {
    const accessToken = localStorage.getItem("maplexpress_access_token") || ""
    if (!accessToken) {
        throw new Error("Authentication token not found")
    }

    const url = getEndpointUrl(
        ORDER_SERVICE_URL,
        `orders?customerId=${customerId}&paymentStatus=paid`
    )

    const response = await fetch(url, {
        headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`)
    }

    return response.json()
}


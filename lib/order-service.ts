import type { ShippingOrder, Address } from "@/components/ship-now/ship-now-form"

function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null

    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)

    if (parts.length === 2) {
        return parts.pop()!.split(";").shift() || null
    }

    return null
}

function getAccessToken() {
    return (
        localStorage.getItem("maplexpress_access_token") ||
        getCookie("accessToken") ||
        getCookie("maplexpress_access_token") ||
        ""
    )
}

function getAuthHeaders(): Record<string, string> {
    const accessToken = getAccessToken()

    if (!accessToken) {
        return {}
    }

    return {
        Authorization: `Bearer ${accessToken}`,
    }
}

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
    isFragile?: boolean
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
    orderItemId?: string
    trackingId?: string
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
    isFragile?: boolean
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

interface OrderRequestItem {
    pickup: {
        address: ReturnType<typeof formatAddress>
        time: string
        notes: string
    }
    dropoff: {
        address: ReturnType<typeof formatAddress>
        time: string
        notes: string
    }
    packageDetails: {
        weight: number
        dimensions: {
            length: number
            width: number
            height: number
        }
    }
    isFragile?: boolean
}

interface OrderRequest {
    customerId: string
    priorityDelivery: boolean
    isFragile?: boolean
    orderItems: OrderRequestItem[]
    shippingOrderId?: string
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
        if (!userId) {
            throw new Error("User ID not found")
        }

        // Format the request body according to the API requirements
        const requestBody = formatOrderRequest(order, userId, priorityDelivery, existingOrderId)

        const response = existingOrderId
            ? await updateOrder(requestBody)
            : await createOrder(requestBody)

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
function formatOrderRequest(order: ShippingOrder, userId: string, priorityDelivery: boolean, existingOrderId?: string): OrderRequest {
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
            isFragile: pkg.fragile,
        }
    })

    const requestBody: OrderRequest = {
        customerId: userId,
        priorityDelivery,
        isFragile: orderItems.some((item) => item.isFragile),
        orderItems,
    }

    // If updating an existing order, include the shippingOrderId
    if (existingOrderId) {
        requestBody.shippingOrderId = existingOrderId
    }

    return requestBody
}

export async function createOrder(payload: OrderRequest) {
    return fetch("/api/orders", {
        method: "POST",
        headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    })
}

export async function updateOrder(payload: OrderRequest) {
    return fetch("/api/orders", {
        method: "PUT",
        headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    })
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
    const url = `/api/orders?customerId=${encodeURIComponent(customerId)}&paymentStatus=paid`

    const response = await fetch(url, {
        headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`)
    }

    return response.json()
}

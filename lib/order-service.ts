import type {
  ShippingOrder as DraftShippingOrder,
  Address as DraftAddress,
} from "@/components/ship-now/ship-now-form";

import { apiFetch } from "@/lib/client-api";

// Define the API response types based on the actual response format
export interface OrderResponse {
  shippingOrderId: string;
  customerId: string;
  customerContact: {
    name: string;
    phone: string;
    email: string;
  };
  priorityDelivery: boolean;
  isFragile?: boolean;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  aggregatedPricing: AggregatedPricing;
  orderItems: OrderItemResponse[];
}

export type ChargeMap = Record<string, number>;

export interface AggregatedPricing {
  currency: string;
  customQuoteRequired: boolean;
  customQuoteReasons?: string[];
  customerQuoteReasons?: string[];
  customerQuoteResons?: string[];
  charges: ChargeMap;
  totalAmount: number;
}

export interface OrderItemPricing {
  pricingModelId?: string | null;
  pricingModelVersion?: number | null;
  pricingTypeApplied?: string | null;
  ownerIdApplied?: string | null;
  zoneCode?: string | null;
  currency: string;
  customQuoteRequired: boolean;
  customQuoteReason?: string | null;
  charges: ChargeMap;
  calculationContext?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface OrderItemResponse {
  orderItemId?: string;
  trackingId?: string;
  pickup: {
    address: AddressResponse;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    time: string;
    notes: string;
    images: any[];
  };
  dropoff: {
    address: AddressResponse;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    time: string;
    notes: string;
    images: any[];
  };
  distanceToDelivery: number;
  packageDetails: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    type: string | null;
    value: number | null;
    images: {
      imageUrl: string;
      timestamp: string;
    }[];
  };
  isFragile?: boolean;
  signatureRequired?: boolean;
  pricing: OrderItemPricing;
  itemStatus: string;
  description?: string | null;
  trackingNumber: string | null;
  estimatedDeliveryTime: string | null;
  specialIncidents: any[];
  trackingEvents?: TrackingEvent[];
}

export interface Tax {
  amount: number;
  taxType: string;
}

export interface Pricing {
  currency?: string | null;
  customQuoteRequired?: boolean | null;
  customQuoteReasons?: string[];
  customerQuoteReasons?: string[];
  customerQuoteResons?: string[];
  customQuoteReason?: string | null;
  charges?: ChargeMap;
  basePrice?: number | null;
  distanceCharge?: number | null;
  weightCharge?: number | null;
  dimensionalWeightCharge?: number | null;
  prioritySurcharge?: number | null;
  taxes?: Tax[];
  discount?: number | null;
  totalAmount?: number | null;
  pricingId?: string | null;
}

export interface Address {
  fullName?: string | null;
  company?: string | null;
  streetAddress?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
  phoneNumber?: string | null;
  deliveryInstructions?: string | null;
}

export interface Coordinates {
  latitude?: number | null;
  longitude?: number | null;
}

export interface Stop {
  address?: Address | null;
  coordinates?: Coordinates | null;
  time?: string | null;
  notes?: string | null;
  images?: unknown[];
}

export interface TrackingEvent {
  status?: string | null;
  timestamp?: string | null;
  location?: Coordinates | null;
  statusMessage?: string | null;
  driverComments?: string | null;
  photographUrls?: string[];
}

export interface OrderItem {
  orderItemId?: string | null;
  trackingId?: string | null;
  pickup?: Stop | null;
  dropoff?: Stop | null;
  distanceToDelivery?: number | null;
  packageDetails?: {
    weight?: number | null;
    dimensions?: {
      length?: number | null;
      width?: number | null;
      height?: number | null;
    } | null;
    type?: string | null;
    value?: number | null;
    images?: unknown[];
  } | null;
  pricing?: Pricing | null;
  description?: string | null;
  itemStatus?: string | null;
  assignedDriverId?: string | null;
  isFragile?: boolean | null;
  signatureRequired?: boolean | null;
  estimatedDeliveryTime?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  specialIncidents?: unknown[];
  trackingEvents?: TrackingEvent[];
}

export interface ShippingOrder {
  shippingOrderId: string;
  userId?: string | null;
  clientUserId?: string | null;
  clientType?: string | null;
  customerContact?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  priorityDelivery?: boolean | null;
  orderStatus?: string | null;
  assignedDriverId?: string | null;
  paymentStatus?: string | null;
  paymentId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  aggregatedPricing?: Pricing | null;
  orderItems?: OrderItem[];
}

export interface GeneratedDocument {
  documentType?: string | null;
  documentName?: string | null;
  s3Key?: string | null;
  presignedUrl?: string | null;
}

export interface CustomerOrderDetailResponse {
  shippingOrder?: ShippingOrder | null;
  documents?: GeneratedDocument[];
}

export interface CustomerOrderSummaryResponse {
  shippingOrderId: string;
  createdAt?: string | null;
  orderStatus?: string | null;
  amount?: number | null;
  numberOfOrderItems?: number | null;
}

export interface PaginationMetadata {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sortBy: string;
  sortDir: "asc" | "desc";
}

export interface PagedCustomerOrderSummaryResponse {
  orders: CustomerOrderSummaryResponse[];
  pagination: PaginationMetadata;
}

export type ClientOrdersResponse = PagedCustomerOrderSummaryResponse;
export type ClientOrder = CustomerOrderSummaryResponse;

export interface ClientOrdersFilters {
  orderStatus?: string;
  orderStatuses?: string[];
  paymentStatus?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

interface OrderRequestItem {
  pickup: {
    address: ReturnType<typeof formatAddress>;
    time: string;
    notes: string;
  };
  dropoff: {
    address: ReturnType<typeof formatAddress>;
    time: string;
    notes: string;
  };
  packageDetails: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
  description: string;
  isFragile?: boolean;
  signatureRequired?: boolean;
}

interface OrderRequest {
  customerId: string;
  priorityDelivery: boolean;
  isFragile?: boolean;
  orderItems: OrderRequestItem[];
  shippingOrderId?: string;
}

interface AddressResponse {
  fullName: string;
  company: string;
  streetAddress: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  deliveryInstructions: string;
}

// Function to create or update a draft order
export async function createDraftOrder(
  order: DraftShippingOrder,
  userId: string,
  priorityDelivery = false,
  existingOrderId?: string,
): Promise<OrderResponse> {
  try {
    if (!userId) {
      throw new Error("User ID not found");
    }

    // Format the request body according to the API requirements
    const requestBody = formatOrderRequest(
      order,
      userId,
      priorityDelivery,
      existingOrderId,
    );

    console.log(
      `[createDraftOrder] ${existingOrderId ? "Update" : "Create"} order request body:`,
      JSON.stringify(requestBody, null, 2),
    );

    const response = existingOrderId
      ? await updateOrder(requestBody)
      : await createOrder(requestBody);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const backendMessage =
        data && typeof data === "object" && "message" in data
          ? (data as { message?: string }).message
          : null;
      throw new Error(
        backendMessage ||
          `Failed to ${existingOrderId ? "update" : "create"} order: ${response.statusText}`,
      );
    }

    // Return the shippingOrder object from the response
    return data.shippingOrder;
  } catch (error) {
    console.error(
      `Error ${existingOrderId ? "updating" : "creating"} draft order:`,
      error,
    );
    throw error;
  }
}

// Helper function to format the order request
function formatOrderRequest(
  order: DraftShippingOrder,
  userId: string,
  priorityDelivery: boolean,
  existingOrderId?: string,
): OrderRequest {
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
      description: pkg.contents,
      isFragile: pkg.fragile,
      signatureRequired: pkg.signatureRequired,
    };
  });

  const requestBody: OrderRequest = {
    customerId: userId,
    priorityDelivery,
    isFragile: orderItems.some((item) => item.isFragile),
    orderItems,
  };

  // If updating an existing order, include the shippingOrderId
  if (existingOrderId) {
    requestBody.shippingOrderId = existingOrderId;
  }

  return requestBody;
}

export async function createOrder(payload: OrderRequest) {
  return apiFetch("/api/orders", {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateOrder(payload: OrderRequest) {
  return apiFetch("/api/orders", {
    method: "PUT",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function requestAdminQuote(shippingOrderId: string, _message = "Custom Quote Required "): Promise<OrderResponse | null> {
  const response = await apiFetch(
    `/api/shipping-orders/${encodeURIComponent(shippingOrderId)}/manual-quote-request`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
      },
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const backendMessage =
      data && typeof data === "object" && "message" in data
        ? (data as { message?: string }).message
        : null;
    throw new Error(backendMessage || "Failed to request a custom quote");
  }

  return getUpdatedOrder(data);
}

export async function cancelOrder(shippingOrderId: string): Promise<void> {
  const response = await apiFetch(
    `/api/orders/${encodeURIComponent(shippingOrderId)}/cancel`,
    {
      method: "PATCH",
      headers: {
        accept: "application/json",
      },
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const backendMessage =
      data && typeof data === "object" && "message" in data
        ? (data as { message?: string }).message
        : null;
    throw new Error(backendMessage || "Failed to cancel order");
  }
}

function getUpdatedOrder(data: unknown): OrderResponse | null {
  if (!data || typeof data !== "object") return null;

  const response = data as { shippingOrder?: unknown; shippingOrderId?: unknown };
  const order = response.shippingOrder ?? response;

  if (!order || typeof order !== "object" || typeof (order as { shippingOrderId?: unknown }).shippingOrderId !== "string") {
    return null;
  }

  return order as OrderResponse;
}

export async function removeOrderItems(shippingOrderId: string, trackingIds: string[]): Promise<OrderResponse> {
  if (trackingIds.length === 0) {
    throw new Error("At least one tracking ID is required to remove an order item");
  }

  const response = await apiFetch(
    `/api/orders/${encodeURIComponent(shippingOrderId)}/remove-order-items`,
    {
      method: "PATCH",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trackingIds }),
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const backendMessage =
      data && typeof data === "object" && "message" in data
        ? (data as { message?: string }).message
        : null;
    throw new Error(backendMessage || "Failed to remove package");
  }

  const updatedOrder = getUpdatedOrder(data);
  if (!updatedOrder) {
    throw new Error("Remove package response did not include the updated order");
  }

  return updatedOrder;
}

export async function updateRushPriority(shippingOrderId: string, rushPriorityRequested: boolean): Promise<OrderResponse> {
  const response = await apiFetch(
    `/api/orders/${encodeURIComponent(shippingOrderId)}/rush-priority`,
    {
      method: "PATCH",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rushPriorityRequested }),
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const backendMessage =
      data && typeof data === "object" && "message" in data
        ? (data as { message?: string }).message
        : null;
    throw new Error(backendMessage || "Failed to update priority delivery");
  }

  const updatedOrder = getUpdatedOrder(data);
  if (!updatedOrder) {
    throw new Error("Priority delivery response did not include the updated order");
  }

  return updatedOrder;
}

// Helper function to format address
function formatAddress(address: DraftAddress | null) {
  if (!address) return null;

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
  };
}

// Fetch paid orders for a customer
export async function getPaidOrdersByCustomer(
  customerId: string,
): Promise<OrderResponse[]> {
  const url = `/api/orders?customerId=${encodeURIComponent(customerId)}&paymentStatus=paid`;

  const response = await apiFetch(url, {
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.statusText}`);
  }

  return response.json();
}

export async function getClientOrders(
  filters: ClientOrdersFilters,
): Promise<ClientOrdersResponse> {
  const params = new URLSearchParams();

  if (filters.orderStatus) params.set("orderStatus", filters.orderStatus);
  filters.orderStatuses?.forEach((orderStatus) => params.append("orderStatus", orderStatus));
  if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
  if (filters.createdFrom) params.set("createdFrom", filters.createdFrom);
  if (filters.createdTo) params.set("createdTo", filters.createdTo);

  params.set("page", String(filters.page ?? 0));
  params.set("size", String(filters.size ?? 10));
  params.set("sortBy", filters.sortBy ?? "createdAt");
  params.set("sortDir", filters.sortDir ?? "desc");

  const response = await apiFetch(`/api/orders/my-orders?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.statusText}`);
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    const orders = data.filter(
      (order: CustomerOrderSummaryResponse) =>
        order?.orderStatus?.toLowerCase() !== "draft",
    );

    return {
      orders,
      pagination: {
        page: filters.page ?? 0,
        size: filters.size ?? 10,
        totalElements: orders.length,
        totalPages: orders.length ? 1 : 0,
        sortBy: filters.sortBy ?? "createdAt",
        sortDir: filters.sortDir ?? "desc",
      },
    };
  }

  const orders = Array.isArray(data?.orders)
    ? data.orders.filter(
        (order: CustomerOrderSummaryResponse) =>
          order?.orderStatus?.toLowerCase() !== "draft",
      )
    : [];

  return {
    orders,
    pagination: {
      page: data?.pagination?.page ?? 0,
      size: data?.pagination?.size ?? filters.size ?? 10,
      totalElements: data?.pagination?.totalElements ?? 0,
      totalPages: data?.pagination?.totalPages ?? 0,
      sortBy: data?.pagination?.sortBy ?? "createdAt",
      sortDir: data?.pagination?.sortDir === "asc" ? "asc" : "desc",
    },
  };
}

export async function getClientOrderDetail(
  shippingOrderId: string,
): Promise<CustomerOrderDetailResponse> {
  const response = await apiFetch(
    `/api/orders/my-orders/${encodeURIComponent(shippingOrderId)}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch order details: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    shippingOrder: data?.shippingOrder ?? null,
    documents: Array.isArray(data?.documents) ? data.documents : [],
  };
}

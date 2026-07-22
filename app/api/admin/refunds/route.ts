import { NextRequest, NextResponse } from "next/server"
import {
  adminListRefunds,
  normalizeAdminRefundPage,
} from "@/lib/admin-refund-service"
import type { AdminRefundApiError, AdminRefundFilters, RefundSortBy, RefundSortDirection } from "@/types/admin-refunds"

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 20

function statusFrom(error: AdminRefundApiError | null) {
  return Number(error?.status) || 400
}

function getFilter(searchParams: URLSearchParams, key: keyof AdminRefundFilters) {
  return searchParams.get(key) || undefined
}

function numberFrom(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const filters: AdminRefundFilters = {
    refundId: getFilter(searchParams, "refundId"),
    paymentId: getFilter(searchParams, "paymentId"),
    shippingOrderId: getFilter(searchParams, "shippingOrderId"),
    trackingNumber: getFilter(searchParams, "trackingNumber"),
    payerUserId: getFilter(searchParams, "payerUserId"),
    status: getFilter(searchParams, "status"),
    workflowType: getFilter(searchParams, "workflowType"),
    reasonCode: getFilter(searchParams, "reasonCode"),
    destination: getFilter(searchParams, "destination"),
    paymentMethodType: getFilter(searchParams, "paymentMethodType"),
    paymentProvider: getFilter(searchParams, "paymentProvider"),
    paymentStatus: getFilter(searchParams, "paymentStatus"),
    currency: getFilter(searchParams, "currency"),
    pricingId: getFilter(searchParams, "pricingId"),
    requestedFrom: getFilter(searchParams, "requestedFrom"),
    requestedTo: getFilter(searchParams, "requestedTo"),
    reviewedFrom: getFilter(searchParams, "reviewedFrom"),
    reviewedTo: getFilter(searchParams, "reviewedTo"),
    processedFrom: getFilter(searchParams, "processedFrom"),
    processedTo: getFilter(searchParams, "processedTo"),
    minProposedAmount: getFilter(searchParams, "minProposedAmount"),
    maxProposedAmount: getFilter(searchParams, "maxProposedAmount"),
    minApprovedAmount: getFilter(searchParams, "minApprovedAmount"),
    maxApprovedAmount: getFilter(searchParams, "maxApprovedAmount"),
    requestingActorType: getFilter(searchParams, "requestingActorType"),
    reviewingAdminId: getFilter(searchParams, "reviewingAdminId"),
    policyCode: getFilter(searchParams, "policyCode"),
    policyVersion: getFilter(searchParams, "policyVersion"),
    gatewayExecutionBlocked: getFilter(searchParams, "gatewayExecutionBlocked"),
    search: getFilter(searchParams, "search"),
    page: numberFrom(searchParams.get("page"), DEFAULT_PAGE),
    size: Math.min(100, Math.max(1, numberFrom(searchParams.get("size"), DEFAULT_SIZE))),
    sortBy: (searchParams.get("sortBy") || "requestedAt") as RefundSortBy,
    sortDirection: (searchParams.get("sortDirection") === "ASC" ? "ASC" : "DESC") as RefundSortDirection,
  }

  const result = await adminListRefunds(filters)
  if (!result.data) {
    return NextResponse.json(result.error ?? { message: "Failed to fetch refunds" }, { status: statusFrom(result.error) })
  }

  return NextResponse.json(normalizeAdminRefundPage(result.data, filters))
}

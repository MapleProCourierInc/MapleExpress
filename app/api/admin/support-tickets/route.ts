import { NextRequest, NextResponse } from "next/server"
import {
  adminListSupportTickets,
  normalizeAdminSupportTicketPage,
} from "@/lib/admin-support-ticket-service"
import type { AdminSupportTicketFilters, SupportTicketApiError } from "@/types/admin-support-tickets"

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 20

function statusFrom(error: SupportTicketApiError | null) {
  return Number(error?.status) || 400
}

function getFilter(searchParams: URLSearchParams, key: keyof AdminSupportTicketFilters) {
  return searchParams.get(key) || undefined
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const filters: AdminSupportTicketFilters = {
    status: getFilter(searchParams, "status"),
    category: getFilter(searchParams, "category"),
    priority: getFilter(searchParams, "priority"),
    clientUserId: getFilter(searchParams, "clientUserId"),
    organizationId: getFilter(searchParams, "organizationId"),
    assignedAdminUserId: getFilter(searchParams, "assignedAdminUserId"),
    shippingOrderId: getFilter(searchParams, "shippingOrderId"),
    orderItemId: getFilter(searchParams, "orderItemId"),
    fulfilmentId: getFilter(searchParams, "fulfilmentId"),
    driverUserId: getFilter(searchParams, "driverUserId"),
    billingAccountId: getFilter(searchParams, "billingAccountId"),
    invoiceId: getFilter(searchParams, "invoiceId"),
    paymentId: getFilter(searchParams, "paymentId"),
    fromDate: getFilter(searchParams, "fromDate"),
    toDate: getFilter(searchParams, "toDate"),
    archived: getFilter(searchParams, "archived"),
    sort: getFilter(searchParams, "sort") || "updatedAt,desc",
    page: Number(searchParams.get("page") || DEFAULT_PAGE),
    size: Number(searchParams.get("size") || DEFAULT_SIZE),
  }

  const result = await adminListSupportTickets(filters)
  if (!result.data) {
    return NextResponse.json(result.error ?? { message: "Failed to fetch support tickets" }, { status: statusFrom(result.error) })
  }

  return NextResponse.json(normalizeAdminSupportTicketPage(result.data, filters))
}

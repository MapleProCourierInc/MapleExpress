import { NextRequest, NextResponse } from "next/server"
import {
  adminListManualQuotes,
  normalizeAdminManualQuotePage,
} from "@/lib/admin-manual-quote-service"
import { statusFromManualQuoteError } from "@/lib/admin-manual-quote-route-utils"
import type { AdminManualQuoteFilters } from "@/types/admin-manual-quotes"

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 20

function getFilter(searchParams: URLSearchParams, key: keyof AdminManualQuoteFilters) {
  return searchParams.get(key) || undefined
}

function normalizeNumber(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const filters: AdminManualQuoteFilters = {
    status: getFilter(searchParams, "status"),
    quoteStatus: getFilter(searchParams, "quoteStatus"),
    priority: getFilter(searchParams, "priority"),
    clientUserId: getFilter(searchParams, "clientUserId"),
    organizationId: getFilter(searchParams, "organizationId"),
    assignedAdminUserId: getFilter(searchParams, "assignedAdminUserId"),
    shippingOrderId: getFilter(searchParams, "shippingOrderId"),
    fromDate: getFilter(searchParams, "fromDate"),
    toDate: getFilter(searchParams, "toDate"),
    archived: getFilter(searchParams, "archived"),
    sort: getFilter(searchParams, "sort") || "updatedAt,desc",
    page: normalizeNumber(searchParams.get("page"), DEFAULT_PAGE),
    size: normalizeNumber(searchParams.get("size"), DEFAULT_SIZE) || DEFAULT_SIZE,
  }

  const result = await adminListManualQuotes(filters)
  if (!result.data) {
    return NextResponse.json(
      result.error ?? { message: "We could not load manual quote requests." },
      { status: statusFromManualQuoteError(result.error) },
    )
  }

  return NextResponse.json(normalizeAdminManualQuotePage(result.data, filters))
}

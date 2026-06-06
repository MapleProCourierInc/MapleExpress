import { AlertCircle } from "lucide-react"
import { AdminManualQuotes } from "@/components/admin/admin-manual-quotes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  adminListManualQuotes,
  normalizeAdminManualQuotePage,
} from "@/lib/admin-manual-quote-service"
import type { AdminManualQuoteFilters } from "@/types/admin-manual-quotes"

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 20

function normalizeNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = (await searchParams) ?? {}
  const getValue = (key: string) => {
    const value = resolved[key]
    if (Array.isArray(value)) return value[0] || ""
    return value || ""
  }

  const filters: AdminManualQuoteFilters = {
    status: getValue("status").trim(),
    quoteStatus: getValue("quoteStatus").trim(),
    priority: getValue("priority").trim(),
    clientUserId: getValue("clientUserId").trim(),
    organizationId: getValue("organizationId").trim(),
    assignedAdminUserId: getValue("assignedAdminUserId").trim(),
    shippingOrderId: getValue("shippingOrderId").trim(),
    fromDate: getValue("fromDate").trim(),
    toDate: getValue("toDate").trim(),
    archived: getValue("archived").trim(),
    sort: getValue("sort").trim() || "updatedAt,desc",
    page: normalizeNumber(getValue("page"), DEFAULT_PAGE),
    size: normalizeNumber(getValue("size"), DEFAULT_SIZE) || DEFAULT_SIZE,
  }

  const result = await adminListManualQuotes(filters)
  const data = normalizeAdminManualQuotePage(result.data, filters)

  return (
    <div className="space-y-4">
      {result.error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{result.error.message || "We could not load manual quote requests."}</AlertTitle>
          <AlertDescription>
            Backend returned status {result.error.status || "unknown"}. You can still adjust filters or refresh.
          </AlertDescription>
        </Alert>
      ) : null}

      <AdminManualQuotes initialData={data} initialError={result.error} initialFilters={filters} />
    </div>
  )
}

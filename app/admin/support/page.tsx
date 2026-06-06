import { AlertCircle } from "lucide-react"
import { AdminSupportTickets } from "@/components/admin/admin-support-tickets"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  adminListSupportTickets,
  normalizeAdminSupportTicketPage,
} from "@/lib/admin-support-ticket-service"
import type { AdminSupportTicketFilters } from "@/types/admin-support-tickets"

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 20

function normalizeNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export default async function AdminSupportPage({
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

  const filters: AdminSupportTicketFilters = {
    status: getValue("status").trim(),
    category: getValue("category").trim(),
    priority: getValue("priority").trim(),
    clientUserId: getValue("clientUserId").trim(),
    organizationId: getValue("organizationId").trim(),
    assignedAdminUserId: getValue("assignedAdminUserId").trim(),
    shippingOrderId: getValue("shippingOrderId").trim(),
    orderItemId: getValue("orderItemId").trim(),
    fulfilmentId: getValue("fulfilmentId").trim(),
    driverUserId: getValue("driverUserId").trim(),
    billingAccountId: getValue("billingAccountId").trim(),
    invoiceId: getValue("invoiceId").trim(),
    paymentId: getValue("paymentId").trim(),
    fromDate: getValue("fromDate").trim(),
    toDate: getValue("toDate").trim(),
    archived: getValue("archived").trim(),
    sort: getValue("sort").trim() || "updatedAt,desc",
    page: normalizeNumber(getValue("page"), DEFAULT_PAGE),
    size: normalizeNumber(getValue("size"), DEFAULT_SIZE) || DEFAULT_SIZE,
  }

  const result = await adminListSupportTickets(filters)
  const data = normalizeAdminSupportTicketPage(result.data, filters)

  return (
    <div className="space-y-4">
      {result.error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{result.error.message || "Failed to load support tickets"}</AlertTitle>
          <AlertDescription>
            Backend returned status {result.error.status || "unknown"}. You can still adjust filters or refresh.
          </AlertDescription>
        </Alert>
      ) : null}

      <AdminSupportTickets initialData={data} initialError={result.error} initialFilters={filters} />
    </div>
  )
}

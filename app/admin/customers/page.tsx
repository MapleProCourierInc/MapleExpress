import { AlertCircle } from "lucide-react"
import { CustomerBillingFilters } from "@/components/admin/customer-billing-filters"
import { CustomerBillingTable } from "@/components/admin/customer-billing-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listIndividualProfiles, listOrganizationProfiles } from "@/lib/admin-customer-billing-service"
import type { AdminCustomerBillingRow, IndividualProfile, OrganizationProfile } from "@/types/admin-customer-billing"

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 20

function normalizeNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function isRealProfileDocument(id?: string) {
  return Boolean(id && id !== "_serial_numbers_")
}


function getPostpayStatus(profile: IndividualProfile | OrganizationProfile) {
  const direct = profile.payLaterConfiguration?.activationStatus
  if (direct) return direct

  const extensionCandidate = profile.extensions?.payLaterConfiguration
  if (!extensionCandidate) return "DISABLED"

  if (typeof extensionCandidate === "string") {
    try {
      const parsed = JSON.parse(extensionCandidate) as { activationStatus?: "DISABLED" | "PENDING_BILLING_ACCOUNT" | "ACTIVE" | "FAILED" }
      return parsed?.activationStatus || "DISABLED"
    } catch {
      return "DISABLED"
    }
  }

  const objectCandidate = extensionCandidate as { activationStatus?: "DISABLED" | "PENDING_BILLING_ACCOUNT" | "ACTIVE" | "FAILED" }
  return objectCandidate?.activationStatus || "DISABLED"
}

function normalizeIndividual(item: IndividualProfile): AdminCustomerBillingRow {
  const fullName = `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.email || item.userId || item.id
  return {
    id: item.id,
    userId: item.userId,
    ownerType: "INDIVIDUAL",
    displayName: fullName,
    email: item.email || "",
    phone: item.phone || "",
    status: item.status || "UNKNOWN",
    postpayStatus: getPostpayStatus(item),
    updatedAt: item.updatedAt,
  }
}

function normalizeOrganization(item: OrganizationProfile): AdminCustomerBillingRow {
  return {
    id: item.id,
    userId: item.userId,
    ownerType: "ORGANIZATION",
    displayName: item.name || item.email || item.userId || item.id,
    email: item.email || "",
    phone: item.phone || "",
    status: item.status || "UNKNOWN",
    postpayStatus: getPostpayStatus(item),
    updatedAt: item.updatedAt,
  }
}

export default async function AdminCustomersPage({
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

  const ownerType = getValue("ownerType") === "organization" ? "organization" : "individual"
  const filters = {
    email: getValue("email").trim(),
    userId: getValue("userId").trim(),
    type: getValue("type").trim(),
    name: getValue("name").trim(),
    industry: getValue("industry").trim(),
    page: normalizeNumber(getValue("page"), DEFAULT_PAGE),
    size: normalizeNumber(getValue("size"), DEFAULT_SIZE) || DEFAULT_SIZE,
  }

  const result =
    ownerType === "organization"
      ? await listOrganizationProfiles({
          email: filters.email,
          userId: filters.userId,
          name: filters.name,
          industry: filters.industry,
          page: filters.page,
          size: filters.size,
        })
      : await listIndividualProfiles({
          email: filters.email,
          userId: filters.userId,
          type: filters.type,
          page: filters.page,
          size: filters.size,
        })

  const filteredItems = (result.data?.items || []).filter((item) => isRealProfileDocument(item?.id))
  const rows = filteredItems.map((item) =>
    ownerType === "organization" ? normalizeOrganization(item as OrganizationProfile) : normalizeIndividual(item as IndividualProfile),
  )

  const dataMeta = result.data
    ? {
        page: result.data.page,
        size: result.data.size,
        totalElements: result.data.totalElements,
        totalPages: result.data.totalPages,
      }
    : null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Review client profiles and manage postpay monthly billing access.</p>
      </div>

      <CustomerBillingFilters ownerType={ownerType} initialFilters={filters} />

      {result.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{result.error.message || "Failed to load profiles"}</AlertTitle>
          <AlertDescription>{result.textError || "Please check filters and retry."}</AlertDescription>
        </Alert>
      )}

      {!result.error && rows.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No profiles found</CardTitle>
            <CardDescription>Try adjusting filters and applying the search again.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!result.error && rows.length > 0 && (
        <CustomerBillingTable
          rows={rows}
          ownerType={ownerType}
          filters={{
            email: filters.email,
            userId: filters.userId,
            type: filters.type,
            name: filters.name,
            industry: filters.industry,
            size: filters.size,
          }}
          meta={dataMeta}
        />
      )}
    </div>
  )
}

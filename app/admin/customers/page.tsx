import { AlertCircle } from "lucide-react"
import { CustomerBillingFilters } from "@/components/admin/customer-billing-filters"
import { CustomerBillingTable } from "@/components/admin/customer-billing-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listIndividualProfiles, listOrganizationProfiles } from "@/lib/admin-customer-billing-service"
import type {
  AdminCustomerBillingRow,
  IndividualProfile,
  OrganizationProfile,
} from "@/types/admin-customer-billing"

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
    secondaryInfo: item.type ? `Type: ${item.type}` : item.userId,
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
    secondaryInfo: item.industry ? `Industry: ${item.industry}` : item.userId,
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
  }

  const result =
    ownerType === "organization"
      ? await listOrganizationProfiles({
          email: filters.email,
          userId: filters.userId,
          name: filters.name,
          industry: filters.industry,
        })
      : await listIndividualProfiles({ email: filters.email, userId: filters.userId, type: filters.type })

  const rows = (result.data || []).map((item) =>
    ownerType === "organization" ? normalizeOrganization(item as OrganizationProfile) : normalizeIndividual(item as IndividualProfile),
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Customer Billing</h1>
        <p className="text-muted-foreground">Review customer profiles and enable postpay monthly billing terms.</p>
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

      {!result.error && rows.length > 0 && <CustomerBillingTable rows={rows} />}
    </div>
  )
}

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { EnablePayLaterDialog } from "@/components/admin/enable-pay-later-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getIndividualProfileById, getOrganizationProfileById } from "@/lib/admin-customer-billing-service"
import type {
  IndividualProfile,
  OrganizationProfile,
  OwnerType,
  ProfileAddress,
  ProfileBillingConfigurationResponse,
} from "@/types/admin-customer-billing"

function humanize(value?: string | null) {
  if (!value) return "—"
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

function field(value?: string | number | boolean | null) {
  if (value === null || value === undefined || value === "") return "—"
  return String(value)
}

function renderAddress(addresses?: ProfileAddress[]) {
  if (!addresses?.length) return <p className="text-sm text-muted-foreground">No addresses on profile.</p>

  return (
    <div className="space-y-2 text-sm">
      {addresses.map((address, index) => (
        <div key={`${address.street || "address"}-${index}`} className="rounded border p-2">
          <p>{[address.street, address.city, address.province, address.postalCode].filter(Boolean).join(", ") || "—"}</p>
          {address.country ? <p className="text-muted-foreground">{address.country}</p> : null}
        </div>
      ))}
    </div>
  )
}

function extractBillingConfiguration(
  profile: IndividualProfile | OrganizationProfile,
  ownerType: OwnerType,
): ProfileBillingConfigurationResponse | null {
  const direct = (profile.billingConfiguration || profile.payLaterConfiguration) as ProfileBillingConfigurationResponse | null
  if (direct?.ownerId) return direct

  const extensionCandidate = profile.extensions?.billingConfiguration || profile.extensions?.payLaterConfiguration
  if (!extensionCandidate) return null

  if (typeof extensionCandidate === "string") {
    try {
      const parsed = JSON.parse(extensionCandidate) as ProfileBillingConfigurationResponse
      return parsed?.ownerId ? parsed : null
    } catch {
      return null
    }
  }

  const objectCandidate = extensionCandidate as ProfileBillingConfigurationResponse
  if (objectCandidate?.ownerId) return objectCandidate

  return {
    ownerType,
    ownerId: profile.userId,
    paymentTerms: profile.billingAccount?.billingAccountId ? "MONTHLY_INVOICE" : "PREPAID",
    activationStatus: profile.billingAccount?.billingAccountId ? "PENDING_BILLING_ACCOUNT" : "DISABLED",
    billingAccountId: profile.billingAccount?.billingAccountId || null,
    payLaterEligible: undefined,
    message: "Derived from profile data",
  }
}

function billingTone(status?: string) {
  const normalized = String(status || "").toUpperCase()
  if (normalized === "ACTIVE") return "default"
  if (normalized === "PENDING_BILLING_ACCOUNT") return "secondary"
  if (normalized === "FAILED") return "destructive"
  return "outline"
}

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ ownerType: string; profileId: string }> }) {
  const { ownerType: rawOwnerType, profileId } = await params
  const ownerType = rawOwnerType === "organization" ? "ORGANIZATION" : "INDIVIDUAL"

  const result =
    ownerType === "ORGANIZATION" ? await getOrganizationProfileById(profileId) : await getIndividualProfileById(profileId)

  if (!result.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{result.error?.message || "Unable to load customer profile"}</AlertTitle>
        <AlertDescription>{result.textError || "Please return to the list and retry."}</AlertDescription>
      </Alert>
    )
  }

  const profile = result.data
  const displayName =
    ownerType === "ORGANIZATION"
      ? ((profile as OrganizationProfile).name || profile.email || profile.id)
      : (`${(profile as IndividualProfile).firstName || ""} ${(profile as IndividualProfile).lastName || ""}`.trim() || profile.email || profile.id)

  const billingConfiguration = extractBillingConfiguration(profile, ownerType)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Link href="/admin/customers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Customer Billing
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="text-muted-foreground">{field(profile.email)}</p>
            <p className="text-xs text-muted-foreground">
              Profile ID: <span className="font-mono">{profile.id}</span> • User ID: <span className="font-mono">{field(profile.userId)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{humanize(ownerType)}</Badge>
            <Badge variant="secondary">{humanize(profile.status)}</Badge>
          </div>
        </div>

        <EnablePayLaterDialog ownerType={ownerType} ownerId={profile.userId} displayName={displayName} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Core customer information from profile service.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Email:</span> {field(profile.email)}</p>
            <p><span className="text-muted-foreground">Phone:</span> {field(profile.phone)}</p>
            <p><span className="text-muted-foreground">Status:</span> {humanize(profile.status)}</p>
            {ownerType === "INDIVIDUAL" ? (
              <>
                <p><span className="text-muted-foreground">Name:</span> {displayName}</p>
                <p><span className="text-muted-foreground">Date of Birth:</span> {field((profile as IndividualProfile).dateOfBirth)}</p>
                <p><span className="text-muted-foreground">Type:</span> {field((profile as IndividualProfile).type)}</p>
              </>
            ) : (
              <>
                <p><span className="text-muted-foreground">Organization:</span> {field((profile as OrganizationProfile).name)}</p>
                <p><span className="text-muted-foreground">Industry:</span> {field((profile as OrganizationProfile).industry)}</p>
                <p><span className="text-muted-foreground">Registration #:</span> {field((profile as OrganizationProfile).registrationNumber)}</p>
                <p><span className="text-muted-foreground">Tax ID:</span> {field((profile as OrganizationProfile).taxID)}</p>
              </>
            )}
            <p><span className="text-muted-foreground">Created:</span> {formatDate(profile.createdAt)}</p>
            <p><span className="text-muted-foreground">Updated:</span> {formatDate(profile.updatedAt)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing / Postpay</CardTitle>
            <CardDescription>Current monthly billing state based on available profile-backed data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {billingConfiguration ? (
              <>
                <p><span className="text-muted-foreground">Payment Terms:</span> {humanize(billingConfiguration.paymentTerms)}</p>
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground">Activation:</span>
                  <Badge variant={billingTone(billingConfiguration.activationStatus)}>{humanize(billingConfiguration.activationStatus)}</Badge>
                </p>
                <p><span className="text-muted-foreground">Billing Account ID:</span> {field(billingConfiguration.billingAccountId)}</p>
                <p><span className="text-muted-foreground">Pay-later Eligible:</span> {field(billingConfiguration.payLaterEligible)}</p>
                <p><span className="text-muted-foreground">Message:</span> {field(billingConfiguration.message)}</p>
              </>
            ) : (
              <p className="text-muted-foreground">No explicit billing configuration returned for this profile. Use enable action and refresh.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Addresses</CardTitle>
          <CardDescription>Saved profile addresses.</CardDescription>
        </CardHeader>
        <CardContent>{renderAddress(profile.address)}</CardContent>
      </Card>
    </div>
  )
}

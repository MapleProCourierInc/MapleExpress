import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { EnablePayLaterDialog } from "@/components/admin/enable-pay-later-dialog"
import { ProfileBillingCard } from "@/components/admin/profile-billing-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getIndividualProfileById, getOrganizationProfileById } from "@/lib/admin-customer-billing-service"
import type { IndividualProfile, OrganizationProfile, OwnerType, PayLaterConfigurationEntity } from "@/types/admin-customer-billing"

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

function formatDateOnly(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

function field(value?: string | number | boolean | null) {
  if (value === null || value === undefined || value === "") return "—"
  return String(value)
}

function getPayLaterConfiguration(profile: IndividualProfile | OrganizationProfile): PayLaterConfigurationEntity | null {
  if (profile.payLaterConfiguration) return profile.payLaterConfiguration

  const extensionCandidate = profile.extensions?.payLaterConfiguration
  if (!extensionCandidate) return null

  if (typeof extensionCandidate === "string") {
    try {
      const parsed = JSON.parse(extensionCandidate) as PayLaterConfigurationEntity
      return parsed || null
    } catch {
      return null
    }
  }

  return extensionCandidate as PayLaterConfigurationEntity
}

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ ownerType: string; profileId: string }> }) {
  const { ownerType: rawOwnerType, profileId } = await params
  const ownerType = rawOwnerType === "organization" ? "ORGANIZATION" : "INDIVIDUAL"

  const result =
    ownerType === "ORGANIZATION" ? await getOrganizationProfileById(profileId) : await getIndividualProfileById(profileId)

  if (!result.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{result.error?.message || "Unable to load user profile"}</AlertTitle>
        <AlertDescription>{result.textError || "Please return to the list and retry."}</AlertDescription>
      </Alert>
    )
  }

  const profile = result.data
  const displayName =
    ownerType === "ORGANIZATION"
      ? ((profile as OrganizationProfile).name || profile.email || profile.id)
      : (`${(profile as IndividualProfile).firstName || ""} ${(profile as IndividualProfile).lastName || ""}`.trim() || profile.email || profile.id)

  const payLaterConfiguration = getPayLaterConfiguration(profile)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Link href="/admin/customers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Users
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

        {!payLaterConfiguration ? <EnablePayLaterDialog ownerType={ownerType} ownerId={profile.userId} displayName={displayName} /> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Core user information from profile service.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Email:</span> {field(profile.email)}</p>
            <p><span className="text-muted-foreground">Phone:</span> {field(profile.phone)}</p>
            <p><span className="text-muted-foreground">Status:</span> {humanize(profile.status)}</p>
            {ownerType === "INDIVIDUAL" ? (
              <>
                <p><span className="text-muted-foreground">Name:</span> {displayName}</p>
                <p><span className="text-muted-foreground">Date of Birth:</span> {formatDateOnly((profile as IndividualProfile).dateOfBirth)}</p>
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
          </CardContent>
        </Card>

        {payLaterConfiguration ? (
          <ProfileBillingCard ownerType={ownerType as OwnerType} ownerId={profile.userId} payLaterConfiguration={payLaterConfiguration} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Billing / Postpay</CardTitle>
              <CardDescription>Monthly billing is not configured for this user yet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Payment Terms:</span> Prepaid</p>
              <p className="text-muted-foreground">
                This user is currently prepaid. Use “Enable Monthly Billing” to set up postpay terms.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

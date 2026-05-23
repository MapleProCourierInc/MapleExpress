"use client"

import { useEffect, useState, type ReactNode } from "react"
import { CreditCard, FileText, Loader2, MapPin, Pencil, Save, User, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AddressManagement } from "@/components/dashboard/address-management"
import { getIndividualProfile, getOrganizationProfile, updateProfileTaxID } from "@/lib/profile-service"
import { isOrganizationAccount, profileAccountTypeLabel } from "@/lib/profile-account-type"
import type { IndividualProfile, OrganizationProfile } from "@/types/profile"

interface ProfileSectionProps {
  userId: string
  userType: string
  groups?: string[]
}

type ProfileData = IndividualProfile | OrganizationProfile

function isOrganizationProfile(profile: ProfileData | null): profile is OrganizationProfile {
  return Boolean(profile && "name" in profile)
}

function profileTaxID(profile?: ProfileData | null) {
  return profile?.taxID || ""
}

function profileDisplayName(profile: ProfileData | null) {
  if (!profile) return "Loading..."
  if (isOrganizationProfile(profile)) return profile.name || "Not available"
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Not available"
}

function formatProfileDate(value?: string | null) {
  if (!value) return "Not available"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not available"
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatEnumLabel(value?: string | null) {
  if (!value) return "Not available"
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function DetailItem({ label, children, dark = false }: { label: string; children: ReactNode; dark?: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${dark ? "text-slate-300" : "text-slate-500"}`}>
        {label}
      </div>
      <div className={`min-h-5 text-sm font-medium ${dark ? "text-white" : "text-slate-950"}`}>{children}</div>
    </div>
  )
}

export function ProfileSection({
  userId,
  userType,
  groups,
}: ProfileSectionProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isEditingTaxID, setIsEditingTaxID] = useState(false)
  const [taxIDInput, setTaxIDInput] = useState("")
  const [isSavingTaxID, setIsSavingTaxID] = useState(false)
  const [taxIDError, setTaxIDError] = useState<string | null>(null)
  const currentTaxID = profileTaxID(profile)
  const payLaterConfiguration = profile?.payLaterConfiguration

  useEffect(() => {
    async function loadProfile() {
      if (!userId) return

      setIsLoadingProfile(true)
      setProfileError(null)
      setTaxIDError(null)

      try {
        const data =
          isOrganizationAccount(groups, userType)
            ? await getOrganizationProfile()
            : await getIndividualProfile()

        setProfile(data)
      } catch (error) {
        console.error("Failed to load profile:", error)
        setProfileError(error instanceof Error ? error.message : "Failed to load profile")
      } finally {
        setIsLoadingProfile(false)
      }
    }

    if (activeTab === "details") {
      loadProfile()
    }
  }, [activeTab, groups, userId, userType])

  const startTaxIDEdit = () => {
    setTaxIDInput(currentTaxID)
    setTaxIDError(null)
    setIsEditingTaxID(true)
  }

  const cancelTaxIDEdit = () => {
    setTaxIDInput(currentTaxID)
    setTaxIDError(null)
    setIsEditingTaxID(false)
  }

  const saveTaxID = async () => {
    setIsSavingTaxID(true)
    setTaxIDError(null)

    try {
      const updatedProfile = await updateProfileTaxID(taxIDInput.trim())
      setProfile((current) =>
        current
          ? ({ ...current, ...updatedProfile, taxID: updatedProfile.taxID || taxIDInput.trim() } as ProfileData)
          : updatedProfile,
      )
      setIsEditingTaxID(false)
    } catch (error) {
      setTaxIDError(error instanceof Error ? error.message : "Failed to update GST registration number")
    } finally {
      setIsSavingTaxID(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your profile details and saved addresses.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile Details
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Addresses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {profileError ? <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{profileError}</p> : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.95fr)]">
            <Card className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-sm">
              <div className="h-1 bg-red-700" />
              <CardHeader className="flex flex-row items-start justify-between gap-4 px-7 pb-2 pt-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                    <User className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-semibold text-slate-950">Account Details</CardTitle>
                </div>
                <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase text-emerald-700 hover:bg-emerald-50">
                  {profile?.status || (isLoadingProfile ? "Loading" : "Unknown")}
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-x-12 gap-y-7 px-7 pb-8 pt-4 sm:grid-cols-2">
                <DetailItem label="Display Name">{profileDisplayName(profile)}</DetailItem>
                <DetailItem label="Phone Number">{profile?.phone || "Not available"}</DetailItem>
                <DetailItem label="Email Address">{profile?.email || "Not available"}</DetailItem>
                <DetailItem label="Account Type">
                  <Badge variant="secondary" className="rounded-md bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                    {profileAccountTypeLabel(groups, userType)}
                  </Badge>
                </DetailItem>
                {profile && isOrganizationProfile(profile) ? (
                  <>
                    <DetailItem label="Registration Number">{profile.registrationNumber || "Not available"}</DetailItem>
                    <DetailItem label="Industry">{profile.industry || "Not available"}</DetailItem>
                    <DetailItem label="Website">{profile.website || "Not available"}</DetailItem>
                    <DetailItem label="Point of Contact">{profile.pointOfContact?.name || "Not available"}</DetailItem>
                  </>
                ) : profile ? (
                  <DetailItem label="Date of Birth">{formatProfileDate(profile.dateOfBirth)}</DetailItem>
                ) : null}
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-sm">
                <div className="h-1 bg-blue-600" />
                <CardHeader className="px-4 pb-2 pt-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <FileText className="h-4 w-4" />
                    </span>
                    Tax Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-5 pt-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    GST Registration
                  </div>
                  {isEditingTaxID ? (
                    <div className="mt-3 space-y-3">
                      <Input
                        disabled={isSavingTaxID}
                        onChange={(event) => setTaxIDInput(event.target.value)}
                        placeholder="Enter GST registration number"
                        value={taxIDInput}
                      />
                      <div className="flex justify-end gap-2">
                        <Button disabled={isSavingTaxID} onClick={cancelTaxIDEdit} size="sm" type="button" variant="outline">
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                        <Button disabled={isSavingTaxID} onClick={saveTaxID} size="sm" type="button">
                          {isSavingTaxID ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center justify-between gap-4">
                      <div className="min-w-0 truncate text-sm font-semibold text-slate-950">
                        {isLoadingProfile ? "Loading..." : currentTaxID || "Not provided"}
                      </div>
                      <Button
                        className="h-auto gap-1.5 px-0 py-0 text-blue-700 hover:text-blue-800"
                        onClick={startTaxIDEdit}
                        size="sm"
                        type="button"
                        variant="link"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  )}
                  {taxIDError ? <p className="mt-3 text-sm text-destructive">{taxIDError}</p> : null}
                </CardContent>
              </Card>

              {payLaterConfiguration ? (
                <Card className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-sm">
                  <div className="h-1 bg-emerald-600" />
                  <CardHeader className="px-4 pb-2 pt-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <CreditCard className="h-4 w-4" />
                      </span>
                      Pay Later
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 pb-5 pt-1">
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Status
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-950">
                          {formatEnumLabel(payLaterConfiguration.activationStatus)}
                        </div>
                      </div>
                      <Badge className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                        {formatEnumLabel(payLaterConfiguration.paymentTerms)}
                      </Badge>
                    </div>
                    <div className="grid gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                      <DetailItem label="Billing Account">
                        {payLaterConfiguration.billingAccountId || "Not available"}
                      </DetailItem>
                      <DetailItem label="Enabled">
                        {formatProfileDate(payLaterConfiguration.enabledAt)}
                      </DetailItem>
                      <DetailItem label="Last Updated">
                        {formatProfileDate(payLaterConfiguration.lastUpdatedAt)}
                      </DetailItem>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="addresses">
          <AddressManagement userId={userId} userType={userType} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

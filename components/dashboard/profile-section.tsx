"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { User, MapPin } from "lucide-react"
import { AddressManagement } from "@/components/dashboard/address-management"
import type { IndividualProfile, OrganizationProfile } from "@/types/profile"
import { getIndividualProfileOrNull, getOrganizationProfileOrNull } from "@/lib/profile-service"
import type { MeResponse } from "@/lib/me-service"

interface ProfileSectionProps {
  userId: string
  userType: string
  displayName: string
  email?: string
  me: MeResponse | null
}

type ClientType = "client_individual" | "client_organization"

const CLIENT_TYPE_COOKIE_NAME = "maplexpress_client_type"

const getClientTypeFromGroups = (groups?: string[]): ClientType | null => {
  if (!groups || groups.length === 0) return null
  if (groups.includes("client_individual")) return "client_individual"
  if (groups.includes("client_organization")) return "client_organization"
  return null
}

const getClientTypeFromCookie = (): ClientType | null => {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${CLIENT_TYPE_COOKIE_NAME}=([^;]*)`))
  const decoded = match ? decodeURIComponent(match[1]) : ""
  return decoded === "client_individual" || decoded === "client_organization" ? decoded : null
}

const formatDateOnly = (value?: string | null) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

const formatText = (value?: string | null) => {
  if (!value || value.trim() === "") return "—"
  return value
}

const formatBlankText = (value?: string | null) => {
  if (!value || value.trim() === "") return ""
  return value
}

export function ProfileSection({ userId, userType, displayName, email, me }: ProfileSectionProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [isLoadingDetails, setIsLoadingDetails] = useState(true)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [individualProfile, setIndividualProfile] = useState<IndividualProfile | null>(null)
  const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile | null>(null)

  const clientType = useMemo(() => {
    return getClientTypeFromGroups(me?.groups) || getClientTypeFromCookie()
  }, [me?.groups])

  useEffect(() => {
    let isMounted = true

    const loadProfileDetails = async () => {
      setIsLoadingDetails(true)
      setDetailsError(null)
      setIndividualProfile(null)
      setOrganizationProfile(null)

      try {
        if (clientType === "client_individual") {
          const profile = await getIndividualProfileOrNull(userId)
          if (!isMounted) return
          setIndividualProfile(profile)
          return
        }

        if (clientType === "client_organization") {
          const profile = await getOrganizationProfileOrNull(userId)
          if (!isMounted) return
          setOrganizationProfile(profile)
          return
        }

        if (!isMounted) return
        setDetailsError("Unable to determine account type for profile details.")
      } catch (error) {
        console.error("Failed to load profile details:", error)
        if (!isMounted) return
        setDetailsError("Unable to load profile details right now.")
      } finally {
        if (isMounted) {
          setIsLoadingDetails(false)
        }
      }
    }

    loadProfileDetails()

    return () => {
      isMounted = false
    }
  }, [clientType, userId])

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
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
              <CardDescription>Business profile details based on your current account type.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isLoadingDetails ? (
                <div className="border rounded-md p-3 text-muted-foreground">Loading profile details...</div>
              ) : detailsError ? (
                <div className="border rounded-md p-3 text-destructive">{detailsError}</div>
              ) : clientType === "client_individual" ? (
                individualProfile ? (
                  <>
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <span className="text-muted-foreground">Account Type</span>
                      <Badge variant="outline">Individual</Badge>
                    </div>
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{formatText(individualProfile.email || email)}</span>
                    </div>
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <span className="text-muted-foreground">Full Name</span>
                      <span className="font-medium">{formatText(`${individualProfile.firstName || ""} ${individualProfile.lastName || ""}`.trim() || displayName)}</span>
                    </div>
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <span className="text-muted-foreground">Date of Birth</span>
                      <span className="font-medium">{formatDateOnly(individualProfile.dateOfBirth)}</span>
                    </div>
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{formatText(individualProfile.phone)}</span>
                    </div>
                    {individualProfile.payLaterConfiguration ? (
                      <div className="space-y-2 border rounded-md p-3">
                        <div className="text-muted-foreground font-medium">Pay Later Configuration</div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Payment Terms</span>
                          <span className="font-medium">{formatText(individualProfile.payLaterConfiguration.paymentTerms || undefined)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <span className="font-medium">{formatText(individualProfile.payLaterConfiguration.activationStatus || undefined)}</span>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="border rounded-md p-3 text-muted-foreground">
                    No profile details were found for this individual account yet.
                  </div>
                )
              ) : clientType === "client_organization" ? (
                organizationProfile ? (
                  <>
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <span className="text-muted-foreground">Account Type</span>
                      <Badge variant="outline">Organization</Badge>
                    </div>
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{formatText(organizationProfile.name || displayName)}</span>
                    </div>
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <span className="text-muted-foreground">Registration Number</span>
                      <span className="font-medium">{formatBlankText(organizationProfile.registrationNumber)}</span>
                    </div>
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <span className="text-muted-foreground">GST/HST</span>
                      <span className="font-medium">{formatBlankText(organizationProfile.taxID)}</span>
                    </div>
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <span className="text-muted-foreground">Industry</span>
                      <span className="font-medium">{formatBlankText(organizationProfile.industry)}</span>
                    </div>
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{formatText(organizationProfile.email || email)}</span>
                    </div>
                    <div className="space-y-2 border rounded-md p-3">
                      <div className="text-muted-foreground font-medium">Point of Contact</div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium">{formatText(organizationProfile.pointOfContact?.name)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Position</span>
                        <span className="font-medium">{formatText(organizationProfile.pointOfContact?.position)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-medium">{formatText(organizationProfile.pointOfContact?.email)}</span>
                      </div>
                    </div>
                    {organizationProfile.payLaterConfiguration ? (
                      <div className="space-y-2 border rounded-md p-3">
                        <div className="text-muted-foreground font-medium">Pay Later Configuration</div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Payment Terms</span>
                          <span className="font-medium">{formatText(organizationProfile.payLaterConfiguration.paymentTerms || undefined)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <span className="font-medium">{formatText(organizationProfile.payLaterConfiguration.activationStatus || undefined)}</span>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="border rounded-md p-3 text-muted-foreground">
                    No profile details were found for this organization account yet.
                  </div>
                )
              ) : (
                <div className="border rounded-md p-3 text-muted-foreground">
                  Profile details are unavailable for this account type.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <AddressManagement userId={userId} userType={userType} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

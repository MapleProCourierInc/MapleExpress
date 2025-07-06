"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IndividualSettings } from "@/components/individual-settings"
import { OrganizationSettings } from "@/components/organization-settings"
import { ChangePassword } from "@/components/change-password"
import { getIndividualProfile, getOrganizationProfile } from "@/lib/profile-service"
import type { IndividualProfile, OrganizationProfile } from "@/types/profile"
import { Settings, Key, User, Building, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface UserSettingsProps {
  userId: string
  userType: string
}

export function UserSettings({ userId, userType }: UserSettingsProps) {
  const [activeTab, setActiveTab] = useState("profile")
  const [individualProfile, setIndividualProfile] = useState<IndividualProfile | null>(null)
  const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (userType === "individualUser") {
          const profile = await getIndividualProfile(userId)
          setIndividualProfile(profile)
        } else if (userType === "businessUser") {
          const profile = await getOrganizationProfile(userId)
          setOrganizationProfile(profile)
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError("Failed to load profile data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
  }, [userId, userType])

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    try {
      if (userType === "individualUser") {
        const profile = await getIndividualProfile(userId)
        setIndividualProfile(profile)
      } else if (userType === "businessUser") {
        const profile = await getOrganizationProfile(userId)
        setOrganizationProfile(profile)
      }
    } catch (err) {
      console.error("Error refreshing profile:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile data...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Settings className="mr-2 h-6 w-6" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-64 space-y-6">
          <Tabs orientation="vertical" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-col h-auto bg-transparent space-y-1 p-0">
              <TabsTrigger value="profile" className="justify-start px-3 py-2 data-[state=active]:bg-muted">
                {userType === "individualUser" ? (
                  <User className="mr-2 h-4 w-4" />
                ) : (
                  <Building className="mr-2 h-4 w-4" />
                )}
                {userType === "individualUser" ? "Personal Information" : "Organization Information"}
              </TabsTrigger>
              <TabsTrigger value="security" className="justify-start px-3 py-2 data-[state=active]:bg-muted">
                <Key className="mr-2 h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="profile" className="mt-0">
              {userType === "individualUser" && individualProfile ? (
                <IndividualSettings profile={individualProfile} onProfileUpdate={handleProfileUpdate} />
              ) : userType === "businessUser" && organizationProfile ? (
                <OrganizationSettings profile={organizationProfile} onProfileUpdate={handleProfileUpdate} />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Profile data not available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <ChangePassword />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}


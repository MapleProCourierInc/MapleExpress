"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getIndividualProfile, getOrganizationProfile } from "@/lib/profile-service"
import type { IndividualProfile, OrganizationProfile } from "@/types/profile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IndividualSettings } from "@/components/individual-settings"
import { OrganizationSettings } from "@/components/organization-settings"
import { ChangePassword } from "@/components/change-password"
import { Truck, ArrowLeft, Settings, Key, User, Building } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")
  const [individualProfile, setIndividualProfile] = useState<IndividualProfile | null>(null)
  const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        if (user.userType === "individualUser") {
          const profile = await getIndividualProfile(user.userId)
          console.log("Fetched individual profile:", profile)
          setIndividualProfile(profile)
        } else if (user.userType === "businessUser") {
          const profile = await getOrganizationProfile(user.userId)
          console.log("Fetched organization profile:", profile)
          setOrganizationProfile(profile)
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError("Failed to load profile data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (user && user.userStatus === "active") {
      fetchProfileData()
    }
  }, [user])

  const handleProfileUpdate = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      if (user.userType === "individualUser") {
        const profile = await getIndividualProfile(user.userId)
        setIndividualProfile(profile)
      } else if (user.userType === "businessUser") {
        const profile = await getOrganizationProfile(user.userId)
        setOrganizationProfile(profile)
      }
    } catch (err) {
      console.error("Error refreshing profile:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link href="/">
              <div className="flex items-center gap-2">
                <Truck className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">MapleXpress</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-64 space-y-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Settings className="mr-2 h-6 w-6" /> Settings
              </h1>
              <p className="text-muted-foreground mt-1">Manage your account settings</p>
            </div>

            <Tabs orientation="vertical" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex flex-col h-auto bg-transparent space-y-1 p-0">
                <TabsTrigger value="profile" className="justify-start px-3 py-2 data-[state=active]:bg-muted">
                  {user.userType === "individualUser" ? (
                    <User className="mr-2 h-4 w-4" />
                  ) : (
                    <Building className="mr-2 h-4 w-4" />
                  )}
                  {user.userType === "individualUser" ? "Personal Information" : "Organization Information"}
                </TabsTrigger>
                <TabsTrigger value="security" className="justify-start px-3 py-2 data-[state=active]:bg-muted">
                  <Key className="mr-2 h-4 w-4" />
                  Security
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1">
            {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6">{error}</div>}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="profile" className="mt-0">
                {user.userType === "individualUser" && individualProfile ? (
                  <IndividualSettings profile={individualProfile} onProfileUpdate={handleProfileUpdate} />
                ) : user.userType === "businessUser" && organizationProfile ? (
                  <OrganizationSettings profile={organizationProfile} onProfileUpdate={handleProfileUpdate} />
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Profile data not available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <ChangePassword userId={user.userId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}


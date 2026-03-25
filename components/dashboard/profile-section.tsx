"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { User, MapPin } from "lucide-react"
import { AddressManagement } from "@/components/dashboard/address-management"

interface ProfileSectionProps {
  userId: string
  userType: string
  displayName: string
  email?: string
}

export function ProfileSection({ userId, userType, displayName, email }: ProfileSectionProps) {
  const [activeTab, setActiveTab] = useState("details")

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
              <CardDescription>
                Profile API wiring is pending for MVP. This section is intentionally scaffolded.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between border rounded-md p-3">
                <span className="text-muted-foreground">Display Name</span>
                <span className="font-medium">{displayName || "Not available"}</span>
              </div>
              <div className="flex items-center justify-between border rounded-md p-3">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{email || "Not available"}</span>
              </div>
              <div className="flex items-center justify-between border rounded-md p-3">
                <span className="text-muted-foreground">Account Type</span>
                <Badge variant="outline">{userType === "businessUser" ? "Business" : "Individual"}</Badge>
              </div>
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

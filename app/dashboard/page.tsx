"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProfileSection } from "@/components/dashboard/profile-section"
import { Shipments } from "@/components/dashboard/shipments"
import { ChevronRight, LogOut, Package, Truck, UserRound } from "lucide-react"

type SectionType = "shipments" | "profile"

const getInitials = (name?: string | null) => {
  const trimmed = name?.trim()
  if (!trimmed) return ""

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  const first = parts[0][0] || ""
  const last = parts[parts.length - 1][0] || ""
  return `${first}${last}`.toUpperCase()
}

export default function Dashboard() {
  const { user, isLoading, me, individualProfile, organizationProfile, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const requestedSection = searchParams.get("section")
  const activeSection: SectionType = requestedSection === "profile" ? "profile" : "shipments"

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/")
        return
      }

      if (user.userStatus === "pendingEmailVerification" || user.userStatus === "pendingProfileCompletion") {
        router.push("/")
        return
      }

      if (!requestedSection || (requestedSection !== "shipments" && requestedSection !== "profile")) {
        router.replace("/dashboard?section=shipments")
      }
    }
  }, [user, isLoading, router, requestedSection])

  const displayName = useMemo(() => {
    return (
      me?.displayName ||
      (individualProfile ? `${individualProfile.firstName} ${individualProfile.lastName}` : organizationProfile?.name) ||
      (user ? `User ${user.userId.split("_")[1]}` : "User")
    )
  }, [me, individualProfile, organizationProfile, user])

  const navigateSection = (section: SectionType) => {
    router.push(`/dashboard?section=${section}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden md:flex w-64 flex-col bg-white border-r">
          <div className="flex h-16 items-center border-b px-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
              <Truck className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">MapleXpress</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto py-4">
            <nav className="space-y-1 px-2">
              <button
                className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${activeSection === "shipments" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => navigateSection("shipments")}
              >
                <Package className="h-5 w-5" />
                Shipments
              </button>
              <button
                className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${activeSection === "profile" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => navigateSection("profile")}
              >
                <UserRound className="h-5 w-5" />
                Profile
              </button>
            </nav>
          </div>

          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium leading-none truncate">{displayName}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigateSection("profile")} className="cursor-pointer">
                    <UserRound className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-6">
          {activeSection === "shipments" ? (
            <Shipments />
          ) : (
            <ProfileSection userId={user.userId} userType={user.userType} displayName={displayName} email={user.email} />
          )}
        </main>
      </div>
    </div>
  )
}

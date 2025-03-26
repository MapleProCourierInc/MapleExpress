"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Package, Settings, LogOut, UserCheck } from "lucide-react"
import Link from "next/link"

export function UserProfile() {
  const { user, logout, individualProfile, organizationProfile } = useAuth()

  if (!user) return null

  // Determine display name and user type based on profile data
  let displayName = ""
  let displayInitial = ""
  let userTypeDisplay = ""

  if (individualProfile) {
    displayName = `${individualProfile.firstName} ${individualProfile.lastName}`
    displayInitial = individualProfile.firstName.charAt(0).toUpperCase()
    userTypeDisplay = "Individual"
  } else if (organizationProfile) {
    displayName = organizationProfile.pointOfContact.name
    displayInitial = organizationProfile.name.charAt(0).toUpperCase()
    userTypeDisplay = "Business"
  } else {
    // Fallback to user ID if no profile is available
    displayName = `User ${user.userId.split("_")[1]}`
    displayInitial = user.userId.charAt(0).toUpperCase()
    userTypeDisplay = user.userType === "individualUser" ? "Individual" : "Business"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {displayInitial}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <div className="flex items-center text-xs text-muted-foreground">
              <UserCheck className="mr-1 h-3 w-3" />
              <span>{userTypeDisplay} Account</span>
              {user.userStatus === "active" && (
                <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Active
                </span>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex w-full cursor-pointer items-center">
            <User className="mr-2 h-4 w-4" />
            <span>My Account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/shipments" className="flex w-full cursor-pointer items-center">
            <Package className="mr-2 h-4 w-4" />
            <span>My Shipments</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex w-full cursor-pointer items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


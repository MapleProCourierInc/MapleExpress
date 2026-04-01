"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getMe, MeRequestError, type MeResponse } from "@/lib/me-service"
import { submitOnboarding, type OnboardingPayload } from "@/lib/onboarding-service"
import { apiFetch, cleanupLegacyTokenStorage, initSessionRefresh } from "@/lib/client-api"

// Update the User type to match your API response
type User = {
  userId: string
  userStatus: string
  userType: string
  tokenExpiration: string
  email: string
} | null

// Add types for individual and organization profiles
type IndividualProfile = {
  id: string
  userId: string
  status: string
  email: string
  firstName: string
  lastName: string
  dateOfBirth: string
  type: string
  phone: string
  phoneNumberVerified?: boolean
  address?: Array<{
    fullName: string
    company?: string
    streetAddress: string
    addressLine2?: string
    city: string
    province: string
    postalCode: string
    country: string
    phoneNumber: string
    deliveryInstructions?: string
    addressType: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    isPrimary: boolean
  }>
  createdAt?: string
  updatedAt?: string
  extensions?: Record<string, string>
}

type OrganizationProfile = {
  id: string
  userId: string
  status: string
  name: string
  pointOfContact: {
    name: string
    position: string
    email: string
    phone: string
  }
  address?: Array<{
    fullName: string
    company?: string
    streetAddress: string
    addressLine2?: string
    city: string
    province: string
    postalCode: string
    country: string
    phoneNumber: string
    deliveryInstructions?: string
    addressType: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    isPrimary: boolean
  }>
  createdAt?: string
  updatedAt?: string
  extensions?: Record<string, string>
}

// Update the AuthContextType
type AuthContextType = {
  user: User
  isLoading: boolean
  me: MeResponse | null
  individualProfile: IndividualProfile | null
  organizationProfile: OrganizationProfile | null
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message: string; userStatus?: string }>
  logout: () => Promise<void>
  createIndividualProfile: (
    profileData: Omit<IndividualProfile, "id" | "status" | "email" | "createdAt" | "updatedAt">,
  ) => Promise<{ success: boolean; message: string; profile?: IndividualProfile }>
  createOrganizationProfile: (
    profileData: Omit<OrganizationProfile, "id" | "status" | "createdAt" | "updatedAt">,
  ) => Promise<{ success: boolean; message: string; profile?: OrganizationProfile }>
  confirmEmail: (email: string, code: string) => Promise<{ success: boolean; message: string }>
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message: string }>
  fetchUserProfile: (user?: User) => Promise<void>
  completeOnboarding: (payload: OnboardingPayload) => Promise<{ success: boolean; message: string; statusCode?: number }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const GROUP_COOKIE_NAME = "maplexpress_group"
  const GROUP_COOKIE_MAX_AGE = 60 * 60 * 24 * 5

  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [me, setMe] = useState<MeResponse | null>(null)
  const [individualProfile, setIndividualProfile] = useState<IndividualProfile | null>(null)
  const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile | null>(null)

  const setClientGroupCookie = (groups?: string[]) => {
    if (typeof document === "undefined") return

    const group = groups?.[0]

    if (group) {
      document.cookie = `${GROUP_COOKIE_NAME}=${encodeURIComponent(group)}; path=/; max-age=${GROUP_COOKIE_MAX_AGE}; samesite=lax`
      return
    }

    document.cookie = `${GROUP_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`
  }

  const clearSession = () => {
    cleanupLegacyTokenStorage()
    localStorage.removeItem("maplexpress_user_data")
    localStorage.removeItem("maplexpress_me")
    localStorage.removeItem("maplexpress_individual_profile")
    localStorage.removeItem("maplexpress_organization_profile")
    setClientGroupCookie()
    setUser(null)
    setMe(null)
    setIndividualProfile(null)
    setOrganizationProfile(null)
  }

  const syncMe = async (activeUser: NonNullable<User>) => {
    const meData = await getMe()
    setMe(meData)
    localStorage.setItem("maplexpress_me", JSON.stringify(meData))
    setClientGroupCookie(meData.groups)

    const isSuperAdmin = meData.authenticated && meData.groups?.includes("admin_super")

    if (meData.status === "ONBOARDING_REQUIRED") {
      if (window.location.pathname !== "/onboarding") {
        window.location.href = "/onboarding"
      }
      return meData
    }

    const updatedUser = { ...activeUser, userStatus: "active" }
    localStorage.setItem("maplexpress_user_data", JSON.stringify(updatedUser))
    setUser(updatedUser)

    if (isSuperAdmin && !window.location.pathname.startsWith("/admin")) {
      window.location.href = "/admin"
    }

    return meData
  }

  // Check for existing session on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        cleanupLegacyTokenStorage()
        await initSessionRefresh()
        const userData = localStorage.getItem("maplexpress_user_data")
        const cachedMe = localStorage.getItem("maplexpress_me")

        if (cachedMe) {
          try {
            setMe(JSON.parse(cachedMe))
          } catch {
            localStorage.removeItem("maplexpress_me")
          }
        }

        if (userData) {
          // Check if token is expired
          const user = JSON.parse(userData)
          const expirationDate = new Date(user.tokenExpiration)

          if (expirationDate > new Date()) {
            setUser(user)
            const meData = await syncMe(user)

            if (meData.status === "ACTIVE" && user.userStatus === "active") {
              fetchUserProfile(user)
            }
          } else {
            // Token is expired, clear it
            clearSession()
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error)

        if (error instanceof MeRequestError && (error.status === 401 || error.status === 403)) {
          clearSession()
          if (window.location.pathname !== "/") {
            window.location.href = "/"
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Update the login function to handle different user statuses:
  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; message: string; userStatus?: string }> => {
    try {
      setIsLoading(true)

      // Call our API route that will forward to your microservice
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.userStatus === "pendingEmailVerification") {
          // Do not store tokens if email not verified
          return {
            success: false,
            message: "",
            userStatus: "pendingEmailVerification",
          }
        }

        // Create user object from response
        const user = {
          userId: data.userId,
          userStatus: data.userStatus,
          userType: data.userType,
          tokenExpiration: data.tokenExpiration,
          email: email, // Store email for verification purposes
        }

        // Save user data
        localStorage.setItem("maplexpress_user_data", JSON.stringify(user))
        setUser(user)

        const meData = await syncMe(user)

        // Fetch profile based on user type
        if (meData.status === "ACTIVE") {
          await fetchUserProfile(user)
        }

        return { success: true, message: "Login successful", userStatus: user.userStatus }
      } else {
        return { success: false, message: data.message || "Login failed" }
      }
    } catch (error) {
      console.error("Login error:", error)

      if (error instanceof MeRequestError && (error.status === 401 || error.status === 403)) {
        clearSession()
        if (window.location.pathname !== "/") {
          window.location.href = "/"
        }
        return { success: false, message: "Session expired. Please sign in again." }
      }

      return { success: false, message: "An error occurred during login" }
    } finally {
      setIsLoading(false)
    }
  }

  // Update the logout function:
  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      clearSession()
    }
  }

  // Add function to resend verification email
  const confirmEmail = async (email: string, code: string) => {
    try {
      const response = await fetch("/api/auth/confirm-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true, message: data.message || "Email confirmed successfully." }
      }

      return { success: false, message: data.message || "Failed to confirm email." }
    } catch (error) {
      console.error("Confirm email error:", error)
      return { success: false, message: "An error occurred while confirming your email." }
    }
  }

  // Add function to resend verification email
  const resendVerificationEmail = async (email: string) => {
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true, message: data.message || "Confirmation code sent successfully." }
      }

      return { success: false, message: data.message || "Failed to send confirmation code." }
    } catch (error) {
      console.error("Resend verification error:", error)
      return { success: false, message: "An error occurred while sending confirmation code." }
    }
  }

  // Add function to create individual profile
  const createIndividualProfile = async (
    profileData: Omit<IndividualProfile, "id" | "status" | "email" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const response = await apiFetch("/api/profile/individual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (response.ok) {
        // Update user status to active
        if (user) {
          const updatedUser = { ...user, userStatus: "active" }
          localStorage.setItem("maplexpress_user_data", JSON.stringify(updatedUser))
          setUser(updatedUser)
        }

        // Save profile data
        const profile = Array.isArray(data) ? data[0] : data
        setIndividualProfile(profile)
        localStorage.setItem("maplexpress_individual_profile", JSON.stringify(profile))

        return { success: true, message: "Profile created successfully", profile }
      } else {
        return { success: false, message: data.message || "Failed to create profile" }
      }
    } catch (error) {
      console.error("Create individual profile error:", error)
      return { success: false, message: "An error occurred while creating profile" }
    }
  }

  // Add function to create organization profile
  const createOrganizationProfile = async (
    profileData: Omit<OrganizationProfile, "id" | "status" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const response = await apiFetch("/api/profile/organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (response.ok) {
        // Update user status to active
        if (user) {
          const updatedUser = { ...user, userStatus: "active" }
          localStorage.setItem("maplexpress_user_data", JSON.stringify(updatedUser))
          setUser(updatedUser)
        }

        // Save profile data
        const profile = Array.isArray(data) ? data[0] : data
        setOrganizationProfile(profile)
        localStorage.setItem("maplexpress_organization_profile", JSON.stringify(profile))

        return { success: true, message: "Organization profile created successfully", profile }
      } else {
        return { success: false, message: data.message || "Failed to create organization profile" }
      }
    } catch (error) {
      console.error("Create organization profile error:", error)
      return { success: false, message: "An error occurred while creating organization profile" }
    }
  }


  const completeOnboarding = async (payload: OnboardingPayload) => {
    try {
      const result = await submitOnboarding(payload)

      if (!result.success || !result.data) {
        if (result.statusCode === 401) {
          clearSession()
          if (window.location.pathname !== "/") {
            window.location.href = "/"
          }
        }

        return { success: false, message: result.message, statusCode: result.statusCode }
      }

      const meData = result.data
      setMe(meData)
      localStorage.setItem("maplexpress_me", JSON.stringify(meData))
      setClientGroupCookie(meData.groups)

      if (user) {
        const updatedUser = { ...user, userStatus: "active" }
        setUser(updatedUser)
        localStorage.setItem("maplexpress_user_data", JSON.stringify(updatedUser))
        await fetchUserProfile(updatedUser)
      }

      return { success: true, message: "Onboarding completed" }
    } catch (error) {
      console.error("Complete onboarding error:", error)
      return { success: false, message: "Unable to complete onboarding right now" }
    }
  }

  // Add function to fetch user profile based on userType
  const fetchUserProfile = async (
    targetUser?: User,
  ) => {
    const currentUser = targetUser || user
    if (!currentUser) return

    try {
      if (currentUser.userType === "individualUser") {
        const response = await apiFetch(
          `/api/profile/individual?email=${encodeURIComponent(currentUser.email)}`,
          {},
        )

        if (response.ok) {
          const data = await response.json()
          const profile = Array.isArray(data) ? data[0] : data
          setIndividualProfile(profile)
          localStorage.setItem(
            "maplexpress_individual_profile",
            JSON.stringify(profile),
          )
        }
      } else if (currentUser.userType === "businessUser") {
        const response = await apiFetch(
          `/api/profile/organization?email=${encodeURIComponent(currentUser.email)}`,
          {},
        )

        if (response.ok) {
          const data = await response.json()
          const profile = Array.isArray(data) ? data[0] : data
          setOrganizationProfile(profile)
          localStorage.setItem(
            "maplexpress_organization_profile",
            JSON.stringify(profile),
          )
        }
      }
    } catch (error) {
      console.error("Fetch profile error:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        me,
        individualProfile,
        organizationProfile,
        login,
        logout,
        createIndividualProfile,
        createOrganizationProfile,
        confirmEmail,
        resendVerificationEmail,
        fetchUserProfile,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

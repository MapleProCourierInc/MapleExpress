"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getMe, MeRequestError, type MeResponse } from "@/lib/me-service"
import { submitOnboarding, type OnboardingPayload } from "@/lib/onboarding-service"
import { apiFetch, AUTH_INVALID_EVENT, cleanupLegacyTokenStorage, initSessionRefresh } from "@/lib/client-api"
import { getUserTypeFromGroups, isAdminAccount, isIndividualAccount } from "@/lib/profile-account-type"

const SESSION_REFRESH_INTERVAL_MS = 45 * 60 * 1000
const SESSION_RECHECK_MIN_INTERVAL_MS = 5 * 60 * 1000
const ONBOARDING_SESSION_SYNC_ATTEMPTS = 3
const ONBOARDING_SESSION_SYNC_RETRY_MS = 300

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
  taxID?: string
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
  registrationNumber?: string
  taxID?: string
  industry?: string
  phone?: string
  email?: string
  website?: string
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
  fetchUserProfile: (user?: User, groups?: string[]) => Promise<void>
  completeOnboarding: (payload: OnboardingPayload) => Promise<{ success: boolean; message: string; statusCode?: number }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function readStoredJson<T>(key: string): T | null {
  const value = localStorage.getItem(key)
  if (!value) return null

  try {
    return JSON.parse(value) as T
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

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

    const group = groups?.find((candidate) => candidate === "client_organization" || candidate === "client_individual") || groups?.[0]

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
    const syncedUser = {
      ...activeUser,
      userId: activeUser.userId || meData.sub,
      userType: getUserTypeFromGroups(meData.groups, activeUser.userType),
    }

    if (meData.status === "ONBOARDING_REQUIRED") {
      localStorage.setItem("maplexpress_user_data", JSON.stringify(syncedUser))
      setUser(syncedUser)

      if (window.location.pathname !== "/onboarding") {
        window.location.replace("/onboarding")
      }
      return meData
    }

    const updatedUser = {
      ...syncedUser,
      userStatus: "active",
    }
    localStorage.setItem("maplexpress_user_data", JSON.stringify(updatedUser))
    setUser(updatedUser)

    if (isSuperAdmin && !window.location.pathname.startsWith("/admin")) {
      window.location.replace("/admin")
    }

    return meData
  }

  // Check for existing session on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        cleanupLegacyTokenStorage()
        const cachedMe = readStoredJson<MeResponse>("maplexpress_me")
        const parsedUser = readStoredJson<NonNullable<User>>("maplexpress_user_data")

        if (cachedMe) {
          setMe(cachedMe)
        }

        if (parsedUser) {
          setUser(parsedUser)
        }

        const seedUser: NonNullable<User> =
          parsedUser || {
            userId: "",
            userStatus: "active",
            userType: "individualUser",
            tokenExpiration: "",
            email: "",
          }

        const meData = await syncMe(seedUser)

        if (
          meData.status === "ACTIVE" &&
          parsedUser?.userStatus === "active" &&
          !isAdminAccount(meData.groups)
        ) {
          fetchUserProfile(parsedUser, meData.groups)
        }
      } catch (error) {
        console.error("Authentication check failed:", error)

        if (error instanceof MeRequestError && (error.status === 401 || error.status === 403)) {
          clearSession()
          if (window.location.pathname !== "/") {
            window.location.replace("/")
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (!user) return

    let disposed = false
    let refreshInFlight: Promise<void> | null = null
    let lastRefreshAt = Date.now()

    const refreshAndSyncSession = (force = false) => {
      if (!force && Date.now() - lastRefreshAt < SESSION_RECHECK_MIN_INTERVAL_MS) {
        return refreshInFlight || Promise.resolve()
      }

      if (!refreshInFlight) {
        lastRefreshAt = Date.now()
        refreshInFlight = (async () => {
          const refreshed = await initSessionRefresh()
          if (!refreshed || disposed) return

          const activeUser = readStoredJson<NonNullable<User>>("maplexpress_user_data") || user
          await syncMe(activeUser)
        })()
          .catch((error) => {
            console.error("Session revalidation failed:", error)
            if (error instanceof MeRequestError && (error.status === 401 || error.status === 403)) {
              clearSession()
              if (window.location.pathname !== "/") {
                window.location.replace("/")
              }
            }
          })
          .finally(() => {
            refreshInFlight = null
          })
      }

      return refreshInFlight
    }

    const interval = window.setInterval(() => {
      void refreshAndSyncSession(true)
    }, SESSION_REFRESH_INTERVAL_MS)

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshAndSyncSession()
      }
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return

      setIsLoading(true)
      void refreshAndSyncSession(true).finally(() => {
        if (!disposed) setIsLoading(false)
      })
    }

    const handleOnline = () => {
      void refreshAndSyncSession(true)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("pageshow", handlePageShow)
    window.addEventListener("online", handleOnline)

    return () => {
      disposed = true
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("pageshow", handlePageShow)
      window.removeEventListener("online", handleOnline)
    }
  }, [user?.userId])

  useEffect(() => {
    if (user) return

    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return

      setIsLoading(true)
      const seedUser: NonNullable<User> = {
        userId: "",
        userStatus: "active",
        userType: "individualUser",
        tokenExpiration: "",
        email: "",
      }

      void syncMe(seedUser)
        .catch((error) => {
          console.error("Restored-page authentication check failed:", error)
          if (error instanceof MeRequestError && (error.status === 401 || error.status === 403)) {
            clearSession()
          }
        })
        .finally(() => {
          setIsLoading(false)
        })
    }

    window.addEventListener("pageshow", handlePageShow)
    return () => {
      window.removeEventListener("pageshow", handlePageShow)
    }
  }, [user])

  useEffect(() => {
    const handleAuthInvalid = () => {
      clearSession()
      if (window.location.pathname !== "/") {
        window.location.replace("/")
      }
    }

    window.addEventListener(AUTH_INVALID_EVENT, handleAuthInvalid)
    return () => {
      window.removeEventListener(AUTH_INVALID_EVENT, handleAuthInvalid)
    }
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

        // Reset profile cache so role/account switches do not render stale client data
        setIndividualProfile(null)
        setOrganizationProfile(null)
        localStorage.removeItem("maplexpress_individual_profile")
        localStorage.removeItem("maplexpress_organization_profile")

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
        if (meData.status === "ACTIVE" && !isAdminAccount(meData.groups)) {
          await fetchUserProfile(user, meData.groups)
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
          window.location.replace("/")
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
      if (window.location.pathname !== "/") {
        window.location.replace("/")
      }
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

      if (!result.success) {
        if (result.statusCode === 401) {
          clearSession()
          if (window.location.pathname !== "/") {
            window.location.replace("/")
          }
        }

        return { success: false, message: result.message, statusCode: result.statusCode }
      }

      setIndividualProfile(null)
      setOrganizationProfile(null)
      localStorage.removeItem("maplexpress_individual_profile")
      localStorage.removeItem("maplexpress_organization_profile")

      const expectedGroup = payload.userType === "ORGANIZATION" ? "client_organization" : "client_individual"
      let meData: MeResponse | null = null

      // Cognito group membership changes are only reflected in newly issued JWTs.
      // Refresh before calling /me so it does not evaluate the pre-onboarding claims.
      for (let attempt = 0; attempt < ONBOARDING_SESSION_SYNC_ATTEMPTS; attempt += 1) {
        const refreshed = await initSessionRefresh()
        if (!refreshed) break

        const refreshedMe = await getMe()
        if (refreshedMe.status === "ACTIVE" && refreshedMe.groups?.includes(expectedGroup)) {
          meData = refreshedMe
          break
        }

        if (attempt < ONBOARDING_SESSION_SYNC_ATTEMPTS - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, ONBOARDING_SESSION_SYNC_RETRY_MS * (attempt + 1)))
        }
      }

      if (!meData) {
        return {
          success: false,
          message: "Your profile was created, but your session could not be updated. Please sign in again.",
        }
      }

      setMe(meData)
      localStorage.setItem("maplexpress_me", JSON.stringify(meData))
      setClientGroupCookie(meData.groups)

      if (user) {
        const updatedUser = {
          ...user,
          userStatus: "active",
          userType: getUserTypeFromGroups(meData.groups, user.userType),
        }
        setUser(updatedUser)
        localStorage.setItem("maplexpress_user_data", JSON.stringify(updatedUser))
        await fetchUserProfile(updatedUser, meData.groups)
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
    groups?: string[],
  ) => {
    const currentUser = targetUser || user
    if (!currentUser) return

    try {
      const activeGroups = groups || me?.groups
      if (isAdminAccount(activeGroups)) {
        setIndividualProfile(null)
        setOrganizationProfile(null)
        localStorage.removeItem("maplexpress_individual_profile")
        localStorage.removeItem("maplexpress_organization_profile")
        return
      }

      if (isIndividualAccount(activeGroups, currentUser.userType)) {
        const response = await apiFetch(
          "/api/profile/individual",
          {},
        )

        if (response.ok) {
          const data = await response.json()
          const profile = Array.isArray(data?.items) ? data.items[0] : Array.isArray(data) ? data[0] : data
          setIndividualProfile(profile)
          setOrganizationProfile(null)
          localStorage.setItem(
            "maplexpress_individual_profile",
            JSON.stringify(profile),
          )
          localStorage.removeItem("maplexpress_organization_profile")
        }
      } else {
        const response = await apiFetch(
          "/api/profile/organization",
          {},
        )

        if (response.ok) {
          const data = await response.json()
          const profile = Array.isArray(data?.items) ? data.items[0] : Array.isArray(data) ? data[0] : data
          setOrganizationProfile(profile)
          setIndividualProfile(null)
          localStorage.setItem(
            "maplexpress_organization_profile",
            JSON.stringify(profile),
          )
          localStorage.removeItem("maplexpress_individual_profile")
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

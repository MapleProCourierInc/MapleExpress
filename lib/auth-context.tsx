"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

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
  individualProfile: IndividualProfile | null
  organizationProfile: OrganizationProfile | null
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message: string; userStatus?: string }>
  logout: () => void
  createIndividualProfile: (
    profileData: Omit<IndividualProfile, "id" | "status" | "email" | "createdAt" | "updatedAt">,
  ) => Promise<{ success: boolean; message: string; profile?: IndividualProfile }>
  createOrganizationProfile: (
    profileData: Omit<OrganizationProfile, "id" | "status" | "createdAt" | "updatedAt">,
  ) => Promise<{ success: boolean; message: string; profile?: OrganizationProfile }>
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message: string }>
  fetchUserProfile: (user?: User) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [individualProfile, setIndividualProfile] = useState<IndividualProfile | null>(null)
  const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile | null>(null)

  // Check for existing session on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have tokens in localStorage
        const accessToken = localStorage.getItem("maplexpress_access_token")
        const userData = localStorage.getItem("maplexpress_user_data")

        if (accessToken && userData) {
          // Check if token is expired
          const user = JSON.parse(userData)
          const expirationDate = new Date(user.tokenExpiration)

          if (expirationDate > new Date()) {
            setUser(user)

            // If user is active, fetch their profile
            if (user.userStatus === "active") {
              fetchUserProfile(user)
            }
          } else {
            // Token is expired, clear it
            localStorage.removeItem("maplexpress_access_token")
            localStorage.removeItem("maplexpress_refresh_token")
            localStorage.removeItem("maplexpress_user_data")
            setUser(null)
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error)
        localStorage.removeItem("maplexpress_access_token")
        localStorage.removeItem("maplexpress_refresh_token")
        localStorage.removeItem("maplexpress_user_data")
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

        // Save tokens and user data to localStorage
        localStorage.setItem("maplexpress_access_token", data.accessToken)
        localStorage.setItem("maplexpress_refresh_token", data.refreshToken)

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

        // Fetch profile based on user type
        await fetchUserProfile(user)

        return { success: true, message: "Login successful", userStatus: user.userStatus }
      } else {
        return { success: false, message: data.message || "Login failed" }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "An error occurred during login" }
    } finally {
      setIsLoading(false)
    }
  }

  // Update the logout function:
  const logout = () => {
    localStorage.removeItem("maplexpress_access_token")
    localStorage.removeItem("maplexpress_refresh_token")
    localStorage.removeItem("maplexpress_user_data")
    localStorage.removeItem("maplexpress_individual_profile")
    localStorage.removeItem("maplexpress_organization_profile")
    setUser(null)
    setIndividualProfile(null)
    setOrganizationProfile(null)
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
        return { success: true, message: "Verification email sent successfully" }
      } else {
        return { success: false, message: data.message || "Failed to send verification email" }
      }
    } catch (error) {
      console.error("Resend verification error:", error)
      return { success: false, message: "An error occurred while sending verification email" }
    }
  }

  // Add function to create individual profile
  const createIndividualProfile = async (
    profileData: Omit<IndividualProfile, "id" | "status" | "email" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const accessToken = localStorage.getItem("maplexpress_access_token")

      if (!accessToken) {
        return { success: false, message: "Not authenticated" }
      }

      const response = await fetch("/api/profile/individual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
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
        setIndividualProfile(profile)
        localStorage.setItem("maplexpress_individual_profile", JSON.stringify(profile))

        return { success: true, message: "Profile created successfully", profile: profile }
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
      const accessToken = localStorage.getItem("maplexpress_access_token")

      if (!accessToken) {
        return { success: false, message: "Not authenticated" }
      }

      const response = await fetch("/api/profile/organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
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
        setOrganizationProfile(profile)
        localStorage.setItem("maplexpress_organization_profile", JSON.stringify(profile))

        return { success: true, message: "Organization profile created successfully", profile: profile }
      } else {
        return { success: false, message: data.message || "Failed to create organization profile" }
      }
    } catch (error) {
      console.error("Create organization profile error:", error)
      return { success: false, message: "An error occurred while creating organization profile" }
    }
  }

  // Add function to fetch user profile based on userType
  const fetchUserProfile = async (
    targetUser?: User,
  ) => {
    const currentUser = targetUser || user
    if (!currentUser) return

    try {
      const accessToken = localStorage.getItem("maplexpress_access_token")

      if (!accessToken) return

      if (currentUser.userType === "individualUser") {
        const response = await fetch(
          `/api/profile/individual?email=${encodeURIComponent(currentUser.email)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
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
        const response = await fetch(
          `/api/profile/organization?email=${encodeURIComponent(currentUser.email)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
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
        individualProfile,
        organizationProfile,
        login,
        logout,
        createIndividualProfile,
        createOrganizationProfile,
        resendVerificationEmail,
        fetchUserProfile,
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


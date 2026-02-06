"use client"

import { createContext, ReactNode, useContext, useEffect, useState } from "react"

export type AuthUser = {
  userId: string
  email: string
  groups: string[]
  group?: string
  userStatus: "active" | "pendingEmailVerification" | "pendingProfileCompletion"
  userType: "individualUser" | "businessUser"
}

type AuthContextType = {
  user: AuthUser | null
  isLoading: boolean
  individualProfile: any
  organizationProfile: any
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  createIndividualProfile: (...args: any[]) => Promise<{ success: boolean; message: string }>
  createOrganizationProfile: (...args: any[]) => Promise<{ success: boolean; message: string }>
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message: string }>
  fetchUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = async () => {
    setIsLoading(true)
    try {
      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" })
      const session = await sessionResponse.json()

      if (!session.authenticated) {
        setUser(null)
        return
      }

      const meResponse = await fetch("/api/auth/me", { cache: "no-store" })
      if (!meResponse.ok) {
        setUser(null)
        return
      }

      const me = await meResponse.json()
      setUser({
        userId: me.sub,
        email: me.email,
        groups: me.groups ?? [],
        group: me.groups?.[0],
        userStatus: "active",
        userType: "individualUser",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshSession()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, message: data.message ?? "Login failed" }
    }

    await refreshSession()
    return { success: true, message: "Logged in" }
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        individualProfile: null,
        organizationProfile: null,
        login,
        logout,
        createIndividualProfile: async () => ({ success: false, message: "Profile flow not included in Cognito auth MVP" }),
        createOrganizationProfile: async () => ({ success: false, message: "Profile flow not included in Cognito auth MVP" }),
        resendVerificationEmail: async (email: string) => {
          const response = await fetch("/api/auth/resend-signup-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          })
          return response.ok
            ? { success: true, message: "Verification code resent" }
            : { success: false, message: "Unable to resend code" }
        },
        fetchUserProfile: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

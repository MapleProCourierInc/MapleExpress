"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ShipNowForm } from "@/components/ship-now/ship-now-form"
import { LoginPrompt } from "@/components/ship-now/login-prompt"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"

export default function ShipNowPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // If user is logged in but not active, redirect to home
  useEffect(() => {
    if (!isLoading && user && user.userStatus !== "active") {
      router.push("/")
    }
  }, [user, isLoading, router])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {isLoading ? (
          <div className="container py-20 flex items-center justify-center">
            <div className="w-full max-w-3xl p-8 rounded-lg bg-background shadow-md">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <p className="text-lg font-medium">Loading...</p>
              </div>
            </div>
          </div>
        ) : !user ? (
          <LoginPrompt />
        ) : (
          <ShipNowForm />
        )}
      </main>
      <Footer />
    </div>
  )
}


"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"
import { OnboardingFlow } from "@/components/onboarding-flow"
import { useAuth } from "@/lib/auth-context"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, me, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push("/")
      return
    }

    if (me?.status === "ACTIVE") {
      router.push("/dashboard?section=shipments")
    }
  }, [user, me, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-background to-primary/5">
        <OnboardingFlow />
      </main>
      <Footer />
    </div>
  )
}

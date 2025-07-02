"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { AUTH_MICROSERVICE_URL } from "@/lib/config"

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
  const router = useRouter()

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(
          `${AUTH_MICROSERVICE_URL}/verify-email?token=${params.token}`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: "",
          }
        )

        if (res.ok) {
          toast({
            title: "Email verified",
            description: "Your email has been confirmed. You can now log in.",
          })
        } else {
          toast({
            title: "Verification failed",
            description: "We couldn't verify your email. Please try again.",
          })
        }
      } catch (error) {
        console.error("Email verification error:", error)
        toast({
          title: "Verification error",
          description: "An unexpected error occurred while verifying your email.",
        })
      } finally {
        setTimeout(() => router.push("/"), 3000)
      }
    }

    verify()
  }, [params.token, router])

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-muted-foreground">Verifying your email...</p>
    </div>
  )
}

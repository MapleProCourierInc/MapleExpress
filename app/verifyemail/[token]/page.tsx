"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AUTH_MICROSERVICE_URL } from "@/lib/config"

type VerificationState = "loading" | "success" | "error"

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [state, setState] = useState<VerificationState>("loading")
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${AUTH_MICROSERVICE_URL}/verify-email?token=${params.token}`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: "",
        })

        if (res.ok) {
          setState("success")
        } else {
          setState("error")
        }
      } catch (error) {
        console.error("Email verification error:", error)
        setState("error")
      }
    }

    verify()
  }, [params.token])

  useEffect(() => {
    if (state === "success") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            router.push("/")
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [state, router])

  const handleReturnHome = () => {
    router.push("/")
  }

  const handleResendVerification = () => {
    // You can implement resend logic here
  }

  return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
            <CardDescription>
              {state === "loading" && "We're verifying your email address..."}
              {state === "success" && "Your email has been successfully verified!"}
              {state === "error" && "We couldn't verify your email address"}
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            {state === "loading" && (
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                  <p className="text-sm text-muted-foreground">Please wait while we verify your email...</p>
                </div>
            )}

            {state === "success" && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center animate-pulse">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-green-700 dark:text-green-300 font-medium">Verification successful!</p>
                    <p className="text-sm text-muted-foreground">You can now access all features of your account.</p>
                    <p className="text-xs text-muted-foreground">Redirecting to home page in {countdown} seconds...</p>
                  </div>
                  <Button onClick={handleReturnHome} className="w-full">
                    Continue to Dashboard
                  </Button>
                </div>
            )}

            {state === "error" && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-red-700 dark:text-red-300 font-medium">Verification failed</p>
                    <p className="text-sm text-muted-foreground">The verification link may have expired or is invalid.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button variant="outline" onClick={handleResendVerification} className="flex-1 bg-transparent">
                      Resend Email
                    </Button>
                    <Button onClick={handleReturnHome} className="flex-1">
                      Return Home
                    </Button>
                  </div>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
  )
}

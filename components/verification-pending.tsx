"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, RefreshCw, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"

type VerificationPendingProps = {
  email: string
  userId: string
  onClose?: () => void
}

export function VerificationPending({ email, userId, onClose }: VerificationPendingProps) {
  const { resendVerificationEmail } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResendEmail = async () => {
    setIsResending(true)
    setError(null)
    setResendSuccess(false)

    try {
      const result = await resendVerificationEmail(email, userId)

      if (result.success) {
        setResendSuccess(true)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Mail className="h-10 w-10 text-primary" />
          </div>
        </div>
        <CardTitle className="text-center">Verify Your Email</CardTitle>
        <CardDescription className="text-center">
          We've sent a verification email to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground">
          Please check your inbox and click the verification link to complete your registration.
        </p>

        {resendSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              Verification email has been resent successfully!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Didn't receive the email? Check your spam folder or click below to resend.
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button variant="outline" className="w-full" onClick={handleResendEmail} disabled={isResending}>
          {isResending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Resending...
            </>
          ) : (
            "Resend Verification Email"
          )}
        </Button>
        {onClose && (
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Back to Home
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}


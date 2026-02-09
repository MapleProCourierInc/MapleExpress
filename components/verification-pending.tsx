"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, RefreshCw, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type VerificationPendingProps = {
  email: string
  onClose?: () => void
  onConfirmed?: () => void
}

export function VerificationPending({ email, onClose, onConfirmed }: VerificationPendingProps) {
  const { confirmEmail, resendVerificationEmail } = useAuth()
  const [confirmationCode, setConfirmationCode] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmSuccess, setConfirmSuccess] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setConfirmationCode("")
    setConfirmSuccess(false)
    setResendSuccess(false)
    setError(null)
  }, [email])

  const handleConfirmEmail = async () => {
    if (!confirmationCode.trim()) {
      setError("Please enter the confirmation code from your email.")
      return
    }

    setIsConfirming(true)
    setError(null)

    try {
      const result = await confirmEmail(email, confirmationCode.trim())

      if (result.success) {
        setConfirmSuccess(true)
        setTimeout(() => {
          onConfirmed?.()
        }, 1200)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsConfirming(false)
    }
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    setError(null)
    setResendSuccess(false)

    try {
      const result = await resendVerificationEmail(email)

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
          We've sent a confirmation code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground">
          Enter the 6-digit code from your email to complete your registration.
        </p>

        <div className="space-y-2">
          <Label htmlFor="confirmationCode">Confirmation code</Label>
          <Input
            id="confirmationCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter confirmation code"
            value={confirmationCode}
            onChange={(event) => setConfirmationCode(event.target.value)}
            disabled={isConfirming || confirmSuccess}
          />
        </div>

        {confirmSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              Your email has been confirmed. Redirecting you to login...
            </AlertDescription>
          </Alert>
        )}

        {resendSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              Confirmation code sent again. Please check your email.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Didn't receive the code? Check your spam folder or click below to resend.
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button className="w-full" onClick={handleConfirmEmail} disabled={isConfirming || confirmSuccess}>
          {isConfirming ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Confirming...
            </>
          ) : (
            "Confirm Email"
          )}
        </Button>
        <Button variant="outline" className="w-full" onClick={handleResendEmail} disabled={isResending}>
          {isResending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Resending...
            </>
          ) : (
            "Resend Code"
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

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type SignupModalProps = {
  isOpen: boolean
  onClose: () => void
  onSignupSuccess: (email: string, userId: string) => void
}

export function SignupModal({ isOpen, onClose, onSignupSuccess }: SignupModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [accountType, setAccountType] = useState("Individual")
  const [tosAgreement, setTosAgreement] = useState(false)
  const [communicationConsent, setCommunicationConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const validatePassword = (password: string): boolean => {
    // Password must be at least 8 characters, contain uppercase, lowercase, number, and special character
    const hasMinLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      setPasswordError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      )
      return false
    }

    setPasswordError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return
    }

    // Validate TOS agreement
    if (!tosAgreement) {
      setError("You must agree to the Terms of Service")
      return
    }

    setIsLoading(true)

    try {
      // Map account type to API expected format
      const userType = accountType === "Individual" ? "individualUser" : "businessUser"

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          type: userType,
          password,
          tosAgreement,
          communicationConsent,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Call the success callback with email and userId
        onSignupSuccess(email, data.userId)

        // Reset form
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setAccountType("Individual")
        setTosAgreement(false)
        setCommunicationConsent(false)
      } else {
        setError(data.message || "Signup failed. Please try again.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create an Account</DialogTitle>
          <DialogDescription>Join MapleXpress to track shipments, manage deliveries, and more.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Organization">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (e.target.value) validatePassword(e.target.value)
                }}
                required
              />
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="tosAgreement"
                checked={tosAgreement}
                onCheckedChange={(checked) => setTosAgreement(checked === true)}
              />
              <Label htmlFor="tosAgreement" className="text-sm">
                I agree to the{" "}
                <a href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="communicationConsent"
                checked={communicationConsent}
                onCheckedChange={(checked) => setCommunicationConsent(checked === true)}
              />
              <Label htmlFor="communicationConsent" className="text-sm">
                I agree to receive marketing communications from MapleXpress
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2, Truck, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"

type SignupModalProps = {
  isOpen: boolean
  onClose: () => void
  onSignupSuccess: (email: string, userId: string) => void
  onOpenLogin?: () => void
}

export function SignupModal({ isOpen, onClose, onSignupSuccess, onOpenLogin }: SignupModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [accountType, setAccountType] = useState("Individual")
  const [tosAgreement, setTosAgreement] = useState(false)
  const [communicationConsent, setCommunicationConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
        <DialogContent className="p-0 overflow-hidden border rounded-lg max-w-md">
          <div className="relative bg-gradient-to-r from-primary/80 to-primary text-white p-6 text-center">
            <button onClick={onClose} className="absolute right-4 top-4 text-white/80 hover:text-white">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>

            <div className="mx-auto bg-white rounded-full p-3 w-14 h-14 flex items-center justify-center mb-3">
              <Truck className="h-7 w-7 text-primary" />
            </div>

            <h2 className="text-xl font-bold">Create Account</h2>
            <p className="text-white/90 mt-1 text-sm">Join MapleXpress to track shipments, manage deliveries, and more</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {error && (
                  <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                  >
                    <Alert variant="destructive" className="mb-6 bg-red-50 border border-red-200 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="block mb-1.5 font-medium">
                    Email Address
                  </Label>
                  <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="accountType" className="block mb-1.5 font-medium">
                    Account Type
                  </Label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger className="w-full border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Organization">Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="password" className="block mb-1.5 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (e.target.value) validatePassword(e.target.value)
                        }}
                        required
                        className="w-full border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {passwordError && <p className="mt-1.5 text-sm text-red-600">{passwordError}</p>}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="block mb-1.5 font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                      id="tosAgreement"
                      checked={tosAgreement}
                      onCheckedChange={(checked) => setTosAgreement(checked === true)}
                      className="mt-0.5 border-gray-300"
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

                <div className="flex items-start space-x-2">
                  <Checkbox
                      id="communicationConsent"
                      checked={communicationConsent}
                      onCheckedChange={(checked) => setCommunicationConsent(checked === true)}
                      className="mt-0.5 border-gray-300"
                  />
                  <Label htmlFor="communicationConsent" className="text-sm">
                    I agree to receive marketing communications from MapleXpress
                  </Label>
                </div>
              </div>

              <div className="mt-6">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-md"
                >
                  {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                  ) : (
                      "Sign Up"
                  )}
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Cancel
                </Button>
                <Button
                    type="button"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
                    onClick={(e) => {
                      e.preventDefault()
                      onClose()
                      onOpenLogin && onOpenLogin()
                    }}
                >
                  Sign In Instead
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
  )
}


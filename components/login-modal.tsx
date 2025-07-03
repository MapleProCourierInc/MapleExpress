"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { AlertCircle, Loader2, Truck, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { VerificationPending } from "@/components/verification-pending"

type LoginModalProps = {
  isOpen: boolean
  onClose: () => void
  onOpenSignup?: () => void
}

export function LoginModal({ isOpen, onClose, onOpenSignup }: LoginModalProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showVerification, setShowVerification] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await login(email, password)

      if (result.success) {
        onClose()
        // Reset form
        setEmail("")
        setPassword("")
      } else if (result.userStatus === "pendingEmailVerification") {
        setError(null)
        setShowVerification(true)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setShowVerification(false)
            onClose()
          }
        }}
      >
        <DialogContent
          className="p-0 overflow-hidden border rounded-lg max-w-md"
          {...(showVerification && {
            onEscapeKeyDown: (e: Event) => e.preventDefault(),
            onPointerDownOutside: (e: Event) => e.preventDefault(),
          })}
        >
          {showVerification ? (
            <VerificationPending
              email={email}
              onClose={() => {
                setShowVerification(false)
                onClose()
              }}
            />
          ) : (
            <>
              <div className="relative bg-primary text-white p-8 text-center">
                <button onClick={onClose} className="absolute right-4 top-4 text-white/80 hover:text-white">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </button>

                <div className="mx-auto bg-white rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                  <Truck className="h-8 w-8 text-primary" />
                </div>

                <h2 className="text-2xl font-bold">Welcome Back</h2>
                <p className="text-white/80 mt-2">Sign in to your MapleXpress account to continue</p>
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

              <div className="space-y-6">
                <div>
                  <Label htmlFor="email" className="block mb-2 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="w-full px-4 py-3 h-12 border border-gray-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label htmlFor="password" className="font-medium">
                      Password
                    </Label>
                    <button
                        type="button"
                        className="text-primary hover:underline text-sm"
                        onClick={(e) => {
                          e.preventDefault()
                          // This would typically open a password reset flow
                          alert("Password reset functionality would go here")
                        }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 h-12 border border-gray-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 h-12 rounded-md"
                >
                  {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                  ) : (
                      "Sign In"
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
                    className="bg-orange-400 hover:bg-orange-500 text-white rounded-md"
                    onClick={(e) => {
                      e.preventDefault()
                      onClose()
                      onOpenSignup && onOpenSignup()
                    }}
                >
                  Create Account
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              By signing in, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </div>
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>
  )
}


"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"
import { Package } from "lucide-react"

export function LoginPrompt() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState("")
  const [verificationUserId, setVerificationUserId] = useState("")

  const handleSignupSuccess = (email: string, userId: string) => {
    setIsSignupModalOpen(false)
    setVerificationEmail(email)
    setVerificationUserId(userId)
  }

  return (
    <div className="container py-20 flex items-center justify-center">
      <Card className="w-full max-w-3xl shadow-lg border-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/30">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign In Required</CardTitle>
          <CardDescription className="text-lg mt-2">Please sign in to create a shipping order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <p className="text-center text-muted-foreground mb-4">
              You need to be signed in to access our shipping services. This allows us to save your addresses and
              shipping preferences for a faster checkout experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button size="lg" onClick={() => setIsLoginModalOpen(true)} className="w-full sm:w-auto">
                Sign In
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsSignupModalOpen(true)}
                className="w-full sm:w-auto"
              >
                Create Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSignupSuccess={handleSignupSuccess}
      />
    </div>
  )
}


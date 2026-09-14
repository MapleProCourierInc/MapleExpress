"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"
import { VerificationPending } from "@/components/verification-pending"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { UserProfile } from "@/components/user-profile"
import { useState } from "react"

export function Header() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState("")
  const [verificationPassword, setVerificationPassword] = useState("")

  const closeVerification = () => {
    setVerificationEmail("")
    setVerificationPassword("")
  }

  return (
    <header className="border-b sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <img
              src="/3.svg"
              alt="MapleXpress Logo"
              className="h-[175px] w-auto"
            />
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          <Link href="/ship-now" className="text-sm font-medium hover:text-primary">
            Ship Now
          </Link>
          <Link href="/#services" className="text-sm font-medium hover:text-primary">
            Services
          </Link>
          <Link
            href="/rates"
            className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            Rates
          </Link>
          <Link href="/#about" className="text-sm font-medium hover:text-primary">
            About Us
          </Link>
          <Link href="/#contact" className="text-sm font-medium hover:text-primary">
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/track" className="text-sm font-medium hover:text-primary hidden md:block">
            Track Package
          </Link>
          {isLoading ? (
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md"></div>
          ) : user ? (
            <UserProfile />
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsLoginModalOpen(true)}>
                Login
              </Button>
              <Button
                className="bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary text-secondary-foreground"
                onClick={() => setIsSignupModalOpen(true)}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenSignup={() => {
          setIsLoginModalOpen(false)
          setIsSignupModalOpen(true)
        }}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSignupSuccess={(email, password) => {
          setIsSignupModalOpen(false)
          setVerificationEmail(email)
          setVerificationPassword(password)
        }}
        onOpenLogin={() => {
          setIsSignupModalOpen(false)
          setIsLoginModalOpen(true)
        }}
      />

      <Dialog open={Boolean(verificationEmail)} onOpenChange={(open) => !open && closeVerification()}>
        <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-md">
          {verificationEmail && (
            <VerificationPending
              email={verificationEmail}
              password={verificationPassword || undefined}
              onClose={closeVerification}
              onConfirmed={(authenticated) => {
                closeVerification()
                if (authenticated) {
                  router.replace("/onboarding")
                } else {
                  setIsLoginModalOpen(true)
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </header>
  )
}


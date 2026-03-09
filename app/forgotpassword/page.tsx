"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Step = "request" | "confirm" | "success"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<Step>("request")
  const { toast } = useToast()

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password)
    return hasMinLength && hasUppercase && hasLowercase && hasSpecialChar
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (step === "request") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        })

        const data = await res.json()

        if (res.ok) {
          setStep("confirm")
          toast({
            description: "Reset code sent. Please check your email.",
          })
        } else {
          toast({
            description: data?.message || "Unable to send reset code. Please try again.",
            variant: "destructive",
          })
        }
      } else if (step === "confirm") {
        if (newPassword !== confirmPassword || !validatePassword(newPassword)) {
          toast({
            description:
              "Password must be at least 8 characters and include uppercase, lowercase and special character. Ensure both fields match.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }

        const res = await fetch("/api/auth/confirm-forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code, password: newPassword }),
        })

        const data = await res.json()

        if (res.ok) {
          setStep("success")
          setTimeout(() => router.push("/"), 2000)
        } else {
          toast({
            description: data?.message || "Unable to reset password. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (err) {
      toast({
        description:
          "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          {step === "success" ? (
            <>
              <CardHeader className="text-center space-y-2">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Password Reset Successful</CardTitle>
                <CardDescription>
                  Your password has been updated. You can now sign in with your new password.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full mt-4" href="/" asChild>
                  <a href="/">Return to Login</a>
                </Button>
              </CardContent>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              {step === "request" ? (
                <>
                  <CardHeader className="text-center space-y-2">
                    <CardTitle>Forgot Password</CardTitle>
                    <CardDescription>Enter your email to receive a reset code.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? "Sending..." : "Send Reset Code"}
                    </Button>
                  </CardContent>
                </>
              ) : (
                <>
                  <CardHeader className="text-center space-y-2">
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>
                      Enter the code sent to <strong>{email}</strong> and choose a new password.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Reset Code</Label>
                      <Input
                        id="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNew(!showNew)}
                        >
                          {showNew ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showNew ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirm(!showConfirm)}
                        >
                          {showConfirm ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showConfirm ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? "Resetting..." : "Reset Password"}
                    </Button>
                  </CardContent>
                </>
              )}
            </form>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  )
}

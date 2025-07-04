"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ResetPasswordPageProps {
  params: { token: string }
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password)
    return hasMinLength && hasUppercase && hasLowercase && hasSpecialChar
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword || !validatePassword(newPassword)) {
      toast({
        description:
          "Password must be at least 8 characters and include uppercase, lowercase and special character. Ensure both fields match.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: params.token, newPassword }),
      })

      if (res.ok) {
        toast({ description: "Password changed successfully." })
        setTimeout(() => router.push("/"), 2000)
      } else {
        toast({
          description:
            "Uh oh, something went wrong. Please try again. If this happens again contact our support team.",
          variant: "destructive",
        })
        setTimeout(() => router.push("/forgotpassword"), 2000)
      }
    } catch (err) {
      toast({
        description:
          "Uh oh, something went wrong. Please try again. If this happens again contact our support team.",
        variant: "destructive",
      })
      setTimeout(() => router.push("/forgotpassword"), 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardHeader className="text-center space-y-2">
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                Enter your new password below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

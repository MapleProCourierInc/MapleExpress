"use client"

import { useState } from "react"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setSuccess(true)
      } else {
        toast({
          description:
            "We couldn't find the email entered in our system. Please check and try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        description:
          "We couldn't find the email entered in our system. Please check and try again.",
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
          {success ? (
            <>
              <CardHeader className="text-center space-y-2">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Password Reset Email Sent</CardTitle>
                <CardDescription>
                  A password reset link has been sent to <strong>{email}</strong>. Check your inbox to reset your password.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full mt-4" href="/" asChild>
                  <a href="/">Return Home</a>
                </Button>
              </CardContent>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader className="text-center space-y-2">
                <CardTitle>Forgot Password</CardTitle>
                <CardDescription>Enter your email to receive a reset link.</CardDescription>
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
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
              </CardContent>
            </form>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  )
}

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Package } from "lucide-react"

export function LoginPrompt() {
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
              You need to be signed in to access shipping services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/auth/login"><Button size="lg" className="w-full sm:w-auto">Sign In</Button></Link>
              <Link href="/auth/signup"><Button size="lg" variant="outline" className="w-full sm:w-auto">Create Account</Button></Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

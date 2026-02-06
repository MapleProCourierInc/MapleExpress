"use client"

import Link from "next/link"
import { Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export function Header() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <header className="border-b sticky top-0 z-50 w-full bg-background/95 backdrop-blur shadow-sm">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">MapleXpress</span>
        </Link>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md"></div>
          ) : user ? (
            <>
              <span className="text-sm text-muted-foreground hidden md:inline">{user.email} ({user.group ?? "no-group"})</span>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Link href="/auth/login"><Button variant="outline">Login</Button></Link>
              <Link href="/auth/signup"><Button>Sign Up</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

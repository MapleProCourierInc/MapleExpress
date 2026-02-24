"use client"

import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function getInitials(name?: string | null) {
  const trimmed = name?.trim()
  if (!trimmed) return "AD"

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  const first = parts[0][0] || ""
  const last = parts[parts.length - 1][0] || ""
  return `${first}${last}`.toUpperCase()
}

export function AdminUserMenu({ displayName }: { displayName?: string | null }) {
  const { logout } = useAuth()
  const router = useRouter()

  const name = displayName || "Admin"

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium leading-none">{name}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import Link from "next/link"
import { Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AdminUserMenu } from "@/components/admin/admin-user-menu"

export function AdminHeader({ displayName }: { displayName?: string | null }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">MapleXpress Admin</span>
        </Link>

        <div className="flex items-center gap-3">
          <Badge variant="secondary">Super Admin</Badge>
          <AdminUserMenu displayName={displayName} />
        </div>
      </div>
    </header>
  )
}

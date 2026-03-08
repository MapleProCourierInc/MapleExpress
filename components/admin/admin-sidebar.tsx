"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Truck, Route, Building2, Settings, BadgeDollarSign, Users } from "lucide-react"

const navItems = [
  { href: "/admin/drivers", label: "Drivers", icon: Truck, disabled: false },
  { href: "/admin/customers", label: "Users", icon: Users, disabled: false },
  { href: "/admin/pricing", label: "Pricing", icon: BadgeDollarSign, disabled: false },
  { href: "#", label: "Fleet", icon: Route, disabled: true },
  { href: "#", label: "Stations", icon: Building2, disabled: true },
  { href: "#", label: "Settings", icon: Settings, disabled: true },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 rounded-lg border bg-background p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Navigation</h2>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = !item.disabled && pathname === item.href

          if (item.disabled) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground/70"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                <span className="ml-auto text-xs">Coming soon</span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

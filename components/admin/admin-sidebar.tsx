"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { AdminUserMenu } from "@/components/admin/admin-user-menu"
import {
  BadgeDollarSign,
  Building2,
  ClipboardList,
  FileText,
  LifeBuoy,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  Settings,
  Truck,
  Users,
} from "lucide-react"

const navItems = [
  { href: "/admin/drivers", label: "Drivers", icon: Truck, disabled: false },
  { href: "/admin/order-fulfillments", label: "Fulfilments", icon: ClipboardList, disabled: false },
  { href: "/admin/customers", label: "Users", icon: Users, disabled: false },
  { href: "/admin/pricing", label: "Pricing", icon: BadgeDollarSign, disabled: false },
  { href: "/admin/quotes", label: "Quotes", icon: FileText, disabled: false },
  { href: "/admin/service-zones", label: "Service Zones", icon: Map, disabled: false },
  { href: "/admin/support", label: "Support", icon: LifeBuoy, disabled: false },
  { href: "#", label: "Fleet", icon: Route, disabled: true },
  { href: "#", label: "Stations", icon: Building2, disabled: true },
  { href: "#", label: "Settings", icon: Settings, disabled: true },
]

export function AdminSidebar({ displayName }: { displayName?: string | null }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "admin-sidebar flex h-screen shrink-0 flex-col border-r p-3 transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className={cn("flex h-14 items-center gap-2 border-b pb-3", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed ? (
          <Link href="/admin" className="flex min-w-0 items-center gap-2">
            <img src="/leaf.svg" alt="" className="h-10 w-10 shrink-0" />
            <span className="truncate text-lg font-semibold">MapleXpress Admin</span>
          </Link>
        ) : null}
        <button
          type="button"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <div className={cn("py-4", collapsed ? "text-center" : "")}>
        {!collapsed ? (
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Navigation</h2>
            <Badge variant="secondary" className="shrink-0">Super Admin</Badge>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = !item.disabled && (pathname === item.href || pathname.startsWith(`${item.href}/`))

          if (item.disabled) {
            return (
              <div
                key={item.label}
                className={cn(
                  "flex items-center rounded-md py-2 text-sm text-muted-foreground/70",
                  collapsed ? "justify-center px-0" : "gap-2 px-3",
                )}
                title={collapsed ? `${item.label} - Coming soon` : undefined}
              >
                <Icon className="h-4 w-4" />
                {!collapsed ? (
                  <>
                    <span>{item.label}</span>
                    <span className="ml-auto text-xs">Coming soon</span>
                  </>
                ) : null}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-md py-2 text-sm transition-colors",
                collapsed ? "justify-center px-0" : "gap-2 px-3",
                active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          )
        })}
      </nav>

      <div className={cn("border-t pt-3", collapsed ? "flex justify-center" : "")}>
        {!collapsed ? (
          <div className="mb-2 px-1">
            <p className="truncate text-sm font-medium">{displayName || "Admin"}</p>
            <p className="text-xs text-muted-foreground">Admin console</p>
          </div>
        ) : null}
        <AdminUserMenu displayName={displayName} />
      </div>
    </aside>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BadgeDollarSign,
  Building2,
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
  { href: "/admin/customers", label: "Users", icon: Users, disabled: false },
  { href: "/admin/pricing", label: "Pricing", icon: BadgeDollarSign, disabled: false },
  { href: "/admin/service-zones", label: "Service Zones", icon: Map, disabled: false },
  { href: "#", label: "Fleet", icon: Route, disabled: true },
  { href: "#", label: "Stations", icon: Building2, disabled: true },
  { href: "#", label: "Settings", icon: Settings, disabled: true },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "shrink-0 rounded-lg border bg-background p-3 transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className={cn("mb-4 flex items-center gap-2", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed ? (
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Navigation</h2>
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
      <nav className="space-y-1">
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
    </aside>
  )
}

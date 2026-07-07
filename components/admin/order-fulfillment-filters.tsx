"use client"

import { useMemo, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ADMIN_ATTENTION_FULFILLMENT_STATUSES,
  FULFILLMENT_STATUS_OPTIONS,
  type FulfillmentStatus,
  type SortDirection,
} from "@/types/admin-order-fulfillments"

type OrderFulfillmentFiltersProps = {
  initialFilters: {
    trackingNumber: string
    shippingOrderId: string
    status: string
    assignedDriverUserId: string
    assignedDriverName: string
    size: number
    sortDir: SortDirection
  }
}

function splitStatuses(value: string) {
  if (!value || value === "ALL") return []
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean) as FulfillmentStatus[]
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function OrderFulfillmentFilters({ initialFilters }: OrderFulfillmentFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [trackingNumber, setTrackingNumber] = useState(initialFilters.trackingNumber)
  const [shippingOrderId, setShippingOrderId] = useState(initialFilters.shippingOrderId)
  const [assignedDriverName, setAssignedDriverName] = useState(initialFilters.assignedDriverName)
  const [statusMode, setStatusMode] = useState<"custom" | "all">(initialFilters.status === "ALL" ? "all" : "custom")
  const [selectedStatuses, setSelectedStatuses] = useState<FulfillmentStatus[]>(() => splitStatuses(initialFilters.status))
  const [size, setSize] = useState(String(initialFilters.size || 20))
  const [sortDir, setSortDir] = useState<SortDirection>(initialFilters.sortDir || "asc")

  const statusLabel = useMemo(() => {
    if (statusMode === "all") return "All statuses"
    if (selectedStatuses.length === ADMIN_ATTENTION_FULFILLMENT_STATUSES.length) {
      const selected = new Set(selectedStatuses)
      const isAttention = ADMIN_ATTENTION_FULFILLMENT_STATUSES.every((status) => selected.has(status))
      if (isAttention) return "Admin attention"
    }
    if (selectedStatuses.length === 0) return "No statuses"
    if (selectedStatuses.length === 1) return humanize(selectedStatuses[0])
    return `${selectedStatuses.length} statuses`
  }, [selectedStatuses, statusMode])

  const toggleStatus = (status: FulfillmentStatus, checked: boolean) => {
    setStatusMode("custom")
    setSelectedStatuses((current) => {
      if (checked) return Array.from(new Set([...current, status]))
      return current.filter((item) => item !== status)
    })
  }

  const apply = () => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", "0")
    next.set("size", size)
    next.set("sortBy", "createdAt")
    next.set("sortDir", sortDir)

    const pairs: Record<string, string> = {
      trackingNumber: trackingNumber.trim(),
      shippingOrderId: shippingOrderId.trim(),
      assignedDriverName: assignedDriverName.trim(),
    }

    for (const [key, value] of Object.entries(pairs)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }

    if (statusMode === "all") {
      next.set("status", "ALL")
    } else if (selectedStatuses.length) {
      next.set("status", selectedStatuses.join(","))
    } else {
      next.set("status", "ALL")
    }

    router.push(`${pathname}?${next.toString()}`)
  }

  const clear = () => {
    setTrackingNumber("")
    setShippingOrderId("")
    setAssignedDriverName("")
    setStatusMode("custom")
    setSelectedStatuses(ADMIN_ATTENTION_FULFILLMENT_STATUSES)
    setSize(String(initialFilters.size || 20))
    setSortDir("asc")
    router.push(`${pathname}?page=0&size=${initialFilters.size || 20}`)
  }

  return (
    <div className="rounded-md border bg-card p-3 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(180px,0.9fr)_minmax(220px,1.1fr)_190px_minmax(180px,0.9fr)_auto] xl:items-end">
        <div className="min-w-0 space-y-1">
          <Label htmlFor="filter-tracking" className="text-xs text-muted-foreground">
            Tracking number
          </Label>
          <Input
            id="filter-tracking"
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="MPLX123456789"
            className="h-9"
          />
        </div>

        <div className="min-w-0 space-y-1">
          <Label htmlFor="filter-shipping-order" className="text-xs text-muted-foreground">
            Shipping order ID
          </Label>
          <Input
            id="filter-shipping-order"
            value={shippingOrderId}
            onChange={(event) => setShippingOrderId(event.target.value)}
            placeholder="shipping-order-123"
            className="h-9"
          />
        </div>

        <div className="min-w-0 space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="h-9 w-full justify-between">
                {statusLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[440px] w-[280px] overflow-auto">
              <DropdownMenuLabel>Status preset</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={statusMode === "custom" && statusLabel === "Admin attention"}
                onCheckedChange={() => {
                  setStatusMode("custom")
                  setSelectedStatuses(ADMIN_ATTENTION_FULFILLMENT_STATUSES)
                }}
              >
                Admin attention
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusMode === "all"}
                onCheckedChange={() => {
                  setStatusMode("all")
                  setSelectedStatuses([])
                }}
              >
                All statuses
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Custom statuses</DropdownMenuLabel>
              {FULFILLMENT_STATUS_OPTIONS.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusMode === "custom" && selectedStatuses.includes(status)}
                  onCheckedChange={(checked) => toggleStatus(status, Boolean(checked))}
                >
                  {humanize(status)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="min-w-0 space-y-1">
          <Label htmlFor="filter-driver-name" className="text-xs text-muted-foreground">
            Driver name
          </Label>
          <Input
            id="filter-driver-name"
            value={assignedDriverName}
            onChange={(event) => setAssignedDriverName(event.target.value)}
            placeholder="Jane"
            className="h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-1 xl:flex-nowrap xl:justify-end">
          <Button type="button" size="sm" onClick={apply}>
            Apply
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={clear}>
            Reset
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                More
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[320px] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Page size</Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Created sort</Label>
                  <Select value={sortDir} onValueChange={(value) => setSortDir(value as SortDirection)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Oldest first</SelectItem>
                      <SelectItem value="desc">Newest first</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button type="button" size="sm" variant="outline" onClick={clear}>
                  Reset
                </Button>
                <Button type="button" size="sm" onClick={apply}>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}

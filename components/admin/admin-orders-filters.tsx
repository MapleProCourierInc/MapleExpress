"use client"

import { useMemo, useState, type FormEvent } from "react"
import { Filter, RotateCcw, Search, SlidersHorizontal } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
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
  ADMIN_ORDER_CLIENT_TYPE_OPTIONS,
  ADMIN_ORDER_PAYMENT_STATUS_OPTIONS,
  ADMIN_ORDER_STATUS_OPTIONS,
  type AdminOrderSortBy,
  type AdminOrderSortDirection,
  type AdminOrdersFilters,
} from "@/types/admin-orders"

type Props = {
  initialFilters: AdminOrdersFilters
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function AdminOrdersFilters({ initialFilters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [shippingOrderId, setShippingOrderId] = useState(initialFilters.shippingOrderId || "")
  const [trackingId, setTrackingId] = useState(initialFilters.trackingId || "")
  const [statuses, setStatuses] = useState<string[]>(initialFilters.orderStatuses || [])
  const [paymentStatus, setPaymentStatus] = useState(initialFilters.paymentStatus || "ALL")
  const [clientUserId, setClientUserId] = useState(initialFilters.clientUserId || "")
  const [userId, setUserId] = useState(initialFilters.userId || "")
  const [clientType, setClientType] = useState(initialFilters.clientType || "ALL")
  const [priorityDelivery, setPriorityDelivery] = useState(initialFilters.priorityDelivery || "ALL")
  const [createdFrom, setCreatedFrom] = useState(initialFilters.createdFrom || "")
  const [createdTo, setCreatedTo] = useState(initialFilters.createdTo || "")
  const [updatedFrom, setUpdatedFrom] = useState(initialFilters.updatedFrom || "")
  const [updatedTo, setUpdatedTo] = useState(initialFilters.updatedTo || "")
  const [sortBy, setSortBy] = useState<AdminOrderSortBy>(initialFilters.sortBy)
  const [sortDir, setSortDir] = useState<AdminOrderSortDirection>(initialFilters.sortDir)

  const statusLabel = useMemo(() => {
    if (!statuses.length) return "All statuses"
    if (statuses.length === 1) return humanize(statuses[0])
    return `${statuses.length} statuses`
  }, [statuses])

  const activeFilterCount = useMemo(
    () =>
      [
        shippingOrderId,
        trackingId,
        statuses.length ? "statuses" : "",
        paymentStatus === "ALL" ? "" : paymentStatus,
        clientUserId,
        userId,
        clientType === "ALL" ? "" : clientType,
        priorityDelivery === "ALL" ? "" : priorityDelivery,
        createdFrom,
        createdTo,
        updatedFrom,
        updatedTo,
      ].filter(Boolean).length,
    [
      clientType,
      clientUserId,
      createdFrom,
      createdTo,
      paymentStatus,
      priorityDelivery,
      shippingOrderId,
      statuses.length,
      trackingId,
      updatedFrom,
      updatedTo,
      userId,
    ],
  )

  const toggleStatus = (status: string, checked: boolean) => {
    setStatuses((current) =>
      checked ? Array.from(new Set([...current, status])) : current.filter((entry) => entry !== status),
    )
  }

  const apply = (event?: FormEvent) => {
    event?.preventDefault()
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", "0")
    next.set("size", String(initialFilters.size))
    next.set("sortBy", sortBy)
    next.set("sortDir", sortDir)

    const values: Record<string, string> = {
      shippingOrderId: shippingOrderId.trim(),
      trackingId: trackingId.trim(),
      orderStatus: statuses.join(","),
      paymentStatus: paymentStatus === "ALL" ? "" : paymentStatus,
      clientUserId: clientUserId.trim(),
      userId: userId.trim(),
      clientType: clientType === "ALL" ? "" : clientType,
      priorityDelivery: priorityDelivery === "ALL" ? "" : priorityDelivery,
      createdFrom,
      createdTo,
      updatedFrom,
      updatedTo,
    }

    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }

    router.push(`${pathname}?${next.toString()}`)
  }

  const reset = () => {
    setShippingOrderId("")
    setTrackingId("")
    setStatuses([])
    setPaymentStatus("ALL")
    setClientUserId("")
    setUserId("")
    setClientType("ALL")
    setPriorityDelivery("ALL")
    setCreatedFrom("")
    setCreatedTo("")
    setUpdatedFrom("")
    setUpdatedTo("")
    setSortBy("createdAt")
    setSortDir("desc")
    router.push(`${pathname}?page=0&size=10&sortBy=createdAt&sortDir=desc`)
  }

  return (
    <form onSubmit={apply} className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(210px,1.1fr)_minmax(190px,1fr)_190px_190px_auto] xl:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="admin-order-id" className="text-xs text-muted-foreground">Order ID</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="admin-order-id"
              value={shippingOrderId}
              onChange={(event) => setShippingOrderId(event.target.value)}
              placeholder="Shipping order ID"
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-tracking-id" className="text-xs text-muted-foreground">Tracking ID</Label>
          <Input
            id="admin-tracking-id"
            value={trackingId}
            onChange={(event) => setTrackingId(event.target.value)}
            placeholder="Package tracking ID"
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Order status</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="h-10 w-full justify-between font-normal">
                <span className="truncate">{statusLabel}</span>
                <Filter className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[420px] w-[280px] overflow-y-auto">
              <DropdownMenuLabel>Order statuses</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={!statuses.length} onCheckedChange={() => setStatuses([])}>
                All statuses
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {ADMIN_ORDER_STATUS_OPTIONS.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statuses.includes(status)}
                  onCheckedChange={(checked) => toggleStatus(status, Boolean(checked))}
                >
                  {humanize(status)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Payment status</Label>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All payment statuses</SelectItem>
              {ADMIN_ORDER_PAYMENT_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>{humanize(status)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-1 xl:flex-nowrap xl:justify-end">
          <Button type="submit" className="h-10">Apply</Button>
          <Button type="button" variant="outline" className="h-10" onClick={reset} aria-label="Reset filters">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="h-10">
                <SlidersHorizontal className="mr-2 h-4 w-4" /> More
                {activeFilterCount ? <Badge className="ml-2 h-5 min-w-5 px-1.5 text-[10px]">{activeFilterCount}</Badge> : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(92vw,460px)] space-y-4 p-4">
              <div>
                <p className="font-semibold">More filters</p>
                <p className="text-xs text-muted-foreground">Narrow results by customer, service, or date.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-client-user-id" className="text-xs text-muted-foreground">Client user ID</Label>
                  <Input id="admin-client-user-id" value={clientUserId} onChange={(event) => setClientUserId(event.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-legacy-user-id" className="text-xs text-muted-foreground">Legacy user ID</Label>
                  <Input id="admin-legacy-user-id" value={userId} onChange={(event) => setUserId(event.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Customer type</Label>
                  <Select value={clientType} onValueChange={setClientType}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All customer types</SelectItem>
                      {ADMIN_ORDER_CLIENT_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>{type === "client_organization" ? "Organization" : "Individual"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Priority delivery</Label>
                  <Select value={priorityDelivery} onValueChange={setPriorityDelivery}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All orders</SelectItem>
                      <SelectItem value="true">Priority only</SelectItem>
                      <SelectItem value="false">Standard only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-created-from" className="text-xs text-muted-foreground">Created from</Label>
                  <Input id="admin-created-from" type="date" value={createdFrom} max={createdTo || undefined} onChange={(event) => setCreatedFrom(event.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-created-to" className="text-xs text-muted-foreground">Created to</Label>
                  <Input id="admin-created-to" type="date" value={createdTo} min={createdFrom || undefined} onChange={(event) => setCreatedTo(event.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-updated-from" className="text-xs text-muted-foreground">Updated from</Label>
                  <Input id="admin-updated-from" type="date" value={updatedFrom} max={updatedTo || undefined} onChange={(event) => setUpdatedFrom(event.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-updated-to" className="text-xs text-muted-foreground">Updated to</Label>
                  <Input id="admin-updated-to" type="date" value={updatedTo} min={updatedFrom || undefined} onChange={(event) => setUpdatedTo(event.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Sort order</Label>
                  <Select
                    value={`${sortBy}:${sortDir}`}
                    onValueChange={(value) => {
                      const [field, direction] = value.split(":")
                      setSortBy(field as AdminOrderSortBy)
                      setSortDir(direction as AdminOrderSortDirection)
                    }}
                  >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt:desc">Newest created</SelectItem>
                      <SelectItem value="createdAt:asc">Oldest created</SelectItem>
                      <SelectItem value="updatedAt:desc">Recently updated</SelectItem>
                      <SelectItem value="updatedAt:asc">Least recently updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <Button type="button" size="sm" variant="outline" onClick={reset}>Reset</Button>
                <Button type="button" size="sm" onClick={() => apply()}>Apply filters</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </form>
  )
}

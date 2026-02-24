"use client"

import Link from "next/link"
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react"
import type { AdminDriverItem, AdminDriversResponse } from "@/types/admin-drivers"
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"

type DriversGridProps = {
  data: AdminDriversResponse
  filters: {
    email: string
    name: string
    station: string
    companyName: string
    profileStatus: string
    size: number
  }
}

type OptionalColumn = "phone" | "updated" | "backgroundCheck"

function formatDateShort(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "DRIVER_LICENSE_MISSING":
      return "License Missing"
    case "IN_REVIEW":
      return "In Review"
    case "APPROVED":
      return "Active"
    case "REJECTED":
      return "Rejected"
    case "PENDING":
      return "Pending"
    default:
      return status || "Unknown"
  }
}

function statusVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "APPROVED":
      return "default"
    case "REJECTED":
      return "destructive"
    case "DRIVER_LICENSE_MISSING":
      return "secondary"
    default:
      return "outline"
  }
}

export function DriversGrid({ data, filters }: DriversGridProps) {
  const [visibleColumns, setVisibleColumns] = useState<Record<OptionalColumn, boolean>>({
    phone: false,
    updated: true,
    backgroundCheck: false,
  })

  const buildHref = (page: number) => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(filters.size))

    if (filters.email) params.set("email", filters.email)
    if (filters.name) params.set("name", filters.name)
    if (filters.station) params.set("station", filters.station)
    if (filters.companyName) params.set("companyName", filters.companyName)
    if (filters.profileStatus) params.set("profileStatus", filters.profileStatus)

    return `/admin/drivers?${params.toString()}`
  }


  const currentListHref = () => buildHref(data.page)

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {data.items.length} of {data.totalElements} driver records
          </p>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={visibleColumns.phone}
                onCheckedChange={(checked) =>
                  setVisibleColumns((prev) => ({ ...prev, phone: Boolean(checked) }))
                }
              >
                Phone
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.updated}
                onCheckedChange={(checked) =>
                  setVisibleColumns((prev) => ({ ...prev, updated: Boolean(checked) }))
                }
              >
                Updated
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.backgroundCheck}
                onCheckedChange={(checked) =>
                  setVisibleColumns((prev) => ({ ...prev, backgroundCheck: Boolean(checked) }))
                }
              >
                Background check
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="py-2">Driver</TableHead>
                {visibleColumns.phone ? <TableHead className="py-2">Phone</TableHead> : null}
                <TableHead className="py-2">Assignment</TableHead>
                <TableHead className="py-2">Status</TableHead>
                <TableHead className="py-2">Verified</TableHead>
                {visibleColumns.backgroundCheck ? <TableHead className="py-2">Background</TableHead> : null}
                {visibleColumns.updated ? <TableHead className="py-2">Updated</TableHead> : null}
                <TableHead className="w-[44px] py-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item: AdminDriverItem) => {
                const name = `${item.firstName || ""} ${item.lastName || ""}`.trim() || "—"
                return (
                  <TableRow key={item.driverId}>
                    <TableCell className="py-2">
                      <div>
                        <p className="font-medium leading-tight">{name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[260px]">{item.email || "—"}</p>
                      </div>
                    </TableCell>
                    {visibleColumns.phone ? <TableCell className="py-2">{item.phone || "—"}</TableCell> : null}
                    <TableCell className="py-2">
                      <div>
                        <p className="leading-tight">{item.station || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[220px]">{item.companyName || "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant={statusVariant(item.profileStatus)} className="whitespace-nowrap">
                            {getStatusLabel(item.profileStatus)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>{item.profileStatus || "UNKNOWN"}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="py-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center">
                            {item.isVerified ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{item.isVerified ? "Verified" : "Not verified"}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    {visibleColumns.backgroundCheck ? (
                      <TableCell className="py-2">{item.backgroundCheckStatus || "—"}</TableCell>
                    ) : null}
                    {visibleColumns.updated ? <TableCell className="py-2">{formatDateShort(item.updatedAt)}</TableCell> : null}
                    <TableCell className="py-2 pr-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button asChild size="sm" variant="outline" className="h-8 px-2">
                        <Link href={`/admin/drivers/${item.driverId}?returnTo=${encodeURIComponent(currentListHref())}`}>
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          Open profile
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <span className="text-sm text-muted-foreground">
            Page {data.totalPages === 0 ? 0 : data.page + 1} of {data.totalPages}
          </span>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                {data.page > 0 ? (
                  <PaginationPrevious href={buildHref(data.page - 1)} />
                ) : (
                  <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Previous</span>
                )}
              </PaginationItem>
              <PaginationItem>
                {data.page + 1 < data.totalPages ? (
                  <PaginationNext href={buildHref(data.page + 1)} />
                ) : (
                  <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Next</span>
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </TooltipProvider>
  )
}

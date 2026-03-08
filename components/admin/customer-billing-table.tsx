import Link from "next/link"
import { ExternalLink } from "lucide-react"
import type { AdminCustomerBillingRow } from "@/types/admin-customer-billing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function formatDate(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

function humanize(value?: string) {
  if (!value) return "—"
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function statusBadgeClass(status?: string) {
  const normalized = String(status || "").toUpperCase()
  if (["ACTIVE", "APPROVED"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
  }
  if (normalized.includes("PENDING")) {
    return "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
  }
  if (["DISABLED", "FAILED", "INACTIVE", "REJECTED", "SUSPENDED"].includes(normalized)) {
    return "border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
  }
  return "border-muted bg-muted text-foreground"
}

type Props = {
  rows: AdminCustomerBillingRow[]
  ownerType: "individual" | "organization"
  filters: {
    email: string
    userId: string
    type: string
    name: string
    industry: string
    size: number
  }
  meta: {
    page: number
    size: number
    totalElements: number
    totalPages: number
  } | null
}

export function CustomerBillingTable({ rows, ownerType, filters, meta }: Props) {
  const buildHref = (page: number) => {
    const params = new URLSearchParams()
    params.set("ownerType", ownerType)
    params.set("page", String(page))
    params.set("size", String(filters.size || 20))
    if (filters.email) params.set("email", filters.email)
    if (filters.userId) params.set("userId", filters.userId)
    if (filters.type && ownerType === "individual") params.set("type", filters.type)
    if (filters.name && ownerType === "organization") params.set("name", filters.name)
    if (filters.industry && ownerType === "organization") params.set("industry", filters.industry)
    return `/admin/customers?${params.toString()}`
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Showing {rows.length} of {meta?.totalElements ?? rows.length} user profiles</p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Owner Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[44px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.ownerType}-${row.id}`}>
                <TableCell>
                  <p className="font-medium leading-tight">{row.displayName}</p>
                  <p className="text-xs text-muted-foreground">{row.email || "—"}</p>
                  <p className="text-xs text-muted-foreground">{row.phone || "—"}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{humanize(row.ownerType)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusBadgeClass(row.status)}>
                    {humanize(row.status)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">{row.userId || "—"}</TableCell>
                <TableCell>{formatDate(row.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline" className="h-8 px-2">
                    <Link href={`/admin/customers/${row.ownerType.toLowerCase()}/${row.id}`}>
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      Open
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta ? (
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <span className="text-sm text-muted-foreground">
            Page {meta.totalPages === 0 ? 0 : meta.page + 1} of {meta.totalPages}
          </span>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                {meta.page > 0 ? (
                  <PaginationPrevious href={buildHref(meta.page - 1)} />
                ) : (
                  <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Previous</span>
                )}
              </PaginationItem>
              <PaginationItem>
                {meta.page + 1 < meta.totalPages ? (
                  <PaginationNext href={buildHref(meta.page + 1)} />
                ) : (
                  <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Next</span>
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  )
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getClientOrderDetail,
  getClientOrders,
  type ClientOrdersFilters,
  type CustomerOrderDetailResponse,
  type CustomerOrderSummaryResponse,
  type GeneratedDocument,
  type OrderItem,
} from "@/lib/order-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarClock,
  Package,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

type SortOption = "newest" | "oldest" | "updated";

const PAGE_SIZE = 10;

function getSortParams(
  sort: SortOption,
): Pick<ClientOrdersFilters, "sortBy" | "sortDir"> {
  switch (sort) {
    case "oldest":
      return { sortBy: "createdAt", sortDir: "asc" };
    case "updated":
      return { sortBy: "updatedAt", sortDir: "desc" };
    case "newest":
    default:
      return { sortBy: "createdAt", sortDir: "desc" };
  }
}

function statusBadge(status?: string | null) {
  const value = (status || "").toLowerCase();
  const success = new Set([
    "confirmed",
    "delivered",
    "partial_complete",
    "successful",
    "success",
    "paid",
  ]);
  const progress = new Set([
    "label_created",
    "scheduled",
    "assigned",
    "picked_up",
    "in_transit",
    "in_progress",
  ]);
  const warning = new Set(["payment_pending", "pending", "end_of_day"]);
  const danger = new Set([
    "payment_failed",
    "pickup_failed",
    "drop_off_failed",
    "failed",
    "cancelled",
  ]);
  const neutral = new Set(["draft", "returned"]);

  let tone = "bg-slate-100 text-slate-700 border-slate-200";
  if (success.has(value))
    tone = "bg-emerald-100 text-emerald-800 border-emerald-200";
  else if (progress.has(value)) tone = "bg-sky-100 text-sky-800 border-sky-200";
  else if (warning.has(value))
    tone = "bg-amber-100 text-amber-900 border-amber-200";
  else if (danger.has(value))
    tone = "bg-rose-100 text-rose-800 border-rose-200";
  else if (neutral.has(value))
    tone = "bg-zinc-100 text-zinc-700 border-zinc-200";

  const label = status
    ? value
        .split("_")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ")
    : "Unknown";

  return (
    <Badge
      variant="outline"
      className={`h-6 rounded-md px-2 text-[11px] border ${tone}`}
    >
      {label}
    </Badge>
  );
}

function money(value?: number | null) {
  if (typeof value !== "number") return "N/A";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value);
}

function formatOrderDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, "MMM d, yyyy • h:mm a");
}

function itemBucket(
  status?: string | null,
): "delivered" | "in_progress" | "failed" {
  const v = (status || "").toLowerCase();
  if (["delivered", "partial_complete"].includes(v)) return "delivered";
  if (
    [
      "draft",
      "payment_pending",
      "payment_failed",
      "pickup_failed",
      "returned",
      "failed",
      "cancelled",
    ].includes(v)
  )
    return "failed";
  return "in_progress";
}

function compactAddress(item: OrderItem, stop: "pickup" | "dropoff") {
  const address = item[stop]?.address;
  const city = address?.city || "N/A";
  const street = address?.streetAddress || "Address unavailable";
  return `${city} • ${street}`;
}

function documentLabel(document: GeneratedDocument) {
  return document.documentName || document.documentType || "Generated document";
}

export function Shipments() {
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [page, setPage] = useState(0);

  const [ordersPage, setOrdersPage] = useState<
    CustomerOrderSummaryResponse[]
  >([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] =
    useState<CustomerOrderDetailResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const sortParams = useMemo(() => getSortParams(sortOption), [sortOption]);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getClientOrders({
          page,
          size: PAGE_SIZE,
          sortBy: sortParams.sortBy,
          sortDir: sortParams.sortDir,
        });
        const nonDraftOrders = (response.orders || []).filter(
          (order) => order.orderStatus?.toLowerCase() !== "draft",
        );

        if (cancelled) return;
        setOrdersPage(nonDraftOrders);
        setTotalElements(response.pagination?.totalElements || 0);
        setTotalPages(response.pagination?.totalPages || 0);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch orders", err);
        setError("Failed to load shipments. Please try again.");
        setOrdersPage([]);
        setTotalElements(0);
        setTotalPages(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [page, sortParams]);

  useEffect(() => {
    if (!ordersPage.length) {
      setSelectedOrderId(null);
      setSelectedOrderDetail(null);
      return;
    }

    const exists =
      selectedOrderId &&
      ordersPage.some((order) => order.shippingOrderId === selectedOrderId);
    if (!exists) {
      setSelectedOrderId(ordersPage[0].shippingOrderId);
    }
  }, [ordersPage, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrderDetail(null);
      setDetailError(null);
      setIsDetailLoading(false);
      return;
    }

    let cancelled = false;
    const orderId = selectedOrderId;

    async function loadOrderDetail() {
      setIsDetailLoading(true);
      setDetailError(null);
      setSelectedOrderDetail(null);

      try {
        const detail = await getClientOrderDetail(orderId);
        if (cancelled) return;
        setSelectedOrderDetail({
          shippingOrder: detail.shippingOrder ?? null,
          documents: detail.documents ?? [],
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch order detail", err);
        setDetailError("Failed to load this shipment. Please try again.");
      } finally {
        if (!cancelled) setIsDetailLoading(false);
      }
    }

    loadOrderDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedOrderId]);

  const selectedSummary = useMemo(
    () =>
      ordersPage.find((order) => order.shippingOrderId === selectedOrderId) ||
      null,
    [ordersPage, selectedOrderId],
  );
  const selectedOrder = selectedOrderDetail?.shippingOrder ?? null;
  const documents = selectedOrderDetail?.documents ?? [];

  const itemProgress = useMemo(() => {
    if (!selectedOrder?.orderItems?.length)
      return { delivered: 0, in_progress: 0, failed: 0 };

    return selectedOrder.orderItems.reduce(
      (acc, item) => {
        const bucket = itemBucket(item.itemStatus);
        acc[bucket] += 1;
        return acc;
      },
      { delivered: 0, in_progress: 0, failed: 0 },
    );
  }, [selectedOrder]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-background px-3 py-2">
        <h1 className="text-xl font-semibold tracking-tight">
          Shipments Workspace
        </h1>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 min-h-[620px]">
        <Card className="lg:col-span-2 flex flex-col min-h-[620px]">
          <CardHeader className="px-3 py-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm">Shipping Orders</CardTitle>
              <Select
                value={sortOption}
                onValueChange={(value: SortOption) => {
                  setSortOption(value);
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-8 text-xs w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CardDescription className="text-xs">
              {totalElements} orders
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-2 flex-1 flex flex-col min-h-0">
            {isLoading ? (
              <div className="space-y-2 px-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="border rounded-md p-2.5 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : ordersPage.length === 0 ? (
              <div className="flex-1 px-4 py-10 text-center text-xs text-muted-foreground flex items-center justify-center">
                No shipments found yet.
              </div>
            ) : (
              <div className="divide-y border-y flex-1">
                {ordersPage.map((order) => {
                  const selected = selectedOrderId === order.shippingOrderId;
                  return (
                    <button
                      key={order.shippingOrderId}
                      className={`w-full text-left px-3 py-2.5 hover:bg-muted/30 ${selected ? "bg-muted/60" : ""}`}
                      onClick={() => setSelectedOrderId(order.shippingOrderId)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">
                          {order.shippingOrderId}
                        </p>
                        <p className="text-xs font-semibold">
                          {money(order.amount)}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {statusBadge(order.orderStatus)}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />{" "}
                          {formatOrderDate(order.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Package className="h-3 w-3" />{" "}
                          {order.numberOfOrderItems ?? 0} items
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between px-3 pt-2 mt-auto border-t">
              <p className="text-[11px] text-muted-foreground">
                Page {totalPages === 0 ? 0 : page + 1} / {totalPages || 0}
              </p>
              <div className="flex gap-1">
                <button
                  className="text-xs border rounded px-2 py-1 disabled:opacity-50"
                  disabled={page <= 0 || isLoading}
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                >
                  Prev
                </button>
                <button
                  className="text-xs border rounded px-2 py-1 disabled:opacity-50"
                  disabled={
                    isLoading || totalPages === 0 || page + 1 >= totalPages
                  }
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-3 space-y-3">
            {isDetailLoading ? (
              <div className="min-h-[460px] space-y-3">
                <div className="border rounded-md p-3 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : detailError ? (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{detailError}</AlertDescription>
              </Alert>
            ) : !selectedOrder ? (
              <div className="h-full min-h-[460px] flex items-center justify-center text-sm text-muted-foreground">
                {ordersPage.length
                  ? "Select a shipping order to view details."
                  : "No shipment details to display."}
              </div>
            ) : (
              <>
                <div className="border rounded-md p-3 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold">
                        {selectedOrder.shippingOrderId}
                      </h2>
                      {statusBadge(selectedOrder.orderStatus)}
                    </div>
                    <p className="text-lg font-semibold">
                      {money(
                        selectedOrder.aggregatedPricing?.totalAmount ??
                          selectedSummary?.amount,
                      )}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      Created: {formatOrderDate(selectedOrder.createdAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Payment:</span>
                      {statusBadge(selectedOrder.paymentStatus)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="h-6">
                      Delivered: {itemProgress.delivered}
                    </Badge>
                    <Badge variant="outline" className="h-6">
                      In Progress: {itemProgress.in_progress}
                    </Badge>
                    <Badge variant="outline" className="h-6">
                      Failed: {itemProgress.failed}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Order Items</h3>
                  {selectedOrder.orderItems?.length ? (
                    <div className="divide-y border rounded-md">
                      {selectedOrder.orderItems.map((item, idx: number) => (
                        <div
                          key={item.trackingId || idx}
                          className="p-2.5 space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium">
                                  Item {idx + 1}
                                </p>
                                {statusBadge(item.itemStatus)}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Tracking: {item.trackingId || "N/A"}
                              </p>
                            </div>
                            <p className="text-sm font-semibold whitespace-nowrap">
                              {money(item.pricing?.totalAmount)}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              <p className="font-medium text-foreground">
                                Pickup
                              </p>
                              <p>{compactAddress(item, "pickup")}</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                Dropoff
                              </p>
                              <p>{compactAddress(item, "dropoff")}</p>
                            </div>
                            <div>
                              Weight:{" "}
                              {typeof item.packageDetails?.weight === "number"
                                ? `${item.packageDetails.weight} kg`
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground border rounded-md p-3">
                      No order items available.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Documents</h3>
                  {documents.length ? (
                    <div className="divide-y border rounded-md">
                      {documents.map((document, idx) => (
                        <div
                          key={document.s3Key || document.presignedUrl || idx}
                          className="p-2.5 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {documentLabel(document)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {document.documentType || "Document"}
                              </p>
                            </div>
                          </div>
                          {document.presignedUrl ? (
                            <a
                              className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 hover:bg-muted"
                              href={document.presignedUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Unavailable
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground border rounded-md p-3">
                      No documents available for this order.
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

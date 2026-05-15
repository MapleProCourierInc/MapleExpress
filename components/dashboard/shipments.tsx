"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getClientOrderDetail,
  getClientOrders,
  type ClientOrdersFilters,
  type CustomerOrderDetailResponse,
  type CustomerOrderSummaryResponse,
  type GeneratedDocument,
  type OrderItem,
  type TrackingEvent,
} from "@/lib/order-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Box,
  CalendarClock,
  CheckCircle,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Home,
  MapPin,
  Package,
  Plus,
  Route,
  Search,
  Tag,
  Truck,
} from "lucide-react";
import { format, isToday } from "date-fns";

type SortOption = "newest" | "oldest" | "updated";
type ShipmentFilter = "all" | "active" | "exceptions";
type StatusTone = "success" | "progress" | "warning" | "danger" | "neutral";

const PAGE_SIZE = 10;

const TRACKING_STEPS = [
  { label: "Order", icon: CheckCircle },
  { label: "Pickup", icon: Truck },
  { label: "Transit", icon: Route },
  { label: "Delivery", icon: Home },
];

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

function formatStatusLabel(status?: string | null) {
  if (!status) return "Unknown";
  return status
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusMeta(status?: string | null): { label: string; tone: StatusTone } {
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

  let tone: StatusTone = "neutral";
  if (success.has(value)) tone = "success";
  else if (progress.has(value)) tone = "progress";
  else if (warning.has(value)) tone = "warning";
  else if (danger.has(value)) tone = "danger";

  return { label: formatStatusLabel(status), tone };
}

const statusStyles: Record<StatusTone, { badge: string; dot: string; text: string; line: string; step: string }> = {
  success: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    line: "border-emerald-500",
    step: "bg-emerald-500 text-white border-emerald-500",
  },
  progress: {
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
    text: "text-blue-700",
    line: "border-blue-500",
    step: "bg-emerald-500 text-white border-emerald-500",
  },
  warning: {
    badge: "bg-amber-50 text-amber-900 border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-800",
    line: "border-amber-500",
    step: "bg-amber-500 text-white border-amber-500",
  },
  danger: {
    badge: "bg-red-50 text-red-800 border-red-200",
    dot: "bg-red-600",
    text: "text-red-700",
    line: "border-red-500",
    step: "bg-red-600 text-white border-red-600",
  },
  neutral: {
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    text: "text-slate-600",
    line: "border-slate-300",
    step: "bg-slate-900 text-white border-slate-900",
  },
};

function statusBadge(status?: string | null, className = "") {
  const meta = getStatusMeta(status);

  return (
    <Badge
      variant="outline"
      className={`rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase tracking-normal ${statusStyles[meta.tone].badge} ${className}`}
    >
      {meta.label}
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
  return format(date, "MMM d, yyyy");
}

function formatOrderDateTime(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, "MMM d, yyyy, h:mm a");
}

function formatTrackingDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return isToday(date) ? format(date, "'Today,' h:mm a") : format(date, "MMM d, h:mm a");
}

function itemBucket(
  status?: string | null,
): "delivered" | "in_progress" | "failed" {
  const tone = getStatusMeta(status).tone;
  if (tone === "success" && (status || "").toLowerCase() === "delivered") return "delivered";
  if (tone === "danger") return "failed";
  return "in_progress";
}

function orderMatchesFilter(order: CustomerOrderSummaryResponse, filter: ShipmentFilter) {
  if (filter === "all") return true;
  const tone = getStatusMeta(order.orderStatus).tone;
  if (filter === "exceptions") return tone === "danger" || tone === "warning";
  return tone === "progress";
}

function matchesSearch(order: CustomerOrderSummaryResponse, query: string) {
  const value = query.trim().toLowerCase();
  if (!value) return true;

  return [
    order.shippingOrderId,
    order.orderStatus,
    order.amount?.toString(),
    order.createdAt,
  ]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(value));
}

function shortOrderId(id?: string | null) {
  if (!id) return "N/A";
  const clean = id.replace(/^ShippingOrder_/i, "");
  return clean.length > 10 ? `...${clean.slice(-8)}` : clean;
}

function displayOrderId(id?: string | null) {
  if (!id) return "N/A";
  return id.replace(/^ShippingOrder_/i, "");
}

function documentLabel(document: GeneratedDocument) {
  return document.documentName || document.documentType || "Generated document";
}

function findDocument(documents: GeneratedDocument[], type: string) {
  return documents.find((document) => document.documentType?.toUpperCase() === type);
}

function addressTitle(item: OrderItem, stop: "pickup" | "dropoff") {
  const address = item[stop]?.address;
  const cityProvince = [address?.city, address?.province].filter(Boolean).join(", ");
  return cityProvince || "Address unavailable";
}

function addressLine(item: OrderItem, stop: "pickup" | "dropoff") {
  const address = item[stop]?.address;
  return [address?.streetAddress, address?.addressLine2, address?.postalCode]
    .filter(Boolean)
    .join(", ") || "Details unavailable";
}

function packageDescriptor(item: OrderItem) {
  const details = item.packageDetails;
  const dimensions = details?.dimensions;
  const parts = [details?.type ? formatStatusLabel(details.type) : "Package"];

  if (typeof details?.weight === "number") {
    parts.push(`${details.weight} kg`);
  }

  if (
    typeof dimensions?.length === "number" &&
    typeof dimensions.width === "number" &&
    typeof dimensions.height === "number"
  ) {
    parts.push(`${dimensions.length}x${dimensions.width}x${dimensions.height} in`);
  }

  if (item.isFragile) parts.push("Fragile");

  return parts.join(" - ");
}

function sortedTrackingEvents(item: OrderItem): TrackingEvent[] {
  return [...(item.trackingEvents || [])].sort(
    (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime(),
  );
}

function latestItemStatus(item: OrderItem) {
  return sortedTrackingEvents(item)[0]?.status || item.itemStatus;
}

function trackingMessage(event: TrackingEvent) {
  return event.statusMessage?.trim() || getStatusMeta(event.status).label;
}

function stepProgress(item: OrderItem) {
  const status = (latestItemStatus(item) || "").toLowerCase();

  if (["delivered", "partial_complete"].includes(status)) return 3;
  if (["in_transit", "drop_off_failed", "end_of_day"].includes(status)) return 2;
  if (["assigned", "picked_up", "pickup_failed"].includes(status)) return 1;
  return 0;
}

function paymentLabel(status?: string | null) {
  const value = (status || "").toLowerCase();
  if (["paid", "successful", "success"].includes(value)) return "Paid";
  return formatStatusLabel(status);
}

function packageCountLabel(count?: number | null) {
  const value = count ?? 0;
  return `${value} ${value === 1 ? "Package" : "Packages"}`;
}

function DocumentAction({
  document,
  label,
  primary = false,
  icon,
}: {
  document?: GeneratedDocument;
  label: string;
  primary?: boolean;
  icon: React.ReactNode;
}) {
  const classes = primary
    ? "bg-red-700 text-white border-red-700 hover:bg-red-800"
    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50";

  if (!document?.presignedUrl) {
    return (
      <button
        className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold opacity-50 ${classes}`}
        disabled
        type="button"
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <a
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${classes}`}
      href={document.presignedUrl}
      target="_blank"
      rel="noreferrer"
    >
      {icon}
      {label}
    </a>
  );
}

function ProgressStepper({ item }: { item: OrderItem }) {
  const progress = stepProgress(item);
  const tone = getStatusMeta(latestItemStatus(item)).tone;
  const activeStepClass = statusStyles[tone === "danger" ? "danger" : "success"].step;

  return (
    <div className="grid grid-cols-4 gap-2">
      {TRACKING_STEPS.map((step, index) => {
        const Icon = step.icon;
        const complete = index <= progress;

        return (
          <div key={step.label} className="relative flex flex-col items-center gap-2">
            {index > 0 && (
              <div
                className={`absolute right-1/2 top-4 h-0.5 w-full ${
                  complete ? activeStepClass.split(" ")[0] : "bg-slate-200"
                }`}
              />
            )}
            <div
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                complete
                  ? activeStepClass
                  : "border-slate-300 bg-slate-100 text-slate-500"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className={`text-[10px] font-bold uppercase ${complete ? "text-slate-950" : "text-slate-500"}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TrackingHistory({ item }: { item: OrderItem }) {
  const events = sortedTrackingEvents(item).slice(0, 4);

  if (!events.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-500">
        Tracking updates will appear here once available.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const latest = index === 0;
        const meta = getStatusMeta(event.status);
        const styles = latest ? statusStyles[meta.tone] : statusStyles.neutral;

        return (
          <div
            key={`${event.status || "event"}-${event.timestamp || index}`}
            className={`relative ml-2 border-l-2 pb-4 pl-6 last:pb-0 ${latest ? styles.line : "border-slate-200"}`}
          >
            <span
              className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 bg-white ${
                latest ? styles.line.replace("border-", "border-") : "border-slate-300"
              }`}
            />
            <p className={`text-[11px] font-bold ${latest ? styles.text : "text-slate-500"}`}>
              {formatTrackingDate(event.timestamp)}
            </p>
            <p className={`mt-1 text-sm leading-tight ${latest ? "font-semibold text-slate-950" : "text-slate-500"}`}>
              {trackingMessage(event)}
            </p>
            {event.driverComments && (
              <p className="mt-1 text-xs text-slate-500">Driver note: {event.driverComments}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PackageCard({ item, index }: { item: OrderItem; index: number }) {
  const currentStatus = latestItemStatus(item);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300">
      <div className="grid grid-cols-1 xl:grid-cols-12">
        <div className="space-y-6 p-5 xl:col-span-8 xl:border-r xl:border-slate-200/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="truncate font-mono text-sm font-bold text-slate-950">
                {item.trackingId || `Package ${index + 1}`}
              </span>
              {statusBadge(currentStatus)}
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {packageDescriptor(item)}
            </div>
          </div>

          <ProgressStepper item={item} />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Pickup Address</p>
              <p className="font-semibold text-slate-950">{addressTitle(item, "pickup")}</p>
              <p className="mt-1 text-sm text-slate-500">{addressLine(item, "pickup")}</p>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Dropoff Address</p>
              <p className="font-semibold text-slate-950">{addressTitle(item, "dropoff")}</p>
              <p className="mt-1 text-sm text-slate-500">{addressLine(item, "dropoff")}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-slate-50/70 p-5 xl:col-span-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h4 className="text-sm font-bold text-slate-950">Tracking History</h4>
            <span className="whitespace-nowrap text-lg font-bold text-slate-950">
              {money(item.pricing?.totalAmount)}
            </span>
          </div>

          <TrackingHistory item={item} />

          {item.trackingId && (
            <button
              className="mt-5 rounded-md py-2 text-center text-sm font-bold text-red-700 transition-colors hover:bg-red-50"
              onClick={() => window.open(`/track?trackingNumber=${encodeURIComponent(item.trackingId || "")}`, "_blank")}
              type="button"
            >
              Full Tracking Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Shipments() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId")?.trim() || null;

  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [shipmentFilter, setShipmentFilter] = useState<ShipmentFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
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
    if (orderIdParam) {
      setSelectedOrderId(orderIdParam);
    }
  }, [orderIdParam]);

  useEffect(() => {
    if (!ordersPage.length) {
      if (!orderIdParam) {
        setSelectedOrderId(null);
        setSelectedOrderDetail(null);
      }
      return;
    }

    if (orderIdParam) return;

    const exists =
      selectedOrderId &&
      ordersPage.some((order) => order.shippingOrderId === selectedOrderId);
    if (!exists) {
      setSelectedOrderId(ordersPage[0].shippingOrderId);
    }
  }, [ordersPage, selectedOrderId, orderIdParam]);

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
        setDetailError(
          "We could not load this order. Please check the link or try again.",
        );
      } finally {
        if (!cancelled) setIsDetailLoading(false);
      }
    }

    loadOrderDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedOrderId]);

  const handleSelectOrder = (shippingOrderId: string) => {
    setSelectedOrderId(shippingOrderId);

    const params = new URLSearchParams(searchParams.toString());
    params.set("section", "shipments");
    params.set("orderId", shippingOrderId);
    router.push(`/dashboard?${params.toString()}`);
  };

  const selectedSummary = useMemo(
    () =>
      ordersPage.find((order) => order.shippingOrderId === selectedOrderId) ||
      null,
    [ordersPage, selectedOrderId],
  );
  const selectedOrder = selectedOrderDetail?.shippingOrder ?? null;
  const documents = selectedOrderDetail?.documents ?? [];
  const invoiceDocument = findDocument(documents, "INVOICE");
  const labelDocument = findDocument(documents, "SHIPPING_LABEL");

  const visibleOrders = useMemo(
    () =>
      ordersPage.filter(
        (order) =>
          orderMatchesFilter(order, shipmentFilter) &&
          matchesSearch(order, searchQuery),
      ),
    [ordersPage, shipmentFilter, searchQuery],
  );

  const filterCounts = useMemo(
    () => ({
      all: ordersPage.length,
      active: ordersPage.filter((order) => orderMatchesFilter(order, "active")).length,
      exceptions: ordersPage.filter((order) => orderMatchesFilter(order, "exceptions")).length,
    }),
    [ordersPage],
  );

  const itemProgress = useMemo(() => {
    if (!selectedOrder?.orderItems?.length)
      return { delivered: 0, in_progress: 0, failed: 0 };

    return selectedOrder.orderItems.reduce(
      (acc, item) => {
        const bucket = itemBucket(latestItemStatus(item));
        acc[bucket] += 1;
        return acc;
      },
      { delivered: 0, in_progress: 0, failed: 0 },
    );
  }, [selectedOrder]);

  return (
    <div className="min-h-[calc(100vh-3rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-950">Shipments</h1>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-medium text-slate-700">
            {totalElements} Orders
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 sm:w-72"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search shipments..."
              value={searchQuery}
            />
          </div>

          <Select
            value={sortOption}
            onValueChange={(value: SortOption) => {
              setSortOption(value);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-10 w-full border-slate-200 text-sm sm:w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="updated">Recently updated</SelectItem>
            </SelectContent>
          </Select>

          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            onClick={() => router.push("/ship-now")}
            type="button"
          >
            <Plus className="h-4 w-4" />
            New Shipment
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 pb-0">
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="grid grid-cols-3 gap-2 border-b border-slate-200 bg-slate-50 p-3">
            {([
              ["all", "All", filterCounts.all],
              ["active", "In Transit", filterCounts.active],
              ["exceptions", "Exceptions", filterCounts.exceptions],
            ] as const).map(([value, label, count]) => (
              <button
                key={value}
                className={`rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                  shipmentFilter === value
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
                }`}
                onClick={() => setShipmentFilter(value)}
                type="button"
              >
                {label} <span className="text-slate-400">{count}</span>
              </button>
            ))}
          </div>

          <div className="max-h-[620px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="mt-3 h-4 w-24" />
                    <Skeleton className="mt-4 h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : visibleOrders.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center px-6 text-center text-sm text-slate-500">
                No shipments match the current filters.
              </div>
            ) : (
              <div className="space-y-1">
                {visibleOrders.map((order) => {
                  const selected = selectedOrderId === order.shippingOrderId;
                  const meta = getStatusMeta(order.orderStatus);

                  return (
                    <button
                      key={order.shippingOrderId}
                      className={`w-full rounded-xl border p-4 text-left transition-colors ${
                        selected
                          ? "border-slate-300 bg-slate-50 shadow-sm [border-left:3px_solid_#b6191a]"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                      onClick={() => handleSelectOrder(order.shippingOrderId)}
                      type="button"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <span className="min-w-0 truncate font-mono text-sm font-bold text-slate-950">
                          {shortOrderId(order.shippingOrderId)}
                        </span>
                        <span className="whitespace-nowrap text-sm font-bold text-slate-950">
                          {money(order.amount)}
                        </span>
                      </div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${statusStyles[meta.tone].dot}`} />
                        {statusBadge(order.orderStatus)}
                      </div>
                      <div className="space-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {formatOrderDate(order.createdAt)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" />
                          {packageCountLabel(order.numberOfOrderItems)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-500">
              Page {totalPages === 0 ? 0 : page + 1} / {totalPages || 0}
            </p>
            <div className="flex gap-2">
              <button
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
                disabled={page <= 0 || isLoading}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                type="button"
              >
                Prev
              </button>
              <button
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
                disabled={
                  isLoading || totalPages === 0 || page + 1 >= totalPages
                }
                onClick={() => setPage((prev) => prev + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 bg-slate-50/80">
          {isDetailLoading ? (
            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <Skeleton className="h-7 w-60" />
                <Skeleton className="mt-3 h-4 w-72" />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          ) : detailError ? (
            <div className="p-6">
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{detailError}</AlertDescription>
              </Alert>
            </div>
          ) : !selectedOrder ? (
            <div className="flex min-h-[520px] items-center justify-center p-6 text-sm text-slate-500">
              {ordersPage.length
                ? "Select a shipping order to view details."
                : "No shipment details to display."}
            </div>
          ) : (
            <div className="min-w-0">
              <div className="sticky top-0 z-10 flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="truncate font-mono text-2xl font-bold text-slate-950">
                      Order #{displayOrderId(selectedOrder.shippingOrderId)}
                    </h2>
                    {statusBadge(selectedOrder.orderStatus)}
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {selectedOrder.customerContact?.name || "Customer shipment"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <DocumentAction
                    document={invoiceDocument}
                    icon={<Download className="h-4 w-4" />}
                    label="Invoice"
                  />
                  <DocumentAction
                    document={labelDocument}
                    icon={<Tag className="h-4 w-4" />}
                    label="Print Labels"
                    primary
                  />
                </div>
              </div>

              <div className="space-y-7 p-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="mb-1 text-[10px] font-bold uppercase text-slate-500">Total Price</p>
                    <p className="text-xl font-bold text-slate-950">
                      {money(selectedOrder.aggregatedPricing?.totalAmount ?? selectedSummary?.amount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="mb-1 text-[10px] font-bold uppercase text-slate-500">Payment Status</p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                      <p className="text-xl font-bold text-slate-950">
                        {paymentLabel(selectedOrder.paymentStatus)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="mb-1 text-[10px] font-bold uppercase text-slate-500">Created Date</p>
                    <p className="text-xl font-bold text-slate-950">
                      {formatOrderDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="mb-1 text-[10px] font-bold uppercase text-slate-500">Total Items</p>
                    <p className="text-xl font-bold text-slate-950">
                      {packageCountLabel(selectedOrder.orderItems?.length)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-md border-slate-200 bg-white px-3 py-1 text-xs">
                    Delivered: {itemProgress.delivered}
                  </Badge>
                  <Badge variant="outline" className="rounded-md border-slate-200 bg-white px-3 py-1 text-xs">
                    In Progress: {itemProgress.in_progress}
                  </Badge>
                  <Badge variant="outline" className="rounded-md border-slate-200 bg-white px-3 py-1 text-xs">
                    Failed: {itemProgress.failed}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                    <Box className="h-5 w-5" />
                    Package Details
                  </h3>

                  {selectedOrder.orderItems?.length ? (
                    <div className="space-y-5">
                      {selectedOrder.orderItems.map((item, idx) => (
                        <PackageCard
                          key={item.trackingId || item.orderItemId || idx}
                          item={item}
                          index={idx}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                      No order items available.
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                    <FileText className="h-5 w-5" />
                    Documents
                  </h3>

                  {documents.length ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {documents.map((document, idx) => (
                        <div
                          key={document.s3Key || document.presignedUrl || idx}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">
                              {documentLabel(document)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatStatusLabel(document.documentType)}
                            </p>
                          </div>
                          {document.presignedUrl ? (
                            <a
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                              href={document.presignedUrl}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Open ${documentLabel(document)}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">Unavailable</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                      No documents available for this order.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

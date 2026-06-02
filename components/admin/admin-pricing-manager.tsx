"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CalendarClock, CheckCircle2, CircleDollarSign, Code2, Plus, RefreshCw, Rocket } from "lucide-react"
import { apiFetch } from "@/lib/client-api"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { CreatePricingV2Request, PricingApiError, PricingV2Model, PricingV2Page, PricingV2Status, PricingV2Type } from "@/types/pricing"

const quoteSafeTemplate: CreatePricingV2Request = {
  name: "Standard Global Pricing", description: "Default pricing for standard courier deliveries", status: "DRAFT", pricingType: "GLOBAL", ownerId: null,
  zoneCode: "GLOBAL", zoneDisplayName: "Global", currency: "CAD", effectiveFrom: null, effectiveTo: null,
  dimensionalWeight: { enabled: true, displayName: "Dimensional Weight", unit: "CM", divisor: 5000, roundingScale: 2, roundingMode: "CEILING" },
  chargeableWeight: { enabled: true, displayName: "Chargeable Weight", calculationType: "MAX_OF_ACTUAL_AND_DIMENSIONAL" },
  packageSlabs: [
    { slabCode: "SMALL", displayName: "Small Package", enabled: true, tierOrder: 1, minChargeableWeightKgExclusive: null, maxChargeableWeightKg: 5, minDimensionSumCmExclusive: null, maxDimensionSumCm: 60, basePrice: 9.99 },
    { slabCode: "MEDIUM", displayName: "Medium Package", enabled: true, tierOrder: 2, minChargeableWeightKgExclusive: 5, maxChargeableWeightKg: 10, minDimensionSumCmExclusive: 60, maxDimensionSumCm: 120, basePrice: 14.99 },
    { slabCode: "LARGE", displayName: "Large Package", enabled: true, tierOrder: 3, minChargeableWeightKgExclusive: 10, maxChargeableWeightKg: 25, minDimensionSumCmExclusive: 120, maxDimensionSumCm: 200, basePrice: 19.99 },
  ],
  distancePricing: { enabled: true, displayName: "Distance Pricing", includedDistanceKm: 10, distanceSlabs: [
    { slabCode: "DISTANCE_10_25", displayName: "Distance Charge 10-25 KM", enabled: true, fromKmExclusive: 10, toKmInclusive: 25, calculationType: "PER_KM", rate: 0.75 },
    { slabCode: "DISTANCE_25_50", displayName: "Distance Charge 25-50 KM", enabled: true, fromKmExclusive: 25, toKmInclusive: 50, calculationType: "PER_KM", rate: 1 },
  ] },
  surcharges: [
    { surchargeCode: "RUSH_PRIORITY", displayName: "Rush / Priority Fee", description: "Applied when rush delivery is requested", enabled: true, triggerType: "SERVICE_TYPE", triggerValue: "RUSH_PRIORITY", startTime: null, endTime: null, timezone: null, calculationType: "FLAT", amount: 5, percentage: null, percentageBase: null },
    { surchargeCode: "AFTER_HOURS", displayName: "After Hours Fee", description: "Applied during the configured Halifax time window", enabled: true, triggerType: "TIME_WINDOW", triggerValue: null, startTime: "17:00:00", endTime: "21:00:00", timezone: "America/Halifax", calculationType: "FLAT", amount: 5, percentage: null, percentageBase: null },
  ],
  taxes: [{ taxCode: "HST", displayName: "HST", enabled: true, calculationType: "PERCENTAGE", percentage: 15, percentageBase: "SUBTOTAL" }],
  customQuoteRules: { enabled: true, maxStandardDistanceKm: 50, distanceExceededMessage: "Distance exceeds standard pricing limits. Please contact us for a manual quote." },
  rounding: { moneyScale: 2, moneyRoundingMode: "HALF_UP", measurementScale: 2, measurementRoundingMode: "CEILING" },
}

type Props = { initialData: PricingV2Page | null; initialError: PricingApiError | null }
const templateJson = () => JSON.stringify(quoteSafeTemplate, null, 2)
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : "—"
const badgeVariant = (status: PricingV2Status) => status === "ACTIVE" ? "default" : status === "DRAFT" ? "secondary" : "outline"

async function apiError(response: Response) {
  const payload = await response.json().catch(() => null) as PricingApiError | null
  return payload?.message || `Request failed with ${response.status}`
}

function PricingCard({ item, activating, onActivate }: { item: PricingV2Model; activating: boolean; onActivate: (item: PricingV2Model) => void }) {
  return <Card className={item.status === "ACTIVE" ? "border-primary/50" : ""}>
    <CardHeader className="pb-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><CardTitle className="text-lg">{item.name}</CardTitle><CardDescription>{item.description || "No description"}</CardDescription></div><div className="flex gap-2"><Badge variant={badgeVariant(item.status)}>{item.status}</Badge>{item.isLatest && <Badge variant="outline">Latest</Badge>}</div></div></CardHeader>
    <CardContent className="space-y-3 text-sm">
      <div className="grid gap-2 md:grid-cols-3"><p><span className="text-muted-foreground">Scope:</span> {item.pricingType}</p><p><span className="text-muted-foreground">Zone:</span> {item.zoneDisplayName || item.zoneCode}</p><p><span className="text-muted-foreground">Version:</span> {item.version}</p><p><span className="text-muted-foreground">Currency:</span> {item.currency}</p><p><span className="text-muted-foreground">Package tiers:</span> {item.packageSlabs?.length || 0}</p><p><span className="text-muted-foreground">Distance tiers:</span> {item.distancePricing?.distanceSlabs?.length || 0}</p></div>
      {item.ownerId && <p><span className="text-muted-foreground">Owner ID:</span> {item.ownerId}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"><p className="text-muted-foreground">Created {formatDate(item.audit?.createdAt)} by {item.audit?.createdBy || "unknown"}</p>{item.status !== "ACTIVE" && <Button size="sm" onClick={() => onActivate(item)} disabled={activating}><Rocket className="mr-2 h-4 w-4" />{activating ? "Activating..." : "Activate"}</Button>}</div>
    </CardContent>
  </Card>
}

export function AdminPricingManager({ initialData, initialError }: Props) {
  const router = useRouter(); const { toast } = useToast()
  const [open, setOpen] = useState(false); const [editor, setEditor] = useState(templateJson); const [editorError, setEditorError] = useState("")
  const [submitting, setSubmitting] = useState(false); const [activatingId, setActivatingId] = useState<string | null>(null); const [refreshing, setRefreshing] = useState(false)
  const [status, setStatus] = useState<"ALL" | PricingV2Status>("ALL"); const [pricingType, setPricingType] = useState<"ALL" | PricingV2Type>("ALL"); const [search, setSearch] = useState("")
  const models = initialData?.content || []
  const filtered = useMemo(() => models.filter((item) => (status === "ALL" || item.status === status) && (pricingType === "ALL" || item.pricingType === pricingType) && `${item.name} ${item.zoneCode} ${item.ownerId || ""}`.toLowerCase().includes(search.toLowerCase())), [models, pricingType, search, status])
  const refresh = () => { setRefreshing(true); router.refresh(); setTimeout(() => setRefreshing(false), 500) }
  const submit = async () => { let payload: unknown; try { payload = JSON.parse(editor); setEditorError("") } catch { setEditorError("Enter valid JSON before saving the draft."); return }
    setSubmitting(true); const response = await apiFetch("/api/admin/pricing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); setSubmitting(false)
    if (!response.ok) { setEditorError(await apiError(response)); return }
    setOpen(false); setEditor(templateJson()); toast({ title: "Draft pricing model created", description: "Review quote previews before activating this model." }); router.refresh()
  }
  const activate = async (item: PricingV2Model) => { if (!window.confirm(`Activate ${item.name} v${item.version}? This expires the currently active model in the same scope.`)) return
    setActivatingId(item.id); const response = await apiFetch(`/api/admin/pricing/${encodeURIComponent(item.id)}/activate`, { method: "POST" }); setActivatingId(null)
    if (!response.ok) { toast({ variant: "destructive", title: "Activation failed", description: await apiError(response) }); return }
    toast({ title: "Pricing model activated", description: `${item.name} v${item.version} is now active.` }); router.refresh()
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Pricing Models</h1><p className="text-muted-foreground">Create quote-safe V2 drafts, review configured tiers, and activate approved models.</p></div><div className="flex gap-2"><Button variant="outline" onClick={refresh} disabled={refreshing}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</Button><Dialog open={open} onOpenChange={(value) => { setOpen(value); setEditorError("") }}><DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create Draft</Button></DialogTrigger><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>Create V2 pricing draft</DialogTitle><DialogDescription>Edit the quote-safe JSON template. Save as DRAFT, test quote boundaries, then activate from the list.</DialogDescription></DialogHeader><Alert><Code2 className="h-4 w-4" /><AlertTitle>Advanced pricing model editor</AlertTitle><AlertDescription>The template includes package slabs, cumulative distance slabs, Halifax time-window surcharges, HST, dimensional weight, custom-quote limits, and constrained rounding defaults.</AlertDescription></Alert><div className="space-y-2"><Label htmlFor="pricing-json">Pricing model JSON</Label><Textarea id="pricing-json" className="min-h-[480px] font-mono text-xs" value={editor} onChange={(event) => setEditor(event.target.value)} spellCheck={false} />{editorError && <p className="text-sm text-destructive">{editorError}</p>}</div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button><Button onClick={submit} disabled={submitting}>{submitting ? "Saving..." : "Save Draft"}</Button></DialogFooter></DialogContent></Dialog></div></div>
    <Alert><CheckCircle2 className="h-4 w-4" /><AlertTitle>Activation checklist</AlertTitle><AlertDescription>Save drafts first. Before activation, preview quotes at package and distance boundaries, verify rush and after-hours fees, taxes, and manual-quote outcomes. Activating replaces the active model for the same scope.</AlertDescription></Alert>
    {initialError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>{initialError.message || "Failed to load pricing"}</AlertTitle><AlertDescription><Button className="mt-2" variant="outline" size="sm" onClick={refresh}>Retry</Button></AlertDescription></Alert>}
    {!initialError && <><Card><CardContent className="grid gap-3 pt-6 md:grid-cols-[1fr_180px_180px]"><Input placeholder="Search name, zone, or owner" value={search} onChange={(event) => setSearch(event.target.value)} /><Select value={status} onValueChange={(value) => setStatus(value as typeof status)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["ALL", "DRAFT", "ACTIVE", "EXPIRED", "ARCHIVED"].map((value) => <SelectItem key={value} value={value}>{value === "ALL" ? "All statuses" : value}</SelectItem>)}</SelectContent></Select><Select value={pricingType} onValueChange={(value) => setPricingType(value as typeof pricingType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All scopes</SelectItem><SelectItem value="GLOBAL">Global</SelectItem><SelectItem value="CUSTOMER_SPECIFIC">Customer-specific</SelectItem></SelectContent></Select></CardContent></Card>
    {filtered.length ? <div className="space-y-3">{filtered.map((item) => <PricingCard key={item.id} item={item} activating={activatingId === item.id} onActivate={activate} />)}</div> : <Card><CardHeader><CardTitle>No pricing models found</CardTitle><CardDescription>Create a quote-safe draft or adjust the filters.</CardDescription></CardHeader></Card>}</>}
    <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="h-4 w-4" /><span>{initialData?.totalElements || 0} total pricing models</span><CircleDollarSign className="ml-2 h-4 w-4" /></div>
  </div>
}

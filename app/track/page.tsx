"use client"

import type React from "react"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getTrackingEvents, type TrackingEvent } from "@/lib/tracking-service"
import { format } from "date-fns"
import {
  Package,
  Search,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  ArrowRight,
  Zap,
  Star,
  Navigation,
  UserCheck,
  XCircle,
  RotateCcw,
  Moon,
  AlertTriangle,
  CalendarClock,
} from "lucide-react"

type FulfillmentStatus =
    | "SCHEDULED"
    | "CREATED"
    | "ASSIGNED"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "PICKUP_FAILED"
    | "DROP_OFF_FAILED"
    | "CANCELLED"
    | "END_OF_DAY"

function TrackingPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initial = searchParams.get("trackingNumber") || ""
  const [trackingNumber, setTrackingNumber] = useState(initial)
  const [events, setEvents] = useState<TrackingEvent[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initial) {
      handleTrack(initial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTrack = async (num?: string) => {
    const tracking = (num ?? trackingNumber).trim()
    if (!tracking) return

    setLoading(true)
    setError(null)

    try {
      const data = await getTrackingEvents(tracking)
      data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      setEvents(data)
    } catch (e) {
      console.error(e)
      setError("Failed to fetch tracking information.")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.replace(`/track?trackingNumber=${encodeURIComponent(trackingNumber)}`)
    handleTrack()
  }

  const getStatusConfig = (status: string) => {
    const statusUpper = status.toUpperCase() as FulfillmentStatus

    switch (statusUpper) {
      case "SCHEDULED":
        return {
          icon: <CalendarClock className="h-6 w-6" />,
          color: "bg-chart-4/20 text-chart-4 border-chart-4/30",
          bgColor: "bg-chart-4/10",
          textColor: "text-chart-4",
          label: "Scheduled",
          description: "Your package pickup has been scheduled",
          isPositive: true,
        }
      case "CREATED":
        return {
          icon: <Package className="h-6 w-6" />,
          color: "bg-chart-5/20 text-chart-5 border-chart-5/30",
          bgColor: "bg-chart-5/10",
          textColor: "text-chart-5",
          label: "Order Created",
          description: "Your shipment has been created and is being prepared",
          isPositive: true,
        }
      case "ASSIGNED":
        return {
          icon: <UserCheck className="h-6 w-6" />,
          color: "bg-chart-1/20 text-chart-1 border-chart-1/30",
          bgColor: "bg-chart-1/10",
          textColor: "text-chart-1",
          label: "Driver Assigned",
          description: "A courier has been assigned to your package",
          isPositive: true,
        }
      case "IN_TRANSIT":
        return {
          icon: <Truck className="h-6 w-6" />,
          color: "bg-chart-1/20 text-chart-1 border-chart-1/30",
          bgColor: "bg-chart-1/10",
          textColor: "text-chart-1",
          label: "In Transit",
          description: "Your package is on its way to the destination",
          isPositive: true,
        }
      case "DELIVERED":
        return {
          icon: <CheckCircle className="h-6 w-6" />,
          color: "bg-chart-2/20 text-chart-2 border-chart-2/30",
          bgColor: "bg-chart-2/10",
          textColor: "text-chart-2",
          label: "Delivered",
          description: "Package successfully delivered!",
          isPositive: true,
        }
      case "PICKUP_FAILED":
        return {
          icon: <AlertTriangle className="h-6 w-6" />,
          color: "bg-destructive/20 text-destructive border-destructive/30",
          bgColor: "bg-destructive/10",
          textColor: "text-destructive",
          label: "Pickup Failed",
          description: "Unable to pick up the package. We'll try again soon.",
          isPositive: false,
        }
      case "DROP_OFF_FAILED":
        return {
          icon: <XCircle className="h-6 w-6" />,
          color: "bg-destructive/20 text-destructive border-destructive/30",
          bgColor: "bg-destructive/10",
          textColor: "text-destructive",
          label: "Delivery Failed",
          description: "Delivery attempt unsuccessful. We'll try again soon.",
          isPositive: false,
        }
      case "CANCELLED":
        return {
          icon: <XCircle className="h-6 w-6" />,
          color: "bg-muted text-muted-foreground border-border",
          bgColor: "bg-muted/50",
          textColor: "text-muted-foreground",
          label: "Cancelled",
          description: "This shipment has been cancelled",
          isPositive: false,
        }
      case "END_OF_DAY":
        return {
          icon: <Moon className="h-6 w-6" />,
          color: "bg-chart-3/20 text-chart-3 border-chart-3/30",
          bgColor: "bg-chart-3/10",
          textColor: "text-chart-3",
          label: "End of Day",
          description: "Delivery will be reattempted tomorrow during business hours",
          isPositive: true,
        }
      default:
        return {
          icon: <Package className="h-6 w-6" />,
          color: "bg-muted text-muted-foreground border-border",
          bgColor: "bg-muted/50",
          textColor: "text-muted-foreground",
          label: status,
          description: "Status update received",
          isPositive: true,
        }
    }
  }

  const getCurrentStatus = () => {
    if (!events || events.length === 0) return null
    return events[events.length - 1]
  }

  const currentStatus = getCurrentStatus()

  return (
      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section with Floating Search */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-chart-1/5 to-chart-2/5" />
          <div className="relative px-4 py-16 sm:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium text-primary mb-6">
                <Zap className="h-4 w-4" />
                Real-time tracking
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-foreground">
                Where's my
                <span className="block text-primary">package?</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                Track your shipment in real-time with our lightning-fast tracking system
              </p>

              {/* Floating Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-2 shadow-2xl">
                  <form onSubmit={onSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="Enter tracking number..."
                          className="pl-12 h-14 text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <Button type="submit" disabled={loading || !trackingNumber.trim()} className="h-14 px-8 rounded-xl">
                      {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                          <>
                            Track
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            {/* Error State */}
            {error && (
                <div className="mb-8 p-6 bg-destructive/10 border border-destructive/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/20 rounded-full">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-destructive">Tracking Error</h3>
                      <p className="text-destructive/80">{error}</p>
                    </div>
                  </div>
                </div>
            )}

            {/* Current Status Highlight */}
            {currentStatus && !loading && (
                <div className="mb-12">
                  <div
                      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${
                          getStatusConfig(currentStatus.status).isPositive
                              ? "from-card via-card to-primary/5"
                              : "from-card via-card to-destructive/5"
                      } shadow-xl`}
                  >
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                    <div className="relative p-8">
                      <div className="flex items-start gap-6">
                        {/* Status Icon with colored background */}
                        <div className="relative">
                          <div
                              className={`absolute inset-0 ${getStatusConfig(currentStatus.status).bgColor} rounded-2xl blur-sm opacity-60`}
                          />
                          <div
                              className={`relative p-5 ${getStatusConfig(currentStatus.status).bgColor} rounded-2xl ${getStatusConfig(currentStatus.status).textColor} shadow-lg`}
                          >
                            {getStatusConfig(currentStatus.status).icon}
                          </div>
                        </div>

                        <div className="flex-1">
                          {/* Status Header */}
                          <div className="flex items-center gap-4 mb-4">
                            <Badge
                                className={`${getStatusConfig(currentStatus.status).color} px-4 py-2 text-sm font-semibold border-0 shadow-sm`}
                            >
                              {getStatusConfig(currentStatus.status).label}
                            </Badge>

                            {!getStatusConfig(currentStatus.status).isPositive && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-destructive/15 text-destructive rounded-full">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span className="text-xs font-medium">Needs Attention</span>
                                </div>
                            )}
                          </div>

                          {/* Main Status Text */}
                          <h3 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                            {getStatusConfig(currentStatus.status).description}
                          </h3>

                          {/* Timestamp */}
                          <div className="flex items-center gap-2 text-muted-foreground mb-6">
                            <div className="p-1.5 bg-muted/50 rounded-lg">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <span className="text-sm">
                          {format(new Date(currentStatus.timestamp), "EEEE, MMMM do 'at' h:mm a")}
                        </span>
                          </div>

                          {/* Special Status Messages */}
                          {currentStatus.status.toUpperCase() === "END_OF_DAY" && (
                              <div className="p-4 bg-gradient-to-r from-chart-3/15 to-transparent rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-chart-3/20 rounded-full">
                                    <RotateCcw className="h-4 w-4 text-chart-3" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-chart-3">Tomorrow's Delivery</p>
                                    <p className="text-sm text-chart-3/80">
                                      We'll attempt delivery again during business hours
                                    </p>
                                  </div>
                                </div>
                              </div>
                          )}

                          {(currentStatus.status.toUpperCase() === "PICKUP_FAILED" ||
                              currentStatus.status.toUpperCase() === "DROP_OFF_FAILED") && (
                              <div className="p-4 bg-gradient-to-r from-destructive/15 to-transparent rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-destructive/20 rounded-full">
                                    <RotateCcw className="h-4 w-4 text-destructive" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-destructive">Automatic Retry</p>
                                    <p className="text-sm text-destructive/80">
                                      We'll try again automatically - no action needed
                                    </p>
                                  </div>
                                </div>
                              </div>
                          )}

                          {currentStatus.status.toUpperCase() === "DELIVERED" && (
                              <div className="p-4 bg-gradient-to-r from-chart-2/15 to-transparent rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-chart-2/20 rounded-full">
                                    <CheckCircle className="h-4 w-4 text-chart-2" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-chart-2">Successfully Delivered!</p>
                                    <p className="text-sm text-chart-2/80">Your package has reached its destination</p>
                                  </div>
                                </div>
                              </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            )}

            {/* Timeline - Redesigned as Cards */}
            {events && events.length > 0 && !loading && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Navigation className="h-6 w-6 text-primary" />
                    Journey Timeline
                  </h2>

                  <div className="grid gap-4">
                    {events.map((event, idx) => {
                      const config = getStatusConfig(event.status)
                      return (
                          <div
                              key={idx}
                              className={`group relative p-6 bg-card border rounded-2xl hover:shadow-lg transition-all duration-300 ${
                                  config.isPositive ? "border-border hover:border-primary/20" : "border-destructive/20"
                              }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`p-3 ${config.bgColor} rounded-xl ${config.textColor} transition-colors`}>
                                {config.icon}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className={`${config.color} border font-medium`}>{config.label}</Badge>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Star className="h-3 w-3" />
                                    Step {idx + 1}
                                  </div>
                                </div>

                                <p className="text-foreground font-medium mb-2">{config.description}</p>

                                {event.statusMessage && event.statusMessage !== config.description && (
                                    <p className="text-sm text-muted-foreground mb-2">{event.statusMessage}</p>
                                )}

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(event.timestamp), "PPpp")}
                                </div>
                              </div>
                            </div>

                            {/* Connecting line */}
                            {idx < events.length - 1 && (
                                <div className="absolute left-8 bottom-0 w-0.5 h-4 bg-border transform translate-y-full" />
                            )}
                          </div>
                      )
                    })}
                  </div>
                </div>
            )}

            {/* No Results State */}
            {events && events.length === 0 && !loading && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-muted rounded-full mb-6">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">No tracking data found</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    We couldn't locate any information for this tracking number. Double-check the number and try again.
                  </p>
                  <Button variant="outline" onClick={() => setTrackingNumber("")} className="rounded-xl px-8 py-3">
                    Try Different Number
                  </Button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-6">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Tracking your package...</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Searching through our network to find the latest updates on your shipment.
                  </p>
                </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
  )
}

export default function TrackingPage() {
  return (
      <Suspense fallback={<div>Loading tracking...</div>}>
        <TrackingPageContent />
      </Suspense>
  )
}

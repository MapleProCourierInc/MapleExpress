"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getTrackingEvents, type TrackingEvent } from "@/lib/tracking-service"
import { format } from "date-fns"
import { Package, Search, Truck, MapPin, CheckCircle, Clock, AlertCircle, Loader2, Calendar, Info } from "lucide-react"

export default function TrackingPage() {
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

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes("delivered")) return <CheckCircle className="h-4 w-4 text-chart-2" />
    if (statusLower.includes("transit") || statusLower.includes("shipping"))
      return <Truck className="h-4 w-4 text-chart-1" />
    if (statusLower.includes("picked") || statusLower.includes("collected"))
      return <Package className="h-4 w-4 text-chart-4" />
    if (statusLower.includes("processing") || statusLower.includes("preparing"))
      return <Clock className="h-4 w-4 text-chart-5" />
    return <MapPin className="h-4 w-4 text-muted-foreground" />
  }

  const getStatusVariant = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes("delivered")) return "default"
    if (statusLower.includes("transit") || statusLower.includes("shipping")) return "secondary"
    if (statusLower.includes("picked") || statusLower.includes("collected")) return "outline"
    return "secondary"
  }

  const getCurrentStatus = () => {
    if (!events || events.length === 0) return null
    return events[events.length - 1]
  }

  const currentStatus = getCurrentStatus()

  return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />

        <main className="flex-1 py-12 bg-muted/20">
          <div className="container max-w-4xl mx-auto px-4">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-4 text-foreground">Track Your Package</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Enter your tracking number below to get real-time updates on your package delivery status
              </p>
            </div>

            {/* Search Form */}
            <Card className="mb-8 shadow-lg">
              <CardContent className="p-6">
                <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter your tracking number"
                        className="pl-10 h-12 text-lg"
                    />
                  </div>
                  <Button type="submit" disabled={loading || !trackingNumber.trim()} className="h-12 px-8">
                    {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Tracking...
                        </>
                    ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Track Package
                        </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Error State */}
            {error && (
                <Card className="mb-8 border-destructive/50 bg-destructive/10">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <p className="text-destructive font-medium">{error}</p>
                    </div>
                  </CardContent>
                </Card>
            )}

            {/* Current Status Card */}
            {currentStatus && !loading && (
                <Card className="mb-8 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Current Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(currentStatus.status)}
                        <div>
                          <Badge variant={getStatusVariant(currentStatus.status)} className="font-medium">
                            {currentStatus.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">{currentStatus.statusMessage}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(currentStatus.timestamp), "PPpp")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
            )}

            {/* Tracking Timeline */}
            {events && events.length > 0 && !loading && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Tracking History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="relative">
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

                      <TooltipProvider>
                        {events.map((event, idx) => (
                            <div key={idx} className="relative flex items-start gap-4 pb-8 last:pb-0">
                              <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-card border-4 border-muted rounded-full shadow-sm">
                                {getStatusIcon(event.status)}
                              </div>

                              <div className="flex-1 min-w-0 pt-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-default group">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant={getStatusVariant(event.status)} className="text-xs font-medium">
                                          {event.status}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2 group-hover:text-foreground transition-colors">
                                        {event.statusMessage}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(event.timestamp), "PPpp")}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs">
                                    <p className="font-medium">{event.status}</p>
                                    <p className="text-xs opacity-90">{event.statusMessage}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                        ))}
                      </TooltipProvider>
                    </div>
                  </CardContent>
                </Card>
            )}

            {/* No Results State */}
            {events && events.length === 0 && !loading && (
                <Card className="text-center py-12 shadow-lg">
                  <CardContent>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Tracking Information Found</h3>
                    <p className="text-muted-foreground mb-4">
                      We couldn't find any tracking events for this number. Please check the tracking number and try again.
                    </p>
                    <Button variant="outline" onClick={() => setTrackingNumber("")}>
                      Try Another Number
                    </Button>
                  </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {loading && (
                <Card className="text-center py-12 shadow-lg">
                  <CardContent>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Fetching Tracking Information</h3>
                    <p className="text-muted-foreground">
                      Please wait while we retrieve the latest updates for your package...
                    </p>
                  </CardContent>
                </Card>
            )}
          </div>
        </main>

        <Footer />
      </div>
  )
}

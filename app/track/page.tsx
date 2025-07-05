"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/shared/header'
import { Footer } from '@/components/shared/footer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getTrackingEvents, type TrackingEvent } from '@/lib/tracking-service'
import { format } from 'date-fns'

export default function TrackingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initial = searchParams.get('trackingNumber') || ''
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
      data.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      setEvents(data)
    } catch (e) {
      console.error(e)
      setError('Failed to fetch tracking information.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.replace(`/track?trackingNumber=${encodeURIComponent(trackingNumber)}`)
    handleTrack()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-12 bg-muted/20">
        <div className="container max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Track Your Package</h1>
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-4 mb-8">
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              Track Now
            </Button>
          </form>
          {loading && <p className="text-center">Loading...</p>}
          {error && <p className="text-center text-destructive mb-4">{error}</p>}
          {events && events.length > 0 && (
            <div className="relative pl-4 border-l border-border">
              <TooltipProvider>
                {events.map((ev, idx) => (
                  <div key={idx} className="relative pb-8">
                    <span className="absolute -left-2 top-1.5 h-3 w-3 rounded-full bg-primary" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-default">
                          <p className="font-medium">{ev.status}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(ev.timestamp), 'PPpp')}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{ev.statusMessage}</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </TooltipProvider>
            </div>
          )}
          {events && events.length === 0 && !loading && (
            <p className="text-center">No tracking events found.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

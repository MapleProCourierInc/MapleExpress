import type { Metadata } from "next"
import Link from "next/link"
import { BadgeDollarSign, Building2, MapPin } from "lucide-react"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Delivery Rates | MapleXpress",
  description: "Local delivery rate information for MapleXpress customers in Greater Moncton.",
}

export default function RatesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-maple-soft via-background to-brand-wine-soft" />
          <div className="container text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <BadgeDollarSign className="h-7 w-7" />
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Delivery Rates</p>
            <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              Straightforward pricing for local delivery
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Our detailed rate guide is coming soon. You can still start a shipment for current pricing or contact us
              about a delivery outside the standard service area.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/ship-now">Ship Now</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/#get-in-touch">Get in Touch</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="container">
            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
              <Card className="home-surface-card h-full">
                <CardContent className="p-6">
                  <MapPin className="h-7 w-7 text-primary" />
                  <h2 className="mt-5 text-xl font-bold">Same-Day Local Delivery</h2>
                  <p className="mt-2 leading-7 text-muted-foreground">
                    Pricing is calculated for your pickup, destination, and parcel details during booking.
                  </p>
                </CardContent>
              </Card>
              <Card className="home-surface-card h-full">
                <CardContent className="p-6">
                  <Building2 className="h-7 w-7 text-primary" />
                  <h2 className="mt-5 text-xl font-bold">Business Delivery</h2>
                  <p className="mt-2 leading-7 text-muted-foreground">
                    Contact us to discuss recurring pickups, multi-package routes, and volume needs.
                  </p>
                </CardContent>
              </Card>
              <Card className="home-surface-card h-full">
                <CardContent className="p-6">
                  <BadgeDollarSign className="h-7 w-7 text-primary" />
                  <h2 className="mt-5 text-xl font-bold">Custom Requests</h2>
                  <p className="mt-2 leading-7 text-muted-foreground">
                    Deliveries outside our standard area can be reviewed individually by the MapleXpress team.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

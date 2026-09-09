import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BadgeDollarSign, Building2, Check, CircleDollarSign, FileCheck2, PackageSearch, Route } from "lucide-react"
import { RateEstimator } from "@/components/rates/rate-estimator"
import { Footer } from "@/components/shared/footer"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Delivery Rates & Estimates | MapleXpress",
  description: "Estimate MapleXpress local delivery rates and learn about recurring, volume, and custom business pricing.",
}

const estimateBenefits = [
  {
    icon: PackageSearch,
    title: "Built around your parcel",
    description: "Your estimate considers both addresses, packed dimensions, weight, and delivery service.",
  },
  {
    icon: Route,
    title: "Options that fit the day",
    description: "Compare available standard and priority services before deciding how to send it.",
  },
  {
    icon: FileCheck2,
    title: "Clear totals up front",
    description: "See the estimated subtotal, tax, and total without digging through a complicated rate sheet.",
  },
]

const businessFeatures = ["Recurring delivery schedules", "Multi-stop routes", "Volume-based pricing", "Monthly invoicing"]

export default function RatesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-hidden">
        <section className="relative border-b py-14 md:py-20 lg:py-24">
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-brand-maple-soft/90 via-background to-brand-wine-soft/80" />
          <div className="absolute -left-32 top-8 -z-10 h-80 w-80 rounded-full bg-brand-maple/15 blur-3xl" />
          <div className="absolute -right-32 bottom-0 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

          <div className="container">
            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(380px,2fr)] xl:gap-16">
              <div className="pt-2 lg:pt-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur">
                  <BadgeDollarSign className="h-4 w-4" /> Delivery rates
                </div>
                <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.08]">
                  Know the rate before you book the delivery.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                  Enter the route and parcel details to compare available MapleXpress services. It is a quick way to plan a one-time local shipment without creating an order.
                </p>

                <div className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
                  {estimateBenefits.map(({ icon: Icon, title, description }) => (
                    <article key={title} className="rounded-2xl border border-white/80 bg-white/75 p-5 shadow-sm backdrop-blur">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-wine-soft text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h2 className="mt-4 font-bold">{title}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                    </article>
                  ))}
                </div>

                <div className="mt-10 max-w-3xl overflow-hidden rounded-3xl border border-brand-forest/15 bg-brand-forest text-white shadow-xl shadow-brand-forest/10">
                  <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/65">
                        <Building2 className="h-4 w-4" /> Business pricing
                      </div>
                      <h2 className="mt-3 text-2xl font-bold">Sending more than the occasional parcel?</h2>
                      <p className="mt-3 max-w-xl leading-7 text-white/80">
                        We can shape a practical delivery plan around your regular pickups, common routes, and weekly volume—so your team spends less time coordinating each trip.
                      </p>
                    </div>
                    <Button asChild className="bg-white text-brand-forest hover:bg-white/90">
                      <Link href="/business-solutions#business-enquiry">Explore Business Solutions <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </div>
                  <div className="grid gap-3 border-t border-white/15 bg-black/10 px-6 py-5 sm:grid-cols-2 sm:px-8">
                    {businessFeatures.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-white/85">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15"><Check className="h-3 w-3" /></span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex max-w-3xl flex-col gap-5 rounded-2xl border border-brand-maple/40 bg-brand-maple-soft/80 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-rust shadow-sm">
                      <CircleDollarSign className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="font-bold">A delivery that does not fit the usual boxes?</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">Talk with our team about custom routes, larger volumes, or requirements that need a personal review.</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="shrink-0 border-primary/25 bg-white">
                    <Link href="/#get-in-touch">Get in Touch</Link>
                  </Button>
                </div>
              </div>

              <aside className="relative lg:sticky lg:top-24">
                <RateEstimator />
              </aside>
            </div>
          </div>
        </section>

        <section className="bg-background py-12">
          <div className="container">
            <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
              <div>
                <h2 className="text-xl font-bold">Ready to turn an estimate into a delivery?</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Sign in, confirm the shipment details, and finish booking through Ship Now.</p>
              </div>
              <Button asChild size="lg" className="shrink-0">
                <Link href="/ship-now">Ship Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
